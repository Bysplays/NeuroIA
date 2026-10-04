import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRoundAdaptation} from '../src/services/roundAdaptation.ts';
import type {EvidenceEvent} from '../src/services/sessionEvidence.ts';
const make=(overrides={})=>createRoundAdaptation({exerciseId:'visual-scanning',level:5,mode:'normal',locked:false,...overrides});
const event=(patch:object)=>({sequence:0,activeMs:0,at:'2026-10-04T00:00:00.000Z',...patch} as EvidenceEvent);
function respond(controller:ReturnType<typeof make>,round:string,level:number,count=3){
 controller.begin(round);
 for(let i=0;i<count;i++){
  controller.observe(event({kind:'stimulus',stimulus:`${round}-${i}`,level,activeMs:i*1000}));
  controller.observe(event({kind:'response',stimulus:`${round}-${i}`,correct:false,final:true,latencyMs:1000,activeMs:(i+1)*1000}));
 }
 return controller.complete(round,'search-board',count*1000);
}
test('learned adjustment takes effect only when the next round explicitly starts',()=>{
 const c=make();const result=respond(c,'r1',5);assert.equal(result.decision.nextLevel,4);
 assert.equal(c.snapshot().config.level,5);assert.equal(c.snapshot().transitions[0].nextStarted,false);
 const next=c.begin('r2');assert.equal(next.level,4);assert.equal(c.snapshot().transitions[0].nextStarted,true);
 assert.equal(next.rounds,5);assert.equal(next.targets,9);assert.equal(next.contactSeconds,10);
 assert.throws(()=>{(next as {level:number}).level=9;},TypeError);
});
test('active opportunities and duplicate starts cannot resize an in-flight board',()=>{
 const c=make();c.begin('r1');c.observe(event({kind:'stimulus',stimulus:'q',level:5}));
 assert.throws(()=>c.complete('r1','search-board',1000),/not-ready/);assert.throws(()=>c.begin('r2'),/invalid-round-start/);
 c.observe(event({kind:'response',stimulus:'q',correct:false,final:false,latencyMs:1000,activeMs:1000}));assert.throws(()=>c.complete('r1','search-board',1000),/not-ready/);
 c.observe(event({kind:'cancel',stimulus:'q'}));c.complete('r1','search-board',1000);assert.throws(()=>c.begin('r1'),/invalid-round-start/);
});
test('boundary replay is idempotent, copies cannot mutate the audit and close blocks late events',()=>{
 const c=make(),first=respond(c,'r1',5);assert.deepEqual(c.complete('r1','search-board',5000),first);
 first.decision.nextLevel=9;assert.equal(c.snapshot().transitions[0].decision.nextLevel,4);
 assert.throws(()=>c.complete('r1','target',3000),/conflicting/);
 c.close();assert.throws(()=>c.begin('r2'),/invalid/);assert.throws(()=>c.observe(event({kind:'hint'})),/no-active/);assert.throws(()=>c.complete('r1','search-board',3000),/closed/);
});
test('assigned, manual, placement and practice contexts never change a level',()=>{
 for(const options of [{locked:true},{manualLevel:true},{mode:'placement' as const},{mode:'practice' as const}]){
  const c=make(options),transition=respond(c,'r1',5);assert.equal(transition.decision.action,0);assert.notEqual(transition.decision.reason,'policy');assert.equal(c.begin('r2').level,5);
 }
});
test('a changed level requires fresh response evidence instead of recycling the old failures',()=>{
 const c=make();respond(c,'r1',5);const next=respond(c,'r2',4,1);
 assert.equal(next.decision.reason,'insufficient-evidence');assert.equal(next.decision.nextLevel,4);
 assert.equal(c.snapshot().transitions[0].decision.application,'pending');
});
test('stimulus level must match the active immutable round config',()=>{
 const c=make();c.begin('r1');assert.throws(()=>c.observe(event({kind:'stimulus',stimulus:'q',level:6})),/level-mismatch/);
});

test('unmatched responses and a boundary from another game cannot advance the controller',()=>{
 const c=make();c.begin('r1');c.observe(event({kind:'stimulus',stimulus:'q',level:5}));
 assert.throws(()=>c.observe(event({kind:'response',stimulus:'other',correct:true,final:true,latencyMs:1000})),/opportunity-mismatch/);
 assert.throws(()=>c.complete('r1','search-board',1000),/not-ready/);
 c.observe(event({kind:'cancel',stimulus:'q'}));assert.throws(()=>c.complete('r1','contact-release',1000),/invalid-round-boundary/);
});
