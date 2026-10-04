import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluatePilot,pilotHash} from '../scripts/evaluation/pilot.mjs';
import {calculateAdherence} from '../src/services/practiceSchedule.ts';
import type {ExerciseResult} from '../src/types/index.ts';
function fixture(count=20,registered=19){
 const revisions=[{version:1 as const,revision:1,timeZone:'UTC',effectiveFrom:'2026-10-01',createdAt:Date.parse('2026-09-30T12:00:00Z'),daysMask:127,dailyExercises:1}];
 const results=Array.from({length:3},(_,i)=>({id:`r${i}`,exerciseId:'motor-target',date:`2026-10-0${i+1}`,totalQuestions:1,correctAnswers:1,durationSeconds:1} as ExerciseResult));
 const calendar={revisions,adherence:calculateAdherence(revisions,results,{asOf:Date.parse('2026-10-06T12:00:00Z'),complete:true})};
 const evidence={version:1,coverage:{complete:true},attempts:Array.from({length:registered},(_,i)=>({attempt:i+1,status:'completed',mode:'normal',resultSaved:true,issues:[],measurements:{responseCount:1}}))};
 const register=Array.from({length:count},(_,i)=>({sessionCode:`s${i}`,participant:'p1',day:'2026-10-01',outcome:'completed',observerCode:'observer'}));
 return {protocol:{version:1,pilotCode:'test',provenance:'synthetic',approvedBy:'reviewer',approvedAt:'2026-09-30T00:00:00Z',from:'2026-10-01',to:'2026-10-05',participants:['p1'],registrationDefinition:'observed-completed-exercises-v1',adherenceDefinition:'planned-days-completed-exercises-v1'},register,participants:[{code:'p1',registerComplete:true,evidence,calendar,reconciliation:register.map((row,i)=>({sessionCode:row.sessionCode,reviewerCode:'reviewer',archiveHash:pilotHash(evidence),attempt:i<registered?i+1:null}))}]};
}
test('strict thresholds use independent observed sessions and planned days; synthetic is not accepted pilot evidence',()=>{
 const result=evaluatePilot(fixture());assert.equal(result.measurements.registrationFraction,.95);assert.equal(result.targets.registrationOver95,false);assert.equal(result.measurements.pooledAdherenceFraction,.6);assert.equal(result.targets.adherenceOver60,false);assert.equal(result.eligibleForPilotReview,false);
 assert.equal(evaluatePilot(fixture(21,20)).targets.registrationOver95,true);
});
test('unreviewed, missing participants and unfinished observation suppress cohort percentages',()=>{
 const input=fixture();input.participants[0].reconciliation.pop();assert.equal(evaluatePilot(input).measurements.registrationFraction,null);
 const second=fixture();second.protocol.participants.push('p2');const result=evaluatePilot(second);assert.equal(result.measurements.registrationFraction,null);assert.equal(result.measurements.pooledAdherenceFraction,null);
 const third=fixture();third.participants[0].registerComplete=false;assert.equal(evaluatePilot(third).measurements.registrationFraction,null);
});
test('stale exports, duplicate links and unknown observed sessions cannot produce passing reconciliation',()=>{
 const input=fixture();input.participants[0].evidence.attempts[0].resultSaved=false;assert.throws(()=>evaluatePilot(input),/stale/);
 const second=fixture();second.participants[0].reconciliation[1].attempt=1;assert.throws(()=>evaluatePilot(second),/duplicate/);
 const third=fixture();third.register[0].outcome='unknown';third.participants[0].reconciliation.shift();assert.equal(evaluatePilot(third).measurements.registrationFraction,null);
});
test('calendar denominator is reconstructed from immutable revisions and the study interval',()=>{
 const input=fixture();input.participants[0].calendar.adherence.days.pop();assert.equal(evaluatePilot(input).measurements.pooledAdherenceFraction,null);
 const second=fixture();second.participants[0].calendar.adherence.days[0].met=false;assert.throws(()=>evaluatePilot(second),/calendar-days/);
 const third=fixture();third.protocol.from='2026-10-02';third.register.forEach(row=>row.day='2026-10-02');assert.equal(evaluatePilot(third).measurements.pooledAdherenceFraction,.5);
});
test('observed provenance still requires prospective protocol approval and complete evidence',()=>{
 const input=fixture();input.protocol.provenance='observed';assert.equal(evaluatePilot(input).eligibleForPilotReview,true);
 input.protocol.approvedAt='2026-10-07T00:00:00Z';assert.equal(evaluatePilot(input).eligibleForPilotReview,false);
 input.participants[0].evidence.coverage.complete=false;input.participants[0].reconciliation.forEach(row=>row.archiveHash=pilotHash(input.participants[0].evidence));assert.equal(evaluatePilot(input).measurements.registrationFraction,null);
});
test('CLI writes a review artifact and refuses to overwrite it or accept the empty template',async()=>{
 const {mkdtemp,writeFile,readFile,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {spawnSync}=await import('node:child_process');
 const dir=await mkdtemp(join(tmpdir(),'neuroia-pilot-'));
 const run=(...args:string[])=>spawnSync(process.execPath,['--experimental-strip-types','scripts/evaluation/pilot.mjs',...args],{encoding:'utf8'});
 try{
  const input=join(dir,'input.json'),output=join(dir,'summary.json'),template=join(dir,'empty.json');await writeFile(input,JSON.stringify(fixture()));
  assert.equal(run(input,output).status,0);const before=await readFile(output,'utf8');assert.equal(JSON.parse(before).measurements.registrationFraction,.95);
  assert.notEqual(run(input,output).status,0);assert.equal(await readFile(output,'utf8'),before);
  assert.equal(run('--template',template).status,0);assert.notEqual(run(template,join(dir,'invalid.json')).status,0);
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('cohort adherence pools planned days instead of averaging participant percentages',()=>{
 const input=fixture(),other=fixture();const participant=other.participants[0];participant.code='p2';
 const revision=participant.calendar.revisions[0];revision.createdAt=Date.parse('2026-10-03T12:00:00Z');revision.effectiveFrom='2026-10-04';
 participant.calendar.adherence=calculateAdherence([revision],[],{asOf:Date.parse('2026-10-06T12:00:00Z'),complete:true});
 participant.reconciliation.forEach(row=>row.sessionCode=`second-${row.sessionCode}`);
 other.register.forEach(row=>{row.sessionCode=`second-${row.sessionCode}`;row.participant='p2';});
 input.protocol.participants.push('p2');input.participants.push(participant);input.register.push(...other.register);
 const result=evaluatePilot(input);assert.equal(result.measurements.plannedDays,7);assert.equal(result.measurements.metDays,3);assert.equal(result.measurements.pooledAdherenceFraction,3/7);
});
