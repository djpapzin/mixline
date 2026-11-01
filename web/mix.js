export function transitionPlan(aDuration,bDuration,bStart,fadeSeconds){
 const overlap=Math.max(0,Math.min(aDuration,bStart+bDuration)-bStart);
 const fade=Math.max(0,Math.min(fadeSeconds,overlap));
 return {aDuration,bDuration,bStart,fade,duration:Math.max(aDuration,bStart+bDuration)};
}
export function envelope(deck,time,plan){
 if(deck==='a')return !plan.fade||time<plan.bStart?1:time>=plan.bStart+plan.fade?0:Math.cos((time-plan.bStart)/plan.fade*Math.PI/2);
 return !plan.fade?1:time>=plan.bStart+plan.fade?1:time<=plan.bStart?0:Math.sin((time-plan.bStart)/plan.fade*Math.PI/2);
}
export function schedule(context,tracks,plan,position,destination){
 const nodes=[],now=context.currentTime+.03;
 for(const deck of ['a','b']){
  const track=tracks[deck];if(!track?.buffer)continue;
  const start=deck==='a'?0:plan.bStart,end=start+track.buffer.duration;
  if(position>=end)continue;
  const source=context.createBufferSource(),gain=context.createGain();source.buffer=track.buffer;source.connect(gain);gain.connect(destination);
  const from=Math.max(position,start),offset=Math.max(0,position-start),when=now+Math.max(0,start-position);
  gain.gain.setValueAtTime(envelope(deck,from,plan)*.7,when);
  if(plan.fade && from<plan.bStart+plan.fade){
   const stop=Math.min(end,plan.bStart+plan.fade),curveStart=Math.max(from,plan.bStart),curveTime=now+Math.max(0,curveStart-position);
   const length=stop-curveStart;
   if(length>0){const curve=new Float32Array(512);for(let i=0;i<curve.length;i++)curve[i]=.7*envelope(deck,curveStart+length*i/(curve.length-1),plan);gain.gain.setValueCurveAtTime(curve,curveTime,length);}
  }
  source.start(when,offset);nodes.push(source);
 }
 return {nodes,startTime:now};
}
export function encodeWav(buffer){
 const channels=buffer.numberOfChannels,frames=buffer.length,bytes=frames*channels*2;
 const data=new ArrayBuffer(44+bytes),view=new DataView(data);
 const str=(o,s)=>{for(let i=0;i<s.length;i++)view.setUint8(o+i,s.charCodeAt(i));};
 str(0,'RIFF');view.setUint32(4,36+bytes,true);str(8,'WAVE');str(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels,true);view.setUint32(24,buffer.sampleRate,true);view.setUint32(28,buffer.sampleRate*channels*2,true);view.setUint16(32,channels*2,true);view.setUint16(34,16,true);str(36,'data');view.setUint32(40,bytes,true);
 const pcm=Array.from({length:channels},(_,n)=>buffer.getChannelData(n));let peak=0;
 for(const channel of pcm)for(let n=0;n<frames;n++)peak=Math.max(peak,Math.abs(channel[n]));
 const scale=peak>.98?.98/peak:1;
 for(let n=0;n<frames;n++)for(let ch=0;ch<channels;ch++){const value=Math.max(-1,Math.min(1,pcm[ch][n]*scale));view.setInt16(44+(n*channels+ch)*2,value*(value<0?32768:32767),true);}
 return {data,normalized:scale<1};
}


/** Each playlist row is independently scheduled; there is no fixed lane count. */
export function clipBounds(track) {
  const rate=Number.isFinite(track.rate)&&track.rate>0?track.rate:1;
  const sourceDuration=track.original?.duration ?? track.buffer.duration*rate;
  const min=Math.min(.05*rate,sourceDuration);
  const trimIn=Math.max(0,Math.min(sourceDuration-min,Number.isFinite(track.trimIn)?track.trimIn:0));
  const trimOut=Math.max(trimIn+min,Math.min(sourceDuration,Number.isFinite(track.trimOut)?track.trimOut:sourceDuration));
  return {rate,sourceDuration,trimIn,trimOut,sourceOffset:trimIn/rate,duration:(trimOut-trimIn)/rate};
}
export function editClip(track,kind,seconds) {
  if(!Number.isFinite(seconds))return track;
  const b=clipBounds(track),min=.05*b.rate;
  if(kind==='trim-in'){
    const into=Math.max(0,Math.min(b.trimOut-min,b.trimIn+seconds*b.rate));
    const shift=(into-b.trimIn)/b.rate;
    // Trimming moves the left edge, preserving the remaining audio's timeline position.
    if(track.start+shift<0)return editClip(track,kind,-track.start);
    return {...track,start:track.start+shift,trimIn:into};
  }
  if(kind==='trim-out')return {...track,trimOut:Math.min(b.sourceDuration,Math.max(b.trimIn+min,b.trimOut+seconds*b.rate))};
  if(kind==='fade-in')return {...track,customFadeIn:Math.max(0,Math.min(b.duration,seconds))};
  if(kind==='fade-out')return {...track,customFadeOut:Math.max(0,Math.min(b.duration,seconds))};
  return track;
}
export function playlistPlan(tracks, fadeSeconds) {
  const items=tracks.map(t=>({...t,...clipBounds(t),end:t.start+clipBounds(t).duration,fadeIn:0,fadeOut:0,fadeOutStart:0}));
  const order=[...items].sort((a,b)=>a.start-b.start);
  for(let i=1;i<order.length;i++){
    const previous=order[i-1],current=order[i];
    const length=Math.max(0,Math.min(fadeSeconds,previous.end-current.start,current.duration));
    current.fadeIn=length;previous.fadeOut=length;
  }
  for(const item of items){
    if(Number.isFinite(item.customFadeIn))item.fadeIn=Math.max(0,Math.min(item.duration,item.customFadeIn));
    if(Number.isFinite(item.customFadeOut))item.fadeOut=Math.max(0,Math.min(item.duration,item.customFadeOut));
    item.fadeOutStart=item.end-item.fadeOut;
  }
  const events=items.flatMap(t=>[{time:t.start,delta:1},{time:t.end,delta:-1}]).sort((a,b)=>a.time-b.time||a.delta-b.delta);
  let active=0,max=1;for(const event of events){active+=event.delta;max=Math.max(max,active);}
  return {items,duration:Math.max(0,...items.map(t=>t.end)),gain:Math.min(.7,.98/max)};
}
export function playlistGain(item,time){
  if(time<item.start||time>=item.end)return 0;
  const into=time-item.start;
  const incoming=item.fadeIn&&into<item.fadeIn?Math.sin(into/item.fadeIn*Math.PI/2):1;
  const outgoing=item.fadeOut&&time>=item.fadeOutStart?Math.cos(Math.min(1,(time-item.fadeOutStart)/item.fadeOut)*Math.PI/2):1;
  return incoming*outgoing;
}
export function schedulePlaylist(context,plan,position,destination){
  const now=context.currentTime+.03,nodes=[];
  for(const item of plan.items){
    if(position>=item.end)continue;
    const from=Math.max(position,item.start),length=item.end-from;
    if(length<=0)continue;
    const source=context.createBufferSource(),gain=context.createGain();source.buffer=item.buffer;source.connect(gain);gain.connect(destination);
    const when=now+Math.max(0,item.start-position),curve=new Float32Array(Math.max(2,Math.ceil(length*100)+1));
    for(let i=0;i<curve.length;i++)curve[i]=plan.gain*playlistGain(item,Math.min(item.end-1e-7,from+length*i/(curve.length-1)));
    gain.gain.setValueCurveAtTime(curve,when,length);source.start(when,item.sourceOffset+Math.max(0,position-item.start),length);nodes.push(source);
  }
  return {nodes,startTime:now};
}
