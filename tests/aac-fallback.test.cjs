const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
// Run the actual bundled library. Mock only the browser's native support report;
// its fallback registration and configuration checks are real library code.
test('bundled AAC: default native support must not suppress fallback at 80 kbps',async()=>{
 const configs=[];
 const context={console,performance,setTimeout,clearTimeout,TextDecoder,TextEncoder,URL,Blob,DOMException,AbortController,
  AudioEncoder:class{static async isConfigSupported(c){configs.push(c);return {supported:c.codec==='mp4a.40.2'&&[128000,160000,192000].includes(c.bitrate),config:c};}}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../lib/browser-media-io.js'),'utf8'),context);
 const api=context.BrowserMediaIO;
 assert.equal(await api.enableAacFallback({sampleRate:48000,channels:2}),'native');
 assert.equal((await api.getCapabilities({sampleRate:48000,channels:2,audioBitrate:80000})).aacEncode,false);
 assert.equal(await api.enableAacFallback({sampleRate:48000,channels:2,audioBitrate:80000}),'wasm');
 const support=await api.getCapabilities({sampleRate:48000,channels:2,audioBitrate:80000});
 assert.equal(support.nativeAacEncode,false);assert.equal(support.aacEncode,true);
 for(const bitrate of [32000,48000,64000,80000,96000,128000,160000,192000,256000]){
   const s=await api.getCapabilities({sampleRate:48000,channels:2,audioBitrate:bitrate});assert.equal(s.aacEncode,true,`AAC ${bitrate}`);
 }
 assert.ok(configs.some(c=>c.bitrate===192000));assert.ok(configs.some(c=>c.bitrate===80000));
});
