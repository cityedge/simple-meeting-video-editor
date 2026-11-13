// Optional independent validation: Node, ffmpeg and ffprobe required.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),C=require('../core.js');
const c={console,performance,setTimeout,clearTimeout,TextDecoder,TextEncoder,URL,Blob,DOMException,AbortController,ReadableStream,WritableStream,TransformStream,MeetingCore:C};
for(const k of ['ArrayBuffer','DataView','Uint8Array','Uint8ClampedArray','Uint16Array','Uint32Array','Int8Array','Int16Array','Int32Array','Float32Array','Float64Array','BigInt64Array','BigUint64Array'])c[k]=globalThis[k];
vm.createContext(c);
for(const f of ['lib/browser-media-io.js','engine.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
const run=(cmd,args)=>execFileSync(cmd,args,{encoding:'utf8',maxBuffer:8*1024*1024});
const packets=f=>JSON.parse(run('ffprobe',['-v','error','-select_streams','v:0','-show_packets','-show_data_hash','sha256','-of','json',f])).packets;
const frames=f=>run('ffmpeg',['-v','error','-i',f,'-map','0:v:0','-f','framemd5','-']).split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>l.split(',').at(-1).trim());
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'meeting-cut-outside-'));
 const reports=[];
 try{
  const small=path.join(dir,'short-source.mp4');
  fs.writeFileSync(small,Buffer.from(vm.runInNewContext(fs.readFileSync(path.join(__dirname,'fixture.js'),'utf8')+'\nMEETING_TEST_CLIP'),'base64'));
  const cases=[
   {name:'long-opening-strict',file:path.join(__dirname,'fixtures/long-gop.mp4'),validation:'strict',duration:120,fps:2,cuts:[{start:0,end:1},{start:30,end:45},{start:119,end:120}]},
   {name:'long-opening-forced',file:path.join(__dirname,'fixtures/long-gop.mp4'),validation:'container',duration:120,fps:2,cuts:[{start:0,end:1},{start:30,end:45},{start:119,end:120}]},
   {name:'long-trial',file:path.join(__dirname,'fixtures/long-gop.mp4'),validation:'container',duration:120,fps:2,cuts:[{start:0,end:1},{start:119,end:120}],trial:1},
   {name:'merged-and-separated-spans',file:small,validation:'strict',duration:4,fps:15,cuts:[{start:0,end:.1},{start:.9,end:1.1},{start:1.9,end:3.1},{start:3.9,end:4}]}
  ];
  for(const example of cases){
   const file=new Blob([fs.readFileSync(example.file)],{type:'video/mp4'}),meta={video:{id:1},duration:example.duration,sampleRate:48000,channels:0,audio:null};
   const {session,info}=await c.MeetingEngine.openCopy(file,meta,undefined,undefined,example.validation);
   try{
    let plan=await c.MeetingEngine.planCopy(session,info,meta,example.cuts);
    if(example.trial!==undefined)plan=await session.plan({keepRanges:C.copyExcerptRanges(plan,info,example.trial),snap:'strict',audioSampleRate:48000});
    const analysis=await c.MeetingEngine.analyze(file,meta,example.cuts,-14,true,undefined,null,true,C.copyAudioPlan(plan));
    const result=await c.MeetingEngine.exportCopy(file,meta,analysis,{videoMode:'copy',audioBitrate:80000},{kind:'blob'},session,plan);
    const out=path.join(dir,example.name+'.mp4');fs.writeFileSync(out,Buffer.from(await result.blob.arrayBuffer()));
    const sourcePackets=packets(example.file),outputPackets=packets(out),sourceFrames=frames(example.file),outputFrames=frames(out);
    const expectedPackets=sourcePackets.filter(p=>plan.ranges.some(r=>Number(p.pts_time)>=r.sourceStart&&Number(p.pts_time)<r.sourceEnd));
    assert.deepEqual(outputPackets.map(p=>p.data_hash),expectedPackets.map(p=>p.data_hash));
    assert.deepEqual(outputFrames,Array.from(plan.ranges).flatMap(r=>sourceFrames.slice(Math.round(r.sourceStart*example.fps),Math.round(r.sourceEnd*example.fps))));
    assert.equal(outputFrames.length,result.videoPackets);
    assert.ok(outputPackets.every((p,i)=>!i||Number(p.dts_time)>Number(outputPackets[i-1].dts_time)));
    reports.push({name:example.name,validation:example.validation,retained:Array.from(plan.ranges,r=>[r.sourceStart,r.sourceEnd]),seconds:plan.duration,packet_payload_hashes_match:outputPackets.length,decoded_frame_hashes_match:outputFrames.length,planned_audio_samples:plan.audioSamples});
   }finally{await session.close();}
  }
  const report={app:'Simple Meeting Video Editor '+JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,tests:reports,scope:'Real video-only MP4 export using the official 0.7.0 bundle and engine. PCM sample counts are planned, not AAC encoded. Browser AAC and the user Zoom file are not tested here.'};
  fs.writeFileSync(path.join(__dirname,'reports/outward-copy-integration.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
