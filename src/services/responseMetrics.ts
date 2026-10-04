import type {buildEvidenceExport} from './evidenceExport.ts';
type EvidenceExport=ReturnType<typeof buildEvidenceExport>;
/** Aggregate comparable game/level groups only; weight response times by actual
 * response count, never by sessions. Incomplete archives provide no totals. */
export function responseMetrics(data:EvidenceExport){
  const groups=new Map<string,{exercise:string;level:number;sessions:number;responses:number;errors:number;hints:number;selections:number;latencyTotal:number;trackingMs:number;contactMs:number}>();
  let excluded=0;
  for(const attempt of data.attempts){
    if(attempt.status!=='completed'||!attempt.resultSaved||attempt.mode!=='normal'||!attempt.exercise||!attempt.level||!attempt.measurements){excluded++;continue;}
    const m=attempt.measurements,key=`${attempt.exercise}:${attempt.level}`;
    const group=groups.get(key)??{exercise:attempt.exercise,level:attempt.level,sessions:0,responses:0,errors:0,hints:0,selections:0,latencyTotal:0,trackingMs:0,contactMs:0};
    group.sessions++;group.responses+=m.responseCount;group.errors+=m.errors;group.hints+=m.hints;group.selections+=m.selections;
    group.latencyTotal+=(m.meanResponseMs??0)*m.responseCount;group.trackingMs+=m.trackingMs;group.contactMs+=m.contactMs;groups.set(key,group);
  }
  return {complete:data.coverage.complete,excluded,malformed:data.coverage.malformedDocuments,
    rows:data.coverage.complete?[...groups.values()].sort((a,b)=>a.exercise.localeCompare(b.exercise)||a.level-b.level).map(({latencyTotal,...group})=>({...group,meanResponseMs:group.responses?latencyTotal/group.responses:null,contactRatio:group.trackingMs?group.contactMs/group.trackingMs:null})):[]};
}
