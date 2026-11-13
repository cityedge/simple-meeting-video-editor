const test=require('node:test'), assert=require('node:assert/strict'), fs=require('fs'),vm=require('vm');
const C=require('../core.js');
function setup({sr=48000,channels=2,duration=2,blocks,sample,failFrame=-1,failAac=false}={}){
 const writes={video:[],audio:[],cancelled:false,closed:0,finished:false};
 const meta={duration,sampleRate:sr,channels,video:{id:1,video:{width:640,height:360}},audio:channels?{id:2}:null};
 let fallback=false;
 const native=c=>[128000,160000,192000].includes(c.audioBitrate??192000);
 writes.fallbackConfigs=[];writes.capabilityConfigs=[];
 const api={
  enableAacFallback:async c=>{writes.fallbackConfigs.push(c);if(!native(c))fallback=true;return fallback?'wasm':'native';},
  getCapabilities:async c=>{writes.capabilityConfigs.push(c);return {h264Encode:true,aacEncode:!failAac&&(native(c)||fallback),nativeAacEncode:native(c)};},
  openMedia:async()=>({
   async *audioPcmBlocks({start,end,signal}){
    if(blocks){for(const b of blocks)yield b;return;}
    for(let pos=Math.round(start*sr);pos<Math.round(end*sr);pos+=337){if(signal.aborted)throw new DOMException('cancel','AbortError');const length=Math.min(337,Math.round(end*sr)-pos);yield {timestamp:pos/sr,length,channelData:Array.from({length:channels},(_,c)=>Float32Array.from({length},(_,i)=>sample?sample((pos+i)/sr,c):.025*Math.sin(2*Math.PI*(c?660:440)*(pos+i)/sr)+((pos+i)/sr>4&&(pos+i)/sr<4.03?.75*Math.sin(2*Math.PI*900*(pos+i)/sr):0)))};}
   },
   async *videoFramesAt(times){for(const time of times)yield {frame:{draw(ctx){ctx.time=time;},close(){}},time};},
   close(){writes.closed++;}
  }),
  createMp4Writer:async options=>{writes.options=options;return ({
   async addVideoFrame(canvas){if(writes.video.length===failFrame)throw new Error('test encoder failure');writes.video.push(canvas.ctx.time);},
   async addPcm(b){assert.equal(b.sampleRate,sr);assert.equal(b.numberOfChannels,channels);writes.audio.push(b.channelData.map(a=>a.slice()));},
   async finish(){writes.finished=true;return {duration:writes.video.length/options.fps,videoFrames:writes.video.length,audioSamples:writes.audio.reduce((s,d)=>s+d[0].length,0)};},
   async cancel(){writes.cancelled=true;}
  });}};
 const context={MeetingCore:C,BrowserMediaIO:api,performance,setTimeout,DOMException,Float32Array,console,document:{createElement:()=>({ctx:{fillRect(){}},getContext(){return this.ctx;}})}};context.globalThis=context;
 vm.runInNewContext(fs.readFileSync(require.resolve('../engine.js'),'utf8'),context);
 return {E:context.MeetingEngine,meta,writes,api};
}
test('track gaps and overlaps are aligned to timestamps, not concatenated blindly',async()=>{
 const sr=1000,channels=1,blocks=[{timestamp:.1,length:200,channelData:[new Float32Array(200).fill(.2)]},{timestamp:.25,length:250,channelData:[new Float32Array(250).fill(.3)]}];
 const {E,meta}=setup({sr,channels,duration:1,blocks});const plan=C.makePlan([],1,sr),data=[];
 for await(const b of E.editedAudio({},meta,plan,new AbortController().signal,false))data.push(...b.data[0]);
 assert.equal(data.length,1000);assert.equal(data[0],0);assert.ok(Math.abs(data[100]-.2)<1e-7);assert.ok(Math.abs(data[299]-.2)<1e-7);assert.ok(Math.abs(data[300]-.3)<1e-7);assert.equal(data[500],0);
});
test('retained audio and output frames stay aligned across several arbitrary cuts',async()=>{
 const {E,meta,writes}=setup({duration:16});const cuts=[{start:0,end:1},{start:5.123,end:7.251},{start:15.13,end:16}],plan=C.makePlan(cuts,16,48000),signal=new AbortController().signal;
 const a={plan,gainDb:0,enabled:false},settings=E.videoSettings(meta,'720','standard',30);
 const result=await E.exportMp4({},meta,a,settings,{kind:'blob'},signal);
 assert.equal(result.audioSamples,plan.total);assert.equal(result.videoFrames,Math.ceil(plan.duration*30));assert.ok(Math.abs(result.duration-plan.duration)<1/30);
 for(let i=0;i<writes.video.length;i++)assert.equal(writes.video[i],C.sourceAt(plan,i/30));
 assert.ok(writes.video.every(t=>!(t>=5.123&&t<7.251)));assert.equal(writes.closed,2);assert.equal(writes.finished,true);
});
test('automatic loudness refinement reaches the target with isolated large peaks',async()=>{
 const {E,meta}=setup({duration:16}),signal=new AbortController().signal;
 const a=await E.analyze({},meta,[{start:0,end:1},{start:5,end:7},{start:15,end:16}],-14,true,signal);
 assert.ok(Math.abs(a.outputLufs+14)<.6,JSON.stringify({gain:a.gainDb,lufs:a.outputLufs}));assert.ok(a.outputPeak<=10**(-1.5/20)+1e-7);assert.ok(a.maxReductionDb>10);assert.ok(a.passes<=2);
});
test('encoder failure cancels writer and closes both input readers',async()=>{
 const {E,meta,writes}=setup({failFrame:5}),plan=C.makePlan([],2,48000);
 await assert.rejects(()=>E.exportMp4({},meta,{plan,gainDb:0,enabled:false},E.videoSettings(meta,'source','small',30),{kind:'blob'},new AbortController().signal),/test encoder failure/);
 assert.equal(writes.cancelled,true);assert.equal(writes.closed,2);assert.equal(writes.finished,false);
});
test('cancel stops audio generation and releases its input',async()=>{
 const {E,meta,writes}=setup({duration:100}),controller=new AbortController(),plan=C.makePlan([],100,48000);
 const reader=E.editedAudio({},meta,plan,controller.signal);await reader.next();controller.abort();await assert.rejects(()=>reader.next(),/cancel|Cancelled/i);await reader.return();assert.equal(writes.closed,1);
});
test('no-audio input, fractional duration and 15fps export',async()=>{
 const {E,meta,writes}=setup({duration:.231,channels:0});
 const a=await E.analyze({},meta,[],-14,true,new AbortController().signal);
 const result=await E.exportMp4({},meta,a,E.videoSettings(meta,'720','standard',15),{kind:'blob'},new AbortController().signal);
 assert.equal(result.videoFrames,4);assert.equal(writes.audio.length,0);assert.equal(writes.closed,1);
});

test('custom video and audio bitrates reach the writer without resolution scaling',async()=>{
 const {E,meta,writes}=setup({duration:.4});meta.video.video={width:1920,height:1080};
 for(const kbps of [25,50,140,250,50000]){const s=E.videoSettings(meta,'720','custom',25,kbps,80);assert.equal(s.videoBitrate,kbps*1000);assert.equal(s.audioBitrate,80000);assert.equal(s.fps,25);}
 for(const bad of [0,24,140.5,50001,NaN])assert.throws(()=>E.videoSettings(meta,'source','custom',25,bad,80),/BITRATE_INVALID/);
 const s=E.videoSettings(meta,'source','custom',25,140,80),plan=C.makePlan([],.4,48000);
 await E.exportMp4({},meta,{plan,gainDb:0,enabled:false},s,{kind:'blob'},new AbortController().signal);
 assert.equal(writes.options.videoBitrate,140000);assert.equal(writes.options.audio.bitrate,80000);assert.equal(writes.video.length,10);
});
test('leveling balances quiet speech-like sections and a mastered insert before normalization',async()=>{
 const sr=12000,duration=44,sample=t=>{
   if(t<4||t>=40)return 0;
   const amplitude=t<16||t>=28?.02:.4;
   return amplitude*(.75+.25*Math.sin(2*Math.PI*3*t))*(.7*Math.sin(2*Math.PI*440*t)+.3*Math.sin(2*Math.PI*1000*t));
 },{E,meta,writes}=setup({sr,duration,sample}),signal=new AbortController().signal;
 const a=await E.analyze({},meta,[],-14,true,signal,undefined,true);
 assert.ok(a.levelCurve);assert.ok(Math.abs(a.outputLufs+14)<.5,`${a.outputLufs}`);assert.ok(a.outputPeak<=10**(-1.5/20)+1e-7);
 const output=new Float32Array(sr*duration);for await(const b of E.processedAudio({},meta,a.plan,a.gainDb,a.enabled,signal,{},a.levelCurve))output.set(b.data[0],b.offset);
 function loudness(data,start,end){const m=new C.LoudnessMeter(sr,2),d=data.slice(start*sr,end*sr);m.push([d,d]);return m.result().lufs;}
 const before=Float32Array.from({length:output.length},(_,i)=>sample(i/sr));
 const inputGap=loudness(before,20,24)-loudness(before,8,12),outputGap=loudness(output,20,24)-loudness(output,8,12);
 assert.ok(inputGap>25);assert.ok(Math.abs(outputGap)<3.5,`gap ${outputGap}`);assert.ok(Math.abs(loudness(output,8,12)-loudness(output,32,36))<.2);
 assert.ok(output.slice(0,sr*3).every(x=>x===0));assert.ok(output.slice(sr*41).every(x=>x===0));
 const result=await E.exportMp4({},meta,a,E.videoSettings(meta,'source','custom',10,140,80),{kind:'blob'},signal);
 assert.equal(result.audioSamples,output.length);const written=new Float32Array(output.length);let offset=0;for(const d of writes.audio){written.set(d[0],offset);offset+=d[0].length;}assert.deepEqual(written,output);
 console.log(JSON.stringify({levelingFixture:{inputGap,outputGap,inputLufs:a.inputLufs,outputLufs:a.outputLufs,peak:a.outputPeak,gain:a.gainDb,minLevelDb:a.levelCurve.minDb,maxLevelDb:a.levelCurve.maxDb}}));
});
test('near-silence is not normalized up by 36 dB',async()=>{
 const {E,meta}=setup({sr:12000,duration:1,sample:t=>.0001*Math.sin(2*Math.PI*1000*t)});
 const a=await E.analyze({},meta,[],-14,true,new AbortController().signal,undefined,true);
 assert.equal(a.gainDb,0);assert.equal(a.levelCurve,null);assert.equal(a.measurable,false);
});

test('AAC fallback is initialized using exactly the writer bitrate, including retries with another rate',async()=>{
 const {E,meta,writes}=setup({duration:.2}),plan=C.makePlan([],.2,48000),signal=new AbortController().signal;
 for(const audio of [80,32,160]){
  const settings=E.videoSettings(meta,'source','custom',25,140,audio);
  await E.exportMp4({},meta,{plan,gainDb:0,enabled:false},settings,{kind:'blob'},signal);
  assert.equal(writes.fallbackConfigs.at(-1).audioBitrate,audio*1000);assert.equal(writes.capabilityConfigs.at(-1).audioBitrate,audio*1000);assert.equal(writes.options.audio.bitrate,audio*1000);
 }
});
test('unsupported AAC fails before decoding and aborts an already-provided output stream',async()=>{
 const {E,meta,writes}=setup({failAac:true}),plan=C.makePlan([],2,48000);let aborted=0;
 await assert.rejects(()=>E.exportMp4({},meta,{plan,gainDb:0,enabled:false},E.videoSettings(meta,'source','custom',25,140,80),{kind:'stream',stream:{abort:async()=>{aborted++;}}},new AbortController().signal),/AAC_ENCODER_UNSUPPORTED/);
 assert.equal(aborted,1);assert.equal(writes.closed,0);assert.equal(writes.options,undefined);
});
test('a trial across cuts exports only retained seconds and uses the full analysis gain curve',async()=>{
 const {E,meta,writes}=setup({sr:12000,duration:65}),signal=new AbortController().signal;
 const whole=await E.analyze({},meta,[{start:16,end:21},{start:37,end:42},{start:61,end:65}],-14,true,signal,undefined,true);
 const plan=C.excerptPlan(whole.plan,12.125,30),trial={...whole,plan};assert.equal(trial.levelCurve,whole.levelCurve);
 const result=await E.exportMp4({},meta,trial,E.videoSettings(meta,'source','custom',25,140,80),{kind:'blob'},signal);
 assert.equal(result.audioSamples,360000);assert.equal(result.videoFrames,750);assert.equal(writes.video[0],12.125);
 for(let i=0;i<writes.video.length;i++)assert.equal(writes.video[i],C.sourceAt(plan,i/25));
 assert.ok(writes.video.every(t=>!(t>=16&&t<21)&&!(t>=37&&t<42)));
});
test('copy analysis and PCM export follow the confirmed plan without an H264 encoder',async()=>{
 const {E,meta,writes,api}=setup({sr:12000,duration:16}),signal=new AbortController().signal;
 const caps=api.getCapabilities;api.getCapabilities=async c=>({...await caps(c),h264Encode:false});
 const copyPlan={audioSampleRate:12000,audioSamples:96000,duration:8,ranges:[
   {sourceStart:2,sourceEnd:6,audioStartSample:0,audioSamples:48000},
   {sourceStart:10,sourceEnd:14,audioStartSample:48000,audioSamples:48000}]};
 const plan=C.copyAudioPlan(copyPlan);
 const a=await E.analyze({},meta,[],-14,true,signal,undefined,true,plan);
 assert.equal(a.plan,plan);assert.equal(a.levelCurve.plan,plan);
 const expected=[];for await(const b of E.processedAudio({},meta,plan,a.gainDb,true,signal,{},a.levelCurve))expected.push(...b.data[0]);
 let seenOptions;const session={async exportMp4(o){seenOptions=o;const got=[];for await(const b of o.audio.blocks(signal)){
   assert.equal(b.sampleRate,12000);assert.equal(b.numberOfChannels,2);got.push(...b.channelData[0]);}
   assert.deepEqual(got,expected);return {videoMode:'copy',duration:8,audioSamples:got.length};}};
 const result=await E.exportCopy({},meta,a,{videoMode:'copy',audioBitrate:80000},{kind:'blob'},session,copyPlan,signal);
 assert.equal(result.audioSamples,96000);assert.equal(seenOptions.plan,copyPlan);assert.equal(seenOptions.audio.bitrate,80000);
 assert.equal(writes.video.length,0);assert.equal(writes.options,undefined);
 assert.ok(Math.abs(result.measurement.lufs-a.outputLufs)<1e-8);
 await assert.rejects(()=>E.prepareExport(meta,E.videoSettings(meta,'source','custom',25,140,80),signal),/ENCODER_UNSUPPORTED/);
});
test('copy PCM keeps cumulative rounding differences and rejects a mismatched plan before writing',async()=>{
 const {E,meta}=setup({sr:44100,duration:4}),signal=new AbortController().signal;
 const copyPlan={audioSampleRate:44100,audioSamples:2943,duration:2002/30000,ranges:[
   {sourceStart:1001/30000,sourceEnd:2002/30000,audioStartSample:0,audioSamples:1471},
   {sourceStart:4004/30000,sourceEnd:5005/30000,audioStartSample:1471,audioSamples:1472}]};
 const plan=C.copyAudioPlan(copyPlan);let writes=0;
 const session={async exportMp4(o){writes++;let count=0;for await(const b of o.audio.blocks(signal))count+=b.length;return {audioSamples:count};}};
 const a={plan,gainDb:0,enabled:false};
 assert.equal((await E.exportCopy({},meta,a,{videoMode:'copy',audioBitrate:80000},{kind:'blob'},session,copyPlan,signal)).audioSamples,2943);
 let aborted=false;
 await assert.rejects(()=>E.exportCopy({},meta,{...a,plan:{...plan,total:2944}},{videoMode:'copy',audioBitrate:80000},{kind:'stream',stream:{abort:async()=>{aborted=true;}}},session,copyPlan,signal),/COPY_PLAN_INVALID/);
 assert.equal(writes,1);assert.equal(aborted,true);
});
test('copy session inspection failure closes the session; no audio requires no AAC initialization',async()=>{
 const {E,meta,api,writes}=setup({channels:0});let closed=false;
 api.openVideoCopy=async()=>({inspect:async()=>{throw new Error('unsupported fixture');},close:async()=>{closed=true;}});
 await assert.rejects(()=>E.openCopy({},meta,new AbortController().signal),/unsupported/);assert.equal(closed,true);
 api.getCapabilities=async()=>({h264Encode:false,aacEncode:false});
 const plan={audioSampleRate:48000,audioSamples:96000,duration:2,ranges:[{sourceStart:0,sourceEnd:2,audioStartSample:0,audioSamples:96000}]};
 const session={exportMp4:async o=>{assert.equal(o.audio.mode,'none');return {audioSamples:0};}};
 await E.exportCopy({},meta,{plan:C.copyAudioPlan(plan)}, {videoMode:'copy',audioBitrate:80000},{kind:'blob'},session,plan,new AbortController().signal);
 assert.equal(writes.fallbackConfigs.length,0);
});
test('forced copy requests container validation and rejects a library that ignores the option',async()=>{
 const {E,meta,api}=setup();let options,closed=0;
 api.openVideoCopy=async(file,o)=>{options=o;return {inspect:async()=>({validation:'container'}),close:async()=>{closed++;}};};
 const opened=await E.openCopy({},meta,new AbortController().signal,undefined,'container');assert.equal(options.validation,'container');await opened.session.close();
 api.openVideoCopy=async()=>({inspect:async()=>({}),close:async()=>{closed++;}});
 await assert.rejects(()=>E.openCopy({},meta,new AbortController().signal,undefined,'container'),/FORCE_COPY_UNAVAILABLE/);assert.equal(closed,2);
});
