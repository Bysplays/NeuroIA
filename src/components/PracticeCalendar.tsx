import {useCallback,useEffect,useRef,useState} from 'react';
import {getFirestore} from 'firebase/firestore';
import {auth} from '../services/firebase';
import {practiceScheduleService} from '../services/practiceScheduleService';
import {loadPracticeAdherence} from '../services/practiceScheduleArchive';
import {EvidenceDownload} from './EvidenceExportButton';
const weekdays=[[1,'Lunes'],[2,'Martes'],[3,'Miércoles'],[4,'Jueves'],[5,'Viernes'],[6,'Sábado'],[0,'Domingo']] as const;
const date=(day:string)=>new Date(`${day}T12:00:00Z`).toLocaleDateString('es-ES',{timeZone:'UTC'});
export function PracticeCalendar({uid}:{uid:string}){return <AccountPracticeCalendar key={uid} uid={uid}/>;}
function AccountPracticeCalendar({uid}:{uid:string}) {
  const [data,setData]=useState<Awaited<ReturnType<typeof loadPracticeAdherence>>>();
  const [enabled,setEnabled]=useState(false),[busy,setBusy]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [daysMask,setDaysMask]=useState(0),[dailyExercises,setDailyExercises]=useState(3);
  const request=useRef<AbortController|null>(null);
  const pending=useRef<Parameters<typeof practiceScheduleService.update>[0]|null>(null);
  const owner=auth.currentUser?.uid===uid;
  const load=useCallback(async(signal:AbortSignal)=>{
    const caller=auth.currentUser?.uid;
    const status=await practiceScheduleService.status(signal);
    const next=await loadPracticeAdherence(getFirestore(auth.app),uid,status.serverNow,signal);
    signal.throwIfAborted();if(!caller||auth.currentUser?.uid!==caller)throw Error('account-changed');
    return {next,enabled:status.enabled};
  },[uid]);
  const apply=useCallback((loaded:Awaited<ReturnType<typeof load>>)=>{
    setData(loaded.next);setEnabled(loaded.enabled);
    const current=loaded.next.revisions.at(-1);setDaysMask(current?.daysMask??0);setDailyExercises(current?.dailyExercises??3);
  },[]);
  const refresh=useCallback(async()=>{
    request.current?.abort();const controller=new AbortController();request.current=controller;setBusy(true);setError('');
    try{apply(await load(controller.signal));}catch{if(!controller.signal.aborted)setError('No hemos podido consultar todo el calendario y la actividad.');}
    finally{if(!controller.signal.aborted)setBusy(false);}
  },[load,apply]);
  useEffect(()=>{
    const controller=new AbortController();request.current=controller;
    void load(controller.signal).then(apply).catch(()=>{if(!controller.signal.aborted)setError('No hemos podido consultar todo el calendario y la actividad.');})
      .finally(()=>{if(!controller.signal.aborted)setBusy(false);});
    return()=>{controller.abort();request.current?.abort();};
  },[load,apply]);
  const save=async(mask:number)=>{
    if(busy||!owner||!enabled||!data||data.adherence.coverage.issues.length)return;
    const current=data.revisions.at(-1);
    const body={baseRevision:current?.revision??0,timeZone:current?.timeZone??Intl.DateTimeFormat().resolvedOptions().timeZone,daysMask:mask,dailyExercises};
    if(!pending.current||Object.entries(body).some(([key,value])=>pending.current![key as keyof typeof body]!==value))pending.current={...body,operationId:crypto.randomUUID()};
    const controller=new AbortController();request.current=controller;setBusy(true);setError('');setNotice('');
    try{await practiceScheduleService.update(pending.current,controller.signal);const loaded=await load(controller.signal);apply(loaded);pending.current=null;setNotice(`Cambio guardado desde el ${date(loaded.next.revisions.at(-1)!.effectiveFrom)}.`);}
    catch(failure){if(!controller.signal.aborted)setError(failure instanceof Error&&'code' in failure&&failure.code==='billing/request-failed'?failure.message:'No hemos podido confirmar el cambio. Puedes reintentarlo o actualizar el calendario.');}
    finally{if(!controller.signal.aborted)setBusy(false);}
  };
  const current=data?.revisions.at(-1),summary=data?.adherence;
  const exportData=async(signal:AbortSignal)=>{
    const caller=auth.currentUser?.uid;
    const status=await practiceScheduleService.status(signal);
    const result=await loadPracticeAdherence(getFirestore(auth.app),uid,status.serverNow,signal);
    signal.throwIfAborted();if(!caller||auth.currentUser?.uid!==caller)throw Error('account-changed');return result;
  };
  return <section className="stats-card practice-calendar"><h2>{owner?'Tu calendario de práctica':'Calendario de práctica'}</h2>
    <p>{owner?'Elige qué días quieres practicar y cuántos ejercicios completar. No cambia tus niveles ni las propuestas de tu profesional.':'Calendario elegido por esta persona. Puedes consultar su cumplimiento, sin modificarlo.'}</p>
    {busy&&!data&&<p role="status">Consultando calendario y actividad…</p>}
    {summary&&<><p className="practice-calendar-summary">{summary.ratio===null?'Todavía no hay un porcentaje verificable.':`${summary.metDays} de ${summary.plannedDays} días previstos cumplidos · ${Math.round(summary.ratio*100)} %`}</p>
      <p>Cuenta desde el inicio del calendario, solo días ya terminados y partidas sincronizadas. No aplica los filtros de actividad.</p></>}
    {current&&<p>Último cambio: desde el {date(current.effectiveFrom)} · {current.timeZone}{current.daysMask===0?' · Calendario en pausa':''}.</p>}
    {owner&&data&&<fieldset disabled={busy||!enabled||!!summary?.coverage.issues.length}><legend>Días y ejercicios que eliges</legend>
      <div className="practice-calendar-days">{weekdays.map(([day,label])=><label key={day}><input type="checkbox" checked={Boolean(daysMask&(1<<day))} onChange={()=>setDaysMask(value=>value^(1<<day))}/>{label}</label>)}</div>
      <label className="practice-calendar-target">Ejercicios por día previsto<select value={dailyExercises} onChange={event=>setDailyExercises(Number(event.target.value))}>{[1,2,3,4,5,6,7,8].map(value=><option key={value} value={value}>{value}</option>)}</select></label>
      <div className="activity-assistant-actions"><button className="stats-quiet-button" disabled={!daysMask} onClick={()=>void save(daysMask)}>{busy?'Guardando…':'Guardar calendario'}</button>{current&&current.daysMask!==0&&<button className="stats-quiet-button" onClick={()=>void save(0)}>Pausar desde mañana</button>}</div>
      {!enabled&&<p>Los cambios de calendario todavía no están disponibles.</p>}
    </fieldset>}
    <p className="soft-label">Los cambios empiezan mañana. Un día se cumple al completar los ejercicios elegidos; hacer más otro día no compensa una ausencia. Este calendario es una elección personal.</p>
    {error&&<div><p role="alert">{error}</p><button className="stats-quiet-button" onClick={()=>void refresh()} disabled={busy}>Actualizar calendario</button></div>}
    {!!summary?.coverage.issues.length&&<div><p role="alert">No hemos podido comprobar todas las versiones y partidas del calendario.</p><button className="stats-quiet-button" disabled={busy} onClick={()=>void refresh()}>Actualizar calendario</button></div>}
    {notice&&<p role="status">{notice}</p>}
    {data&&<EvidenceDownload uid={uid} load={exportData} label="Exportar calendario y cumplimiento" description="Incluye todas las versiones del calendario, los días previstos y la cobertura de la actividad, sin nombres ni identificadores de cuenta." filename="neuroia-calendario.json"/>}
  </section>;
}
