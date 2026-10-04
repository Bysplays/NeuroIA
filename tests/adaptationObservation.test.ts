import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSessionEvidence} from '../src/services/sessionEvidence.ts';
import {museFeatureFrame} from '../src/services/museFeatures.ts';
import {gameConfig} from '../src/services/difficulty.ts';
import {decideAdaptation} from '../src/services/adaptivePolicy.ts';
test('the three-question entry level can progress instead of being permanently ineligible',()=>{
  let now=0;const recorder=createSessionEvidence({sessionId:'entry',exerciseId:'language-naming',activeNow:()=>now,sink:()=>{}});
  recorder.start(1,'normal',false);
  for(let i=0;i<gameConfig(1,'normal').rounds;i++){recorder.present(`q${i}`,1);now+=1000;recorder.respond(true);}
  const decision=decideAdaptation(recorder.observation(),{locked:false,mode:'normal',baseLevel:1});
  assert.equal(decision.reason,'policy');assert.equal(decision.nextLevel,2);
});
test('observation uses actual active responses and masks absent EEG',()=>{
  let now=0;const recorder=createSessionEvidence({sessionId:'a',exerciseId:'language-naming',activeNow:()=>now,sink:()=>{}});
  recorder.start(5,'normal',false);
  for(let i=0;i<8;i++){recorder.present(`q${i}`,5);now+=i<4 ? 100 : 400;recorder.respond(i<4);}
  const observation=recorder.observation();
  assert.equal(observation.eligible,true);assert.equal(observation.vector.length,40);
  assert.equal(observation.vector[9],1);assert.equal(observation.vector[10],1);
  assert.equal(observation.vector[11],1);assert.deepEqual(observation.vector.slice(16),Array(24).fill(0));
});
test('independent channel calibration requires valid baseline and recent windows and expires',()=>{
  let now=0;const recorder=createSessionEvidence({sessionId:'a',exerciseId:'memory-path',activeNow:()=>now,sink:()=>{}});
  recorder.start(3,'normal',false);
  const wave=(hz:number)=>Array.from({length:256},(_,i)=>20*Math.sin(2*Math.PI*hz*i/256));
  for(let i=0;i<10;i++){now+=1000;recorder.eeg(museFeatureFrame(i,[wave(i<5?10:20),wave(5),undefined,wave(35)]));}
  const vector=recorder.observation().vector;
  assert.deepEqual(vector.slice(36),[1,1,0,1]);
  assert.ok(vector[18]<-.9);assert.ok(vector[19]>.9);
  assert.ok(Math.abs(vector[21])<1e-9);
  now+=4000;assert.deepEqual(recorder.observation().vector.slice(16),Array(24).fill(0));
});
test('tracking eligibility comes from measured windows and a terminal partial window is included',()=>{
  let now=0;const recorder=createSessionEvidence({sessionId:'a',exerciseId:'motor-tracking',activeNow:()=>now,sink:()=>{}});
  recorder.start(2,'normal',false);
  for(let i=0;i<35;i++){now+=100;recorder.track(100,i<20);}
  recorder.finish('r');const observation=recorder.observation();
  assert.equal(observation.eligible,true);assert.equal(observation.vector[13],0);
  assert.equal(observation.vector[14],2000/3500);assert.equal(observation.vector[15],1);
});
test('changing task level resets performance comparisons but preserves the independent EEG baseline',async()=>{
 const {createAdaptationObservation}=await import('../src/services/adaptationObservation.ts');
 const observation=createAdaptationObservation('visual-scanning');observation.beginLevel(5);
 const wave=(hz:number)=>Array.from({length:256},(_,i)=>20*Math.sin(2*Math.PI*hz*i/256));
 for(let i=0;i<10;i++)observation.add({kind:'eeg',sequence:i,activeMs:(i+1)*1000,at:'2026-10-04T00:00:00.000Z',frame:museFeatureFrame(i,[wave(i<5?10:20),wave(5),undefined,wave(35)])});
 for(let i=0;i<3;i++)observation.add({kind:'response',sequence:10+i,activeMs:10000,at:'2026-10-04T00:00:00.000Z',stimulus:`q${i}`,correct:false,final:true,latencyMs:1000});
 const before=observation.snapshot(10000);assert.equal(before.eligible,true);
 observation.beginLevel(4);const after=observation.snapshot(10000);
 assert.equal(after.eligible,false);assert.equal(after.level,4);assert.deepEqual(after.vector.slice(9,16),Array(7).fill(0));assert.deepEqual(after.vector.slice(16),before.vector.slice(16));
});
