import {clipBounds,editClip,playlistPlan,playlistGain,schedulePlaylist,encodeWav} from './mix.js';
const $=id=>document.getElementById(id),tracks=[];
const colors=['#83b4ff','#f0a18c','#ba9bff','#79d8c0','#efcd7e','#f195c4'];
const RULER=34,ROW=100,FOOT=48;
let ctx,playing=false,playback=null,position=0,busy=false,matched=null,drag=null,px=1,selected=null,replacing=null,nextId=1;
const canvas=$('timeline'),scroll=$('timeline-scroll'),zone=$('drop-zone');
const tempo=()=>Number($('tempo').value),beat=()=>60/tempo(),fade=()=>Number($('fade').value)*beat();
const plan=()=>playlistPlan(tracks,fade());
const rows=()=>Math.max(4,tracks.length+1),height=()=>RULER+rows()*ROW+FOOT;
const fmt=(seconds,decimal=false)=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${(seconds%60).toFixed(decimal?1:0).padStart(decimal?4:2,'0')}`;
const chosen=()=>tracks.find(t=>t.id===selected);
function status(title,detail){$('status').textContent=title;$('detail').textContent=detail;}
function audio(){return ctx??=new AudioContext({sampleRate:44100});}
function snapshot(){if(playing&&playback)position=Math.min(plan().duration,playback.position+Math.max(0,ctx.currentTime-playback.startTime));}
function stop(reset=false){if(playback){for(const n of playback.nodes){try{n.stop();n.disconnect();}catch{}}playback.master.disconnect();}playback=null;playing=false;if(reset)position=0;$('play').textContent='▶';$('play').setAttribute('aria-label','Play mix');draw();}
async function play(){
 if(busy)return;if(playing){snapshot();stop();return;}if(!tracks.length)return;
 try{await audio().resume();if(ctx.state!=='running')throw Error('Click Play again to enable audio.');if(position>=plan().duration)position=0;
 const master=ctx.createGain();master.gain.value=$('mute').checked?0:1;master.connect(ctx.destination);
 playback={...schedulePlaylist(ctx,plan(),position,master),position,master};playing=true;$('play').textContent='Ⅱ';$('play').setAttribute('aria-label','Pause mix');
 }catch(error){status('Playback could not start.',error.message);}
}
function seek(time){const resume=playing;snapshot();stop();position=Math.max(0,Math.min(plan().duration,time));draw();if(resume)void play();}
function pick(id){selected=id;syncEditor();$('start').value=(chosen()?.start||0).toFixed(2);for(const lane of document.querySelectorAll('.playlist-lane'))lane.classList.toggle('selected',Number(lane.dataset.id)===id);}
function syncEditor(){
 const t=chosen(),item=plan().items.find(t=>t.id===selected);
 $('selected-name').textContent=t?t.file.name:'Select a song to edit';
 for(const id of ['clip-in','clip-out','clip-fade-in','clip-fade-out','reset-trim','auto-fades'])$(id).disabled=busy||!t;
 if(!t)return;
 const bounds=clipBounds(t);
 $('clip-in').value=bounds.trimIn.toFixed(2);$('clip-out').value=bounds.trimOut.toFixed(2);
 $('clip-fade-in').value=item.fadeIn.toFixed(2);$('clip-fade-out').value=item.fadeOut.toFixed(2);
 $('clip-in').max=bounds.trimOut-.05*bounds.rate;$('clip-out').max=bounds.sourceDuration;
}
function applyEdit(kind,value){
 const track=chosen();if(!track||busy)return;snapshot();stop();Object.assign(track,editClip(track,kind,value));position=Math.min(position,plan().duration);update();
 status('Clip edit applied.','Preview and export use the same trimmed audio and fade envelope.');
}
function renderLanes(){
 const root=$('lane-labels');root.replaceChildren();const ruler=document.createElement('div');ruler.className='lane-ruler';ruler.textContent='TRACKS / BPM';root.append(ruler);
 tracks.forEach((track,index)=>{
  const row=document.createElement('div');row.className='playlist-lane'+(track.id===selected?' selected':'');row.dataset.id=track.id;row.style.setProperty('--track-color',colors[index%colors.length]);
  const title=document.createElement('button');title.className='lane-name';title.textContent=`${index+1}  ${track.file.name}`;title.title=track.file.name;title.onclick=()=>pick(track.id);
  const controls=document.createElement('div');controls.className='lane-tools';
  const input=document.createElement('input');input.type='number';input.min=30;input.max=300;input.step=.1;input.value=track.bpm||'';input.placeholder='—';input.setAttribute('aria-label',`Track ${index+1} original BPM`);input.disabled=busy;
  input.onchange=()=>{snapshot();stop();track.bpm=Number(input.value)||null;matched=null;status('Original BPM changed.','Match all songs again to apply it.');update(false);};
  const replace=document.createElement('button');replace.textContent='↺';replace.title='Replace song';replace.setAttribute('aria-label',`Replace track ${index+1}`);replace.disabled=busy;replace.onclick=()=>{replacing=track.id;$('replace-file').click();};
  const remove=document.createElement('button');remove.textContent='×';remove.title='Remove song';remove.setAttribute('aria-label',`Remove track ${index+1}`);remove.disabled=busy;remove.onclick=()=>{snapshot();stop();tracks.splice(tracks.indexOf(track),1);if(selected===track.id)selected=tracks[0]?.id||null;update();};
  const bpmLabel=document.createElement('label');bpmLabel.className='song-bpm-label';bpmLabel.append('ORIGINAL BPM',input);controls.append(bpmLabel,replace,remove);const info=document.createElement('small');info.textContent=`${fmt(clipBounds(track).duration)} · ${track.target?'Playing at '+track.target+' BPM':track.bpm?'Original tempo':'BPM not detected'}`;
  row.append(title,controls,info);root.append(row);
 });
 for(let i=tracks.length;i<rows();i++){const empty=document.createElement('div');empty.className='empty-lane';empty.textContent=i===tracks.length?'＋ Add song':'Track '+(i+1);empty.onclick=()=>$('add-files').click();root.append(empty);}
 const footer=document.createElement('div');footer.className='lane-footer';footer.textContent='TRANSITIONS';root.append(footer);
}
function update(render=true){
 const any=tracks.length>0;
 $('match').disabled=busy||!any;$('arrange').disabled=busy||tracks.length<2;$('export').disabled=busy||!any||matched!==tempo();$('play').disabled=busy||!any;$(…2212 tokens truncated…y+79-playlistGain(item,Math.min(item.end-1e-7,time))*67;if(n)c.lineTo(wx,wy);else c.moveTo(wx,wy);}c.stroke();c.restore();
  // Wide lower grips trim the audio; green upper grips control fade lengths.
  c.fillStyle=color;c.fillRect(x+1,y+56,7,24);c.fillRect(x+w-8,y+56,7,24);
  const fadeX=[x+item.fadeIn*px,x+w-item.fadeOut*px];
  c.fillStyle='#b5f1bf';for(const handleX of fadeX){c.fillRect(handleX-5,y+1,10,10);}
  if(t.id===selected){c.fillStyle='#c0cfdd';c.font='8px sans-serif';c.fillText(`IN ${fmt(item.trimIn,true)} · OUT ${fmt(item.trimOut,true)}`,x+10,y+78);}
 }
 c.fillStyle='#6c8c78';c.font='10px sans-serif';c.fillText('Green lines show each song’s transition envelope',15,RULER+rows()*ROW+28);
 const x=position*px;c.strokeStyle='#eff5ff';c.lineWidth=1.5;c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();c.fillStyle='#eff5ff';c.beginPath();c.moveTo(x-5,0);c.lineTo(x+5,0);c.lineTo(x,7);c.fill();$('position').textContent=fmt(position,true);canvas.setAttribute('aria-valuemax',String(p.duration));canvas.setAttribute('aria-valuenow',String(position));
}
$('add-songs').onclick=()=>$('add-files').click();$('add-files').onchange=e=>{void addFiles(e.target.files);e.target.value='';};$('replace-file').onchange=e=>{void addFiles(e.target.files,replacing);e.target.value='';};
$('match').onclick=match;$('arrange').onclick=()=>{snapshot();stop();arranged();};$('export').onclick=exportMix;$('play').onclick=()=>void play();$('stop').onclick=()=>stop(true);
$('mute').onchange=()=>{if(playback)playback.master.gain.setTargetAtTime($('mute').checked?0:1,ctx.currentTime,.015);};
$('tempo').onchange=()=>{snapshot();stop();if(!Number.isFinite(tempo())||tempo()<40||tempo()>240)$('tempo').value=120;matched=null;update();status('Session tempo changed.','Match all songs again before exporting.');};
$('fade').oninput=()=>{snapshot();stop();update();};$('zoom').onchange=draw;$('start').onchange=()=>{const track=chosen();if(!track)return;snapshot();stop();track.start=Math.max(0,Number($('start').value)||0);update();};
function locationAt(event){const rect=canvas.getBoundingClientRect();return {time:(event.clientX-rect.left)/px,row:Math.floor(((event.clientY-rect.top)*height()/rect.height-RULER)/ROW)};}
canvas.onpointerdown=e=>{
 if(busy)return;const at=locationAt(e),t=tracks[at.row];snapshot();stop();
 if(t){const item=plan().items.find(i=>i.id===t.id),localY=(e.clientY-canvas.getBoundingClientRect().top)*height()/canvas.getBoundingClientRect().height-(RULER+at.row*ROW+9);
  const left=t.start*px,right=item.end*px,point=at.time*px;
  let kind=null;
  if(localY>=-4&&localY<=22){const distances=[{kind:'fade-in',x:left+item.fadeIn*px},{kind:'fade-out',x:right-item.fadeOut*px}].sort((a,b)=>Math.abs(a.x-point)-Math.abs(b.x-point));if(Math.abs(distances[0].x-point)<=12)kind=distances[0].kind;}
  if(!kind&&localY>22){if(Math.abs(point-left)<=9)kind='trim-in';else if(Math.abs(point-right)<=9)kind='trim-out';}
  if(kind||(at.time>=t.start&&at.time<=item.end)){pick(t.id);drag={id:t.id,time:at.time,start:t.start,kind:kind||'move',track:{...t},end:item.end};canvas.setPointerCapture(e.pointerId);return;}
 }
 seek(at.time);
};
canvas.onpointermove=e=>{
 if(!drag)return;const track=tracks.find(t=>t.id===drag.id);let delta=locationAt(e).time-drag.time;if($('snap').checked)delta=Math.round(delta/beat())*beat();
 if(drag.kind==='move')track.start=Math.max(0,drag.start+delta);
 else if(drag.kind==='trim-in'||drag.kind==='trim-out')Object.assign(track,editClip(drag.track,drag.kind,delta));
 else {const time=locationAt(e).time;Object.assign(track,editClip(drag.track,drag.kind,drag.kind==='fade-in'?time-drag.start:drag.end-time));}
 syncEditor();draw();
};
const finishDrag=()=>{if(drag){drag=null;position=Math.min(position,plan().duration);update();}};
canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=finishDrag;
canvas.onkeydown=e=>{if(['Home','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();seek(e.key==='Home'?0:position+(e.key==='ArrowRight'?beat():-beat()));}};
for(const name of ['dragenter','dragover'])zone.addEventListener(name,e=>{e.preventDefault();if(!busy){e.dataTransfer.dropEffect='copy';zone.classList.add('drop-active');}});
zone.addEventListener('dragleave',e=>{if(!zone.contains(e.relatedTarget))zone.classList.remove('drop-active');});zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('drop-active');void addFiles(e.dataTransfer.files);});canvas.ondblclick=e=>{if(!busy&&!tracks[locationAt(e).row])$('add-files').click();};
window.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat&&!e.target.closest('input,button,select,textarea,summary')){e.preventDefault();void play();}});window.addEventListener('resize',draw);window.addEventListener('beforeunload',()=>stop());setInterval(()=>{if(playing){snapshot();if(position>=plan().duration)stop();draw();}},50);update();

$('clip-in').onchange=()=>{const t=chosen();if(t)applyEdit('trim-in',(Number($('clip-in').value)-clipBounds(t).trimIn)/clipBounds(t).rate);};
$('clip-out').onchange=()=>{const t=chosen();if(t)applyEdit('trim-out',(Number($('clip-out').value)-clipBounds(t).trimOut)/clipBounds(t).rate);};
$('clip-fade-in').onchange=()=>applyEdit('fade-in',Number($('clip-fade-in').value));
$('clip-fade-out').onchange=()=>applyEdit('fade-out',Number($('clip-fade-out').value));
$('reset-trim').onclick=()=>{const t=chosen();if(!t||busy)return;snapshot();stop();const b=clipBounds(t);t.start=Math.max(0,t.start-b.trimIn/b.rate);t.trimIn=0;t.trimOut=b.sourceDuration;update();};
$('auto-fades').onclick=()=>{const t=chosen();if(!t||busy)return;snapshot();stop();t.customFadeIn=null;t.customFadeOut=null;update();};
