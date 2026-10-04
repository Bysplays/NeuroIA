import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluatePilotPackage,evaluationContextHash} from '../scripts/evaluation/pilot-package.mjs';
import {pilotHash} from '../scripts/evaluation/pilot.mjs';
import {reviewTemplate} from '../scripts/evaluation/report-evaluation.mjs';
import {EXAMPLE_INPUT,EXAMPLE_RESPONSE} from '../vendor/openrouter/prompts.mjs';
import {calculateAdherence} from '../src/services/practiceSchedule.ts';
function fixture(){
 // Entirely synthetic fixture. 'observed' below tests the declared provenance gate,
 // and is never exported as evidence of a real participant or measurement.
 const revisions=[{version:1 as const,revision:1,timeZone:'UTC',effectiveFrom:'2026-10-01',createdAt:Date.parse('2026-09-30T00:00:00Z'),daysMask:127,dailyExercises:1}];
 const calendar={revisions,adherence:calculateAdherence(revisions,[],{asOf:Date.parse('2026-10-03T00:00:00Z'),complete:true,from:'2026-10-01',to:'2026-10-01'})};
 calendar.adherence.days[0].completed=1;calendar.adherence.days[0].met=true;
 const evidence={version:1,coverage:{complete:true},attempts:[{attempt:1,status:'completed',mode:'normal',resultSaved:true,issues:[],measurements:{responseCount:1}}]};
 const protocol={version:1,pilotCode:'fixture',provenance:'observed',approvedBy:'reviewer',approvedAt:'2026-09-30T00:00:00Z',from:'2026-10-01',to:'2026-10-01',participants:['p1'],registrationDefinition:'observed-completed-exercises-v1',adherenceDefinition:'planned-days-completed-exercises-v1',evaluation:{version:1,timeZone:'UTC',reports:[{caseId:'report1',participant:'p1'}],latency:[{trialId:'trial1',participant:'p1',deviceCode:'tablet',modelVersion:'fixture'}],reportDefinition:'complete-professional-preparation-and-reviewed-units-v1',latencyDefinition:'maximum-physical-input-to-effective-ui-v1'}};
 const record={caseId:'report1',criteria:['Grounded'],status:200,providerCalls:1,analysis:{narrative:EXAMPLE_RESPONSE,insights:EXAMPLE_INPUT}};
 const report={caseId:'report1',participant:'p1',day:'2026-10-01',observedAt:'2026-10-01T12:00:00Z',provenance:'observed',record,review:{...reviewTemplate(record),reviewerCode:'reviewer',reviewedAt:'2026-10-02T12:00:00Z',factuality:true,spanishClarity:true,usefulness:true,scopeAndLimitations:true,criteria:[{criterion:'Grounded',passed:true}],manualPreparationSeconds:1000,assistedPreparationSeconds:500,synthesisUnitsTotal:10,synthesisUnitsAcceptedWithoutEdit:8,contextHash:''}};
 report.review.contextHash=evaluationContextHash(report,'caseId');
 const latencyRecord={scope:'physical-input-to-effective-ui-v1',deviceCode:'tablet',clockId:'shared',resolutionMs:1,modelVersion:'fixture',events:[{stage:'input-acquired',clockId:'shared',monotonicMs:100},{stage:'ui-effective',clockId:'shared',monotonicMs:900}]};
 const trial={trialId:'trial1',participant:'p1',day:'2026-10-01',observedAt:'2026-10-01T12:00:00Z',provenance:'observed',record:latencyRecord,review:{recordHash:pilotHash(latencyRecord),contextHash:'',reviewerCode:'reviewer',reviewedAt:'2026-10-02T12:00:00Z',accepted:true}};
 trial.review.contextHash=evaluationContextHash(trial,'trialId');
 return {cohort:{protocol,register:[{sessionCode:'s1',participant:'p1',day:'2026-10-01',outcome:'completed',observerCode:'observer'}],participants:[{code:'p1',registerComplete:true,evidence,calendar,reconciliation:[{sessionCode:'s1',reviewerCode:'reviewer',archiveHash:pilotHash(evidence),attempt:1}]}]},reports:[report],latency:[trial]};
}
test('complete declared evidence is consolidated without issuing a signed or TRL acceptance',()=>{
 const result=evaluatePilotPackage(fixture());assert.equal(result.eligibleForIndependentReview,true);assert.equal(result.allNumericTargetsMet,true);
 assert.equal(result.measurements.meanAssistedPreparationSeconds,500);assert.equal(result.measurements.preparationReduction,.5);assert.equal(result.measurements.acceptedSynthesisFraction,.8);assert.equal(result.measurements.maxEndToEndLatencyUpperBoundMs,802);
 assert.equal(result.validationStatus,'requires-independent-validation');
});
test('missing planned cases suppress report metrics instead of measuring only successful reports',()=>{
 const input=fixture();input.cohort.protocol.evaluation.reports.push({caseId:'missing',participant:'p1'});
 const result=evaluatePilotPackage(input);assert.equal(result.coverage.reportsPlanned,2);assert.equal(result.measurements.meanAssistedPreparationSeconds,null);assert.equal(result.targets.overSeventyPercentAutomation,null);assert.equal(result.eligibleForIndependentReview,false);
});
test('synthetic reports and browser-only latency never qualify as observed end-to-end evidence',()=>{
 const input=fixture();input.reports[0].provenance='synthetic-live-provider';input.latency[0].record.scope='browser-paint-opportunity';
 const result=evaluatePilotPackage(input);assert.equal(result.measurements.acceptedSynthesisFraction,null);assert.equal(result.measurements.maxEndToEndLatencyUpperBoundMs,null);assert.equal(result.allNumericTargetsMet,false);
});
test('stale reviews, reassigned context and unapproved reports cannot enter cohort measurements',()=>{
 const input=fixture();input.reports[0].record.status=502;assert.throws(()=>evaluatePilotPackage(input),/stale-review/);
 const context=fixture();context.reports[0].observedAt='2026-10-01T13:00:00Z';assert.equal(evaluatePilotPackage(context).coverage.reportsComplete,false);
 const failed=fixture();failed.reports[0].review.factuality=false;assert.equal(evaluatePilotPackage(failed).measurements.preparationReduction,null);
 const late=fixture();late.latency[0].review.reviewedAt='2026-09-01T00:00:00Z';assert.equal(evaluatePilotPackage(late).targets.latencyUnderOneSecond,null);
});
test('incomparable clocks, reversed traces and missing trials cannot satisfy latency',()=>{
 for(const alter of [(r:any)=>{r.events[1].clockId='other';},(r:any)=>{r.events[1].monotonicMs=50;},(r:any)=>{r.events.pop();},(r:any)=>{r.resolutionMs=0;},(r:any)=>{r.events.splice(1,0,{stage:'decision-ready',clockId:'shared',monotonicMs:200},{stage:'features-ready',clockId:'shared',monotonicMs:300});}]){
  const input=fixture();alter(input.latency[0].record);const result=evaluatePilotPackage(input);assert.equal(result.measurements.maxEndToEndLatencyUpperBoundMs,null);
 }
 const input=fixture();input.cohort.protocol.evaluation.latency.push({trialId:'missing',participant:'p1',deviceCode:'tablet',modelVersion:'fixture'});assert.equal(evaluatePilotPackage(input).targets.latencyUnderOneSecond,null);
});
test('thresholds remain strict and include timestamp uncertainty rather than only average latency',()=>{
 const input=fixture();input.reports[0].review.assistedPreparationSeconds=600;input.reports[0].review.synthesisUnitsAcceptedWithoutEdit=7;
 input.latency[0].record.events[1].monotonicMs=1098;input.latency[0].review.recordHash=pilotHash(input.latency[0].record);input.latency[0].review.contextHash=evaluationContextHash(input.latency[0],'trialId');
 const result=evaluatePilotPackage(input);assert.equal(result.targets.underTenMinutes,false);assert.equal(result.targets.atLeastHalfReduction,false);assert.equal(result.targets.overSeventyPercentAutomation,false);assert.equal(result.measurements.maxEndToEndLatencyUpperBoundMs,1000);assert.equal(result.targets.latencyUnderOneSecond,false);
});
test('unknown, duplicate, out-of-period and unplanned inputs are rejected or kept incomplete',()=>{
 const unknown=fixture();unknown.reports[0].participant='stranger';assert.throws(()=>evaluatePilotPackage(unknown),/unknown/);
 const duplicate=fixture();duplicate.latency.push(duplicate.latency[0]);assert.throws(()=>evaluatePilotPackage(duplicate),/duplicate/);
 const out=fixture();out.latency[0].day='2026-10-02';assert.equal(evaluatePilotPackage(out).coverage.latencyComplete,false);
 const changed=fixture();changed.latency[0].record.modelVersion='other';assert.equal(evaluatePilotPackage(changed).coverage.latencyComplete,false);
 const empty=fixture();empty.reports=[];empty.latency=[];assert.equal(evaluatePilotPackage(empty).eligibleForIndependentReview,false);
});


test('observation timestamps must match study days and a synthetic cohort cannot pass the package gate',()=>{
 const outside=fixture();outside.latency[0].observedAt='2025-10-01T12:00:00Z';outside.latency[0].review.contextHash=evaluationContextHash(outside.latency[0],'trialId');assert.equal(evaluatePilotPackage(outside).coverage.latencyComplete,false);
 const input=fixture();input.cohort.protocol.provenance='synthetic';const result=evaluatePilotPackage(input);assert.equal(result.eligibleForIndependentReview,false);assert.equal(result.allNumericTargetsMet,false);
});
test('CLI recomputes raw evidence and refuses to overwrite its private review artifact',async()=>{
 const {mkdtemp,writeFile,readFile,rm,stat}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {spawnSync}=await import('node:child_process');
 const directory=await mkdtemp(join(tmpdir(),'neuroia-package-'));
 try{
  const source=join(directory,'input.json'),destination=join(directory,'package.json');const input=fixture();input.cohort.protocol.provenance='synthetic';
  await writeFile(source,JSON.stringify(input));
  const run=()=>spawnSync(process.execPath,['--experimental-strip-types','scripts/evaluation/pilot-package.mjs',source,destination],{encoding:'utf8'});
  assert.equal(run().status,0);const original=await readFile(destination,'utf8');assert.equal(JSON.parse(original).allNumericTargetsMet,false);
  assert.equal((await stat(destination)).mode&0o777,0o600);assert.notEqual(run().status,0);assert.equal(await readFile(destination,'utf8'),original);
 }finally{await rm(directory,{recursive:true,force:true});}
});

test('report units pool their denominators and latency keeps the worst planned trial',()=>{
 const input=fixture(),report=structuredClone(input.reports[0]);report.caseId='report2';report.record.caseId='report2';report.review.caseId='report2';
 report.review.manualPreparationSeconds=3000;report.review.assistedPreparationSeconds=300;report.review.synthesisUnitsTotal=90;report.review.synthesisUnitsAcceptedWithoutEdit=63;
 report.review.recordHash=pilotHash(report.record);report.review.contextHash=evaluationContextHash(report,'caseId');
 input.cohort.protocol.evaluation.reports.push({caseId:'report2',participant:'p1'});input.reports.push(report);
 const trial=structuredClone(input.latency[0]);trial.trialId='trial2';trial.record.events[1].monotonicMs=1100;trial.review.recordHash=pilotHash(trial.record);trial.review.contextHash=evaluationContextHash(trial,'trialId');
 input.cohort.protocol.evaluation.latency.push({trialId:'trial2',participant:'p1',deviceCode:'tablet',modelVersion:'fixture'});input.latency.push(trial);
 const result=evaluatePilotPackage(input);assert.equal(result.measurements.meanAssistedPreparationSeconds,400);assert.equal(result.measurements.preparationReduction,.8);assert.equal(result.measurements.acceptedSynthesisFraction,.71);assert.equal(result.measurements.maxEndToEndLatencyUpperBoundMs,1002);assert.equal(result.targets.latencyUnderOneSecond,false);
});
