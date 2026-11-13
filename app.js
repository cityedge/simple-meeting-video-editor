(function () {
  'use strict';
  const C = MeetingCore, E = MeetingEngine, $ = id => document.getElementById(id), video = $('video');
  const words = {
    ja: {
      tagline:'会議録画を、見やすく、聞きやすく。',language:'言語',loadProject:'編集設定を開く',saveProject:'編集設定を保存',openVideo:'＋ MP4を開く',noFile:'動画を選択してください',localOnly:'端末内で処理 · アップロードなし · 最長2時間',
      preview:'プレビュー',skipCuts:'削除区間をスキップ',emptyTitle:'必要なところだけ、聞きやすく。',emptyText:'MP4を開くか、ここにドロップしてください。',emptyHint:'前後の余白や休憩をカットして、1本の動画に。',play:'▶ 再生',pause:'❚❚ 停止',monitor:'試聴音量',before:'補正前',after:'補正後',deleted:'削除',zoomOut:'縮小',zoomIn:'拡大',fit:'全体',waveEmpty:'音声波形はここに表示されます',viewRange:'表示範囲',keyboard:'Space 再生 / 停止 · I 開始 · O 終了 · ← → コマ送り',trialExport:'現在位置から30秒お試し出力',trialHint:'削除区間を飛ばして最大30秒。本番と同じ音量補正を使います（未解析なら全体を解析）。',trialRange:'お試し区間',trialEmpty:'この位置以降に残す区間がありません。',trialDone:'お試し出力が完了しました。',checkingExport:'出力形式の対応状況を確認しています…',AAC_ENCODER_UNSUPPORTED:'選択した音声設定でAACを書き出せません。音声ビットレートを変更して再試行してください。',staleExport:'保存先の選択中に編集設定が変わりました。もう一度書き出してください。',goStart:'先頭',goEnd:'末尾',waveHelp:'クリックで移動 · ドラッグで範囲選択 →「削除リストに追加」で確定',leveling:'レベリング（区間ごとの音量差をならす）',levelRange:'レベリング',custom:'ビットレート指定',videoBitrate:'映像ビットレート',audioBitrate:'音声ビットレート',matchSource:'元の容量に近いビットレートにする',sourceRate:'元動画の平均総ビットレート',BITRATE_INVALID:'映像は25〜50,000 kbpsの整数で指定してください。',waveScale:'波形：±1.0固定 / 表示のみモノラル',previousFrame:'前のフレーム',nextFrame:'次のフレーム',cutTitle:'不要な区間をカット',undo:'元に戻す',start:'開始',end:'終了',useCurrent:'現在位置を指定',addCut:'この区間を削除リストに追加',noCuts:'削除区間はありません',removedTime:'削除',outputTime:'完成動画',audioTitle:'音量を整える',auto:'自動',target:'目標ラウドネス',analyze:'解析して補正後の波形を表示',audioHintGlobal:'残す区間全体を目標LUFSへ調整し、飛び出すピークを抑えます。',audioHintOff:'音量補正はOFFです。音声はカット接続点の短いフェードのみ適用します。',audioHint:'レベリング → 目標LUFSへ調整 → ピーク制限の順で処理します。',listenBefore:'補正前を試聴',listenAfter:'補正後を試聴',exportTitle:'MP4を書き出す',resolution:'解像度',quality:'画質',originalSize:'元の解像度',high:'高画質',standard:'標準',small:'容量優先',fps:'フレームレート',export:'MP4を書き出す',readyEmpty:'MP4を開くと編集を始められます。',cancel:'中止',download:'MP4を保存',browserHint:'デスクトップChrome / Edge向け',guide:'使い方',licenses:'ライセンス',
      direct:'ファイルへ直接保存',memory:'小容量ダウンロード',loading:'動画を確認しています…',ready:'削除区間を指定して、音量と画質を調整できます。',wave:'音声波形を読み込んでいます',measure:'残す区間の音量を測定しています',normalize:'音量を補正して波形を作成しています',exporting:'MP4を書き出しています',finalize:'MP4ファイルを確定しています…',done:'書き出しが完了しました。',analyzed:'音量解析と補正後の波形ができました。',cancelled:'中止しました。もう一度実行できます。',auditioning:'試聴用の音声を準備しています…',auditionReady:'現在位置付近から、残す区間を最大10秒試聴します。',savedProject:'編集設定を保存しました。',loadedProject:'編集設定を読み込みました。',chooseVideoFirst:'先に元のMP4を開いてください。',invalidRange:'開始・終了時刻を確認してください。終了は開始より後にしてください。',projectMismatch:'この編集設定の元動画と、開いている動画の名前・サイズが一致しません。',badProject:'対応する編集設定ファイルではありません。',stale:'編集内容が変わりました。音量解析を更新してください。',noAudio:'音声トラックがありません。映像のみを書き出します。',noMeasurement:'無音・極小音量・短すぎる音声のため、自動での持ち上げは行いません。',limited:'ピーク制限により目標との差が残っています。試聴して確認してください。',source:'元動画',deleteLabel:'この削除指定を取り消す',gain:'音量補正',reduction:'最大ピーク抑制',estimate:'容量目安',estimateHint:'実容量は映像によって変わります',actual:'実測',pcmNote:'補正後LUFSはAAC圧縮前のPCM測定値です。',secondsRemaining:'残り約',minutes:'分',downloadLimit:'この環境では大容量の直接保存が利用できません。Chrome / Edgeで開いてください。ダウンロード保存は256 MiB以下です。',originalOverwrite:'元動画と同じファイルへの上書きはできません。別の名前を選んでください。',failed:'処理できませんでした。',fileChanged:'元動画を読み取れません。元ファイルを変更せず、再度開いてください。',
      LIBRARY_MISSING:'libフォルダーが見つかりません。ZIP全体を展開してください。',TRACKS_UNSUPPORTED:'映像1本・音声最大1本のMP4に対応しています。',CODEC_UNSUPPORTED:'H.264映像とAAC音声（モノラル／ステレオ）に対応しています。ブラウザのデコード対応も確認してください。',DURATION_UNSUPPORTED:'再生時間を取得できないか、動画が2時間を超えています。',EMPTY_OUTPUT:'残す区間がありません。削除区間を見直してください。',ENCODER_UNSUPPORTED:'この解像度でH.264を書き出せません。解像度を下げるか、Chrome / Edgeをお試しください。',VIDEO_ENDED_EARLY:'映像の読み込みが途中で終了しました。',AUDIO_ENDED_EARLY:'音声の読み込みが途中で終了しました。'
    },
    en: {
      tagline:'Trim the meeting. Keep it clear.',language:'Language',loadProject:'Open edit settings',saveProject:'Save edit settings',openVideo:'+ Open MP4',noFile:'Choose a video',localOnly:'On-device processing · No upload · Up to 2 hours',preview:'Preview',skipCuts:'Skip removed sections',emptyTitle:'Keep what matters. Make it clear.',emptyText:'Open an MP4 or drop it here.',emptyHint:'Remove waiting time and breaks, then export one video.',play:'▶ Play',pause:'❚❚ Pause',monitor:'Monitor',before:'Before',after:'After',deleted:'Removed',zoomOut:'Zoom out',zoomIn:'Zoom in',fit:'Fit',waveEmpty:'The audio waveform will appear here',viewRange:'Visible range',keyboard:'Space Play / pause · I In · O Out · ← → Frame step',trialExport:'Export 30-second sample from playhead',trialHint:'Up to 30 seconds, skipping removals. Uses the full export loudness settings; analyzes the full program first if needed.',trialRange:'Sample range',trialEmpty:'No retained section remains after this position.',trialDone:'Sample export complete.',checkingExport:'Checking output codec support…',AAC_ENCODER_UNSUPPORTED:'AAC export is unavailable for these audio settings. Change the audio bitrate and try again.',staleExport:'Edits changed while choosing a destination. Start the export again.',goStart:'Start',goEnd:'End',waveHelp:'Click to seek · Drag to select a range → Add to removals to confirm',leveling:'Leveling (balance loud and quiet sections)',levelRange:'Leveling',custom:'Custom bitrate',videoBitrate:'Video bitrate',audioBitrate:'Audio bitrate',matchSource:'Match the source size approximately',sourceRate:'Source average total bitrate',BITRATE_INVALID:'Enter an integer video bitrate from 25 to 50,000 kbps.',waveScale:'Waveform: fixed ±1.0 / mono display only',previousFrame:'Previous frame',nextFrame:'Next frame',cutTitle:'Remove sections',undo:'Undo',start:'Start',end:'End',useCurrent:'Use playhead',addCut:'Add this section to removals',noCuts:'No sections removed',removedTime:'Removed',outputTime:'Final video',audioTitle:'Adjust loudness',auto:'Auto',target:'Target loudness',analyze:'Analyze & show processed waveform',audioHintGlobal:'Adjusts the retained program to target LUFS and limits peaks.',audioHintOff:'Audio correction is off. Only short fades at cut boundaries are applied.',audioHint:'Levels sections, adjusts to target LUFS, then limits peaks.',listenBefore:'Listen before',listenAfter:'Listen after',exportTitle:'Export MP4',resolution:'Resolution',quality:'Quality',originalSize:'Original size',high:'High',standard:'Standard',small:'Smaller file',fps:'Frame rate',export:'Export MP4',readyEmpty:'Open an MP4 to start editing.',cancel:'Cancel',download:'Save MP4',browserHint:'Desktop Chrome / Edge',guide:'User guide',licenses:'Licenses',
      direct:'Save directly to disk',memory:'Small-file download',loading:'Inspecting video…',ready:'Choose sections to remove, then adjust loudness and quality.',wave:'Reading audio waveform',measure:'Measuring retained audio',normalize:'Processing audio and waveform',exporting:'Encoding MP4',finalize:'Finalizing the MP4…',done:'Export complete.',analyzed:'Analysis and processed waveform are ready.',cancelled:'Cancelled. You can try again.',auditioning:'Preparing audio preview…',auditionReady:'Auditioning up to 10 seconds of retained audio near the playhead.',savedProject:'Edit settings saved.',loadedProject:'Edit settings loaded.',chooseVideoFirst:'Open the source MP4 first.',invalidRange:'Check the times. End must be later than start.',projectMismatch:'The source video name and size do not match this project.',badProject:'This is not a supported edit settings file.',stale:'Edits changed. Update the audio analysis.',noAudio:'No audio track. The export will be video only.',noMeasurement:'Silent, extremely quiet, or very short audio. No automatic boost is applied.',limited:'Peak limiting leaves a difference from the target. Please audition the result.',source:'Source',deleteLabel:'Restore this removed section',gain:'Gain',reduction:'Maximum peak reduction',estimate:'Estimated size',estimateHint:'Actual size depends on video content',actual:'Measured',pcmNote:'Processed LUFS is measured on PCM before AAC encoding.',secondsRemaining:'About',minutes:'min remaining',downloadLimit:'Direct saving is unavailable. Open in Chrome / Edge for large files. Download fallback is limited to 256 MiB.',originalOverwrite:'Cannot overwrite the source video. Choose a different name.',failed:'The operation failed.',fileChanged:'Cannot read the source. Keep it unchanged and open it again.',
      LIBRARY_MISSING:'Library missing. Extract the entire ZIP, including the lib folder.',TRACKS_UNSUPPORTED:'One video track and up to one audio track are supported.',CODEC_UNSUPPORTED:'H.264 video and mono/stereo AAC audio are supported. The browser must support decoding them.',DURATION_UNSUPPORTED:'The duration is unavailable or exceeds 2 hours.',EMPTY_OUTPUT:'No retained sections. Review the removals.',ENCODER_UNSUPPORTED:'H.264 encoding at this resolution is unavailable. Lower the resolution or use Chrome / Edge.',VIDEO_ENDED_EARLY:'Video decoding ended early.',AUDIO_ENDED_EARLY:'Audio decoding ended early.'
    }
  };
  Object.assign(words.ja,{
    outputMode:'出力方式',copyMode:'映像無劣化（推奨）',encodeMode:'再圧縮',copyHint:'元の映像品質を維持し、音声のみ処理します。カット位置は残す部分が長くなる方向へ合わせます。',encodeHint:'指定位置でカットし、映像と音声を再圧縮します。画質・容量を設定できます。',
    retryCopy:'再確認',useEncode:'再圧縮に切り替える',confirmedRanges:'実際に残る区間を確認',copyPending:'無劣化編集のカット位置を確認してください。',copyReady:'無劣化編集に対応。波形の削除表示・音量解析は、実際に残る区間に合わせています。',copyAdjusted:'キーフレーム補正で指定より多く残す時間',keyInterval:'キーフレーム間隔',requested:'指定',retained:'実際に残す',copyUnavailable:'この動画では無劣化編集を利用できません。再圧縮に切り替えてください。',copyEmpty:'キーフレーム補正で残せなくなる区間があります。削除指定を調整するか、再圧縮に切り替えてください。',copyTrialExport:'現在位置付近を約30秒お試し出力',copyTrialEmpty:'この位置以降に残す区間がありません。',copyTrialHint:'現在位置から残る内容を30秒選び、開始を前・終了を後のキーフレームへ広げます。30秒を超える場合があります。実際の秒数を確認してください。本番と同じ音量補正を使用します。',copyEstimate:'元映像をコピー（容量は残す場面により変わります）',copyPlanning:'キーフレームにカット位置を合わせています…',inspecting:'無劣化編集の対応状況を確認しています',copying:'映像をコピーし、音声を書き出しています',finalizing:'MP4ファイルを確定しています…',complete:'書き出しが完了しました。',COPY_PLAN_INVALID:'カット位置の同期を確認できません。もう一度解析してください。',
    copyReason_CONTAINER:'MP4の内部構造が未対応です。',copyReason_CODEC:'映像コーデックが未対応です。',copyReason_CONFIGURATION_CHANGE:'映像の設定変更または複数の設定情報が含まれています。',copyReason_GOP_STRUCTURE:'安全にコピーできる映像構造を確認できません。',copyReason_DISPLAY_METADATA:'画面の表示情報が未対応です。',copyReason_TIMELINE:'映像の時刻情報が未対応です。',copyReason_NO_SAFE_BOUNDARY:'安全に切り出せる境界がありません。',copyReason_LIMIT:'無劣化編集で扱える上限を超えています。'
  });
  Object.assign(words.en,{
    outputMode:'Output mode',copyMode:'Video copy (recommended)',encodeMode:'Re-encode',copyHint:'Preserve original video quality and process audio only. Retained sections expand to surrounding keyframes.',encodeHint:'Cut at the requested positions and re-encode video and audio. Set the output quality and size.',
    retryCopy:'Check again',useEncode:'Switch to re-encode',confirmedRanges:'Review actual retained ranges',copyPending:'Check the video copy boundaries before exporting.',copyReady:'Video copy supported. Waveform removals and audio analysis follow the actual retained ranges.',copyAdjusted:'Extra content retained after keyframe alignment',keyInterval:'Keyframe interval',requested:'Requested',retained:'Retained',copyUnavailable:'Video copy is unavailable for this file. Switch to re-encode.',copyEmpty:'A retained range disappears after keyframe alignment. Adjust the cuts or switch to re-encode.',copyTrialExport:'Export ~30-second sample around playhead',copyTrialEmpty:'No retained section remains after this position.',copyTrialHint:'Select 30 retained seconds from the playhead, then expand to the previous and next keyframes. The sample may exceed 30 seconds; check its actual duration. Reuses the full-program audio correction.',copyEstimate:'Copy original video (size depends on the retained scenes)',copyPlanning:'Aligning cuts to keyframes…',inspecting:'Checking video copy support',copying:'Copying video and encoding audio',finalizing:'Finalizing the MP4 file…',complete:'Export complete.',COPY_PLAN_INVALID:'The audio and video plans do not match. Analyze again.',
    copyReason_CONTAINER:'Unsupported MP4 structure.',copyReason_CODEC:'Unsupported video codec.',copyReason_CONFIGURATION_CHANGE:'The video contains changing or multiple codec configurations.',copyReason_GOP_STRUCTURE:'A safe video copy structure could not be verified.',copyReason_DISPLAY_METADATA:'Unsupported display metadata.',copyReason_TIMELINE:'Unsupported video timing.',copyReason_NO_SAFE_BOUNDARY:'No verified cut boundary is available.',copyReason_LIMIT:'The video copy resource limit was exceeded.'
  });
  Object.assign(words.ja,{
    forceWarning:'MP4のキーフレーム情報を使ってコピーを試せます。カット付近の映像の乱れ・欠落・停止や音ズレが生じる可能性があります。元動画は変更しません。',forceAck:'注意点を理解し、出力を再生確認します',forceCopy:'警告を承知でコピーを試す',forceActive:'構造の保証なしでコピーするモードです。まずお試し出力で映像と音声を確認してください。',strictCopy:'通常の検査に戻す',copyDiagnostics:'停止理由・検査結果の詳細',copyUnverified:'通常の検査では無劣化編集への対応を確認できませんでした。再圧縮へ切り替えるか、下の注意点を確認してコピーを試せます。',copyForcedReady:'MP4のキーフレーム情報を使ってコピーします。独立して再生できる区間かどうかは未検証です。',forceResult:'構造未検証のコピー',FORCE_COPY_UNAVAILABLE:'対応するライブラリが見つかりません。ZIP全体を展開し直してください。'
  });
  Object.assign(words.en,{
    forceWarning:'You can try copying using MP4 sync-sample metadata. Images may corrupt, disappear or freeze near cuts, and audio may drift. The original file is unchanged.',forceAck:'I understand and will review the output',forceCopy:'Accept the warning and try copying',forceActive:'Copying without a structural guarantee. Check a trial export for video and audio problems first.',strictCopy:'Return to strict validation',copyDiagnostics:'Detailed reason and validation results',copyUnverified:'Strict validation could not confirm video copy support. Switch to re-encode, or review the warning below and try copying.',copyForcedReady:'Copying using MP4 sync-sample metadata. Independently decodable ranges are not verified.',forceResult:'Unverified copy',FORCE_COPY_UNAVAILABLE:'The required library version is missing. Extract the entire ZIP again.'
  });
  let lang = 'ja'; try { lang = localStorage.getItem('meeting-cut-language') || 'ja'; } catch {}
  if (!words[lang]) lang = 'ja';
  const t = key => words[lang][key] || key;
  const state = { file:null, meta:null, cuts:[], undo:[], raw:null, rawComplete:false, analysis:null, zoom:1, viewStart:0, busy:false, controller:null, status:'readyEmpty', sourceUrl:null, outputUrl:null, audioUrl:null, key:'', taskStarted:0, job:0, copySession:null, copyInfo:null, copyPlan:null, copyAudio:null, copyError:null };
  state.copyValidation='strict';state.copyOriginalError=null;
  const formatLufs = x => Number.isFinite(x) ? x.toFixed(1) : '—';
  const sizeText = bytes => bytes >= 1024 ** 3 ? (bytes / 1024 ** 3).toFixed(2) + ' GiB' : (bytes / 1024 ** 2).toFixed(1) + ' MiB';
  const audioEnabled = () => $('normalize').checked;
  const isCopy = () => $('output-mode').value === 'copy';
  const analysisKey = () => JSON.stringify([state.cuts, $('output-mode').value, isCopy()?state.copyValidation:null, isCopy()?state.copyPlan?.ranges:null, audioEnabled(), $('leveling').checked, $('target').value]);
  const currentAnalysis = () => state.analysis && state.key === analysisKey() ? state.analysis : null;
  const planNow = () => state.meta ? (isCopy()?state.copyAudio:C.makePlan(state.cuts, state.meta.duration, state.meta.sampleRate)) : null;
  const currentSettings = () => {
    if(!isCopy())return E.videoSettings(state.meta, $('resolution').value, $('quality').value, Number($('fps').value), $('quality').value === 'custom' ? Number($('video-bitrate').value) : 250, Number($('audio-bitrate').value));
    const kbps=Number($('audio-bitrate').value);if(![32,48,64,80,96,128,160,192,256].includes(kbps))throw new Error('BITRATE_INVALID');
    return {videoMode:'copy',audioBitrate:kbps*1000};
  };
  function estimatedBytes(plan,settings){
    if(!plan)return 0;
    return settings.videoMode==='copy' ? state.file.size*plan.duration/state.meta.duration + (state.meta.audio?plan.duration*settings.audioBitrate/8:0) + 1024*1024
      : plan.duration*(settings.videoBitrate+(state.meta.audio?settings.audioBitrate:0))/8;
  }
  function effectiveCuts(){
    if(!isCopy()||!state.copyPlan)return state.cuts;
    const cuts=[];let at=0;
    for(const r of state.copyPlan.ranges){if(r.sourceStart>at)cuts.push({start:at,end:r.sourceStart});at=r.sourceEnd;}
    if(at<state.meta.duration)cuts.push({start:at,end:state.meta.duration});return cuts;
  }
  function trialPlanNow(begin=video.currentTime){
    const full=planNow();if(!full)return null;
    if(!isCopy())return C.excerptPlan(full,begin,30);
    const ranges=C.copyExcerptRanges(state.copyPlan,state.copyInfo,begin,30),duration=ranges.reduce((n,r)=>n+r.end-r.start,0);
    return {keep:ranges,requests:ranges,duration,total:Math.round(duration*state.meta.sampleRate)};
  }
  function forceAllowed(error){return error?.recoverableInContainer===true;}
  function copyErrorText(error){
    if(error?.reason==='EMPTY_RANGE')return `${t('copyEmpty')}${Number.isInteger(error.rangeIndex)?` (${error.rangeIndex+1})`:''}`;
    if(error?.message==='EMPTY_OUTPUT')return t('EMPTY_OUTPUT');
    return `${t(state.copyValidation==='strict'&&forceAllowed(error)?'copyUnverified':'copyUnavailable')} ${words[lang]['copyReason_'+error?.reason]||error?.message||''}`;
  }
  async function refreshCopyPlan(signal){
    if(!isCopy()||!state.meta)return;
    state.copyPlan=null;state.copyAudio=null;state.copyError=null;
    try{
      if(!state.copySession){const opened=await E.openCopy(state.file,state.meta,signal,progress,state.copyValidation);state.copySession=opened.session;state.copyInfo=opened.info;}
      state.copyPlan=await E.planCopy(state.copySession,state.copyInfo,state.meta,state.cuts,signal);
      state.copyAudio=C.copyAudioPlan(state.copyPlan);
    }catch(error){if(signal.aborted||error.name==='AbortError'||error.code==='ABORTED')throw error;state.copyError=error;}
    updateUI();drawWave();
  }
  function updateCopyUI(){
    const active=isCopy()&&!!state.meta,info=state.copyInfo,plan=state.copyPlan,error=state.copyError;
    const forced=state.copyValidation==='container';
    $('output-mode').querySelector('option[value="copy"]').textContent=forced?(lang==='ja'?'映像コピー（強行）':'Video copy (forced)'):t('copyMode');
    $('force-copy-choice').hidden=!active||forced||!forceAllowed(error);
    $('force-copy').disabled=state.busy||!$('force-copy-ack').checked;
    $('force-copy-ack').disabled=state.busy;
    $('force-copy-active').hidden=!active||!forced;$('strict-copy').disabled=state.busy;
    const reasons=[state.copyOriginalError,error].filter((e,i,a)=>e&&a.indexOf(e)===i).map(e=>`${e.diagnosticCode||e.reason||e.code||'ERROR'}: ${e.message}`);
    const diagnostics=state.lastExport?.videoMode==='copy'?state.lastExport:plan||info;
    if(diagnostics?.warnings)reasons.push(...diagnostics.warnings.map(w=>`${w.code}: ${w.message} (${w.count})`));
    $('copy-diagnostics').hidden=!active||!reasons.length;
    $('copy-diagnostic-text').textContent=reasons.join('\n');
    $('mode-hint').textContent=t(isCopy()?'copyHint':'encodeHint');
    $('copy-notice').hidden=!active;$('copy-details').hidden=!active||!plan;
    $('copy-actions').hidden=!active||!!plan;$('retry-copy').disabled=state.busy;$('use-encode').disabled=state.busy;
    $('copy-notice').classList.toggle('warning',!!error||forced);
    if(!active)return;
    let text=error?copyErrorText(error):!plan?t('copyPending'):t(forced?'copyForcedReady':'copyReady');
    if(plan){
      const requested=C.copyKeepRanges(state.cuts,state.meta.duration,info).reduce((n,r)=>n+r.end-r.start,0),extra=Math.max(0,plan.duration-requested);
      text+=`\n${t('keyInterval')}: ${info.keyframeInterval.min.toFixed(2)}–${info.keyframeInterval.max.toFixed(2)} s`;
      if(extra>.001)text+=`\n${t('copyAdjusted')}: ${extra.toFixed(3)} s`;
      const list=$('copy-ranges');list.replaceChildren();
      plan.ranges.forEach((r,i)=>{const p=document.createElement('p'),requests=E.copyRequestedRanges(plan,i);p.textContent=`${i+1}. ${t('requested')} ${requests.map(x=>`${C.timeText(x.start)} → ${C.timeText(x.end)}`).join(' / ')}\n${t('retained')} ${C.timeText(r.sourceStart)} → ${C.timeText(r.sourceEnd)}`;list.append(p);});
    }
    $('copy-notice').textContent=text;
  }
  async function setCopyValidation(validation){
    if(state.busy||!state.meta)return;
    if(validation==='container'&&(!$('force-copy-ack').checked||!forceAllowed(state.copyError)))return;
    const reason=state.copyError;
    await task(async signal=>{
      await state.copySession?.close();state.copySession=null;state.copyInfo=null;state.copyPlan=null;state.copyAudio=null;
      state.copyValidation=validation;state.copyOriginalError=validation==='container'?reason:null;
      $('force-copy-ack').checked=false;invalidate();await refreshCopyPlan(signal);setStatus('ready');
    },'copyPlanning');
  }
  function setStatus(key, detail = '') { state.status = key; $('status').textContent = t(key); $('detail').textContent = detail; }
  function showError(error) {
    if(error?.reason){$('error').textContent=copyErrorText(error);$('error').hidden=false;return;}
    const key = error?.code === 'RESOURCE_LIMIT' && /Blob|byte limit/.test(error.message || '') ? 'downloadLimit' : (typeof error === 'string' ? error : error.message);
    $('error').textContent = words[lang][key] || `${t('failed')} ${key}`; $('error').hidden = false;
  }
  function clearError() { $('error').hidden = true; $('error').textContent = ''; }
  function stopAudition() { $('audition').pause(); $('audition').hidden = true; $('audition').removeAttribute('src'); $('audition').load(); if (state.audioUrl) URL.revokeObjectURL(state.audioUrl); state.audioUrl = null; }
  function clearOutput() { if (state.outputUrl) URL.revokeObjectURL(state.outputUrl); state.outputUrl = null; state.lastExport=null; $('download').hidden = true; $('download').removeAttribute('href'); }
  function invalidate() { state.analysis = null; state.key = ''; stopAudition(); clearOutput(); updateUI(); drawWave(); }
  function applyLanguage() {
    document.documentElement.lang = lang; $('language').value = lang;
    $('user-guide').href = `USER_GUIDE.html#${lang}`;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-title]').forEach(el => { el.title = t(el.dataset.title); el.setAttribute('aria-label', t(el.dataset.title)); });
    $('seek').setAttribute('aria-label', lang === 'ja' ? '再生位置' : 'Playhead');
    $('wave').setAttribute('aria-label', lang === 'ja' ? '音声波形。クリックでシーク、ドラッグで範囲選択' : 'Audio waveform. Click to seek, drag to select a range');
    $('volume').setAttribute('aria-label', t('monitor'));
    $('video-bitrate').setAttribute('aria-label', t('videoBitrate') + ' kbps');
    $('go-start').setAttribute('aria-label', lang === 'ja' ? '先頭に移動' : 'Go to start');
    $('go-end').setAttribute('aria-label', lang === 'ja' ? '末尾に移動' : 'Go to end');
    $('status').textContent = t(state.status); updateUI(); renderCuts(); drawWave();
  }
  function updateUI() {
    const loaded = !!state.meta, a = currentAnalysis(), canEdit = loaded && !state.busy;
    $('video-settings').hidden = isCopy();
    for (const id of ['file','load-project','normalize','leveling','target','resolution','quality','fps','video-bitrate','audio-bitrate','skip-cuts','output-mode']) $(id).disabled = state.busy;
    $('target').disabled = state.busy || !audioEnabled();
    $('leveling').disabled = state.busy || !audioEnabled();
    for(const id of ['resolution','quality','fps'])$(id).disabled=state.busy||isCopy();
    $('video-bitrate').disabled = state.busy || isCopy() || $('quality').value !== 'custom';
    $('audio-bitrate').disabled = state.busy || (loaded && !state.meta.audio);
    for (const id of ['play','go-start','go-end','match-source','step-back','step-next','cut-start','cut-end','mark-start','mark-end','add-cut','seek','save-project']) $(id).disabled = !canEdit;
    $('undo').disabled = !canEdit || !state.undo.length;
    $('match-source').disabled=!canEdit||isCopy();
    $('analyze').disabled = !canEdit || !state.meta.audio || !planNow()?.total;
    $('listen-before').disabled = !canEdit || !state.meta.audio || !planNow()?.total;
    $('listen-after').disabled = !canEdit || !state.meta.audio || !a || !planNow()?.total;
    const plan = planNow(); $('export').disabled = !canEdit || !plan?.total;
    $('cancel').hidden = !state.busy; $('cancel').disabled = !!state.controller?.signal.aborted;
    $('progress').hidden = !state.busy;
    $('play').textContent = t(video.paused ? 'play' : 'pause');
    $('save-mode').textContent = t(typeof showSaveFilePicker === 'function' ? 'direct' : 'memory');
    $('empty').hidden = loaded;
    if (loaded) {
      const m = state.meta;
      $('filename').textContent = state.file.name;
      $('filemeta').textContent = `${m.video.video.width} × ${m.video.video.height} · ${C.timeText(m.duration, false)} · ${sizeText(state.file.size)} · ${m.audio ? (m.channels === 1 ? 'Mono' : 'Stereo') : t('noAudio')}`;
      $('duration-time').textContent = C.timeText(m.duration);
      $('output-duration').textContent = plan?C.timeText(plan.duration, false):'—';
      $('removed').textContent = plan?C.timeText(m.duration - plan.duration, false):'—';
      $('source-rate').textContent = `${t('sourceRate')} ${Math.round(state.file.size * 8 / m.duration / 1000)} kbps`;
      try {
        const settings = currentSettings();
        const bytes = estimatedBytes(plan,settings);
        $('export-estimate').textContent = isCopy()?`${t('copyEstimate')}${m.audio?` + AAC ${settings.audioBitrate/1000} kbps`:''}${plan?`\n${t('estimate')} ≈ ${sizeText(bytes)}`:''}`:
          `${settings.width} × ${settings.height} · ${Math.round(settings.videoBitrate / 1000)} kbps VBR${m.audio ? ` + AAC ${settings.audioBitrate / 1000} kbps` : ''}\n${t('estimate')} ${sizeText(bytes)} · ${t('estimateHint')}`;
      } catch {
        $('export-estimate').textContent = t('BITRATE_INVALID');
        $('export').disabled = true; $('save-project').disabled = true;
      }
    }
    $('before-lufs').textContent = formatLufs(a?.inputLufs ?? (!state.cuts.length ? state.raw?.measurement?.lufs : null));
    $('after-lufs').textContent = formatLufs(a?.outputLufs);
    let note = !state.meta?.audio && loaded ? t('noAudio') : t(!audioEnabled() ? 'audioHintOff' : $('leveling').checked ? 'audioHint' : 'audioHintGlobal');
    if (a && state.meta.audio) {
      note = Number.isFinite(a.inputLufs) && a.measurable !== false ? `${t('gain')} ${a.gainDb >= 0 ? '+' : ''}${a.gainDb.toFixed(1)} dB · ${t('reduction')} ${a.maxReductionDb.toFixed(1)} dB. ${t('pcmNote')}` : t('noMeasurement');
      if (a.levelCurve) note = `${t('levelRange')} ${a.levelCurve.minDb.toFixed(1)} ~ ${a.levelCurve.maxDb >= 0 ? '+' : ''}${a.levelCurve.maxDb.toFixed(1)} dB · ` + note;
      if (a.enabled && a.measurable !== false && Number.isFinite(a.outputLufs) && Math.abs(a.outputLufs - a.target) > 1) note += ' ' + t('limited');
    }
    if (loaded && !state.rawComplete && !state.busy) note += ' ' + (lang === 'ja' ? '波形は読み込み途中です。解析ボタンで全体を読み直せます。' : 'The waveform is incomplete. Analyze to reload it.');
    $('audio-note').textContent = note;
    updateView(); updateTrialUI(); updateCopyUI();
    document.querySelectorAll('.cut-row button').forEach(b => b.disabled = state.busy);
  }
  function updateTrialUI() {
    const p = state.meta ? trialPlanNow() : null;
    let valid = true; if (state.meta) { try { currentSettings(); } catch { valid = false; } }
    $('export-trial').disabled = state.busy || !p?.total || !valid;
    $('export-trial').textContent=t(isCopy()?'copyTrialExport':'trialExport');
    $('trial-range').textContent = !p ? '' : p.total ? `${t('trialRange')}: ${C.timeText(p.keep[0].start)} → ${C.timeText(p.keep[p.keep.length - 1].end)} · ${p.duration.toFixed(3)} s` : t(isCopy()?'copyTrialEmpty':'trialEmpty');
    document.querySelector('[data-i18n="trialHint"]').textContent=t(isCopy()?'copyTrialHint':'trialHint');
  }
  function pushUndo() { state.undo.push(state.cuts.map(c => ({ ...c }))); if (state.undo.length > 100) state.undo.shift(); }
  function changedCuts() {
    state.copyPlan=null;state.copyAudio=null;state.copyError=null;invalidate();renderCuts();setStatus('stale');
    if(isCopy())return task(async signal=>{await refreshCopyPlan(signal);setStatus('stale');},'copyPlanning');
  }
  function renderCuts() {
    const list = $('cuts'); list.replaceChildren();
    if (!state.cuts.length) { const p = document.createElement('p'); p.className = 'muted'; p.textContent = t('noCuts'); list.append(p); return; }
    state.cuts.forEach((c, i) => {
      const row = document.createElement('div'); row.className = 'cut-row';
      const label = document.createElement('button'); label.className = 'cut-label'; label.textContent = `${C.timeText(c.start)} – ${C.timeText(c.end)}`;
      label.onclick = () => { if (state.busy) return; $('cut-start').value = C.timeText(c.start); $('cut-end').value = C.timeText(c.end); seek(c.start); };
      const remove = document.createElement('button'); remove.className = 'remove'; remove.textContent = '×'; remove.title = t('deleteLabel'); remove.setAttribute('aria-label', `${t('deleteLabel')} ${i + 1}`);
      remove.onclick = () => { if (state.busy) return; pushUndo(); state.cuts.splice(i, 1); changedCuts(); };
      row.append(label, remove); list.append(row);
    });
  }
  function addCut() {
    if (!state.meta || state.busy) return;
    const start = C.parseTime($('cut-start').value), end = C.parseTime($('cut-end').value);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || start < 0 || end > state.meta.duration + .001) { showError('invalidRange'); return; }
    clearError(); pushUndo(); state.cuts = C.normalizeCuts([...state.cuts, { start, end }], state.meta.duration); changedCuts();
  }
  let progressStamp = 0;
  function progress(p) {
    const now = performance.now(); if (now - progressStamp < 100 && p.fraction < .999) return; progressStamp = now;
    if (p.stage !== state.progressStage) { state.progressStage = p.stage; state.stageStart = now; }
    const key = p.stage === 'export' ? 'exporting' : p.stage;
    $('status').textContent = `${t(key)}${p.stage === 'finalize'||p.fraction==null ? '' : ` · ${Math.floor(p.fraction * 100)}%`}`;
    if(p.fraction==null)$('progress').removeAttribute('value');else $('progress').value = p.fraction;
    if (p.stage === 'export' && p.fraction > .02) {
      const remaining = (now - state.stageStart) / p.fraction * (1 - p.fraction) / 60000;
      $('detail').textContent = `${t('secondsRemaining')} ${Math.ceil(remaining)} ${t('minutes')}`;
    }
    if (p.wave) { waveVersion++; state.raw = { wave:p.wave, measurement:null }; drawWave(); }
  }
  async function task(action, status) {
    if (state.busy) return;
    state.busy = true; state.controller = new AbortController(); state.taskStarted = performance.now(); state.progressStage = null; state.job++;
    video.pause(); stopAudition(); clearError(); setStatus(status); $('progress').value = 0; updateUI();
    try { return await action(state.controller.signal); }
    catch (error) {
      if (state.controller.signal.aborted || error.name === 'AbortError' || error.code === 'ABORTED') setStatus('cancelled');
      else { console.error(error); setStatus('failed'); showError(error); }
    } finally { state.busy = false; state.controller = null; updateUI(); drawWave(); }
  }
  async function openFile(file) {
    if (!file || state.busy) return;
    await task(async signal => {
      const meta = await E.inspect(file, signal);
      await state.copySession?.close();
      state.copySession=null;state.copyInfo=null;state.copyPlan=null;state.copyAudio=null;state.copyError=null;
      state.copyValidation='strict';state.copyOriginalError=null;$('force-copy-ack').checked=false;
      if (state.sourceUrl) URL.revokeObjectURL(state.sourceUrl);
      clearOutput(); state.file = file; state.meta = meta; state.cuts = []; state.undo = []; state.raw = null; state.rawComplete = false; state.analysis = null; state.key = ''; state.zoom = 1; state.viewStart = 0;
      state.sourceUrl = URL.createObjectURL(file); video.src = state.sourceUrl;
      $('cut-start').value = C.timeText(0); $('cut-end').value = C.timeText(meta.duration);
      updateUI(); renderCuts();
      await refreshCopyPlan(signal);
      state.raw = await E.rawWave(file, meta, signal, progress); state.rawComplete = true;
      setStatus('ready');
    }, 'loading');
  }
  async function ensureAnalysis(signal) {
    if (currentAnalysis()) return currentAnalysis();
    if(isCopy()&&!state.copyPlan){await refreshCopyPlan(signal);if(!state.copyPlan)throw state.copyError||new Error('COPY_PLAN_INVALID');}
    if(!planNow()?.total)throw new Error('EMPTY_OUTPUT');
    if (!state.rawComplete) { state.raw = await E.rawWave(state.file, state.meta, signal, progress); state.rawComplete = true; }
    const key = analysisKey();
    const a = await E.analyze(state.file, state.meta, state.cuts, Number($('target').value), audioEnabled(), signal, progress, $('leveling').checked, isCopy()?state.copyAudio:null);
    state.analysis = a; state.key = key; updateUI(); drawWave(); return a;
  }
  function seek(time) {
    if (!state.meta || state.busy) return;
    video.currentTime = C.clamp(time, 0, state.meta.duration); updatePlayhead();
  }
  function togglePlay() {
    if (!state.meta || state.busy) return;
    stopAudition();
    if (video.paused) {
      if (video.currentTime >= state.meta.duration - .01) video.currentTime = 0;
      skipRemoved(); video.play().catch(showError);
    } else video.pause();
  }
  function skipRemoved() {
    if (!$('skip-cuts').checked || video.seeking) return;
    const cut = effectiveCuts().find(c => video.currentTime >= c.start - .001 && video.currentTime < c.end - .001);
    if (cut) { if (cut.end >= state.meta.duration - .001) { video.pause(); video.currentTime = state.meta.duration; } else video.currentTime = cut.end; }
  }
  function updatePlayhead() {
    updateTrialUI();
    $('current-time').textContent = C.timeText(video.currentTime);
    if (state.meta && !video.paused) {
      const length = state.meta.duration / state.zoom;
      if (video.currentTime < state.viewStart || video.currentTime > state.viewStart + length) state.viewStart = C.clamp(video.currentTime - length * .1, 0, state.meta.duration - length);
    }
    updateView(); drawWave();
  }
  function updateView() {
    const d = state.meta?.duration || 1, length = d / state.zoom;
    state.viewStart = C.clamp(state.viewStart, 0, Math.max(0, d - length));
    $('seek').min = state.viewStart; $('seek').max = state.viewStart + length; $('seek').value = video.currentTime || 0;
    $('view-start').textContent = C.timeText(state.viewStart, false); $('view-end').textContent = C.timeText(state.viewStart + (state.meta ? length : 0), false);
    $('zoom-label').textContent = state.zoom + '×'; $('pan-control').hidden = state.zoom <= 1;
    $('pan').max = Math.max(0, d - length); $('pan').value = state.viewStart;
  }
  function changeZoom(z) {
    if (!state.meta) return;
    state.zoom = C.clamp(z, 1, 256); state.viewStart = C.clamp(video.currentTime - state.meta.duration / state.zoom * .5, 0, state.meta.duration);
    updateView(); drawWave();
  }
  let waveVersion = 0, waveCacheKey = '', cachedRaw = null, cachedAfter = null;
  const waveCache = document.createElement('canvas');
  function drawWave() {
    const canvas = $('wave'), rect = canvas.getBoundingClientRect(), ratio = devicePixelRatio || 1;
    const w = rect.width, h = rect.height;
    if (canvas.width !== Math.round(w * ratio) || canvas.height !== Math.round(h * ratio)) { canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio); }
    const ctx = canvas.getContext('2d'); ctx.setTransform(ratio,0,0,ratio,0,0); ctx.clearRect(0,0,w,h);
    const raw = state.raw?.wave, after = currentAnalysis()?.wave;
    $('wave-message').hidden = !!raw;
    ctx.strokeStyle = '#26354c'; ctx.lineWidth = 1;
    for (const a of [.08,.5,.92]) { ctx.beginPath(); ctx.moveTo(0,h*a); ctx.lineTo(w,h*a); ctx.stroke(); }
    if (!state.meta) return;
    const duration = state.meta.duration / state.zoom, start = state.viewStart, xAt = t => (t - start) / duration * w;
    const cacheKey = JSON.stringify([w,h,ratio,start,duration,effectiveCuts(),$('cut-start').value,$('cut-end').value,waveVersion]);
    const rebuild = cacheKey !== waveCacheKey || cachedRaw !== raw || cachedAfter !== after;
    if (rebuild) {
    function paint(wave, color, alpha) {
      if (!wave) return;
      ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < w; x++) {
        const from = Math.max(0, Math.floor((start + x / w * duration) * wave.rate));
        const end = Math.min(wave.min.length, Math.max(from + 1, Math.ceil((start + (x + 1) / w * duration) * wave.rate)));
        let min = 0, max = 0;
        for (let n = from; n < end; n++) { min = Math.min(min, wave.min[n]); max = Math.max(max, wave.max[n]); }
        ctx.moveTo(x+.5,h*.5-C.clamp(max,-1,1)*h*.42); ctx.lineTo(x+.5,h*.5-C.clamp(min,-1,1)*h*.42);
      }
      ctx.stroke(); ctx.globalAlpha=1;
    }
    paint(raw,'#97a9e2',.58); paint(after,'#67dfcd',.88);
    for (const c of effectiveCuts()) {
      const x1 = C.clamp(xAt(c.start),0,w), x2 = C.clamp(xAt(c.end),0,w);
      if (x2 <= x1) continue;
      ctx.fillStyle='#b7496c40'; ctx.fillRect(x1,0,x2-x1,h);
      ctx.save(); ctx.beginPath();ctx.rect(x1,0,x2-x1,h);ctx.clip();ctx.strokeStyle='#e782a133';ctx.lineWidth=1;ctx.beginPath();
      for(let x=x1-h;x<x2;x+=12){ctx.moveTo(x,h);ctx.lineTo(x+h,0);}ctx.stroke();ctx.restore();
    }
    const a=C.parseTime($('cut-start').value),b=C.parseTime($('cut-end').value);
    if (b>a) {ctx.strokeStyle='#f1ba7977';ctx.strokeRect(xAt(a),1,xAt(b)-xAt(a),h-2);}
    waveCache.width=canvas.width;waveCache.height=canvas.height;waveCache.getContext('2d').drawImage(canvas,0,0);
    waveCacheKey=cacheKey;cachedRaw=raw;cachedAfter=after;
    } else { ctx.drawImage(waveCache,0,0,w,h); }
    const px=xAt(video.currentTime); if(px>=0&&px<=w){ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(px,0);ctx.lineTo(px,h);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(px-4,0);ctx.lineTo(px+4,0);ctx.lineTo(px,6);ctx.fill();}
    ctx.fillStyle='#70819b';ctx.font='9px ui-monospace,monospace';ctx.fillText('+1',4,11);ctx.fillText('−1',4,h-4);
  }
  function wavBlob(channels, sr) {
    const len = channels[0].length, ch = channels.length, buffer = new ArrayBuffer(44 + len * ch * 2), v = new DataView(buffer);
    const str=(at,s)=>{for(let i=0;i<s.length;i++)v.setUint8(at+i,s.charCodeAt(i));};
    str(0,'RIFF');v.setUint32(4,36+len*ch*2,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,ch,true);v.setUint32(24,sr,true);v.setUint32(28,sr*ch*2,true);v.setUint16(32,ch*2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,len*ch*2,true);
    for(let n=0;n<len;n++)for(let c=0;c<ch;c++){const x=C.clamp(channels[c][n],-1,1);v.setInt16(44+(n*ch+c)*2,Math.round(x*(x<0?32768:32767)),true);}
    return new Blob([buffer],{type:'audio/wav'});
  }
  async function audition(after) {
    await task(async signal=>{
      const a=after?await ensureAnalysis(signal):null, full=planNow();
      const plan=C.excerptPlan(full,video.currentTime,10);
      if(!plan.total)throw new Error('EMPTY_OUTPUT');
      const data=Array.from({length:state.meta.channels},()=>new Float32Array(plan.total));
      for await(const b of E.processedAudio(state.file,state.meta,plan,a?.gainDb||0,!!a?.enabled,signal,{},a?.levelCurve)) for(let c=0;c<data.length;c++)data[c].set(b.data[c],b.offset);
      state.audioUrl=URL.createObjectURL(wavBlob(data,state.meta.sampleRate));$('audition').src=state.audioUrl;$('audition').hidden=false;
      $('audition').volume=Number($('volume').value);$('audition').play().catch(()=>{});setStatus('auditionReady');
    },'auditioning');
  }
  async function doExport(trial = false) {
    if(state.busy||!state.meta)return;
    clearError();clearOutput();
    let settings;
    try { settings=currentSettings(); } catch (error) { showError(error); return; }
    // Capture and pause immediately: a save dialog must not move the sample start.
    const begin=video.currentTime, full=planNow(), requestedPlan=trial?trialPlanNow(begin):full, fullCopyPlan=state.copyPlan;
    if(!requestedPlan?.total){showError(isCopy()?(state.copyError||'copyTrialEmpty'):(trial?'trialEmpty':'EMPTY_OUTPUT'));return;}
    const sourceAtStart=state.file,keyAtStart=analysisKey();
    video.pause();stopAudition();
    const name=state.file.name.replace(/\.mp4$/i,'')+(trial?`_trial_${C.timeText(requestedPlan.keep[0].start).replace(/[:.]/g,'-')}`:'_edited')+(isCopy()&&state.copyValidation==='container'?'_forced':'')+'.mp4';
    let handle=null;
    // The picker must run immediately inside the user's click gesture, before analysis.
    if(typeof showSaveFilePicker==='function'){
      try{handle=await showSaveFilePicker({suggestedName:name,types:[{description:'MP4 video',accept:{'video/mp4':['.mp4']}}]});
        const old=await handle.getFile();
        if(old.name===state.file.name&&old.size===state.file.size&&old.lastModified===state.file.lastModified){showError('originalOverwrite');return;}
      }catch(error){if(error.name!=='AbortError')showError(error);return;}
    }else{
      const estimate=estimatedBytes(requestedPlan,settings);
      if(estimate>200*1024*1024){showError('downloadLimit');return;}
    }
    if(state.busy||state.file!==sourceAtStart||analysisKey()!==keyAtStart){showError('staleExport');return;}
    try { if(JSON.stringify(currentSettings())!==JSON.stringify(settings))throw new Error('staleExport'); } catch { showError('staleExport');return; }
    await task(async signal=>{
      // Detect unsupported settings before doing a long analysis or opening a writable file.
      await E.prepareExport(state.meta,settings,signal);
      const whole=await ensureAnalysis(signal);
      // The copy library binds plans to the open session. Create a fresh bound
      // trial plan; never clone/spread a library plan or use sample-exact cuts.
      const copyPlan=isCopy()?(trial?await state.copySession.plan({keepRanges:requestedPlan.requests,snap:'strict',audioSampleRate:state.meta.sampleRate,signal}):fullCopyPlan):null;
      const exportPlan=copyPlan?C.copyAudioPlan(copyPlan):requestedPlan;
      const a=trial?{...whole,plan:exportPlan}:whole;
      let stream;
      try{
        if(handle)stream=await handle.createWritable();
        const target=stream?{kind:'stream',stream}:{kind:'blob',maxBytes:256*1024*1024};
        const result=isCopy()?await E.exportCopy(state.file,state.meta,a,settings,target,state.copySession,copyPlan,signal,progress):await E.exportMp4(state.file,state.meta,a,settings,target,signal,progress);
        if(result.blob){state.outputUrl=URL.createObjectURL(result.blob);$('download').href=state.outputUrl;$('download').download=name;$('download').hidden=false;}
        setStatus(trial?'trialDone':'done',`${name}\n${C.timeText(result.duration)} · ${sizeText(result.bytes)} · ${t('actual')} ${Math.round(result.averageVideoBitrate/1000)} kbps${result.measurement?` · ${formatLufs(result.measurement.lufs)} LUFS (PCM)`:''}${isCopy()&&state.copyValidation==='container'?`\n${t('forceResult')} · ${t('forceActive')}`:''}`);
        state.lastExport={...result,blob:undefined,trial,validation:isCopy()?state.copyValidation:'encode',sourceStart:requestedPlan.keep[0].start};
      }catch(error){if(stream&&!stream.locked)await stream.abort().catch(()=>{});throw error;}
    },'checkingExport');
  }
  function downloadBlob(blob,name){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
  function saveProject(){
    if(!state.file)return;
    try { currentSettings(); } catch(error) { showError(error); return; }
    const p={app:'SimpleMeetingVideoEditor',version:3,source:{name:state.file.name,size:state.file.size,lastModified:state.file.lastModified,duration:state.meta.duration},cuts:state.cuts,settings:{mode:$('output-mode').value,normalize:audioEnabled(),leveling:$('leveling').checked,videoKbps:Number.isInteger(Number($('video-bitrate').value))&&Number($('video-bitrate').value)>=25&&Number($('video-bitrate').value)<=50000?Number($('video-bitrate').value):250,audioKbps:Number($('audio-bitrate').value),target:Number($('target').value),resolution:$('resolution').value,quality:$('quality').value,fps:Number($('fps').value)}};
    downloadBlob(new Blob([JSON.stringify(p,null,2)],{type:'application/json'}),state.file.name.replace(/\.mp4$/i,'')+'.smve.json');setStatus('savedProject');
  }
  async function loadProject(file){
    if(!file)return;clearError();if(!state.file){showError('chooseVideoFirst');return;}
    try{
      const sourceAtStart=state.file;
      if(file.size>1024*1024)throw new Error('badProject');const p=JSON.parse(await file.text());
      if(state.busy || state.file!==sourceAtStart)return;
      if(!['SimpleMeetingVideoEditor','MeetingCut'].includes(p.app)||![1,2,3].includes(p.version)||!Array.isArray(p.cuts)||p.cuts.length>500||!p.settings)throw new Error('badProject');
      if(p.source?.name!==state.file.name||p.source?.size!==state.file.size)throw new Error('projectMismatch');
      const s={...p.settings};
      if(p.version<3)s.mode='encode';
      if(p.version===1){s.leveling=false;s.videoKbps=250;s.audioKbps=state.meta.channels===1?96:160;}
      if(!['copy','encode'].includes(s.mode)||![-14,-13,-12].includes(s.target)||!['source','1080','720'].includes(s.resolution)||!['custom','small','standard','high'].includes(s.quality)||![10,15,25,30].includes(s.fps)||typeof s.normalize!=='boolean'||typeof s.leveling!=='boolean'||!Number.isInteger(s.videoKbps)||s.videoKbps<25||s.videoKbps>50000||![32,48,64,80,96,128,160,192,256].includes(s.audioKbps))throw new Error('badProject');
      if(p.cuts.some(c=>!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<0||c.end>state.meta.duration+.001||c.end<=c.start))throw new Error('badProject');
      pushUndo();state.cuts=C.normalizeCuts(p.cuts,state.meta.duration);$('output-mode').value=s.mode;$('normalize').checked=s.normalize;$('leveling').checked=s.leveling;$('video-bitrate').value=s.videoKbps;$('audio-bitrate').value=s.audioKbps;$('target').value=s.target;$('resolution').value=s.resolution;$('quality').value=s.quality;$('fps').value=s.fps;await changedCuts();setStatus('loadedProject');
    }catch(error){showError(words[lang][error.message]?error:'badProject');}
  }
  $('language').onchange=()=>{lang=$('language').value;try{localStorage.setItem('meeting-cut-language',lang);}catch{}applyLanguage();};
  $('output-mode').onchange=()=>{clearError();changedCuts();};
  $('use-encode').onclick=()=>{$('output-mode').value='encode';$('output-mode').onchange();};
  $('retry-copy').onclick=()=>task(async signal=>{invalidate();await refreshCopyPlan(signal);setStatus('ready');},'copyPlanning');
  $('force-copy-ack').onchange=updateCopyUI;
  $('force-copy').onclick=()=>setCopyValidation('container');
  $('strict-copy').onclick=()=>setCopyValidation('strict');
  $('file').onchange=()=>{openFile($('file').files[0]);$('file').value='';};
  $('load-project').onclick=()=>{if(!state.file)showError('chooseVideoFirst');else $('project-file').click();};
  $('project-file').onchange=()=>{loadProject($('project-file').files[0]);$('project-file').value='';};$('save-project').onclick=saveProject;
  const stepSeconds=()=>isCopy()&&state.copyInfo?(state.copyInfo.endTime-state.copyInfo.startTime)/state.copyInfo.videoPackets:1/Number($('fps').value);
  $('play').onclick=togglePlay;$('step-back').onclick=()=>{video.pause();seek(video.currentTime-stepSeconds());};$('step-next').onclick=()=>{video.pause();seek(video.currentTime+stepSeconds());};
  $('go-start').onclick=()=>{stopAudition();video.pause();seek(0);};$('go-end').onclick=()=>{stopAudition();video.pause();seek(state.meta.duration);};
  $('match-source').onclick=()=>{if(state.busy||!state.meta)return;$('quality').value='custom';$('video-bitrate').value=Math.round(C.clamp(state.file.size*8/state.meta.duration/1000-(state.meta.audio?Number($('audio-bitrate').value):0),25,50000));clearOutput();updateUI();};
  $('mark-start').onclick=()=>{$('cut-start').value=C.timeText(video.currentTime);drawWave();};$('mark-end').onclick=()=>{$('cut-end').value=C.timeText(video.currentTime);drawWave();};
  $('cut-start').oninput=drawWave;$('cut-end').oninput=drawWave;$('add-cut').onclick=addCut;
  $('undo').onclick=()=>{if(state.undo.length&&!state.busy){state.cuts=state.undo.pop();changedCuts();}};
  $('seek').oninput=()=>seek(Number($('seek').value));$('pan').oninput=()=>{state.viewStart=Number($('pan').value);updateView();drawWave();};
  $('zoom-in').onclick=()=>changeZoom(state.zoom*2);$('zoom-out').onclick=()=>changeZoom(state.zoom/2);$('zoom-fit').onclick=()=>changeZoom(1);
  for(const id of ['normalize','target','leveling'])$(id).onchange=()=>{invalidate();if(state.meta)setStatus('stale');};
  for(const id of ['resolution','quality','fps','audio-bitrate'])$(id).onchange=()=>{clearOutput();updateUI();};
  $('video-bitrate').oninput=()=>{clearOutput();updateUI();};
  $('analyze').onclick=()=>task(async signal=>{await ensureAnalysis(signal);setStatus('analyzed');},'measure');
  $('listen-before').onclick=()=>audition(false);$('listen-after').onclick=()=>audition(true);$('export').onclick=()=>doExport(false);$('export-trial').onclick=()=>doExport(true);
  $('cancel').onclick=()=>{state.controller?.abort();updateUI();};
  $('volume').oninput=()=>{video.volume=Number($('volume').value);$('audition').volume=video.volume;};
  video.addEventListener('play',()=>{updateUI();});video.addEventListener('pause',()=>{updateUI();});video.addEventListener('timeupdate',()=>{if(!video.paused)skipRemoved();updatePlayhead();});video.addEventListener('seeked',updatePlayhead);
  video.addEventListener('error',()=>{if(state.meta)showError('fileChanged');});
  let waveGesture=null;
  function waveTime(event, gesture) {
    return gesture.start + C.clamp((event.clientX - gesture.left) / gesture.width, 0, 1) * gesture.span;
  }
  function updateWaveGesture(event) {
    const g=waveGesture; if(!g || event.pointerId!==g.id || state.busy)return;
    if(Math.abs(event.clientX-g.x)>=4)g.dragged=true;
    if(!g.dragged)return;
    const time=waveTime(event,g);
    $('cut-start').value=C.timeText(Math.min(g.time,time));
    $('cut-end').value=C.timeText(Math.max(g.time,time));
    drawWave();
  }
  $('wave').onpointerdown=event=>{
    if(!state.meta||state.busy||event.button!==0||waveGesture)return;
    event.preventDefault(); const r=$('wave').getBoundingClientRect();if(!r.width)return;
    waveGesture={id:event.pointerId,x:event.clientX,left:r.left,width:r.width,start:state.viewStart,span:state.meta.duration/state.zoom,dragged:false,previous:[$('cut-start').value,$('cut-end').value]};
    waveGesture.time=waveTime(event,waveGesture);$('wave').setPointerCapture(event.pointerId);
  };
  $('wave').onpointermove=updateWaveGesture;
  $('wave').onpointerup=event=>{
    if(!waveGesture||event.pointerId!==waveGesture.id)return;
    updateWaveGesture(event);const g=waveGesture;waveGesture=null;
    if($('wave').hasPointerCapture(event.pointerId))$('wave').releasePointerCapture(event.pointerId);
    if(!g.dragged)seek(waveTime(event,g));
  };
  function cancelWaveGesture(){if(waveGesture){[$('cut-start').value,$('cut-end').value]=waveGesture.previous;waveGesture=null;drawWave();}}
  $('wave').onpointercancel=cancelWaveGesture;$('wave').onlostpointercapture=cancelWaveGesture;
  for(const type of ['dragenter','dragover'])$('dropzone').addEventListener(type,event=>{event.preventDefault();$('dropzone').classList.add('dragging');});
  $('dropzone').addEventListener('dragleave',()=>$('dropzone').classList.remove('dragging'));$('dropzone').addEventListener('drop',event=>{event.preventDefault();$('dropzone').classList.remove('dragging');openFile(event.dataTransfer.files[0]);});
  window.addEventListener('dragover',event=>event.preventDefault());window.addEventListener('drop',event=>event.preventDefault());
  document.addEventListener('keydown',event=>{
    if(/INPUT|SELECT|TEXTAREA|BUTTON/.test(document.activeElement?.tagName)||state.busy||!state.meta)return;
    if(event.code==='Space'){event.preventDefault();togglePlay();}
    else if(event.key==='Home'){event.preventDefault();$('go-start').click();}else if(event.key==='End'){event.preventDefault();$('go-end').click();}
    else if(event.key==='ArrowLeft'){event.preventDefault();$('step-back').click();}else if(event.key==='ArrowRight'){event.preventDefault();$('step-next').click();}
    else if(event.key.toLowerCase()==='i')$('mark-start').click();else if(event.key.toLowerCase()==='o')$('mark-end').click();else if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();$('undo').click();}
  });
  window.addEventListener('beforeunload',event=>{if(state.busy){event.preventDefault();event.returnValue='';}});
  new ResizeObserver(drawWave).observe($('wave'));
  let lastFrame=0;function animation(time){if(!video.paused&&time-lastFrame>33){skipRemoved();updatePlayhead();lastFrame=time;}requestAnimationFrame(animation);}requestAnimationFrame(animation);
  applyLanguage();
  // Read-only diagnostics/test hooks, no network or hidden file access.
  window.SimpleMeetingVideoEditor=window.MeetingCut={getState:()=>state,openFile,analyze:()=>task(async signal=>{await ensureAnalysis(signal);setStatus('analyzed');},'measure')};
})();
