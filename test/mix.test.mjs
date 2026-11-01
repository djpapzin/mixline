import {test} from 'node:test';import assert from 'node:assert/strict';import {transitionPlan,envelope,encodeWav} from '../web/mix.js';
test('transition is bounded by actual overlap and has equal-power endpoints',()=>{const p=transitionPlan(60,60,52,8);assert.equal(p.duration,112);assert.equal(envelope('a',52,p),1);assert.equal(envelope('b',52,p),0);assert.ok(Math.abs(envelope('a',56,p)**2+envelope('b',56,p)**2-1)<1e-10);assert.equal(envelope('a',60,p),0);assert.equal(envelope('b',60,p),1);assert.equal(transitionPlan(60,20,70,8).fade,0);assert.equal(transitionPlan(60,2,59,8).fade,1);});
test('WAV export interleaves stereo and normalizes excessive peaks',()=>{const wav=encodeWav({numberOfChannels:2,length:2,sampleRate:44100,getChannelData:n=>Float32Array.from(n?[1,-1]:[2,-2])});const v=new DataView(wav.data);assert.equal(v.getUint32(24,true),44100);assert.equal(v.getUint16(22,true),2);assert.equal(v.getUint32(40,true),8);assert.equal(wav.normalized,true);assert.ok(v.getInt16(44,true)>32000);assert.ok(v.getInt16(48,true)<-32000);});
import {clipBounds,editClip,playlistPlan,playlistGain,schedulePlaylist} from '../web/mix.js';
test('playlist supports many independent lanes and includes the last song in duration',()=>{
 const tracks=Array.from({length:12},(_,i)=>({id:i,start:i*8,buffer:{duration:16}}));
 const p=playlistPlan(tracks,8);assert.equal(p.items.length,12);assert.equal(p.duration,104);
 assert.equal(playlistGain(p.items[11],100),1);assert.equal(playlistGain(p.items[0],20),0);
 assert.ok(p.gain*2<=1);
 const shorter=playlistPlan(tracks.filter(t=>t.id!==11),8);assert.equal(shorter.duration,96);
});
test('scheduler renders every lane and seeks correctly into later songs',()=>{
 const tracks=Array.from({length:5},(_,i)=>({id:i,start:i*8,buffer:{duration:16}})),p=playlistPlan(tracks,8),started=[];
 const ctx={currentTime:0,createBufferSource(){return {connect(){},start(...a){started.push(a);}};},createGain(){return {connect(){},gain:{setValueCurveAtTime(curve,when,duration){assert.ok(curve.every(Number.isFinite));assert.ok(duration>0);}}};}};
 assert.equal(schedulePlaylist(ctx,p,0,{}).nodes.length,5);
 assert.equal(schedulePlaylist(ctx,p,33,{}).nodes.length,2);
 assert.deepEqual(started.at(-1),[.03,1,15]);
});

test('source trims remain stable across tempo changes',()=>{
 const t={start:3,rate:2,original:{duration:20},buffer:{duration:10},trimIn:4,trimOut:16};
 assert.equal(clipBounds(t).duration,6);assert.equal(clipBounds(t).sourceOffset,2);
 const slower=clipBounds({...t,rate:1,buffer:{duration:20}});assert.equal(slower.duration,12);assert.equal(slower.trimIn,4);
 const left=editClip(t,'trim-in',1);assert.equal(left.start,4);assert.equal(left.trimIn,6);assert.equal(t.trimIn,4);
 assert.equal(editClip(left,'trim-in',-100).start,1);
 const short=clipBounds(editClip(t,'trim-out',-100));assert.ok(short.duration>=.049999);
});
test('custom fades follow trimmed edges and can return to automatic overlap fades',()=>{
 const t={start:2,buffer:{duration:20},trimIn:3,trimOut:13,customFadeIn:2,customFadeOut:4};
 const p=playlistPlan([t],8),i=p.items[0];assert.equal(p.duration,12);assert.equal(i.fadeOutStart,8);
 assert.equal(playlistGain(i,2),0);assert.equal(playlistGain(i,6),1);assert.ok(Math.abs(playlistGain(i,10)-Math.SQRT1_2)<1e-10);
 assert.equal(playlistPlan([{...t,customFadeIn:100}],8).items[0].fadeIn,10);
 assert.equal(playlistPlan([{...t,customFadeIn:null,customFadeOut:null}],8).items[0].fadeOut,0);
});
test('trimmed scheduling limits source playback and retains offsets on seek',()=>{
 const p=playlistPlan([{start:5,rate:2,original:{duration:20},buffer:{duration:10},trimIn:4,trimOut:16}],0),calls=[];
 const ctx={currentTime:0,createBufferSource(){return {connect(){},start(...args){calls.push(args);}};},createGain(){return {connect(){},gain:{setValueCurveAtTime(c){assert.ok(c.every(Number.isFinite));}}};}};
 schedulePlaylist(ctx,p,0,{});assert.deepEqual(calls.pop(),[5.03,2,6]);
 schedulePlaylist(ctx,p,7,{});assert.deepEqual(calls.pop(),[.03,4,4]);
 assert.equal(schedulePlaylist(ctx,p,11,{}).nodes.length,0);
});
