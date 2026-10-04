import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {calculateAdherence} from '../../src/services/practiceSchedule.ts';
export const pilotHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const code=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(value);
const day=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
const requireValue=(condition,message)=>{if(!condition)throw Error(message);};
const unique=(rows,key)=>new Set(rows.map(row=>row[key])).size===rows.length;
/** The independent observer register supplies the denominator. Archive counts
 * cannot create expected sessions. Hashes bind manual reconciliation to one export. */
export function evaluatePilot(input){
 const {protocol,register,participants}=input;
 requireValue(protocol?.version===1&&code(protocol.pilotCode)&&['synthetic','observed'].includes(protocol.provenance),'invalid-protocol');
 requireValue(day(protocol.from)&&day(protocol.to)&&protocol.from<=protocol.to,'invalid-period');
 requireValue(Array.isArray(protocol.participants)&&protocol.participants.length>0&&protocol.participants.every(code)&&new Set(protocol.participants).size===protocol.participants.length,'invalid-roster');
 requireValue(Array.isArray(register)&&unique(register,'sessionCode'),'duplicate-or-invalid-register');
 requireValue(Array.isArray(participants)&&unique(participants,'code')&&participants.every(row=>protocol.participants.includes(row.code)),'duplicate-or-unknown-participant');
 for(const row of register)requireValue(code(row.sessionCode)&&protocol.participants.includes(row.participant)&&day(row.day)&&row.day>=protocol.from&&row.day<=protocol.to&&['completed','abandoned','not-attended','unknown'].includes(row.outcome)&&code(row.observerCode),'invalid-observer-record');
 const approved=code(protocol.approvedBy)&&typeof protocol.approvedAt==='string'&&Number.isFinite(Date.parse(protocol.approvedAt))&&Date.parse(protocol.approvedAt)<=Date.parse(protocol.from);
 const rows=protocol.participants.map(participant=>{
  const data=participants.find(row=>row.code===participant),sessions=register.filter(row=>row.participant===participant),completed=sessions.filter(row=>row.outcome==='completed');
  const issues=[];let registered=0;const used=new Set();
  if(protocol.registrationDefinition!=='observed-completed-exercises-v1')issues.push('unapproved-registration-definition');
  if(!data||data.registerComplete!==true)issues.push('observer-register-not-confirmed-complete');
  if(sessions.some(row=>row.outcome==='unknown'))issues.push('unknown-session-outcome');
  const archive=data?.evidence,hash=archive?pilotHash(archive):null;
  if(!archive||archive.version!==1||archive.coverage?.complete!==true||!Array.isArray(archive.attempts))issues.push('incomplete-evidence-export');
  const reviews=data?.reconciliation??[];
  requireValue(Array.isArray(reviews)&&unique(reviews,'sessionCode')&&reviews.every(row=>completed.some(session=>session.sessionCode===row.sessionCode)),'invalid-reconciliation-sessions');
  for(const session of completed){
   const review=reviews.find(row=>row.sessionCode===session.sessionCode);
   if(!review){issues.push('unreviewed-completion');continue;}
   requireValue(code(review.reviewerCode)&&review.archiveHash===hash&&hash!==null,'stale-or-unattributed-reconciliation');
   if(review.attempt===null)continue; // An explicitly reviewed missing result remains in the denominator.
   requireValue(Number.isSafeInteger(review.attempt)&&review.attempt>0&&!used.has(review.attempt),'duplicate-or-invalid-attempt-link');used.add(review.attempt);
   const matches=archive.attempts.filter(attempt=>attempt.attempt===review.attempt);
   requireValue(matches.length===1,'unknown-or-ambiguous-attempt');
   const attempt=matches[0];
   if(attempt.status==='completed'&&attempt.mode==='normal'&&attempt.resultSaved===true&&attempt.measurements&&Array.isArray(attempt.issues)&&attempt.issues.length===0)registered++;
  }
  const calendar=data?.calendar,adherence=calendar?.adherence,adherenceIssues=[];
  if(protocol.adherenceDefinition!=='planned-days-completed-exercises-v1')adherenceIssues.push('unapproved-adherence-definition');
  if(!adherence||adherence.definition!==protocol.adherenceDefinition||adherence.coverage?.complete!==true||!Array.isArray(adherence.coverage?.issues)||adherence.coverage.issues.length||!Array.isArray(adherence.days))adherenceIssues.push('incomplete-calendar');
  let planned=0,met=0;
  if(!adherenceIssues.length){
   const days=adherence.days;
   requireValue(unique(days,'day')&&days.every(row=>day(row.day)&&Number.isSafeInteger(row.required)&&row.required>0&&Number.isSafeInteger(row.completed)&&row.completed>=0&&typeof row.met==='boolean'&&row.met===(row.completed>=row.required)),'invalid-calendar-days');
   let observedDay;
   try{observedDay=new Intl.DateTimeFormat('en-CA',{timeZone:adherence.timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(adherence.asOf));}catch{adherenceIssues.push('invalid-calendar-clock');}
   if(!observedDay||observedDay<=protocol.to)adherenceIssues.push('calendar-period-not-finished');
   const selected=days.filter(row=>row.day>=protocol.from&&row.day<=protocol.to).sort((a,b)=>a.day.localeCompare(b.day));
   const expected=calculateAdherence(calendar.revisions??[],[],{asOf:adherence.asOf,complete:true,from:protocol.from,to:protocol.to});
   if(expected.coverage.issues.length||expected.timeZone!==adherence.timeZone||expected.days.length!==selected.length||expected.days.some((row,i)=>row.day!==selected[i]?.day||row.required!==selected[i]?.required||row.revision!==selected[i]?.revision))adherenceIssues.push('calendar-denominator-mismatch');
   planned=selected.length;met=selected.filter(row=>row.met).length;
   if(!planned)adherenceIssues.push('no-planned-days');
  }
  return {participant,completed:completed.length,registered:issues.length?null:registered,registrationIssues:[...new Set(issues)],plannedDays:adherenceIssues.length?null:planned,metDays:adherenceIssues.length?null:met,adherenceIssues:[...new Set(adherenceIssues)],evidenceHash:hash,calendarHash:calendar?pilotHash(calendar):null};
 });
 const registrationComplete=rows.every(row=>!row.registrationIssues.length),adherenceComplete=rows.every(row=>!row.adherenceIssues.length);
 const completed=rows.reduce((n,row)=>n+row.completed,0),registered=rows.reduce((n,row)=>n+(row.registered??0),0),planned=rows.reduce((n,row)=>n+(row.plannedDays??0),0),met=rows.reduce((n,row)=>n+(row.metDays??0),0);
 const registration=registrationComplete&&completed?registered/completed:null,adherence=adherenceComplete&&planned?met/planned:null;
 return {version:1,definition:'pilot-reconciliation-v1',inputHash:pilotHash(input),protocolHash:pilotHash(protocol),provenance:protocol.provenance,protocolApproved:approved,participants:rows,
  measurements:{completedObserved:completed,registered:registrationComplete?registered:null,registrationFraction:registration,plannedDays:adherenceComplete?planned:null,metDays:adherenceComplete?met:null,pooledAdherenceFraction:adherence},
  targets:{registrationOver95:registration===null?null:registration>.95,adherenceOver60:adherence===null?null:adherence>.60},
  eligibleForPilotReview:approved&&protocol.provenance==='observed'&&registration!==null&&adherence!==null,
  limitations:['Observer completeness and protocol approval are declarations requiring independent verification.','Export ordinals change between downloads: reconcile only against the exact hashed export.','Adherence is pooled by planned days, not an unweighted mean of participant percentages.','Calendar days are personal planned practice, not clinical adherence.','No automatic TRL, efficacy, hardware, report-quality or latency acceptance is inferred.','Pseudonymous codes are not a claim of anonymity; keep identity mappings separately.']};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [source,destination,...extra]=process.argv.slice(2);
 if(!source||!destination||extra.length)throw Error('Usage: node --experimental-strip-types scripts/evaluation/pilot.mjs input.json new-summary.json');
 if(source==='--template'){
  await writeFile(destination,JSON.stringify({protocol:{version:1,pilotCode:null,provenance:'synthetic',approvedBy:null,approvedAt:null,from:null,to:null,participants:[],registrationDefinition:'observed-completed-exercises-v1',adherenceDefinition:'planned-days-completed-exercises-v1'},register:[],participants:[]},null,2)+'\n',{flag:'wx'});
 }else{
 const input=JSON.parse(await readFile(source,'utf8'));const summary=evaluatePilot(input);
 await writeFile(destination,JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
 console.log(`Pilot reconciliation written; eligible for review: ${summary.eligibleForPilotReview}`);
 }
}
