export type ReportPhase='started'|'ai-ready'|'pdf-ready'|'download-requested'|'failed'|'cancelled';
export interface ReportEvent {
  version:1; attemptId:string; sequence:number; phase:ReportPhase;
  source:'ai'|'template'; elapsedMs:number; at:string;
}
const phases=['started','ai-ready','pdf-ready','download-requested','failed','cancelled'];
export function validReportEvent(value:unknown):value is ReportEvent {
  if(!value || typeof value!=='object')return false;
  const e=value as ReportEvent;
  return Object.keys(e).length===7 && e.version===1 && typeof e.attemptId==='string'
    && /^[a-zA-Z0-9_-]{1,128}$/.test(e.attemptId) && Number.isInteger(e.sequence) && e.sequence>=0 && e.sequence<=4
    && phases.includes(e.phase) && ['ai','template'].includes(e.source)
    && Number.isSafeInteger(e.elapsedMs) && e.elapsedMs>=0 && e.elapsedMs<=86400000
    && typeof e.at==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(e.at) && Number.isFinite(Date.parse(e.at)) && new Date(e.at).toISOString()===e.at
    && (e.sequence===0 ? e.phase==='started' && e.elapsedMs===0 : e.phase!=='started');
}
/** Wall duration of preparing a report, not game active time or human preparation.
 * Browser download APIs acknowledge a request, never a successful disk write.
 */
export function createReportLifecycle(options:{attemptId:string;source:'ai'|'template';sink:(event:ReportEvent)=>void;now?:()=>number;wall?:()=>string}) {
  const now=options.now??(()=>performance.now()),wall=options.wall??(()=>new Date().toISOString());
  const started=now();let sequence=0,last:ReportPhase|undefined,terminal=false;
  const emit=(phase:ReportPhase)=>{
    if(terminal)return;
    if(phase==='started' && last!==undefined || phase==='ai-ready' && (last!=='started'||options.source!=='ai')
      || phase==='pdf-ready' && last!==(options.source==='ai'?'ai-ready':'started') || phase==='download-requested' && last!=='pdf-ready')throw Error('invalid-report-transition');
    const event:ReportEvent={version:1,attemptId:options.attemptId,sequence,phase,source:options.source,elapsedMs:sequence===0?0:Math.round(now()-started),at:wall()};
    if(!validReportEvent(event))throw Error('invalid-report-event');
    // Account teardown can close the sink before a child unmounts. Do not write
    // into a replacement account or turn an observational failure into a PDF error.
    try{options.sink(event);}catch{terminal=true;return;}
    sequence++;last=phase;terminal=['download-requested','failed','cancelled'].includes(phase);
  };
  emit('started');
  return {emit};
}
