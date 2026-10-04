import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSessionEvidence,readEvidenceChunk,type EvidenceChunk} from '../src/services/sessionEvidence.ts';
import {decideAdaptation} from '../src/services/adaptivePolicy.ts';
import {summarizeEvidence} from '../src/services/evidenceSummary.ts';
import {buildEvidenceExport} from '../src/services/evidenceExport.ts';
import type {ExerciseResult} from '../src/types/index.ts';
function fixture(){
 let now=0;const chunks:EvidenceChunk[]=[];
 const r=createSessionEvidence({sessionId:'round-evidence',exerciseId:'visual-scanning',activeNow:()=>now,sink:c=>chunks.push(c)});
 r.start(5,'normal',false);r.roundStart('first',5);
 for(let i=0;i<3;i++){r.present(`a${i}`,5);now+=1000;r.respond(false);}
 const first=decideAdaptation(r.prepareRoundDecision(),{locked:false,mode:'normal',baseLevel:5});r.roundDecision('first','search-board',first);
 r.roundStart('second',first.nextLevel);r.present('b',first.nextLevel);now+=500;r.respond(true);
 const second=decideAdaptation(r.prepareRoundDecision(),{locked:false,mode:'normal',baseLevel:first.nextLevel});r.roundDecision('second','search-board',second);r.finish('result');
 return {chunks,first,second};
}
function change(chunks:EvidenceChunk[],kind:string,edit:(event:any)=>void){
 const copy=structuredClone(chunks);const chunk=copy.find(c=>JSON.parse(c.events).some((e:any)=>e.kind===kind))!;
 const events=JSON.parse(chunk.events);edit(events.find((e:any)=>e.kind===kind));chunk.events=JSON.stringify(events);return copy;
}
test('round audits replay actual observations, next-start application and level-specific metrics across chunks',()=>{
 const {chunks,first}=fixture();const summary=summarizeEvidence([...chunks].reverse().concat(chunks));
 assert.equal(summary.status,'completed');assert.equal(summary.rounds?.length,2);assert.equal(summary.rounds?.[0].nextStarted,true);assert.equal(summary.rounds?.[1].nextStarted,false);
 assert.equal(summary.rounds?.[0].decision?.nextLevel,first.nextLevel);assert.equal(summary.rounds?.[1].decision?.reason,'insufficient-evidence');assert.equal(summary.metrics?.responseCount,4);
 const result={id:'result',exerciseId:'visual-scanning',evidenceSessionId:'round-evidence'} as ExerciseResult;
 const exported=buildEvidenceExport(chunks,[result],true);assert.equal(exported.attempts[0].rounds?.[0].round,1);assert.equal(JSON.stringify(exported).includes('"first"'),false);
});
test('independently valid policy output cannot be substituted for a different observed response sequence',()=>{
 const {chunks}=fixture();const altered=change(chunks,'response',event=>{event.correct=true;});
 const summary=summarizeEvidence(altered);assert.ok(summary.issues.includes('round-observation-mismatch'));assert.equal(summary.metrics,null);assert.equal(summary.rounds,null);
});
test('level jumps, unfinished rounds and mismatched round identities invalidate the trace',()=>{
 const {chunks}=fixture();assert.equal(summarizeEvidence(change(chunks,'round-start',event=>event.level=9)).status,'invalid');
 assert.ok(summarizeEvidence(change(chunks,'round-decision',event=>event.round='unknown')).issues.includes('invalid-round-decision'));
 const missing=chunks.filter(c=>!JSON.parse(c.events).some((e:any)=>e.kind==='round-decision'&&e.round==='second'));
 assert.equal(summarizeEvidence(missing).status,'invalid');
});
test('round boundary kind and server application outcomes cannot be forged inside local decision events',()=>{
 const {chunks}=fixture();
 for(const data of [change(chunks,'round-decision',event=>event.boundary='target'),change(chunks,'round-decision',event=>{const decision=JSON.parse(event.decision);decision.application='applied';event.decision=JSON.stringify(decision);})]){
  assert.ok(data.some(chunk=>readEvidenceChunk(chunk).length===0));assert.equal(summarizeEvidence(data).status,'invalid');
 }
});
test('preparing a tracking boundary flushes the last partial window before inference',()=>{
 let now=0;const chunks:EvidenceChunk[]=[];
 const r=createSessionEvidence({sessionId:'tracking-round',exerciseId:'motor-tracking',activeNow:()=>now,sink:c=>chunks.push(c)});
 r.start(2,'normal',false);r.roundStart('contact',2);
 for(let i=0;i<35;i++){now+=100;r.track(100,i<20);}
 const observation=r.prepareRoundDecision();assert.equal(observation.vector[14],2000/3500);
 r.roundDecision('contact','contact-release',decideAdaptation(observation,{locked:false,mode:'normal',baseLevel:2}));r.finish('tracking-result');
 assert.equal(summarizeEvidence(chunks).status,'completed');assert.equal(summarizeEvidence(chunks).metrics?.trackingMs,3500);
});
