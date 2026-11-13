const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const C=require('../core.js');
function setup(){
 const c={console,performance,setTimeout,clearTimeout,TextDecoder,TextEncoder,URL,Blob,DOMException,AbortController,ReadableStream,WritableStream,TransformStream,MeetingCore:C};
 // Share typed array constructors with Node Blob streams across the VM boundary.
 for(const k of ['ArrayBuffer','DataView','Uint8Array','Uint8ClampedArray','Uint16Array','Uint32Array','Int8Array','Int16Array','Int32Array','Float32Array','Float64Array','BigInt64Array','BigUint64Array'])c[k]=globalThis[k];
 vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'../lib/browser-media-io.js'),'utf8'),c);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../engine.js'),'utf8'),c);
 const base64=vm.runInNewContext(fs.readFileSync(path.join(__dirname,'fixture.js'),'utf8')+'\nMEETING_TEST_CLIP');
 return {c,E:c.MeetingEngine,file:new Blob([Buffer.from(base64,'base64')],{type:'video/mp4'})};
}
test('official 0.7.0 bundle and copy adapter export real MP4 without VideoEncoder or VideoDecoder',async()=>{
 const {c,E,file}=setup(),signal=new AbortController().signal;
 assert.equal(typeof c.VideoEncoder,'undefined');assert.equal(typeof c.VideoDecoder,'undefined');
 const meta={video:{id:1},duration:4,sampleRate:48000,channels:0,audio:null};
 const {session,info}=await E.openCopy(file,meta,signal);
 try{
   assert.ok(info.boundaries.length>=3);
   const end=4;
   const plan=await E.planCopy(session,info,meta,[{start:1.1,end:1.9}],signal);
   assert.equal(plan.ranges.length,1);assert.equal(plan.ranges[0].sourceStart,0);assert.equal(plan.ranges[0].sourceEnd,4);
   assert.equal(E.copyRequestedRanges(plan,0).length,2);assert.equal(plan.audioSamples,192000);assert.equal(plan.videoPackets,60);
   const analysis=await E.analyze(file,meta,[],-14,true,signal,null,true,C.copyAudioPlan(plan));
   const result=await E.exportCopy(file,meta,analysis,{videoMode:'copy',audioBitrate:80000},{kind:'blob'},session,plan,signal);
   assert.equal(result.videoMode,'copy');assert.equal(result.duration,end);assert.ok(result.blob.size>1000);
   const output=await c.BrowserMediaIO.openVideoCopy(result.blob);try{
     const info2=await output.inspect();assert.equal(info2.endTime-info2.startTime,end);assert.equal(info2.videoPackets,plan.videoPackets);
   }finally{await output.close();}
   await assert.rejects(()=>session.exportMp4({plan:JSON.parse(JSON.stringify(plan))}),e=>e.reason==='PLAN_MISMATCH');
   await assert.rejects(()=>session.plan({keepRanges:[{start:.1,end:.9}],snap:'inside'}),e=>e.reason==='EMPTY_RANGE');
 }finally{await session.close();}
});
test('container mode is explicit: Open GOP rejected by default, copied using sync metadata on request',async()=>{
 const {c}=setup();const file=new Blob([fs.readFileSync(path.join(__dirname,'fixtures/open-gop.mp4'))],{type:'video/mp4'});
 const strict=await c.BrowserMediaIO.openVideoCopy(file);
 try{await assert.rejects(()=>strict.inspect(),e=>e.reason==='GOP_STRUCTURE'&&e.diagnosticCode==='SYNC_IDR_MISMATCH'&&e.recoverableInContainer===true);}finally{await strict.close();}
 const force=await c.BrowserMediaIO.openVideoCopy(file,{validation:'container'});
 try{
  const info=await force.inspect();assert.equal(info.validation,'container');assert.ok(info.warnings.length>0);assert.equal(info.boundaries[1].kind,'sync');
  const plan=await force.plan({keepRanges:[{start:2,end:4},{start:6,end:8}],snap:'strict',audioSampleRate:48000});
  const trial=C.copyExcerptRanges(plan,info,2,30);assert.equal(trial.length,2);
  const result=await force.exportMp4({plan,audio:{mode:'none'}});assert.equal(result.duration,4);assert.equal(result.videoPackets,119);assert.equal(plan.audioSamples,192000);assert.ok(result.warnings.some(w=>w.code==='PACKETS_OMITTED'));assert.equal(result.omittedVideoPackets,1);
  const output=await c.BrowserMediaIO.openVideoCopy(result.blob,{validation:'container'});
  try{const checked=await output.inspect();assert.equal(checked.endTime-checked.startTime,4);}finally{await output.close();}
 }finally{await force.close();}
 await assert.rejects(()=>c.BrowserMediaIO.openVideoCopy(file,{validation:'ignore-everything'}),e=>e.code==='INVALID_ARGUMENT');
});
test('strict and container modes preserve identical closed-GOP output',async()=>{
 const {c,file}=setup(),outputs=[];
 for(const validation of ['strict','container']){
  const session=await c.BrowserMediaIO.openVideoCopy(file,{validation});
  try{const info=await session.inspect();assert.equal(info.validation,validation);const plan=await session.plan({keepRanges:[{start:0,end:1},{start:2,end:4}],snap:'strict'});const result=await session.exportMp4({plan});outputs.push(Buffer.from(await result.blob.arrayBuffer()));}
  finally{await session.close();}
 }
 assert.deepEqual(outputs[0],outputs[1]);
});
test('the official library copies a gap-allowance SPS without warnings in strict mode',async()=>{
 const {c}=setup(),file=new Blob([fs.readFileSync(path.join(__dirname,'fixtures/gaps-allowed.mp4'))],{type:'video/mp4'});
 const session=await c.BrowserMediaIO.openVideoCopy(file);try{
  const info=await session.inspect();assert.equal(info.validation,'strict');assert.equal(info.warnings.length,0);
  const plan=await session.plan({keepRanges:[{start:0,end:1},{start:2,end:4}],snap:'strict',audioSampleRate:48000});
  const out=await session.exportMp4({plan});assert.equal(out.duration,3);assert.equal(out.videoPackets,45);assert.equal(out.warnings.length,0);
 }finally{await session.close();}
});
test('application expands and merges ranges while preserving official plan identity and UI provenance',async()=>{
 const {c,E,file}=setup(),session=await c.BrowserMediaIO.openVideoCopy(file);
 try{
  const info=await session.inspect(),meta={duration:4,sampleRate:44100};
  const cuts=[{start:0,end:.1},{start:.9,end:1.1},{start:1.9,end:3.1},{start:3.9,end:4}];
  const plan=await E.planCopy(session,info,meta,cuts);
  assert.deepEqual(Array.from(plan.ranges,r=>[r.sourceStart,r.sourceEnd]),[[0,2],[3,4]]);
  assert.equal(plan.duration,3);assert.equal(plan.audioSamples,132300);assert.equal(plan.videoPackets,45);
  const requested=E.copyRequestedRanges(plan,0);
  assert.deepEqual(Array.from(requested,r=>[r.start,r.end]),[[.1,.9],[1.1,1.9]]);
  assert.ok(Object.isFrozen(plan));assert.ok(Object.isFrozen(requested));assert.ok(Object.isFrozen(requested[0]));
  assert.equal(plan.ranges[0].requestedRanges,undefined); // No extension injected into the official object.
  const out=await session.exportMp4({plan});assert.equal(out.videoPackets,45);
  const exact=await E.planCopy(session,info,meta,[{start:1,end:2}]);
  assert.deepEqual(Array.from(exact.ranges,r=>[r.sourceStart,r.sourceEnd]),[[0,1],[2,4]]);
  await assert.rejects(()=>session.plan({keepRanges:[{start:0,end:2},{start:1,end:3}],snap:'strict'}),e=>e.reason==='INVALID_RANGE');
  await assert.rejects(()=>session.plan({keepRanges:[{start:-1,end:2}],snap:'strict'}),e=>e.reason==='INVALID_RANGE');
 }finally{await session.close();}
});
test('60-second GOPs retain the opening and ending in strict and forced copy, including trials',async()=>{
 const {c,E}=setup(),file=new Blob([fs.readFileSync(path.join(__dirname,'fixtures/long-gop.mp4'))],{type:'video/mp4'});
 const meta={video:{id:1},duration:120,sampleRate:48000,channels:0,audio:null};
 for(const validation of ['strict','container']){
  const {session,info}=await E.openCopy(file,meta,undefined,undefined,validation);
  try{
   assert.equal(info.keyframeInterval.max,60);
   const plan=await E.planCopy(session,info,meta,[{start:0,end:1},{start:30,end:45},{start:119,end:120}]);
   assert.deepEqual(Array.from(plan.ranges,r=>[r.sourceStart,r.sourceEnd]),[[0,120]]);
   assert.equal(E.copyRequestedRanges(plan,0).length,2);assert.equal(plan.audioSamples,5760000);assert.equal(plan.videoPackets,240);
   const trial=C.copyExcerptRanges(plan,info,1);
   assert.deepEqual(trial,[{start:0,end:60}]);
   const trialPlan=await session.plan({keepRanges:trial,snap:'strict',audioSampleRate:48000});
   assert.equal(trialPlan.audioSamples,2880000);assert.equal(trialPlan.videoPackets,120);
   const result=await session.exportMp4({plan:trialPlan});assert.equal(result.duration,60);assert.equal(result.videoPackets,120);
   const check=await c.BrowserMediaIO.openVideoCopy(result.blob);try{const read=await check.inspect();assert.equal(read.startTime,0);assert.equal(read.endTime,60);}finally{await check.close();}
  }finally{await session.close();}
 }
});
