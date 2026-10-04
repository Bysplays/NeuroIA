export interface SaveEvent {
  version:1;attemptId:string;resultId:string;mode:'normal'|'practice';
  status:'started'|'acknowledged'|'failed';elapsedMs:number;at:string;errorCategory:'none'|'network'|'permission'|'other';
}
export function validSaveEvent(value:unknown):value is SaveEvent {
  if(!value||typeof value!=='object')return false;
  const row=value as SaveEvent;
  return Object.keys(row).length===8 && row.version===1
    && typeof row.attemptId==='string'&&/^[a-zA-Z0-9_-]{1,128}$/.test(row.attemptId)
    && typeof row.resultId==='string'&&row.resultId.length>0&&row.resultId.length<=512
    && ['normal','practice'].includes(row.mode)&&['started','acknowledged','failed'].includes(row.status)
    && Number.isSafeInteger(row.elapsedMs)&&row.elapsedMs>=0
    && typeof row.at==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(row.at)&&Number.isFinite(Date.parse(row.at))&&new Date(row.at).toISOString()===row.at
    && ['none','network','permission','other'].includes(row.errorCategory)
    && (row.status==='started'?row.elapsedMs===0&&row.errorCategory==='none':row.status==='acknowledged'?row.errorCategory==='none':row.errorCategory!=='none');
}
export function saveErrorCategory(error:unknown):SaveEvent['errorCategory'] {
  const code=error&&typeof error==='object'&&'code' in error?String(error.code):'';
  if(['permission-denied','unauthenticated'].includes(code))return 'permission';
  if(['unavailable','deadline-exceeded','cancelled'].includes(code))return 'network';
  return 'other';
}

/** Failed transport can coexist with a stored result (lost acknowledgment). Never
 * infer data loss from an exception, or completion from a started-only attempt.
 */
export function summarizeSaveEvidence(records:unknown[],results:{id:string}[]) {
  const groups=new Map<string,unknown[]>();let malformed=0;
  for(const row of records){
    if(!row||typeof row!=='object'||!('attemptId' in row)||typeof row.attemptId!=='string'){malformed++;continue;}
    if(!validSaveEvent(row))malformed++;
    groups.set(row.attemptId,[...(groups.get(row.attemptId)??[]),row]);
  }
  const saved=new Map<string,Set<string>>();
  for(const result of results){const group=saved.get(result.id)??new Set();group.add(JSON.stringify(result));saved.set(result.id,group);}
  const resultOrdinals=new Map<string,number>();
  const attempts=[...groups.values()].map((raw,index)=>{
    const unique=new Map<string,SaveEvent>();const issues:string[]=[];
    for(const row of raw){
      if(!validSaveEvent(row)){issues.push('invalid-event');continue;}
      const previous=unique.get(row.status);
      if(previous&&JSON.stringify(Object.entries(previous).sort())!==JSON.stringify(Object.entries(row).sort()))issues.push('conflicting-event');
      else unique.set(row.status,row);
    }
    const start=unique.get('started'),ack=unique.get('acknowledged'),failure=unique.get('failed');
    if(!start)issues.push('missing-start');
    if(ack&&failure)issues.push('conflicting-outcome');
    if([...unique.values()].some(row=>row.resultId!==start?.resultId||row.mode!==start?.mode))issues.push('mixed-result');
    if(start&&!resultOrdinals.has(start.resultId))resultOrdinals.set(start.resultId,resultOrdinals.size+1);
    const terminal=ack??failure;
    const valid=!issues.length;
    return {attempt:index+1,result:valid?resultOrdinals.get(start!.resultId)!:null,mode:valid?start!.mode:null,
      status:valid?terminal?.status??'unfinished':'invalid',issues:[...new Set(issues)],
      elapsedMs:valid?terminal?.elapsedMs??null:null,errorCategory:valid?terminal?.errorCategory??null:null,
      resultInArchive:valid?saved.get(start!.resultId)?.size===1:null};
  });
  const normal=attempts.filter(row=>row.mode==='normal'&&row.status!=='invalid');
  const normalResults=new Set(normal.map(row=>row.result));
  const archived=new Set(normal.filter(row=>row.resultInArchive).map(row=>row.result));
  return {version:1,coverage:{documents:records.length,malformed,attempts:attempts.length},attempts,
    counts:{acknowledged:attempts.filter(row=>row.status==='acknowledged').length,failed:attempts.filter(row=>row.status==='failed').length,
      unfinished:attempts.filter(row=>row.status==='unfinished').length,invalid:attempts.filter(row=>row.status==='invalid').length,
      distinctNormalResultsAttempted:normalResults.size,distinctNormalResultsArchived:archived.size},
    limitations:['Son intentos de envío de resultados, no sesiones nuevas. Los reintentos no aumentan el número de partidas.',
      'Un fallo de envío puede haber ocurrido después de guardar el resultado; se contrasta con el archivo.',
      'Los eventos usan la misma cola: pueden faltar intentos nunca sincronizados o cerrados antes de registrar su desenlace.',
      'La confirmación corresponde al adaptador y puede incluir un resultado ya guardado por un intento anterior.',
      'El KPI de registro requiere el denominador independiente del piloto; no se demuestra con esta muestra.']};
}
