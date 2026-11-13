/* Browser Media I/O adapter. All data stays on this device. */
(function (root) {
  'use strict';
  const C = root.MeetingCore, api = root.BrowserMediaIO;
  function check(signal) { if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError'); }
  let lastYield = 0;
  async function breathe(signal) {
    check(signal);
    if (performance.now() - lastYield > 18) { await new Promise(r => setTimeout(r, 0)); lastYield = performance.now(); check(signal); }
  }
  function report(fn, stage, fraction, extra) { fn?.({ stage, fraction: C.clamp(fraction, 0, 1), ...extra }); }
  async function inspect(file, signal) {
    if (!api) throw new Error('LIBRARY_MISSING');
    let info = await api.probe(file, { mode: 'metadata', signal });
    const vs = info.tracks.filter(t => t.kind === 'video'), as = info.tracks.filter(t => t.kind === 'audio');
    if (vs.length !== 1 || as.length > 1) throw new Error('TRACKS_UNSUPPORTED');
    const v = vs[0], a = as[0];
    if (!['avc', 'h264'].includes(v.codec) || (a && (!a.canDecode || a.codec !== 'aac' || ![1, 2].includes(a.audio.channels)))) throw new Error('CODEC_UNSUPPORTED');
    if (!Number.isFinite(v.duration.seconds) || v.duration.seconds <= 0) {
      info = await api.probe(file, { mode: 'scan', signal });
    }
    const video = info.tracks.find(t => t.kind === 'video'), audio = info.tracks.find(t => t.kind === 'audio');
    const duration = video.duration.seconds;
    if (!(duration > 0 && duration <= 7201)) throw new Error('DURATION_UNSUPPORTED');
    if (audio && (audio.audio.sampleRate < 8000 || audio.audio.sampleRate > 96000)) throw new Error('CODEC_UNSUPPORTED');
    return { info, video, audio, duration, sampleRate: audio?.audio.sampleRate || 48000, channels: audio?.audio.channels || 0 };
  }
  // Timestamp-aware trim. Fills track gaps, drops overlapping samples and preserves offsets.
  async function* editedAudio(file, meta, plan, signal, fade = true) {
    if (!meta.audio) return;
    const sr = meta.sampleRate, channels = meta.channels;
    const input = await api.openMedia(file, { signal });
    let out = 0;
    function block(data, position, s) {
      if (fade) {
        const fadeSamples = Math.round(sr * .003);
        for (let i = 0; i < data[0].length; i++) {
          const p = position + i;
          let g = 1;
          if (s.first > 0) g = Math.min(g, (p + 1) / fadeSamples);
          if (s.end < meta.duration - 1 / sr) g = Math.min(g, (s.length - p) / fadeSamples);
          if (g < 1) for (const a of data) a[i] *= g;
        }
      }
      const result = { data, offset: out }; out += data[0].length; return result;
    }
    try {
      for (const s of plan.keep) {
        let pos = 0;
        const blocks=s.end>s.start?input.audioPcmBlocks({ start: s.start, end: s.end, trackId: meta.audio.id, maxBlockSamples: 4096, signal }):[];
        for await (const pcm of blocks) {
          check(signal);
          const at = Math.round(pcm.timestamp * sr) - s.first;
          while (pos < Math.min(at, s.length)) {
            const n = Math.min(4096, Math.min(at, s.length) - pos);
            yield block(Array.from({ length: channels }, () => new Float32Array(n)), pos, s); pos += n;
            await breathe(signal);
          }
          const from = Math.max(0, pos - at), count = Math.min(pcm.length - from, s.length - pos);
          if (count > 0) { yield block(pcm.channelData.map(a => a.slice(from, from + count)), pos, s); pos += count; }
          await breathe(signal);
        }
        while (pos < s.length) {
          const n = Math.min(4096, s.length - pos);
          yield block(Array.from({ length: channels }, () => new Float32Array(n)), pos, s); pos += n;
          await breathe(signal);
        }
      }
    } finally { input.close(); }
  }
  async function rawWave(file, meta, signal, onProgress) {
    const wave = new C.Waveform(meta.duration), meter = meta.audio ? new C.LoudnessMeter(meta.sampleRate, meta.channels) : null;
    if (!meta.audio) return { wave, measurement: null };
    const plan = C.makePlan([], meta.duration, meta.sampleRate);
    for await (const b of editedAudio(file, meta, plan, signal, false)) {
      wave.push(b.data, meta.sampleRate, b.offset / meta.sampleRate); meter.push(b.data);
      report(onProgress, 'wave', (b.offset + b.data[0].length) / plan.total, { wave });
    }
    return { wave, measurement: meter.result() };
  }
  async function* processedAudio(file, meta, plan, gainDb, enabled, signal, stats = {}, levelCurve = null) {
    const limiter = enabled ? new C.Limiter(meta.sampleRate, meta.channels, gainDb) : null;
    const leveler = enabled && levelCurve ? new C.Leveler(levelCurve, plan) : null;
    let offset = 0;
    for await (const b of editedAudio(file, meta, plan, signal)) {
      const leveled = leveler ? leveler.push(b.data, b.offset) : b.data;
      const data = limiter ? limiter.push(leveled) : leveled;
      if (data[0].length) { yield { data, offset }; offset += data[0].length; }
    }
    if (limiter) {
      const data = limiter.finish();
      if (data[0].length) yield { data, offset };
      stats.maxReductionDb = limiter.maxReductionDb;
    }
  }
  async function analyze(file, meta, cuts, target, enabled, signal, onProgress, leveling = false, confirmedPlan = null) {
    const plan = confirmedPlan || C.makePlan(cuts, meta.duration, meta.sampleRate);
    if (!plan.total) throw new Error('EMPTY_OUTPUT');
    if (!meta.audio) return { plan, inputLufs: null, outputLufs: null, gainDb: 0, wave: null, enabled: false };
    const raw = new C.LoudnessMeter(meta.sampleRate, meta.channels);
    for await (const b of editedAudio(file, meta, plan, signal)) {
      raw.push(b.data); report(onProgress, 'measure', (b.offset + b.data[0].length) / plan.total);
    }
    const before = raw.result();
    const levelCurve = enabled && leveling ? C.makeLevelCurve(raw, plan) : null;
    const startingLufs = levelCurve?.estimatedLufs ?? before.lufs;
    // No finite LUFS for silence/very short material: leave its level unchanged.
    const measurable = Number.isFinite(before.lufs) && before.lufs >= -55;
    let gainDb = enabled && measurable ? C.clamp(target - startingLufs, -40, 36) : 0;
    let after, wave, stats, pass = 0;
    for (; pass < 2; pass++) {
      const meter = new C.LoudnessMeter(meta.sampleRate, meta.channels); wave = new C.Waveform(meta.duration); stats = {};
      for await (const b of processedAudio(file, meta, plan, gainDb, enabled, signal, stats, levelCurve)) {
        meter.push(b.data); wave.pushEdited(b.data, meta.sampleRate, b.offset, plan);
        report(onProgress, 'normalize', (b.offset + b.data[0].length) / plan.total, { pass: pass + 1 });
      }
      after = meter.result();
      if (!enabled || !measurable || !Number.isFinite(after.lufs) || Math.abs(target - after.lufs) < .35 || pass === 1) break;
      // One bounded refinement. Do not iterate indefinitely on pathological material.
      gainDb = C.clamp(gainDb + C.clamp(target - after.lufs, -12, 12), -40, 36);
    }
    return { plan, inputLufs: before.lufs, outputLufs: after.lufs, inputPeak: before.peak, outputPeak: after.peak,
      gainDb, wave, levelCurve, measurable, maxReductionDb: stats.maxReductionDb || 0, enabled, target, passes: pass + 1 };
  }
  function videoSettings(meta, resolution, quality, fps, videoKbps = 250, audioKbps = 80) {
    const w = meta.video.video.width, h = meta.video.video.height;
    const maxHeight = resolution === 'source' ? h : Number(resolution);
    const scale = Math.min(1, maxHeight / h);
    const width = Math.max(2, Math.round(w * scale / 2) * 2), height = Math.max(2, Math.round(h * scale / 2) * 2);
    const rate = { small: 2000000, standard: 4000000, high: 8000000 }[quality];
    if (!Number.isInteger(videoKbps) || videoKbps < 25 || videoKbps > 50000 || ![32,48,64,80,96,128,160,192,256].includes(audioKbps) || ![10,15,25,30].includes(fps) || (!rate && quality !== 'custom')) throw new Error('BITRATE_INVALID');
    const videoBitrate = quality === 'custom' ? Math.round(videoKbps * 1000) : Math.round(Math.max(200000, rate * width * height / (1920 * 1080) * (fps / 30) ** .5));
    return { width, height, fps, videoBitrate, audioBitrate: audioKbps * 1000, videoBitrateMode: 'variable' };
  }
  async function prepareExport(meta, settings, signal) {
    check(signal);
    // The fallback decision and the writer MUST check the same bitrate. Checking
    // the library default (192 kbps) can leave native-only 80 kbps configurations unsupported.
    const config = { ...settings, sampleRate: meta.sampleRate, channels: meta.channels || 2,
      audioBitrate: settings.audioBitrate || 80000 };
    if (meta.audio) {
      try { await api.enableAacFallback(config); }
      catch (cause) { check(signal); throw new Error('AAC_ENCODER_UNSUPPORTED', { cause }); }
    }
    check(signal);
    const support = await api.getCapabilities(config);
    check(signal);
    if (settings.videoMode !== 'copy' && !support.h264Encode) throw new Error('ENCODER_UNSUPPORTED');
    if (meta.audio && !support.aacEncode) throw new Error('AAC_ENCODER_UNSUPPORTED');
    return support;
  }
  async function openCopy(file, meta, signal, onProgress, validation='strict') {
    const session=await api.openVideoCopy(file,{videoTrackId:meta.video.id,signal,validation});
    try { const info=await session.inspect({signal,onProgress});
      if(validation==='container'&&info.validation!=='container')throw new Error('FORCE_COPY_UNAVAILABLE');
      return {session,info}; }
    catch(error){await session.close();throw error;}
  }
  // UI provenance is kept separately: never clone or mutate a bound library plan.
  const copyRequests = new WeakMap();
  function copyRequestedRanges(plan, index) {
    return copyRequests.get(plan)?.[index] || [{start:plan.ranges[index].requestedStart,end:plan.ranges[index].requestedEnd}];
  }
  async function planCopy(session, info, meta, cuts, signal) {
    const keepRanges=C.copyKeepRanges(cuts,meta.duration,info);
    if(!keepRanges.length)throw new Error('EMPTY_OUTPUT');
    const expanded=C.expandCopyRanges(keepRanges,info);
    const plan=await session.plan({keepRanges:expanded.map(r=>({start:r.start,end:r.end})),snap:'strict',audioSampleRate:meta.sampleRate,signal});
    copyRequests.set(plan,Object.freeze(expanded.map(r=>r.requestedRanges)));
    return plan;
  }
  async function exportCopy(file, meta, analysis, settings, target, session, copyPlan, signal, onProgress) {
    try {
      check(signal);
      await prepareExport(meta,settings,signal);
      const expected=C.copyAudioPlan(copyPlan),plan=analysis.plan;
      if(plan.total!==expected.total||plan.keep.length!==expected.keep.length||plan.keep.some((r,i)=>{
        const s=expected.keep[i];return r.start!==s.start||r.end!==s.end||r.length!==s.length||r.offset!==s.offset;
      }))throw new Error('COPY_PLAN_INVALID');
      const meter=meta.audio?new C.LoudnessMeter(meta.sampleRate,meta.channels):null;
      const audio=meta.audio?{mode:'pcm',sampleRate:meta.sampleRate,channels:meta.channels,codec:'aac',bitrate:settings.audioBitrate,
        blocks:async function*(readSignal){
          for await(const b of processedAudio(file,meta,plan,analysis.gainDb,analysis.enabled,readSignal,{},analysis.levelCurve)){
            meter.push(b.data);
            yield {sampleRate:meta.sampleRate,numberOfChannels:meta.channels,length:b.data[0].length,channelData:b.data};
          }
        }}:{mode:'none'};
      const result=await session.exportMp4({plan:copyPlan,audio,target,signal,onProgress});
      return {...result,measurement:meter?.result()||null};
    }catch(error){
      if(target.kind==='stream'&&!target.stream.locked)await target.stream.abort().catch(()=>{});
      throw error;
    }
  }
  async function exportMp4(file, meta, analysis, settings, target, signal, onProgress) {
    const plan = analysis.plan, sr = meta.sampleRate, frames = Math.ceil(plan.duration * settings.fps - 1e-7);
    let writer, input, reader, audioReader, canvas;
    const outputMeter = meta.audio ? new C.LoudnessMeter(sr, meta.channels) : null;
    try {
      if (!frames) throw new Error('EMPTY_OUTPUT');
      await prepareExport(meta, settings, signal);
      canvas = document.createElement('canvas'); canvas.width = settings.width; canvas.height = settings.height;
      const ctx = canvas.getContext('2d', { alpha: false });
      writer = await api.createMp4Writer({ ...settings, expectedFrames: frames, target, signal,
        audio: meta.audio ? { sampleRate: sr, channels: meta.channels, codec: 'aac', bitrate: settings.audioBitrate || 80000 } : undefined });
      input = await api.openMedia(file, { signal, maxOutstandingFrames: 3 });
      const times = function* () { for (let n = 0; n < frames; n++) yield C.sourceAt(plan, n / settings.fps); };
      reader = input.videoFramesAt(times(), { trackId: meta.video.id, signal });
      audioReader = meta.audio ? processedAudio(file, meta, plan, analysis.gainDb, analysis.enabled, signal, {}, analysis.levelCurve) : null;
      let current = null, at = 0, written = 0;
      for (let n = 0; n < frames; n++) {
        check(signal);
        const item = await reader.next();
        if (item.done) throw new Error('VIDEO_ENDED_EARLY');
        const f = item.value.frame;
        try { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height); f?.draw(ctx, 0, 0, canvas.width, canvas.height); await writer.addVideoFrame(canvas); }
        finally { f?.close(); }
        const wanted = Math.min(plan.total, Math.round((n + 1) * sr / settings.fps));
        while (audioReader && written < wanted) {
          if (!current || at >= current[0].length) {
            const next = await audioReader.next();
            if (next.done) throw new Error('AUDIO_ENDED_EARLY');
            current = next.value.data; at = 0;
          }
          const count = Math.min(wanted - written, current[0].length - at), data = current.map(a => a.subarray(at, at + count));
          await writer.addPcm({ sampleRate: sr, numberOfChannels: meta.channels, length: count, channelData: data });
          outputMeter.push(data); at += count; written += count;
        }
        report(onProgress, 'export', (n + 1) / frames * .99); await breathe(signal);
      }
      report(onProgress, 'finalize', .99);
      const result = await writer.finish();
      return { ...result, measurement: outputMeter?.result() || null };
    } catch (error) {
      if (writer) await writer.cancel().catch(() => {});
      else if (target.kind === 'stream') await target.stream.abort().catch(() => {});
      throw error;
    } finally {
      await reader?.return().catch(() => {}); await audioReader?.return().catch(() => {}); input?.close();
      if (canvas) canvas.width = canvas.height = 1;
    }
  }
  root.MeetingEngine = { inspect, rawWave, editedAudio, processedAudio, analyze, videoSettings, prepareExport, exportMp4, openCopy, planCopy, copyRequestedRanges, exportCopy };
})(globalThis);
