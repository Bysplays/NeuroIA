import {useEffect,useRef,useState} from 'react';
import {getFirestore} from 'firebase/firestore';
import {auth} from '../services/firebase';
import {loadEvidenceExport} from '../services/evidenceArchive';
import {responseMetrics} from '../services/responseMetrics';
import {getExerciseById} from '../services/exerciseCatalog';
import type {ExerciseId} from '../types';
const number=new Intl.NumberFormat('es-ES',{maximumFractionDigits:2});
export function ResponseMetrics({uid}:{uid:string}){return <AccountResponseMetrics key={uid} uid={uid}/>;}
function AccountResponseMetrics({uid}:{uid:string}){
  const [data,setData]=useState<ReturnType<typeof responseMetrics>>();
  const [busy,setBusy]=useState(false),[error,setError]=useState(false);
  const request=useRef<AbortController|null>(null);
  useEffect(()=>()=>request.current?.abort(),[]);
  const load=async()=>{
    if(request.current)return;
    const controller=new AbortController();request.current=controller;const caller=auth.currentUser?.uid;
    setBusy(true);setError(false);setData(undefined);
    try{
      const archive=await loadEvidenceExport(getFirestore(auth.app),uid,controller.signal);
      controller.signal.throwIfAborted();if(!caller||auth.currentUser?.uid!==caller)throw Error('account-changed');
      setData(responseMetrics(archive));
    }catch{if(!controller.signal.aborted)setError(true);}
    finally{if(request.current===controller)request.current=null;if(!controller.signal.aborted)setBusy(false);}
  };
  return <section className="stats-card response-metrics"><h2>Respuestas medidas</h2>
    <p>Tiempos entre una oportunidad de respuesta y la respuesta registrada, sin las pausas. No equivalen a la velocidad media ni a una medición clínica del tiempo de reacción.</p>
    <p>Incluye todo el archivo de partidas normales completadas y vinculadas a registros válidos, agrupadas por juego y nivel. No aplica los filtros de actividad.</p>
    <button className="stats-quiet-button" disabled={busy} onClick={()=>void load()}>{busy?'Consultando respuestas…':data?'Actualizar respuestas medidas':'Consultar respuestas medidas'}</button>
    {error&&<p role="alert">No hemos podido consultar todos los registros. Vuelve a intentarlo.</p>}
    {data&&<>
      <p role="status">{!data.complete?'Archivo incompleto: no se muestran totales.':data.rows.length?`Partidas con medidas verificables: ${data.rows.reduce((sum,row)=>sum+row.sessions,0)}.`:'No hay partidas con medidas verificables.'} {data.excluded} intentos excluidos · {data.malformed} documentos no válidos.</p>
      <div className="response-metrics-list">{data.rows.map(row=><article key={`${row.exercise}:${row.level}`}>
        <h3>{getExerciseById(row.exercise as ExerciseId)?.title??row.exercise} · Nivel {row.level}</h3>
        <dl><div><dt>Partidas</dt><dd>{row.sessions}</dd></div><div><dt>Respuestas</dt><dd>{row.responses}</dd></div><div><dt>Tiempo medio por respuesta</dt><dd>{row.meanResponseMs===null?'Sin respuestas discretas':`${number.format(row.meanResponseMs/1000)} s`}</dd></div><div><dt>Intentos incorrectos</dt><dd>{row.errors}</dd></div><div><dt>Ayudas abiertas</dt><dd>{row.hints}</dd></div>
        {row.selections>0&&<div><dt>Selecciones previas</dt><dd>{row.selections}</dd></div>}
        {row.contactRatio!==null&&<div><dt>Tiempo de seguimiento en contacto</dt><dd>{number.format(row.contactRatio*100)} % de {number.format(row.trackingMs/1000)} s</dd></div>}</dl>
      </article>)}</div>
      <p>Se excluyen pruebas iniciales, prácticas, intentos sin terminar, registros inválidos y partidas sin enlace confirmado. Las partidas antiguas pueden no tener medidas. Las ayudas cuentan aperturas durante una oportunidad activa. El tiempo empieza de nuevo tras cada intento incorrecto o selección previa; en parejas, la primera carta se registra como selección y la segunda como respuesta.</p>
    </>}
  </section>;
}
