process.chdir(require('path').resolve(__dirname,'..'));
const {JSDOM}=require('jsdom');const fs=require('fs');const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const dom=new JSDOM(html,{url:'https://example.test/meeting-cut/',runScripts:'outside-only'});const w=dom.window;
w.ResizeObserver=class{observe(){}};w.requestAnimationFrame=()=>{};
w.HTMLCanvasElement.prototype.getContext=function(){return {setTransform(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fillRect(){},save(){},rect(){},clip(){},restore(){},strokeRect(){},fill(){},fillText(){},drawImage(){}};};
let lastBlob;w.Blob=Blob;w.URL.createObjectURL=b=>{lastBlob=b;return 'blob:local';};w.URL.revokeObjectURL=()=>{};
for(const method of ['play','pause','load'])w.HTMLMediaElement.prototype[method]=function(){return Promise.resolve();};
w.HTMLAnchorElement.prototype.click=function(){this.downloaded=true;};
w.eval(fs.readFileSync('core.js','utf8'));
w.BrowserMediaIO={};w.eval(fs.readFileSync('engine.js','utf8'));const videoSettings=w.MeetingEngine.videoSettings;
w.MeetingEngine={inspect:async()=>({duration:16,sampleRate:48000,channels:2,video:{id:1,video:{width:640,height:360}},audio:{id:2}}),rawWave:async()=>({wave:new w.MeetingCore.Waveform(16),measurement:{lufs:-25}}),videoSettings,prepareExport:async()=>({h264Encode:true,aacEncode:true}),analyze:async(file,meta,cuts,target,enabled)=>({plan:w.MeetingCore.makePlan(cuts,16,48000),inputLufs:-25,outputLufs:target,gainDb:11,maxReductionDb:5,wave:new w.MeetingCore.Waveform(16),enabled,target}),exportMp4:async()=>({duration:12,bytes:1000000,averageVideoBitrate:400000,measurement:{lufs:-14}})};
w.eval(fs.readFileSync('app.js','utf8'));const $=id=>w.document.getElementById(id);
(async()=>{
 // The existing regression suite exercises the retained re-encode path.
 $('output-mode').value='encode';$('output-mode').onchange();
 assert.equal($('export').disabled,true);
 const file=new w.File(['fixture'],'source.mp4',{type:'video/mp4'});Object.defineProperty(file,'size',{value:434000});
 await w.MeetingCut.openFile(file);
 assert.equal($('export').disabled,false);assert.equal($('filename').textContent,'source.mp4');assert.equal($('empty').hidden,true);
 for(const [a,b] of [[0,1],[5,7],[15,16]]){$('cut-start').value=String(a);$('cut-end').value=String(b);$('add-cut').click();}
 assert.equal(w.MeetingCut.getState().cuts.length,3);assert.equal($('output-duration').textContent,'00:00:12');
 await w.MeetingCut.analyze();assert.equal($('after-lufs').textContent,'-14.0');assert.equal($('listen-after').disabled,false);
 $('target').value='-12';$('target').dispatchEvent(new w.Event('change'));assert.equal($('listen-after').disabled,true);assert.equal($('after-lufs').textContent,'—');
 $('undo').click();assert.equal(w.MeetingCut.getState().cuts.length,2);
 $('cut-start').value='00:90:00';$('cut-end').value='10';$('add-cut').click();assert.equal($('error').hidden,false);
 $('language').value='en';$('language').dispatchEvent(new w.Event('change'));assert.equal($('export').textContent,'Export MP4');assert.equal(w.document.documentElement.lang,'en');
 $('normalize').checked=false;$('normalize').dispatchEvent(new w.Event('change'));assert.equal($('target').disabled,true);
 $('quality').value='small';$('quality').dispatchEvent(new w.Event('change'));
 const props=['play','step-back','step-next','save-project','analyze'];for(const p of props)assert.equal($(p).disabled,false,p);

 // Endpoint buttons ignore preview skips while paused, preserving an exact trim mark.
 $('go-end').click();assert.equal($('video').currentTime,16);assert.equal($('export-trial').disabled,true);$('mark-end').click();assert.equal($('cut-end').value,'00:00:16.000');
 $('go-start').click();assert.equal($('video').currentTime,0);assert.equal($('export-trial').disabled,false);
 // Pointer gestures: click/jitter seek; dragging selects in either direction without seeking.
 const wave=$('wave');wave.getBoundingClientRect=()=>({left:10,width:800,height:150});
 let captured=false;wave.setPointerCapture=()=>captured=true;wave.hasPointerCapture=()=>captured;wave.releasePointerCapture=()=>captured=false;
 const evt=x=>({clientX:x,pointerId:1,button:0,preventDefault(){}});
 $('cut-start').value='1';$('cut-end').value='2';wave.onpointerdown(evt(410));wave.onpointerup(evt(412));assert.equal($('video').currentTime,8.04);assert.equal($('cut-start').value,'1');assert.equal($('cut-end').value,'2');
 const at=$('video').currentTime;wave.onpointerdown(evt(110));wave.onpointermove(evt(310));assert.equal($('cut-start').value,'00:00:02.000');assert.equal($('cut-end').value,'00:00:06.000');wave.onpointerup(evt(310));assert.equal($('video').currentTime,at);
 wave.onpointerdown(evt(710));wave.onpointermove(evt(510));wave.onpointerup(evt(510));assert.equal($('cut-start').value,'00:00:10.000');assert.equal($('cut-end').value,'00:00:14.000');
 wave.onpointerdown(evt(110));wave.onpointermove(evt(-30));wave.onpointercancel();assert.equal($('cut-start').value,'00:00:10.000');
 $('zoom-in').click();const st=w.MeetingCut.getState();wave.onpointerdown(evt(210));wave.onpointerup(evt(610));assert.ok(Math.abs(w.MeetingCore.parseTime($('cut-end').value)-w.MeetingCore.parseTime($('cut-start').value)-4)<.001);$('zoom-fit').click();
 // Estimate, original-size helper, low-rate limits, and settings invalidation.
 $('audio-bitrate').value='80';$('match-source').click();assert.equal($('quality').value,'custom');assert.equal($('video-bitrate').value,'137');
 assert.match($('source-rate').textContent,/217 kbps/);assert.match($('export-estimate').textContent,/137 kbps VBR.*80 kbps/);
 $('video-bitrate').value='24';$('video-bitrate').dispatchEvent(new w.Event('input'));assert.equal($('export').disabled,true);
 $('video-bitrate').value='140';$('video-bitrate').dispatchEvent(new w.Event('input'));assert.equal($('export').disabled,false);
 $('normalize').checked=true;$('normalize').dispatchEvent(new w.Event('change'));await w.MeetingCut.analyze();$('leveling').checked=false;$('leveling').dispatchEvent(new w.Event('change'));assert.equal($('listen-after').disabled,true);
 // JSON v2 round-trip, and v1 migration preserves the old audio behavior.
 $('leveling').checked=true;$('fps').value='25';$('save-project').click();const saved=JSON.parse(await lastBlob.text());assert.equal(saved.version,3);assert.equal(saved.app,'SimpleMeetingVideoEditor');assert.equal(saved.settings.mode,'encode');assert.equal(saved.settings.videoKbps,140);assert.equal(saved.settings.audioKbps,80);assert.equal(saved.settings.leveling,true);
 async function load(p){Object.defineProperty($('project-file'),'files',{configurable:true,value:[{size:500,text:async()=>JSON.stringify(p)}]});$('project-file').onchange();await new Promise(r=>w.setTimeout(r,0));}
 $('video-bitrate').value='500';await load(saved);assert.equal($('video-bitrate').value,'140');assert.equal($('leveling').checked,true);assert.equal($('fps').value,'25');
 await load({...saved,app:'MeetingCut',version:2});assert.equal($('error').hidden,true);
 const old={...saved,app:'MeetingCut',version:1,settings:{normalize:true,target:-14,resolution:'source',quality:'small',fps:30}};await load(old);assert.equal($('leveling').checked,false);assert.equal($('audio-bitrate').value,'160');assert.equal($('quality').value,'small');assert.equal($('error').hidden,true);
 await load({...saved,settings:{...saved.settings,videoKbps:24}});assert.equal($('error').hidden,false);assert.equal($('quality').value,'small');

 // Trial export uses the same full-program correction and never modifies the removal list.
 const events=[],exports=[];let analysisCalls=0,failPrepare=false,latestWhole;
 w.MeetingEngine.inspect=async()=>({duration:70,sampleRate:48000,channels:2,video:{id:1,video:{width:1920,height:1080}},audio:{id:2}});
 w.MeetingEngine.rawWave=async()=>({wave:new w.MeetingCore.Waveform(70),measurement:{lufs:-25}});
 w.MeetingEngine.prepareExport=async()=>{events.push('prepare');if(failPrepare)throw new Error('AAC_ENCODER_UNSUPPORTED');};
 w.MeetingEngine.analyze=async(file,meta,cuts,target,enabled)=>{events.push('analyze');analysisCalls++;latestWhole={plan:w.MeetingCore.makePlan(cuts,meta.duration,48000),inputLufs:-25,outputLufs:target,gainDb:11,maxReductionDb:5,wave:new w.MeetingCore.Waveform(meta.duration),enabled,target,levelCurve:{minDb:-6,maxDb:6}};return latestWhole;};
 w.MeetingEngine.exportMp4=async(file,meta,a,settings,target)=>{events.push('export');exports.push({a,settings,target});return {duration:a.plan.duration,bytes:1000,averageVideoBitrate:settings.videoBitrate,measurement:{lufs:-14},blob:target.kind==='blob'?new w.Blob(['fixture'],{type:'video/mp4'}):undefined};};
 await w.MeetingCut.openFile(new w.File(['trial source'],'trial.mp4'));
 for(const [a,b] of [[20,25],[65,70]]){$('cut-start').value=a;$('cut-end').value=b;$('add-cut').click();}
 $('quality').value='custom';$('video-bitrate').value='140';$('audio-bitrate').value='80';$('fps').value='25';$('normalize').checked=true;$('leveling').checked=true;
 function seek(t){$('video').currentTime=t;$('video').dispatchEvent(new w.Event('timeupdate'));}
 seek(12);const cutsBefore=JSON.stringify(w.MeetingCut.getState().cuts);
 await $('export-trial').onclick();assert.deepEqual(events,['prepare','analyze','export']);assert.equal(exports.at(-1).a.plan.duration,30);assert.equal(exports.at(-1).a.plan.keep[0].start,12);assert.equal(exports.at(-1).a.plan.keep.at(-1).end,47);assert.equal(exports.at(-1).a.levelCurve,latestWhole.levelCurve);assert.equal(exports.at(-1).a.gainDb,latestWhole.gainDb);assert.equal(w.MeetingCut.getState().analysis,latestWhole);assert.equal(JSON.stringify(w.MeetingCut.getState().cuts),cutsBefore);assert.match($('download').download,/_trial_00-00-12-000\.mp4$/);assert.equal(w.MeetingCut.getState().lastExport.trial,true);
 seek(62);await $('export-trial').onclick();assert.equal(exports.at(-1).a.plan.duration,3);assert.equal(analysisCalls,1);
 seek(22);await $('export-trial').onclick();assert.equal(exports.at(-1).a.plan.keep[0].start,25);assert.equal(exports.at(-1).a.plan.duration,30);assert.equal(analysisCalls,1);
 await $('export').onclick();assert.equal(exports.at(-1).a.plan.duration,60);assert.equal(w.MeetingCut.getState().lastExport.trial,false);assert.equal($('download').download,'trial_edited.mp4');
 seek(66);assert.equal($('export-trial').disabled,true);assert.match($('trial-range').textContent,/No retained section/);
 // A dialog cannot shift the captured cursor; preflight precedes writable creation.
 let suggested;w.showSaveFilePicker=async options=>{suggested=options.suggestedName;seek(50);return {getFile:async()=>({name:suggested,size:0,lastModified:0}),createWritable:async()=>{events.push('writable');return {abort:async()=>{}};}};};
 seek(12);events.length=0;await $('export-trial').onclick();assert.equal(exports.at(-1).a.plan.keep[0].start,12);assert.match(suggested,/_trial_00-00-12-000/);assert.deepEqual(events,['prepare','writable','export']);
 // Unsupported AAC is caught before a potentially long new analysis or a file write.
 $('target').value='-13';$('target').dispatchEvent(new w.Event('change'));seek(12);events.length=0;failPrepare=true;const callsBefore=analysisCalls,nBefore=exports.length;
 const originalError=w.console.error;w.console.error=()=>{};await $('export-trial').onclick();w.console.error=originalError;
 assert.deepEqual(events,['prepare']);assert.equal(analysisCalls,callsBefore);assert.equal(exports.length,nBefore);assert.equal($('error').hidden,false);assert.match($('error').textContent,/AAC/);assert.equal(w.MeetingCut.getState().busy,false);
 console.log('DOM checks passed: original editing, endpoints, click/forward/reverse/cancel/zoom drag, rates, estimates, stale leveling, v2 JSON round-trip v1 migration, trial range/cuts/tail/settings/full-analysis reuse, dialog cursor capture and AAC preflight failure.');
 dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1;dom.window.close();});
