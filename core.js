/* Simple Meeting Video Editor DSP / timeline. No browser dependencies. MIT. */
(function (root) {
  'use strict';
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const db = v => v > 0 ? 20 * Math.log10(v) : -Infinity;
  const energyLufs = v => v > 0 ? -0.691 + 10 * Math.log10(v) : -Infinity;
  function integratedLufs(energies) {
    const abs = energies.filter(e => energyLufs(e) >= -70);
    if (!abs.length) return -Infinity;
    const mean = abs.reduce((a, b) => a + b, 0) / abs.length;
    const rel = abs.filter(e => e >= mean / 10);
    return energyLufs(rel.reduce((a, b) => a + b, 0) / rel.length);
  }
  function normalizeCuts(cuts, duration) {
    const sorted = cuts.map(c => ({ start: clamp(Number(c.start), 0, duration), end: clamp(Number(c.end), 0, duration) }))
      .filter(c => Number.isFinite(c.start) && Number.isFinite(c.end) && c.end > c.start)
      .sort((a, b) => a.start - b.start);
    const result = [];
    for (const c of sorted) {
      const last = result[result.length - 1];
      if (last && c.start <= last.end + 1e-7) last.end = Math.max(last.end, c.end);
      else result.push({ ...c });
    }
    return result;
  }
  function makePlan(cuts, duration, sr = 48000) {
    const keep = []; let cursor = 0, total = 0;
    for (const c of [...normalizeCuts(cuts, duration), { start: duration, end: duration }]) {
      const a = Math.round(cursor * sr), b = Math.round(c.start * sr);
      if (b > a) {
        keep.push({ start: a / sr, end: b / sr, first: a, last: b, length: b - a, offset: total });
        total += b - a;
      }
      cursor = c.end;
    }
    return { keep, total, duration: total / sr, sampleRate: sr };
  }
  function sourceAt(plan, seconds) {
    const n = clamp(Math.floor(seconds * plan.sampleRate + 1e-6), 0, Math.max(0, plan.total - 1));
    let lo = 0, hi = plan.keep.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (n >= plan.keep[m].offset + plan.keep[m].length) lo = m + 1; else hi = m; }
    const s = plan.keep[lo];
    return s ? s.start + (n - s.offset) / plan.sampleRate : 0;
  }
  // Keep source positions separate from output sample counts: cumulative rounding
  // in a copy plan can differ from separately rounded source endpoints by a sample.
  function copyAudioPlan(plan) {
    const sr = plan.audioSampleRate;
    if (!sr || !Number.isSafeInteger(plan.audioSamples)) throw new Error('COPY_PLAN_INVALID');
    return { keep: plan.ranges.map(r => ({ start:r.sourceStart, end:r.sourceEnd,
      first:Math.round(r.sourceStart*sr), last:Math.round(r.sourceEnd*sr),
      length:r.audioSamples, offset:r.audioStartSample })),
      total:plan.audioSamples, duration:plan.duration, sampleRate:sr };
  }
  function copyKeepRanges(cuts, duration, info) {
    const ranges=[]; let cursor=0;
    for (const c of [...normalizeCuts(cuts,duration),{start:duration,end:duration}]) {
      const start=Math.max(cursor,info.startTime),end=Math.min(c.start,info.endTime);
      if(end>start)ranges.push({start,end});
      cursor=c.end;
    }
    return ranges;
  }
  // Choose a superset of requested keeps using the official boundary index.
  // Union in source ticks before asking the library to count audio/video.
  function expandCopyRanges(requests, info) {
    const groups=[], boundaries=info.boundaries;let previous=-Infinity;
    for(const r of requests){
      if(!Number.isFinite(r.start)||!Number.isFinite(r.end)||r.start<info.startTime||r.end>info.endTime||r.end<=r.start||r.start<previous)throw new Error('COPY_PLAN_INVALID');
      previous=r.end;
      const near=t=>boundaries.find(b=>Math.abs(b.time-t)<=Math.max(1,Math.abs(t))*Number.EPSILON*8);
      const start=near(r.start)||boundaries.filter(b=>b.time<r.start).at(-1),end=near(r.end)||boundaries.find(b=>b.time>r.end);
      if(!start||!end||start.kind==='eof'||start.tick>=end.tick)throw new Error('COPY_PLAN_INVALID');
      const request=Object.freeze({start:r.start,end:r.end}),last=groups.at(-1);
      if(last&&start.tick<=last.end.tick){if(end.tick>last.end.tick)last.end=end;last.requests.push(request);}
      else groups.push({start,end,requests:[request]});
    }
    return Object.freeze(groups.map(g=>Object.freeze({start:g.start.time,end:g.end.time,requestedRanges:Object.freeze(g.requests)})));
  }
  // Select the requested retained time first, then expand to surrounding GOPs.
  // This includes the playhead even with long GOPs; the actual trial can exceed
  // 30 seconds. Stay within the full plan so its audio correction remains valid.
  function copyExcerptRanges(plan, info, sourceSeconds, seconds=30) {
    if(!Number.isFinite(sourceSeconds)||!Number.isFinite(seconds)||seconds<=0)throw new Error('INVALID_EXCERPT');
    const ranges=[], scale=info.timeResolution;
    let left=seconds*scale;
    for(const r of plan.ranges){
      const begin=Math.max(sourceSeconds,r.sourceStart), epsilon=Math.max(1,Math.abs(begin))*Number.EPSILON*8;
      if(begin>=r.sourceEnd)continue;
      const requestedEnd=Math.min(r.sourceEnd,begin+left/scale), endEpsilon=Math.max(1,Math.abs(requestedEnd))*Number.EPSILON*8;
      const start=info.boundaries.filter(b=>(b.kind==='idr'||b.kind==='sync')&&b.time<=begin+epsilon&&b.time>=r.sourceStart).at(-1);
      const end=info.boundaries.find(b=>b.time>=requestedEnd-endEpsilon&&b.time<=r.sourceEnd);
      if(!start||!end||start.tick>=end.tick)throw new Error('COPY_PLAN_INVALID');
      ranges.push({start:start.time,end:end.time});left-=(requestedEnd-begin)*scale;
      if(requestedEnd<r.sourceEnd||left<=scale*Number.EPSILON*Math.max(1,seconds)*8)break;
    }
    return ranges;
  }
  // Start in original/source time; take up to `seconds` of retained output.
  // In a removed interval, advance to the next retained sample.
  function excerptPlan(plan, sourceSeconds, seconds) {
    const sr = plan.sampleRate, keep = [];
    if (!Number.isFinite(sourceSeconds) || !Number.isFinite(seconds) || seconds <= 0) throw new Error('INVALID_EXCERPT');
    const begin = Math.max(0, Math.round(sourceSeconds * sr));
    let left = Math.max(0, Math.round(seconds * sr)), total = 0;
    for (const s of plan.keep) {
      if (!left) break;
      const skip = Math.max(0, begin - s.first), first = s.first + skip;
      const length = Math.min(s.length - skip, left);
      if (length <= 0) continue;
      const last = Math.min(s.last, first + length);
      keep.push({ start: first / sr, end: last / sr, first, last, length, offset: total,
        curveOffset: (s.curveOffset ?? s.offset) + skip });
      total += length; left -= length;
    }
    return { keep, total, duration: total / sr, sampleRate: sr };
  }
  function timeText(seconds, millis = true) {
    const n = Math.max(0, Math.round((Number(seconds) || 0) * 1000));
    const h = Math.floor(n / 3600000), m = Math.floor(n / 60000) % 60, s = Math.floor(n / 1000) % 60;
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':') + (millis ? '.' + String(n % 1000).padStart(3, '0') : '');
  }
  function parseTime(text) {
    if (!/^\s*\d+(?::\d{1,2}){0,2}(?:\.\d{1,3})?\s*$/.test(text)) return NaN;
    const parts = text.trim().split(':').map(Number);
    if (parts.slice(1).some(p => p >= 60)) return NaN;
    return parts.reduce((t, v) => t * 60 + v, 0);
  }
  class Biquad {
    constructor(b, a) { this.b = b; this.a = a; this.s1 = 0; this.s2 = 0; }
    process(x) {
      const y = this.b[0] * x + this.s1;
      this.s1 = this.b[1] * x - this.a[1] * y + this.s2;
      this.s2 = this.b[2] * x - this.a[2] * y;
      return y;
    }
  }
  // BS.1770 K weighting; prewarped coefficients as used by libebur128 (MIT).
  function kFilters(sr) {
    let k = Math.tan(Math.PI * 1681.974450955533 / sr), q = 0.7071752369554196;
    const vh = 10 ** (3.999843853973347 / 20), vb = vh ** 0.4996667741545416;
    let a0 = 1 + k / q + k * k;
    const shelf = new Biquad([(vh + vb * k / q + k * k) / a0, 2 * (k * k - vh) / a0, (vh - vb * k / q + k * k) / a0], [1, 2 * (k * k - 1) / a0, (1 - k / q + k * k) / a0]);
    k = Math.tan(Math.PI * 38.13547087602444 / sr); q = 0.5003270373238773; a0 = 1 + k / q + k * k;
    return [shelf, new Biquad([1, -2, 1], [1, 2 * (k * k - 1) / a0, (1 - k / q + k * k) / a0])];
  }
  class LoudnessMeter {
    constructor(sr, channels) {
      this.sr = sr; this.channels = channels; this.filters = Array.from({ length: channels }, () => kFilters(sr));
      this.window = new Float64Array(Math.round(sr * 0.4)); this.hop = Math.round(sr * 0.1);
      this.count = 0; this.sum = 0; this.energies = []; this.peak = 0;
    }
    push(data) {
      for (let i = 0; i < data[0].length; i++) {
        let e = 0;
        for (let c = 0; c < this.channels; c++) {
          const x = data[c][i]; this.peak = Math.max(this.peak, Math.abs(x));
          const f = this.filters[c]; const y = f[1].process(f[0].process(x)); e += y * y;
        }
        const p = this.count % this.window.length;
        this.sum += e - this.window[p]; this.window[p] = e; this.count++;
        if (this.count >= this.window.length && (this.count - this.window.length) % this.hop === 0)
          this.energies.push(Math.max(0, this.sum / this.window.length));
      }
    }
    result() {
      // At least 400 ms are required for an integrated BS.1770 measurement.
      return { lufs: integratedLufs(this.energies), peak: this.peak, samples: this.count };
    }
  }
  // Offline, slow stereo-linked leveler. Store only one gain per 100 ms, not PCM.
  // Local gating is independent of the whole-file loudness so quiet speech is retained
  // even when the recording also contains a long, already-mastered presentation.
  function makeLevelCurve(meter, plan) {
    const energies = meter.energies, n = energies.length;
    if (!n) return null;
    const hop = meter.hop, center = meter.window.length / 2;
    const radius = Math.round(1.5 * meter.sr / hop), floor = 10 ** ((-55 + .691) / 10);
    const desired = new Float64Array(n), active = new Uint8Array(n);
    let activeCount = 0;
    for (let i = 0; i < n; i++) {
      const lo = Math.max(0, i - radius), hi = Math.min(n - 1, i + radius);
      let peak = 0, sum = 0, count = 0;
      for (let j = lo; j <= hi; j++) peak = Math.max(peak, energies[j]);
      const gate = Math.max(floor, peak / 10 ** 1.5);
      for (let j = lo; j <= hi; j++) if (energies[j] >= gate) { sum += energies[j]; count++; }
      if (count && energies[i] >= floor) {
        desired[i] = clamp(.9 * (-23 - energyLufs(sum / count)), -18, 24);
        active[i] = 1; activeCount++;
      }
    }
    if (!activeCount) return null;
    // Hold through brief pauses (up to 1 s). Long silence/noise never requests a boost.
    const hold = Math.round(meter.sr / hop);
    for (let i = 0, last = -hold - 1; i < n; i++) {
      if (active[i]) last = i;
      else if (i - last <= hold) desired[i] = desired[last];
    }
    // Symmetric smoothing avoids abrupt gain changes at both ends of a loud insert.
    const coeff = Math.exp(-hop / (meter.sr * .35)), smooth = new Float64Array(n);
    smooth[0] = desired[0];
    for (let i = 1; i < n; i++) smooth[i] = desired[i] + coeff * (smooth[i - 1] - desired[i]);
    for (let i = n - 2; i >= 0; i--) smooth[i] += coeff * (smooth[i + 1] - smooth[i]);
    const gains = Float32Array.from(smooth, d => 10 ** (d / 20));
    let minDb = Infinity, maxDb = -Infinity;
    for (const d of smooth) { minDb = Math.min(minDb, d); maxDb = Math.max(maxDb, d); }
    const estimatedLufs = integratedLufs(energies.map((e, i) => e * gains[i] ** 2));
    return { gains, hop, center, plan, minDb, maxDb, estimatedLufs };
  }
  class Leveler {
    constructor(curve, plan) {
      this.curve = curve;
      // Map audition subranges back to the gain curve of the full edited program.
      this.segments = plan.keep.map(s => {
        const full = curve.plan.keep.find(p => s.first >= p.first && s.last <= p.last);
        if (!full) throw new Error('LEVEL_CURVE_MISMATCH');
        return { start: s.offset, end: s.offset + s.length, delta: (s.curveOffset ?? (full.offset + s.first - full.first)) - s.offset };
      });
      this.segment = 0;
    }
    push(data, offset) {
      const { gains, hop, center } = this.curve;
      for (let i = 0; i < data[0].length; i++) {
        const n = offset + i;
        while (this.segment + 1 < this.segments.length && n >= this.segments[this.segment].end) this.segment++;
        const u = clamp((n + this.segments[this.segment].delta - center) / hop, 0, gains.length - 1);
        const k = Math.floor(u), gain = gains[k] + (gains[Math.min(k + 1, gains.length - 1)] - gains[k]) * (u - k);
        for (const channel of data) channel[i] *= gain;
      }
      return data;
    }
  }
  class Waveform {
    constructor(duration, rate = 100) {
      this.rate = rate; this.duration = duration;
      this.min = new Float32Array(Math.ceil(duration * rate) + 1);
      this.max = new Float32Array(this.min.length);
    }
    push(data, sr, sourceSeconds) {
      for (let i = 0; i < data[0].length; i++) {
        const b = Math.floor((sourceSeconds + i / sr) * this.rate + 1e-7);
        if (b < 0 || b >= this.min.length) continue;
        for (let c = 0; c < data.length; c++) {
          this.min[b] = Math.min(this.min[b], data[c][i]); this.max[b] = Math.max(this.max[b], data[c][i]);
        }
      }
    }
    pushEdited(data, sr, offset, plan) {
      let cursor = 0;
      for (const s of plan.keep) {
        const from = Math.max(offset, s.offset), to = Math.min(offset + data[0].length, s.offset + s.length);
        if (to <= from) continue;
        cursor = from - offset;
        this.push(data.map(a => a.subarray(cursor, to - offset)), sr, s.start + (from - s.offset) / sr);
      }
    }
  }
  // Stereo-linked, bounded-memory 5ms lookahead limiter. Delay is removed on output.
  // Sample-peak ceiling, not a certified true-peak limiter.
  class Limiter {
    constructor(sr, channels, gainDb, ceilingDb = -1.5) {
      this.sr = sr; this.channels = channels; this.gain = 10 ** (gainDb / 20); this.ceiling = 10 ** (ceilingDb / 20);
      this.look = Math.max(1, Math.round(sr * .005)); this.size = this.look + 2;
      this.ring = Array.from({ length: channels }, () => new Float64Array(this.size));
      this.qIndex = new Float64Array(this.size); this.qValue = new Float64Array(this.size);
      this.head = 0; this.tail = 0; this.n = 0; this.real = 0; this.emitted = 0;
      this.env = 1; this.attack = Math.exp(-1 / (sr * .0005)); this.release = Math.exp(-1 / (sr * .08));
      this.maxReductionDb = 0;
    }
    push(data, flush = false) {
      const len = flush ? this.look : data[0].length;
      if (!flush) this.real += len;
      const arrays = Array.from({ length: this.channels }, () => new Float32Array(len)); let used = 0;
      for (let i = 0; i < len; i++, this.n++) {
        let peak = 0;
        for (let c = 0; c < this.channels; c++) {
          const x = flush ? 0 : data[c][i] * this.gain;
          this.ring[c][this.n % this.size] = x; peak = Math.max(peak, Math.abs(x));
        }
        const oldest = this.n - this.look;
        while (this.head < this.tail && this.qIndex[this.head % this.size] < oldest) this.head++;
        while (this.tail > this.head && this.qValue[(this.tail - 1) % this.size] <= peak) this.tail--;
        this.qIndex[this.tail % this.size] = this.n; this.qValue[this.tail % this.size] = peak; this.tail++;
        if (oldest < 0 || this.emitted >= this.real) continue;
        const wanted = Math.min(1, this.ceiling / Math.max(1e-20, this.qValue[this.head % this.size]));
        const coeff = wanted < this.env ? this.attack : this.release;
        this.env = wanted + coeff * (this.env - wanted);
        let nowPeak = 0;
        for (let c = 0; c < this.channels; c++) nowPeak = Math.max(nowPeak, Math.abs(this.ring[c][oldest % this.size]));
        const gain = Math.min(this.env, this.ceiling / Math.max(1e-20, nowPeak));
        this.maxReductionDb = Math.max(this.maxReductionDb, -db(gain));
        for (let c = 0; c < this.channels; c++) arrays[c][used] = this.ring[c][oldest % this.size] * gain;
        used++; this.emitted++;
      }
      return arrays.map(a => a.subarray(0, used));
    }
    finish() { return this.push(null, true); }
  }
  const api = { clamp, db, normalizeCuts, makePlan, sourceAt, excerptPlan, copyAudioPlan, copyKeepRanges, expandCopyRanges, copyExcerptRanges, timeText, parseTime, LoudnessMeter, makeLevelCurve, Leveler, Waveform, Limiter };
  root.MeetingCore = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
