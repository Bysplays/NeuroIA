import {ALL_EXERCISES} from './exerciseCatalog.ts';
import type {ExerciseResult} from '../types/index.ts';
export interface PracticeScheduleRevision {
  version:1;revision:number;timeZone:string;effectiveFrom:string;createdAt:number;daysMask:number;dailyExercises:number;
}
const dayPattern=/^\d{4}-\d{2}-\d{2}$/;
export function validScheduleDay(day:unknown):day is string {
  return typeof day==='string'&&dayPattern.test(day)&&Number.isFinite(Date.parse(day))&&new Date(day).toISOString().slice(0,10)===day;
}
export function scheduleDay(at:number,timeZone:string) {
  const parts=new Intl.DateTimeFormat('en',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(at));
  return ['year','month','day'].map(type=>parts.find(part=>part.type===type)!.value).join('-');
}
export function nextScheduleDay(day:string) {return new Date(Date.parse(day)+86400000).toISOString().slice(0,10);}
export function validScheduleChoices(value:{timeZone?:unknown;daysMask?:unknown;dailyExercises?:unknown}) {
  if(typeof value.timeZone!=='string'||!value.timeZone.length||value.timeZone.length>80||!Number.isInteger(value.daysMask)||Number(value.daysMask)<0||Number(value.daysMask)>127
    ||!Number.isInteger(value.dailyExercises)||Number(value.dailyExercises)<1||Number(value.dailyExercises)>8)return false;
  try{scheduleDay(0,value.timeZone);return true;}catch{return false;}
}
export function validScheduleRevision(value:unknown):value is PracticeScheduleRevision {
  if(!value||typeof value!=='object')return false;
  const row=value as PracticeScheduleRevision;
  return Object.keys(row).length===7&&row.version===1&&Number.isSafeInteger(row.revision)&&row.revision>=1&&Number.isSafeInteger(row.createdAt)&&row.createdAt>=0&&Number.isFinite(new Date(row.createdAt).getTime())
    && validScheduleChoices(row)&&validScheduleDay(row.effectiveFrom)&&row.effectiveFrom===nextScheduleDay(scheduleDay(row.createdAt,row.timeZone));
}
/** A prospective, caller-chosen practice calendar, not a clinical prescription.
 * Count fully elapsed planned days meeting a target of completed active exercises.
 * Extra exercise completions never compensate another missed calendar day.
 */
export function calculateAdherence(raw:unknown[],results:ExerciseResult[],options:{asOf:number;complete:boolean;from?:string;to?:string}) {
  if(!Number.isFinite(options.asOf)||!Number.isFinite(new Date(options.asOf).getTime())||options.from&&!validScheduleDay(options.from)||options.to&&!validScheduleDay(options.to)||options.from&&options.to&&options.from>options.to)throw Error('invalid-adherence-period');
  const revisions=new Map<number,PracticeScheduleRevision>();const issues:string[]=[];
  for(const row of raw){
    if(!validScheduleRevision(row)){issues.push('invalid-revision');continue;}
    const previous=revisions.get(row.revision);
    if(previous&&Object.keys(previous).some(key=>previous[key as keyof PracticeScheduleRevision]!==row[key as keyof PracticeScheduleRevision]))issues.push('conflicting-revision');
    else revisions.set(row.revision,row);
  }
  const ordered=[...revisions.values()].sort((a,b)=>a.revision-b.revision);
  ordered.forEach((row,i)=>{if(row.revision!==i+1)issues.push('missing-revision');if(i&&(row.timeZone!==ordered[0].timeZone||row.createdAt<ordered[i-1].createdAt||row.effectiveFrom<ordered[i-1].effectiveFrom))issues.push('invalid-revision-order');if(row.createdAt>options.asOf)issues.push('future-revision');});
  const timeZone=ordered[0]?.timeZone;
  const today=timeZone?scheduleDay(options.asOf,timeZone):null;
  const counts=new Map<string,number>();let excludedResults=0,conflictingResults=0;
  const groups=new Map<string,ExerciseResult[]>();
  for(const result of results){if(!result||typeof result.id!=='string'){excludedResults++;continue;}groups.set(result.id,[...(groups.get(result.id)??[]),result]);}
  for(const group of groups.values()){
    const result=group[0];
    if(group.some(row=>JSON.stringify(Object.entries(row).sort())!==JSON.stringify(Object.entries(result).sort()))){conflictingResults++;continue;}
    if(!timeZone||result.practice||!ALL_EXERCISES.some(game=>game.id===result.exerciseId)||!Number.isInteger(result.totalQuestions)||result.totalQuestions<=0
      ||!Number.isInteger(result.correctAnswers)||result.correctAnswers<0||result.correctAnswers>result.totalQuestions||!Number.isFinite(result.durationSeconds)||result.durationSeconds<0){excludedResults++;continue;}
    const legacy=validScheduleDay(result.date);
    const instant=typeof result.date==='string'&&/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(result.date)?Date.parse(result.date):NaN;
    if(!legacy&&(!Number.isFinite(instant)||instant>options.asOf)){excludedResults++;continue;}
    const day=legacy?result.date:scheduleDay(instant,timeZone);
    if(today&&day>=today){excludedResults++;continue;}
    counts.set(day,(counts.get(day)??0)+1);
  }
  if(conflictingResults)issues.push('conflicting-results');
  const days:{day:string;revision:number;required:number;completed:number;met:boolean|null}[]=[];
  if(!issues.length&&timeZone&&today){
    let day=ordered[0].effectiveFrom;
    if(options.from&&options.from>day)day=options.from;
    const end=options.to&&options.to<today?nextScheduleDay(options.to):today;
    // Never silently truncate a long study. Require an explicit smaller interval.
    if((Date.parse(end)-Date.parse(day))/86400000>3660)throw Error('adherence-period-too-large');
    let index=0;
    for(;day<end;day=nextScheduleDay(day)){
      while(index+1<ordered.length&&ordered[index+1].effectiveFrom<=day)index++;
      const revision=ordered[index];
      if(revision.effectiveFrom>day||!(revision.daysMask&(1<<new Date(day).getUTCDay())))continue;
      const completed=counts.get(day)??0;
      days.push({day,revision:revision.revision,required:revision.dailyExercises,completed,met:options.complete?completed>=revision.dailyExercises:null});
    }
  }
  const eligible=options.complete&&!issues.length;
  const met=days.filter(day=>day.met).length;
  return {version:1,definition:'planned-days-completed-exercises-v1',timeZone,asOf:options.asOf,
    coverage:{complete:options.complete,revisions:ordered.length,excludedResults,conflictingResults,issues:[...new Set(issues)]},
    plannedDays:issues.length?null:days.length,metDays:eligible?met:null,ratio:eligible&&days.length?met/days.length:null,days,
    limitations:['Cuenta días previstos ya terminados; el día de hoy aún no entra en el denominador.',
      'Un día se cumple al completar los ejercicios elegidos; repetir más otro día no compensa una ausencia.',
      'Es un calendario de práctica elegido por la persona, no una pauta profesional ni una medida de eficacia.',
      'Las partidas son datos declarados por el cliente. La cobertura parcial o contradictoria no produce un porcentaje.',
      'Cambiar o pausar el calendario solo afecta al día siguiente; no modifica días anteriores.']};
}
