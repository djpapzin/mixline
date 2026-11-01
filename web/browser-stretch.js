import {FFmpeg} from '@ffmpeg/ffmpeg';
import coreURL from '@ffmpeg/core?url';
import wasmURL from '@ffmpeg/core/wasm?url';
let engine;
export async function stretchInBrowser(file,ratio,onStatus=()=>{}){
 if(!Number.isFinite(ratio)||ratio<.5||ratio>2)throw Error('Tempo ratio must be between 0.5 and 2.');
 if(!engine){
  onStatus('Loading the browser audio engine (about 31 MB, first use only)…');
  const candidate=new FFmpeg();
  try{await candidate.load({coreURL,wasmURL});engine=candidate;}catch(error){candidate.terminate();throw Error('The browser audio engine could not load. Check your connection and try again.');}
 }
 const ffmpeg=engine;
 const progress=({progress})=>onStatus(`Matching tempo in your browser${progress>=0&&progress<=1?' · '+Math.floor(progress*100)+'%':''}…`);
 ffmpeg.on('progress',progress);
 try{
  await ffmpeg.writeFile('input.audio',new Uint8Array(await file.arrayBuffer()));
  onStatus('Matching tempo in your browser…');
  const code=await ffmpeg.exec(['-v','error','-i','input.audio','-vn','-af',`atempo=${ratio.toFixed(9)}`,'-ar','44100','-ac','2','-c:a','pcm_s16le','output.wav'],240000);
  if(code!==0)throw Error('Tempo matching failed or timed out. Try a shorter audio file.');
  const data=await ffmpeg.readFile('output.wav');return data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);
 }finally{
  ffmpeg.off('progress',progress);
  for(const name of ['input.audio','output.wav'])try{await ffmpeg.deleteFile(name);}catch{}
  // Release WASM memory between songs; retained decoded tracks remain available in the playlist.
  ffmpeg.terminate();engine=null;
 }
}
