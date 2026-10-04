import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {evaluatePilot,pilotHash} from './pilot.mjs';
import {summarizeReportEvaluation} from './report-evaluation.mjs';
const code=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(value);
const timestamp=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)&&Number.isFinite(Date.parse(value));
const requireValue=(condition,message)=>{if(!condition)throw Error(message);};
const unique=(rows,key)=>new Set(rows.map(row=>row[key])).size===rows.length;
export const evaluationContextHash=(row,key)=>pilotHash({id:row[key],participant:row.participant,day:row.day,observedAt:row.observedAt,provenance:row.provenance,recordHash:pilotHash(row.record)});
function checkPlan(plan,key,roster){
 requireValue(Array.isArray(plan)&&unique(plan,key)&&plan.every(row=>code(row[key])&&roster.includes(row.participant)),'invalid-evaluation-plan');
}
function checkRows(rows,plan,key){
 requireValue(Array.isArray(rows)&&unique(rows,key)&&rows.every(row=>plan.some(expected=>expected[key]===row[key]&&expected.participant===row.participant)),'unknown-or-duplicate-evaluation-row');
}
function inStudy(row,protocol){
 return timestamp(row.observedAt)&&new Intl.DateTimeFormat('en-CA',{timeZone:protocol.evaluation.timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(row.observedAt))===row.day&&row.day>=protocol.from&&row.day<=protocol.to
  && /^\d{4}-\d{2}-\d{2}$/.test(row.day)&&Number.isFinite(Date.parse(row.day))&&new Date(row.day).toISOString().slice(0,10)===row.day;
}
/** Recompute all indicators from raw inputs. This produces a review package,
 * never a signed validation report, scientific approval or TRL certificate. */
export function evaluatePilotPackage(input){
 const cohort=evaluatePilot(input.cohort),protocol=input.cohort.protocol,plan=protocol.evaluation;
 requireValue(plan?.version===1,'missing-evaluation-plan');
 requireValue(typeof plan.timeZone==='string'&&plan.timeZone.length>0,'missing-study-timezone');
 new Intl.DateTimeFormat('en',{timeZone:plan.timeZone});
 checkPlan(plan.reports,'caseId',protocol.participants);checkPlan(plan.latency,'trialId',protocol.participants);
 requireValue(plan.latency.every(row=>code(row.deviceCode)&&typeof row.modelVersion==='string'&&row.modelVersion.length>0&&row.modelVersion.length<=128),'invalid-latency-plan');
 const reports=input.reports??[],latency=input.latency??[];
 checkRows(reports,plan.reports,'caseId');checkRows(latency,plan.latency,'trialId');
 const reportRows=plan.reports.map(expected=>{
  const row=reports.find(value=>value.caseId===expected.caseId);const issues=[];
  if(!row)return {...expected,issues:['missing-report'],recordHash:null,approved:false};
  requireValue(row.record?.caseId===row.caseId&&!Object.hasOwn(row.record,'expectedStatus'),'invalid-pilot-report-record');
  if(!inStudy(row,protocol))issues.push('report-outside-study');
  if(row.provenance!=='observed')issues.push('report-not-observed');
  if(plan.reportDefinition!=='complete-professional-preparation-and-reviewed-units-v1')issues.push('unapproved-report-definition');
  const evaluation=summarizeReportEvaluation([row.record],row.review?[row.review]:[]),outcome=evaluation.outcomes[0];
  if(!outcome.accepted)issues.push('report-not-approved');
  if(row.review?.contextHash!==evaluationContextHash(row,'caseId'))issues.push('unverified-report-context');
  if(!outcome.paired)issues.push('missing-paired-preparation');
  if(!outcome.units)issues.push('missing-reviewed-units');
  if(!timestamp(row.review?.reviewedAt)||!timestamp(row.observedAt)||Date.parse(row.review.reviewedAt)<Date.parse(row.observedAt))issues.push('review-before-observation');
  return {...expected,issues,recordHash:pilotHash(row.record),reviewHash:row.review?pilotHash(row.review):null,approved:outcome.accepted,
   paired:outcome.paired,units:outcome.units};
 });
 const latencyRows=plan.latency.map(expected=>{
  const row=latency.find(value=>value.trialId===expected.trialId);const issues=[];
  if(!row)return {...expected,issues:['missing-latency-trial'],recordHash:null,durationMs:null};
  const record=row.record,review=row.review,recordHash=pilotHash(record??null);
  if(!inStudy(row,protocol))issues.push('latency-outside-study');
  if(row.provenance!=='observed')issues.push('latency-not-observed');
  if(plan.latencyDefinition!=='maximum-physical-input-to-effective-ui-v1'||record?.scope!=='physical-input-to-effective-ui-v1')issues.push('wrong-latency-scope');
  const events=record?.events;
  const traceValid=Array.isArray(events)&&events.length>=2&&events.length<=100&&unique(events,'stage')
   && events[0].stage==='input-acquired'&&events.at(-1).stage==='ui-effective'
   && code(record.clockId)&&code(record.deviceCode)&&typeof record.modelVersion==='string'&&record.modelVersion.length>0&&record.modelVersion.length<=128
   && Number.isFinite(record.resolutionMs)&&record.resolutionMs>0
   && events.every((event,i)=>['input-acquired','features-ready','decision-ready','ui-effective'].includes(event.stage)
    &&(i===0||['input-acquired','features-ready','decision-ready','ui-effective'].indexOf(event.stage)>['input-acquired','features-ready','decision-ready','ui-effective'].indexOf(events[i-1].stage))
    &&event.clockId===record.clockId&&Number.isFinite(event.monotonicMs)&&event.monotonicMs>=0&&(i===0||event.monotonicMs>=events[i-1].monotonicMs));
  if(!traceValid)issues.push('invalid-latency-trace');
  if(record?.deviceCode!==expected.deviceCode||record?.modelVersion!==expected.modelVersion)issues.push('unplanned-device-or-model');
  if(!review||!record||review.contextHash!==evaluationContextHash(row,'trialId')||review.recordHash!==recordHash||!code(review.reviewerCode)||review.accepted!==true||!timestamp(review.reviewedAt)
    ||!timestamp(row.observedAt)||Date.parse(review.reviewedAt)<Date.parse(row.observedAt))issues.push('unverified-latency-trace');
  const durationMs=traceValid?events.at(-1).monotonicMs-events[0].monotonicMs:null;
  return {...expected,issues,recordHash,reviewHash:review?pilotHash(review):null,durationMs,
   upperBoundMs:traceValid?durationMs+2*record.resolutionMs:null};
 });
 const reportsComplete=reportRows.length>0&&reportRows.every(row=>row.issues.length===0);
 const latencyComplete=latencyRows.length>0&&latencyRows.every(row=>row.issues.length===0);
 const sum=(key,field)=>reportRows.reduce((total,row)=>total+row[key][field],0);
 const measurements={meanAssistedPreparationSeconds:reportsComplete?sum('paired','assisted')/reportRows.length:null,
  preparationReduction:reportsComplete?1-sum('paired','assisted')/sum('paired','manual'):null,
  acceptedSynthesisFraction:reportsComplete?sum('units','accepted')/sum('units','total'):null,
  maxEndToEndLatencyUpperBoundMs:latencyComplete?Math.max(...latencyRows.map(row=>row.upperBoundMs)):null};
 const targets={...cohort.targets,underTenMinutes:reportsComplete?measurements.meanAssistedPreparationSeconds<600:null,
  atLeastHalfReduction:reportsComplete?measurements.preparationReduction>=.5:null,
  overSeventyPercentAutomation:reportsComplete?measurements.acceptedSynthesisFraction>.7:null,
  latencyUnderOneSecond:latencyComplete?measurements.maxEndToEndLatencyUpperBoundMs<1000:null};
 return {version:1,definition:'pilot-package-v1',inputHash:pilotHash(input),protocolHash:pilotHash(protocol),cohort,
  coverage:{reportsPlanned:reportRows.length,reportsComplete,latencyTrialsPlanned:latencyRows.length,latencyComplete},
  reports:reportRows,latency:latencyRows,measurements,targets,
  eligibleForIndependentReview:cohort.eligibleForPilotReview&&reportsComplete&&latencyComplete,
  allNumericTargetsMet:cohort.eligibleForPilotReview&&reportsComplete&&latencyComplete&&Object.values(targets).every(value=>value===true),
  validationStatus:'requires-independent-validation',
  limitations:['Provenance, completeness and approvals are declarations, not authenticated attestations.',
   'Observation timestamps must match their local study day in the protocol timezone; identity mappings remain separate.',
   'Missing, synthetic, unreviewed or out-of-scope report/latency evidence suppresses its aggregate metrics.',
   'Latency uses the maximum trial duration plus two timestamp-resolution margins; browser paint opportunities are not physical display measurements.',
   'This package does not establish efficacy, EEG interpretation, deployment acceptance, commercial operation or TRL 7.']};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [source,destination,...extra]=process.argv.slice(2);
 requireValue(source&&destination&&!extra.length,'Usage: node --experimental-strip-types scripts/evaluation/pilot-package.mjs input.json new-package.json');
 const output=evaluatePilotPackage(JSON.parse(await readFile(source,'utf8')));
 await writeFile(destination,JSON.stringify(output,null,2)+'\n',{flag:'wx',mode:0o600});
 console.log(`Evaluation package written; eligible for independent review: ${output.eligibleForIndependentReview}`);
}
