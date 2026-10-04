import {validReportEvent,type ReportEvent} from './reportLifecycle.ts';
export interface ServerReportRecord {
  version:1;attemptId:string;clientAttemptId?:string;status:'started'|'generated'|'failed'|'cancelled';
  startedAt:number;model:string;finishedAt?:number;durationMs?:number;httpStatus?:number;stage?:string;promptVersion?:string;
}
const identifier=(value:unknown):value is string=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,128}$/.test(value);
function serverRecord(value:unknown):value is ServerReportRecord {
  if(!value||typeof value!=='object')return false;
  const row=value as ServerReportRecord;
  return Object.keys(row).every(key=>['version','attemptId','clientAttemptId','status','startedAt','model','finishedAt','durationMs','httpStatus','stage','promptVersion'].includes(key))
    && row.version===1 && identifier(row.attemptId) && (row.clientAttemptId===undefined||identifier(row.clientAttemptId))
    && ['started','generated','failed','cancelled'].includes(row.status) && Number.isFinite(row.startedAt)
    && typeof row.model==='string'&&row.model.length>0&&row.model.length<=200
    && (row.promptVersion===undefined||typeof row.promptVersion==='string'&&row.promptVersion.length<=100)
    && (row.status==='started' ? row.finishedAt===undefined&&row.durationMs===undefined&&row.httpStatus===undefined&&row.stage===undefined
      : Number.isFinite(row.finishedAt)&&Number.isSafeInteger(row.durationMs)&&row.durationMs!>=0&&Number.isInteger(row.httpStatus)
        && (row.status!=='generated'||row.httpStatus===200&&row.stage==='complete') && row.httpStatus!>=100&&row.httpStatus!<=599&&['source','quota','provider','validation','authorization','complete'].includes(row.stage??''));
}
const same=(a:object,b:object)=>JSON.stringify(Object.entries(a).sort())===JSON.stringify(Object.entries(b).sort());
/** Full archive audit: malformed/conflicting records stay in coverage, never in KPI numerators.
 * Correlation uses the explicit random client ID; never wall-clock proximity.
 */
export function buildReportEvidenceExport(client:unknown[],server:unknown[]) {
  const groups=new Map<string,unknown[]>();let malformedClient=0,malformedServer=0;
  for(const value of client){
    const id=value&&typeof value==='object'&&'attemptId' in value?value.attemptId:undefined;
    if(!identifier(id)){malformedClient++;continue;}
    if(!validReportEvent(value))malformedClient++;
    groups.set(id,[...(groups.get(id)??[]),value]);
  }
  const serverById=new Map<string,ServerReportRecord>();const conflicts=new Set<string>();
  for(const row of server){
    if(!serverRecord(row)){malformedServer++;continue;}
    const previous=serverById.get(row.attemptId);
    if(previous&&!same(previous,row))conflicts.add(row.attemptId);
    else serverById.set(row.attemptId,row);
  }
  const claimed=new Set<string>();
  const attempts=[...groups].map(([id,raw],index)=>{
    const issues:string[]=[];const events=new Map<number,ReportEvent>();
    for(const row of raw){
      if(!validReportEvent(row)){issues.push('invalid-event');continue;}
      const previous=events.get(row.sequence);
      if(previous&&!same(previous,row))issues.push('conflicting-sequence');else events.set(row.sequence,row);
    }
    const ordered=[...events.values()].sort((a,b)=>a.sequence-b.sequence);const source=ordered[0]?.source;
    ordered.forEach((row,i)=>{
      const previous=ordered[i-1];
      if(row.sequence!==i||row.source!==source)issues.push('missing-or-mixed-sequence');
      if(i===0){if(row.phase!=='started')issues.push('missing-start');return;}
      if(row.elapsedMs<previous.elapsedMs||['failed','cancelled','download-requested'].includes(previous.phase))issues.push('invalid-order');
      const expected=row.phase==='ai-ready'?(source==='ai'?'started':null):row.phase==='pdf-ready'?(source==='ai'?'ai-ready':'started'):row.phase==='download-requested'?'pdf-ready':null;
      if(row.phase==='started'||(!['failed','cancelled'].includes(row.phase)&&previous.phase!==expected))issues.push('invalid-transition');
    });
    if(!ordered.length)issues.push('missing-events');
    const matched=[...serverById.values()].filter(row=>row.clientAttemptId===id);
    matched.forEach(row=>claimed.add(row.attemptId));
    let correlation:'matched'|'absent'|'ambiguous'|'not-applicable'=source==='template'?'not-applicable':matched.length===1?'matched':matched.length?'ambiguous':'absent';
    if(matched.some(row=>conflicts.has(row.attemptId)) || source==='template'&&matched.length)correlation='ambiguous';
    const last=ordered.at(-1);
    const status=issues.length?'invalid':last&&['download-requested','failed','cancelled'].includes(last.phase)?last.phase:'unfinished';
    const backend=correlation==='matched'?matched[0]:null;
    const consistent=backend && status!=='invalid' && (!ordered.some(row=>row.phase==='ai-ready')||backend.status==='generated');
    return {attempt:index+1,source:source??null,status,issues:[...new Set(issues)],correlation,
      server:backend?{status:backend.status,durationMs:backend.durationMs??null,stage:backend.stage??null,model:backend.model,promptVersion:backend.promptVersion??null}:null,
      consistent:backend?Boolean(consistent):null,
      phases:status==='invalid'?null:ordered.map(row=>({phase:row.phase,elapsedMs:row.elapsedMs})),
    };
  });
  return {version:1,coverage:{clientDocuments:client.length,serverDocuments:server.length,malformedClient,malformedServer,conflictingServerAttempts:conflicts.size,
      clientAttempts:attempts.length,serverAttempts:serverById.size,unlinkedServerAttempts:[...serverById.keys()].filter(id=>!claimed.has(id)).length},attempts,
    unlinkedServer:[...serverById.values()].filter(row=>!claimed.has(row.attemptId)).map((row,index)=>({attempt:index+1,status:conflicts.has(row.attemptId)?'invalid':row.status,durationMs:conflicts.has(row.attemptId)?null:row.durationMs??null,model:row.model})),
    counts:{downloadRequested:attempts.filter(row=>row.status==='download-requested').length,
      failed:attempts.filter(row=>row.status==='failed').length,cancelled:attempts.filter(row=>row.status==='cancelled').length,
      unfinished:attempts.filter(row=>row.status==='unfinished').length,invalid:attempts.filter(row=>row.status==='invalid').length,
      correlatedAiDownloads:attempts.filter(row=>row.source==='ai'&&row.status==='download-requested'&&row.consistent).length},
    limitations:['La descarga solicitada no confirma guardado en disco ni revisión profesional.',
      'Solo registros sincronizados; pueden faltar eventos de cierres abruptos, sin conexión o anteriores a la instrumentación.',
      'No se correlacionan por fecha: registros antiguos o repetidos pueden no tener una correspondencia única.',
      'La paginación no es una instantánea atómica. Las discrepancias pueden requerir una nueva exportación.',
      'Estas duraciones no miden preparación profesional ni demuestran por sí solas automatización o calidad.']};
}
