const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../core.js');

test('overlapping removals merge; timeline is sample-exact', () => {
 const cuts = C.normalizeCuts([{start:5,end:7},{start:6,end:9},{start:-1,end:1},{start:15,end:16}],16);
 assert.deepEqual(cuts,[{start:0,end:1},{start:5,end:9},{start:15,end:16}]);
 const p=C.makePlan(cuts,16,48000);assert.equal(p.total,10*48000);
 assert.equal(C.sourceAt(p,0),1);assert.equal(C.sourceAt(p,4),9);
 assert.ok(C.sourceAt(p,p.duration)<15);
 assert.equal(C.makePlan([{start:0,end:16}],16).total,0);
});
test('time parsing rejects malformed values and round-trips hours',()=>{
 assert.equal(C.parseTime('01:02:03.125'),3723.125);
 assert.equal(C.timeText(3723.125),'01:02:03.125');
 assert.ok(Number.isNaN(C.parseTime('00:80:10')));
 assert.ok(Number.isNaN(C.parseTime('NaN')));
 assert.equal(C.timeText(59.9996),'00:01:00.000');
});
function tone(sr,n,channels=2){const d=Array.from({length:channels},()=>new Float32Array(n));for(let i=0;i<n;i++)for(let c=0;c<channels;c++)d[c][i]=.1*Math.sin(2*Math.PI*1000*i/sr);return d;}
test('K weighting and gating agree with a calibrated 1kHz signal',()=>{
 for(const sr of [44100,48000]){const d=tone(sr,sr*3);const m=new C.LoudnessMeter(sr,2);m.push(d);assert.ok(Math.abs(m.result().lufs-(-20.04))<.15,JSON.stringify(m.result()));}
 const m=new C.LoudnessMeter(48000,1);m.push([new Float32Array(48000)]);assert.equal(m.result().lufs,-Infinity);
});
test('loudness and limiter results do not depend on chunk boundaries',()=>{
 const sr=48000,n=sr*2,d=tone(sr,n);d[0][1234]=.99;d[1][70000]=-.98;
 function run(size){const l=new C.Limiter(sr,2,18),m=new C.LoudnessMeter(sr,2),out=[new Float32Array(n),new Float32Array(n)];let at=0;for(let i=0;i<n;i+=size){const p=l.push(d.map(a=>a.subarray(i,i+size)));m.push(p);p.forEach((a,c)=>out[c].set(a,at));at+=p[0].length;}const p=l.finish();m.push(p);p.forEach((a,c)=>out[c].set(a,at));at+=p[0].length;return {out,m:m.result(),at};}
 const a=run(4096),b=run(337);assert.equal(a.at,n);assert.equal(b.at,n);
 assert.deepEqual(a.out,b.out);assert.equal(a.m.lufs,b.m.lufs);
 assert.ok(a.m.peak<=10**(-1.5/20)+1e-7);
});
test('mono waveform combines stereo peaks without phase cancellation',()=>{
 const w=new C.Waveform(1);w.push([new Float32Array([.8,-.5]),new Float32Array([-.8,.5])],48000,0);
 assert.ok(w.max[0]>.79);assert.ok(w.min[0]<-.79);
});
test('processed waveform maps back to retained source regions',()=>{
 const p=C.makePlan([{start:1,end:2}],3,100);const w=new C.Waveform(3,100);
 w.pushEdited([new Float32Array(200).fill(.5)],100,0,p);
 assert.equal(w.max[99],.5);assert.equal(w.max[100],0);assert.equal(w.max[199],0);assert.equal(w.max[200],.5);
});
test('level curve is bounded, stereo linked, chunk-independent and reused at audition source times',()=>{
 const sr=12000,duration=28,n=sr*duration,plan=C.makePlan([{start:12,end:14}],duration,sr);
 const source=Float32Array.from({length:n},(_,i)=>{const t=i/sr;return (t<3||t>25?0:t<14?.015:.4)*Math.sin(2*Math.PI*1000*t);});
 const input=new Float32Array(plan.total);for(const s of plan.keep)input.set(source.subarray(s.first,s.last),s.offset);
 const meter=new C.LoudnessMeter(sr,2);meter.push([input,input]);const curve=C.makeLevelCurve(meter,plan);
 assert.ok(curve.minDb>=-18&&curve.maxDb<=24);
 function run(chunk){const l=new C.Leveler(curve,plan),out=[new Float32Array(plan.total),new Float32Array(plan.total)];for(let i=0;i<plan.total;i+=chunk){const a=input.slice(i,i+chunk),d=l.push([a,a.map(v=>-v)],i);d.forEach((c,k)=>out[k].set(c,i));}return out;}
 const a=run(4096),b=run(337);assert.deepEqual(a,b);for(let i=0;i<plan.total;i++){assert.equal(a[0][i],-a[1][i]);if(i<sr)assert.ok(a[0][i]===0);}
 const sub=C.makePlan([{start:0,end:10},{start:12,end:14},{start:19,end:28}],duration,sr),preview=new C.Leveler(curve,sub);
 for(const s of sub.keep){const samples=source.slice(s.first,s.last);const out=preview.push([samples],s.offset)[0];const full=plan.keep.find(p=>s.first>=p.first&&s.last<=p.last);const at=full.offset+s.first-full.first;assert.deepEqual(out,a[0].slice(at,at+s.length));}
});
test('silence and very low noise do not create an upward leveling curve',()=>{
 for(const amplitude of [0,.0001]){const m=new C.LoudnessMeter(48000,1);m.push([Float32Array.from({length:48000},(_,i)=>amplitude*Math.sin(2*Math.PI*1000*i/48000))]);assert.equal(C.makeLevelCurve(m,C.makePlan([],1)),null);}
});
test('30-second excerpts start at the source cursor, skip cuts, and shorten at the retained end',()=>{
 const sr=48000,p=C.makePlan([{start:0,end:5},{start:20,end:25},{start:45,end:55},{start:92,end:100}],100,sr);
 const a=C.excerptPlan(p,10,30);assert.equal(a.total,30*sr);assert.deepEqual(a.keep.map(s=>[s.start,s.end,s.offset]),[[10,20,0],[25,45,10*sr]]);
 const b=C.excerptPlan(p,22,30);assert.equal(b.duration,30);assert.deepEqual(b.keep.map(s=>[s.start,s.end]),[[25,45],[55,65]]);
 const end=C.excerptPlan(p,89,30);assert.equal(end.duration,3);assert.equal(end.keep[0].end,92);
 assert.equal(C.excerptPlan(p,92,30).total,0);assert.equal(C.excerptPlan(p,100,30).total,0);
 const f=C.excerptPlan(p,12.345,30);assert.equal(f.keep[0].first,Math.round(12.345*sr));assert.equal(f.total,30*sr);
 assert.equal(C.excerptPlan(p,0,10).keep[0].start,5);
 assert.throws(()=>C.excerptPlan(p,NaN,30),/INVALID_EXCERPT/);
});
