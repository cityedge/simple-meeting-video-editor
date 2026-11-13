const {JSDOM}=require('jsdom'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'file:///meeting-cut/index.html',runScripts:'outside-only'}),w=dom.window;
w.ResizeObserver=class{observe(){}};w.requestAnimationFrame=()=>{};
w.HTMLCanvasElement.prototype.getContext=()=>({setTransform(){},clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fillRect(){},save(){},rect(){},clip(){},restore(){},strokeRect(){},fill(){},fillText(){},drawImage(){}});
let lastBlob;w.Blob=Blob;w.URL.createObjectURL=b=>{lastBlob=b;return 'blob:local';};w.URL.revokeObjectURL=()=>{};
for(const m of ['play','pause','load'])w.HTMLMediaElement.prototype[m]=()=>Promise.resolve();w.HTMLAnchorElement.prototype.click=()=>{};
w.eval(fs.readFileSync(path.join(root,'core.js'),'utf8'));const C=w.MeetingCore;
const boundaries=Array.from({length:36},(_,i)=>({time:i*2,tick:i*60000,kind:i===35?'eof':'idr'}));
const info={startTime:0,endTime:70,timeResolution:30000,videoPackets:1750,boundaries,keyframeInterval:{min:2,max:2,mean:2}};
let unsupported=false,fatal=false,closed=0,inspection=0,planCalls=0,analysisCalls=0,events=[],copyExports=[];
const bound=new WeakSet();
w.BrowserMediaIO={openVideoCopy:async(file,options)=>({inspect:async()=>{inspection++;if(unsupported&&options.validation!=='container')throw Object.assign(new Error('open GOP'),{reason:'GOP_STRUCTURE',diagnosticCode:'SYNC_IDR_MISMATCH',recoverableInContainer:!fatal});return options.validation==='container'?{...info,validation:'container',boundaries:info.boundaries.map(b=>({...b,kind:b.kind==='idr'?'sync':b.kind})),warnings:[{code:'SYNC_IDR_MISMATCH',message:'open GOP',count:1}]}:info;},close:async()=>{closed++;},
 plan:async({keepRanges,snap,audioSampleRate})=>{
   planCalls++;let duration=0,total=0;
   assert.equal(snap,'strict');
   const ranges=keepRanges.map(r=>{
     const start=boundaries.find(b=>b.kind==='idr'&&b.time===r.start),end=boundaries.find(b=>b.time===r.end);
     assert.ok(start&&end&&end.time>start.time);
     const outputStart=duration;duration+=end.time-start.time;const next=Math.round(duration*audioSampleRate);
     const result=Object.freeze({requestedStart:r.start,requestedEnd:r.end,sourceStart:start.time,sourceEnd:end.time,outputStart,outputEnd:duration,audioStartSample:total,audioSamples:next-total});total=next;return result;});
   const p=Object.freeze({ranges:Object.freeze(ranges),duration,audioSamples:total,audioSampleRate});bound.add(p);return p;
 }})};
w.eval(fs.readFileSync(path.join(root,'engine.js'),'utf8'));const E=w.MeetingEngine;
E.inspect=async()=>({duration:70,sampleRate:12000,channels:2,video:{id:1,video:{width:1920,height:1080}},audio:{id:2}});
E.rawWave=async()=>({wave:new C.Waveform(70),measurement:{lufs:-25}});
E.prepareExport=async(meta,settings)=>{events.push('prepare');assert.equal(settings.videoMode,'copy');return {h264Encode:false,aacEncode:true};};
E.analyze=async(file,meta,cuts,target,enabled,signal,progress,leveling,plan)=>{events.push('analyze');analysisCalls++;assert.ok(plan);return {plan,inputLufs:-25,outputLufs:target,gainDb:11,enabled,target,maxReductionDb:4,levelCurve:{plan,gains:new Float32Array([1]),minDb:-1,maxDb:1},wave:new C.Waveform(70)};};
E.exportCopy=async(file,meta,a,settings,target,session,plan)=>{events.push('copy');assert.ok(bound.has(plan));assert.equal(a.plan.total,plan.audioSamples);copyExports.push({a,plan,target});return {duration:plan.duration,bytes:1000,videoMode:'copy',averageVideoBitrate:140000,blob:target.kind==='blob'?new Blob(['mp4']):null};};
w.eval(fs.readFileSync(path.join(root,'app.js'),'utf8'));const $=id=>w.document.getElementById(id);
async function settle(){for(let i=0;i<100;i++){await new Promise(r=>setTimeout(r,1));if(!w.MeetingCut.getState().busy)return;}throw new Error('task stuck');}
async function cut(a,b){$('cut-start').value=a;$('cut-end').value=b;$('add-cut').click();await settle();}
function seek(t){$('video').currentTime=t;$('video').dispatchEvent(new w.Event('timeupdate'));}
(async()=>{
 assert.equal(w.document.title,'Simple Meeting Video Editor');assert.ok($('source-bar').contains($('activity')));
 assert.equal($('output-mode').value,'copy');
 await w.MeetingCut.openFile(new w.File(['fixture'],'meeting.mp4'));
 assert.equal(inspection,1);assert.equal($('export').disabled,false);assert.equal($('quality').disabled,true);assert.equal($('fps').disabled,true);assert.equal($('video-bitrate').disabled,true);assert.equal($('audio-bitrate').disabled,false);
 await cut(0,1.2);await cut(20.2,25.1);await cut(65,70);
 const st=w.MeetingCut.getState(),full=st.copyPlan;assert.equal(full.duration,64);assert.match($('copy-ranges').textContent,/00:00:00.000.*00:00:22.000/);assert.match($('copy-notice').textContent,/5.100 s/);assert.equal($('output-duration').textContent,'00:01:04');
 assert.equal(st.cuts[0].end,1.2);assert.equal(inspection,1);
 await w.MeetingCut.analyze();const whole=st.analysis;assert.equal(whole.plan.total,768000);assert.equal(analysisCalls,1);
 assert.match($('export-trial').textContent,/約30秒/);
 seek(12.3);assert.match($('trial-range').textContent,/00:00:12.000.*00:00:46.000/);assert.equal($('export-trial').disabled,false);
 events=[];await $('export-trial').onclick();assert.deepEqual(events,['prepare','copy']);assert.equal(copyExports.at(-1).plan.duration,32);assert.equal(copyExports.at(-1).a.levelCurve,whole.levelCurve);assert.equal(st.copyPlan,full);assert.equal(st.analysis,whole);assert.match($('download').download,/_trial_00-00-12-000/);
 await $('export').onclick();assert.equal(copyExports.at(-1).plan,full);assert.equal(copyExports.at(-1).plan.duration,64);
 seek(63);assert.equal($('export-trial').disabled,false);assert.match($('trial-range').textContent,/4.000 s/);
 seek(66);assert.equal($('export-trial').disabled,true);assert.match($('trial-range').textContent,/残す区間がありません/);
 let suggested;w.showSaveFilePicker=async o=>{suggested=o.suggestedName;seek(50);return {getFile:async()=>({name:suggested,size:0,lastModified:0}),createWritable:async()=>{events.push('writable');return {abort:async()=>{}};}};};
 seek(12.3);events=[];await $('export-trial').onclick();assert.deepEqual(events,['prepare','writable','copy']);assert.equal(copyExports.at(-1).plan.ranges[0].sourceStart,12);
 $('save-project').click();const saved=JSON.parse(await lastBlob.text());assert.equal(saved.version,3);assert.equal(saved.app,'SimpleMeetingVideoEditor');assert.equal(saved.settings.mode,'copy');assert.equal(saved.cuts[0].end,1.2);assert.equal(saved.copyPlan,undefined);
 $('language').value='en';$('language').onchange();assert.match($('copy-notice').textContent,/Extra content retained/);assert.match($('mode-hint').textContent,/Preserve original/);
 $('output-mode').value='encode';$('output-mode').onchange();assert.equal($('quality').disabled,false);assert.equal($('copy-notice').hidden,true);assert.equal($('export-trial').textContent,'Export 30-second sample from playhead');assert.equal(st.analysis,null);assert.equal(st.cuts[0].end,1.2);
 Object.defineProperty($('project-file'),'files',{configurable:true,value:[{size:1000,text:async()=>JSON.stringify(saved)}]});$('project-file').onchange();await new Promise(r=>setTimeout(r,10));await settle();assert.equal($('output-mode').value,'copy');assert.equal(st.copyPlan.duration,64);assert.notEqual(st.copyPlan,full);assert.equal(inspection,1);
 // Even short retained islands survive outward snapping; removing everything is still an error.
 await cut(3,19);assert.equal($('export').disabled,false);assert.equal(st.copyPlan.ranges[0].sourceStart,0);assert.equal(st.copyPlan.ranges[0].sourceEnd,4);
 await cut(0,70);assert.equal($('export').disabled,true);assert.match($('copy-notice').textContent,/No retained sections/);
 $('undo').click();await settle();assert.equal($('export').disabled,false);
 $('undo').click();await settle();assert.equal($('export').disabled,false);
 // A rejected input remains available for re-encoding; both sessions are closed.
 unsupported=true;await w.MeetingCut.openFile(new w.File(['other'],'unsupported.mp4'));assert.equal(closed,2);assert.equal($('export').disabled,true);assert.match($('copy-notice').textContent,/safe video copy structure/);
 assert.equal($('force-copy-choice').hidden,false);assert.equal($('force-copy').disabled,true);assert.match($('copy-diagnostic-text').textContent,/SYNC_IDR_MISMATCH: open GOP/);
 await $('force-copy').onclick();assert.equal(st.copyValidation,'strict');
 $('force-copy-ack').checked=true;$('force-copy-ack').onchange();assert.equal($('force-copy').disabled,false);
 await $('force-copy').onclick();assert.equal(st.copyValidation,'container');assert.equal($('export').disabled,false);assert.equal($('force-copy-active').hidden,false);assert.match($('copy-notice').textContent,/not verified/);
 seek(12.3);assert.equal($('export-trial').disabled,false);await $('export-trial').onclick();assert.equal(st.lastExport.validation,'container');assert.match(suggested,/_trial_00-00-12-000_forced\.mp4$/);
 $('save-project').click();const forcedSaved=JSON.parse(await lastBlob.text());assert.equal(forcedSaved.settings.validation,undefined);assert.equal(forcedSaved.settings.force,undefined);
 await $('strict-copy').onclick();assert.equal(st.copyValidation,'strict');assert.equal($('export').disabled,true);assert.equal($('force-copy-ack').checked,false);
 $('force-copy-ack').checked=true;$('force-copy-ack').onchange();await $('force-copy').onclick();assert.equal(st.copyValidation,'container');
 await w.MeetingCut.openFile(new w.File(['new'],'new.mp4'));assert.equal(st.copyValidation,'strict');assert.equal($('force-copy-ack').checked,false);assert.equal($('export').disabled,true);
 fatal=true;await w.MeetingCut.openFile(new w.File(['fatal'],'fatal.mp4'));assert.equal($('force-copy-choice').hidden,true);assert.equal($('export').disabled,true);
 $('use-encode').click();assert.equal($('output-mode').value,'encode');assert.equal($('export').disabled,false);
 console.log('Copy DOM checks passed, including explicit per-file forced-copy acknowledgement, detailed reason, sync-sample trial, warning filename, strict reset and no saved force permission.');
 dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1;dom.window.close();});
