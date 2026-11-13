const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../core.js');
function info(end=70,step=2){const boundaries=[];for(let time=0;time<end;time+=step)boundaries.push({time,tick:time*30000,kind:'idr'});boundaries.push({time:end,tick:end*30000,kind:'eof'});return {startTime:0,endTime:end,timeResolution:30000,boundaries};}
test('outward selection preserves requested coverage and unions overlap or touching spans',()=>{
 const groups=C.expandCopyRanges([{start:.1,end:.9},{start:1.1,end:1.9},{start:2.1,end:2.9},{start:8.1,end:9.9}],info());
 assert.deepEqual(groups.map(r=>[r.start,r.end]),[[0,4],[8,10]]);
 assert.equal(groups[0].requestedRanges.length,3);assert.ok(Object.isFrozen(groups[0].requestedRanges));
 assert.deepEqual(C.expandCopyRanges([{start:2,end:4},{start:68,end:70}],info()).map(r=>[r.start,r.end]),[[2,4],[68,70]]);
 const shifted=info();shifted.startTime=2;shifted.boundaries=shifted.boundaries.filter(b=>b.time>=2);
 assert.deepEqual(C.expandCopyRanges([{start:2.1,end:3.9}],shifted).map(r=>[r.start,r.end]),[[2,4]]);
 assert.throws(()=>C.expandCopyRanges([{start:1,end:3}],shifted),/COPY_PLAN_INVALID/);
 assert.throws(()=>C.expandCopyRanges([{start:2,end:4},{start:3,end:6}],info()),/COPY_PLAN_INVALID/);
});
test('copy retains the complement of requested removals within the video presentation bounds',()=>{
 assert.deepEqual(C.copyKeepRanges([{start:0,end:1},{start:10,end:20},{start:15,end:22},{start:69,end:70}],70,{startTime:.1,endTime:69.9}),[{start:1,end:10},{start:22,end:69}]);
});
test('copy PCM uses cumulative sample counts rather than rounded source lengths',()=>{
 const ranges=[];let total=0;
 for(let i=0;i<100;i++){const end=Math.round((i+1)*1001*44100/30000);ranges.push({sourceStart:i*3*1001/30000,sourceEnd:(i*3+1)*1001/30000,audioStartSample:total,audioSamples:end-total});total=end;}
 const plan=C.copyAudioPlan({ranges,audioSampleRate:44100,audioSamples:total,duration:100*1001/30000});
 assert.equal(plan.total,147147);assert.equal(plan.keep.reduce((n,r)=>n+r.length,0),147147);
 assert.ok(plan.keep.some(r=>r.length!==r.last-r.first));
 const partial=C.excerptPlan(plan,0,30);assert.equal(partial.total,plan.total);
 const curve={plan,gains:new Float32Array([1,1]),hop:44100,center:0};
 assert.doesNotThrow(()=>new C.Leveler(curve,partial));
});
test('copy trial includes the cursor and all requested 30 seconds, expanding across cuts',()=>{
 const full={ranges:[{sourceStart:2,sourceEnd:20},{sourceStart:26,sourceEnd:64}]};
 assert.deepEqual(C.copyExcerptRanges(full,info(),12.3),[{start:12,end:20},{start:26,end:50}]);
 assert.deepEqual(C.copyExcerptRanges(full,info(),22),[{start:26,end:56}]);
 assert.deepEqual(C.copyExcerptRanges(full,info(),61),[{start:60,end:64}]);
 assert.deepEqual(C.copyExcerptRanges(full,info(),63),[{start:62,end:64}]);
 assert.deepEqual(C.copyExcerptRanges(full,info(),64),[]);
 const long={ranges:[{sourceStart:0,sourceEnd:80}]};
 assert.deepEqual(C.copyExcerptRanges(long,info(80,40),0),[{start:0,end:40}]);
 assert.deepEqual(C.copyExcerptRanges(long,info(80,40),39),[{start:0,end:80}]);
 assert.deepEqual(C.copyExcerptRanges(full,info(),20),[{start:26,end:56}]);
 assert.deepEqual(C.copyExcerptRanges(full,info(),-10),[{start:2,end:20},{start:26,end:38}]);
});
test('copy trial expands fractional boundaries without dropping any requested content',()=>{
 const scale=30000,step=1001*59,boundaries=[];
 for(let i=0;i<=40;i++)boundaries.push({tick:i*step,time:i*step/scale,kind:i===40?'eof':'idr'});
 const full={ranges:[{sourceStart:0,sourceEnd:40*step/scale}]};
 const ranges=C.copyExcerptRanges(full,{boundaries,timeResolution:scale},.2);
 assert.equal(ranges[0].start,0);
 assert.ok(ranges[0].end>=30.2);
 assert.ok(ranges[0].end-step/scale<30.2);
 const exact=C.copyExcerptRanges(full,{boundaries,timeResolution:scale},step/scale,step/scale);
 assert.deepEqual(exact,[{start:step/scale,end:2*step/scale}]);
});
