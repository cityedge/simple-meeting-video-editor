(function(){
  'use strict';
  const $=id=>document.getElementById(id); let url;
  const label=document.createElement('label');label.textContent='出力方式 / Output mode: ';
  const mode=document.createElement('select');mode.id='test-mode';
  for(const [value,text] of [['copy','映像無劣化 / Video copy'],['encode','再圧縮 / Re-encode']]){const o=document.createElement('option');o.value=value;o.textContent=text;mode.append(o);}
  label.append(mode);$('run').parentNode.before(label);
  $('direct').disabled=typeof showSaveFilePicker!=='function';
  const log=s=>$('log').textContent+=s+'\n';
  async function run(direct){
    let handle;
    if(direct){try{handle=await showSaveFilePicker({suggestedName:'SimpleMeetingVideoEditor_browser_test.mp4',types:[{description:'MP4',accept:{'video/mp4':['.mp4']}}]});}catch(e){log(e.message);return;}}
    $('run').disabled=$('direct').disabled=mode.disabled=true;$('log').textContent='';$('download').hidden=true;
    if(url)URL.revokeObjectURL(url);let stream,copy;
    try{
      log(JSON.stringify({protocol:location.protocol,secure:isSecureContext,browser:navigator.userAgent,directSave:typeof showSaveFilePicker==='function'},null,2));
      const bytes=Uint8Array.from(atob(MEETING_TEST_CLIP),c=>c.charCodeAt(0)),file=new File([bytes],'synthetic.mp4',{type:'video/mp4'}),signal=new AbortController().signal;
      const meta=await MeetingEngine.inspect(file,signal);log('PASS: input '+meta.duration+' s');
      const copying=mode.value==='copy',settings=copying?{videoMode:'copy',audioBitrate:80000}:MeetingEngine.videoSettings(meta,'source','custom',15,140,80);
      const caps=await MeetingEngine.prepareExport(meta,settings,signal);log('AAC 80 kbps: '+(caps.nativeAacEncode?'native':'fallback')+'; supported='+caps.aacEncode);
      const cuts=copying?[{start:1,end:2}]:[{start:.25,end:.75},{start:2.75,end:3.25}];
      let copyPlan;
      if(copying){copy=await MeetingEngine.openCopy(file,meta,signal);copyPlan=await MeetingEngine.planCopy(copy.session,copy.info,meta,cuts,signal);log('Retained ranges: '+JSON.stringify(copyPlan.ranges));}
      const a=await MeetingEngine.analyze(file,meta,cuts,-14,true,signal,p=>{$('p').value=p.fraction;},true,copyPlan?MeetingCore.copyAudioPlan(copyPlan):null);
      log('LUFS: '+a.inputLufs.toFixed(2)+' → '+a.outputLufs.toFixed(2));
      if(!Number.isFinite(a.outputLufs)||Math.abs(a.outputLufs+14)>1)throw new Error('Loudness target differs by >1 LU');
      if(handle)stream=await handle.createWritable();
      const target=stream?{kind:'stream',stream}:{kind:'blob',maxBytes:32*1024*1024},progress=p=>{$('p').value=p.fraction;};
      const result=copying?await MeetingEngine.exportCopy(file,meta,a,settings,target,copy.session,copyPlan,signal,progress):await MeetingEngine.exportMp4(file,meta,a,settings,target,signal,progress);
      if((copying?result.videoPackets:result.videoFrames)!==45||result.audioSamples!==144000)throw new Error('Unexpected output frame/sample count');
      const output=handle?await handle.getFile():result.blob;
      const probe=await BrowserMediaIO.probe(output,{mode:'scan'});log(JSON.stringify({bytes:output.size,duration:probe.duration,tracks:probe.tracks},null,2));
      if(Math.abs(probe.duration.seconds-3)>.1)throw new Error('Unexpected output duration');
      const input=await BrowserMediaIO.openMedia(output);let peak=0,peakTime=0;
      try{for await(const b of input.audioPcmBlocks({start:0,end:3})){for(let i=0;i<b.length;i++){const v=Math.abs(b.channelData[0][i]);if(v>peak){peak=v;peakTime=b.timestamp+i/b.sampleRate;}}}}finally{input.close();}
      const expectedMarker=copying?1.02:1.52;
      if(Math.abs(peakTime-expectedMarker)>.08)throw new Error('Audio marker timing differs: '+peakTime);
      log('PASS: audio marker '+peakTime.toFixed(4)+' s; expected around '+expectedMarker+' s');
      url=URL.createObjectURL(output);$('result').src=url;
      if(!handle){$('download').href=url;$('download').download='SimpleMeetingVideoEditor_browser_test.mp4';$('download').hidden=false;}
      $('p').value=1;log('PASS: '+(copying?'video copy + processed AAC':'video re-encode + processed AAC')+', demux, audio decode, timing and '+(handle?'direct file saving':'Blob output')+'.');
    }catch(e){log('FAIL: '+(e.stack||e.message));if(stream&&!stream.locked)await stream.abort().catch(()=>{});}
    finally{await copy?.session.close();$('run').disabled=mode.disabled=false;$('direct').disabled=typeof showSaveFilePicker!=='function';}
  }
  $('run').onclick=()=>run(false);$('direct').onclick=()=>run(true);
})();
