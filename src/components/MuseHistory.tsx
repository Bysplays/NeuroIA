import {useEffect,useMemo,useState} from 'react';
import {getFirestore} from 'firebase/firestore';
import {auth} from '../services/firebase';
import {loadSessionEvidence} from '../services/evidenceArchive';
import {createMuseBaseline} from '../services/museBaseline';
import {MUSE_CHANNELS,type MuseFeatureFrame} from '../services/museFeatures';
import {MuseChannels} from './MuseChannels';
import type {ExerciseResult} from '../types';

export function MuseHistory({uid,result}:{uid:string;result:ExerciseResult}) {
  return <AccountMuseHistory key={`${uid}:${result.id}:${result.evidenceSessionId}`} uid={uid} result={result}/>;
}
function AccountMuseHistory({uid,result}:{uid:string;result:ExerciseResult}) {
  const [response,setResponse]=useState<Awaited<ReturnType<typeof loadSessionEvidence>>>();
  const [error,setError]=useState(false),[retry,setRetry]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    loadSessionEvidence(getFirestore(auth.app),uid,result.evidenceSessionId!,controller.signal).then(value=>{
      if(!controller.signal.aborted){setResponse(value);setError(false);}
    },()=>{if(!controller.signal.aborted)setError(true);});
    return()=>controller.abort();
  },[uid,result.evidenceSessionId,retry]);
  const valid=response?.status==='completed' && response.resultId===result.id && response.exerciseId===result.exerciseId;
  const samples=useMemo(()=>valid ? response.events.flatMap(event=>event.kind==='eeg'?[{activeMs:event.activeMs,frame:event.frame}]:[]) : [],[response,valid]);
  return <section className="stats-card"><h2>EEG · cuatro canales</h2>
    {!response&&!error ? <p role="status">Cargando el registro de la partida…</p> : error||!valid ? <div><p role="alert">No está disponible el registro completo de esta partida.</p><button className="stats-quiet-button" onClick={()=>{setError(false);setResponse(undefined);setRetry(n=>n+1);}}>Reintentar</button></div>
      : samples.length ? <MuseHistoryView samples={samples}/> : <p>No se guardaron muestras de los cuatro canales en esta partida.</p>}
  </section>;
}
export function MuseHistoryView({samples}:{samples:{activeMs:number;frame:MuseFeatureFrame}[]}) {
  const [index,setIndex]=useState(()=>samples.length-1);
  const selected=Math.min(Math.max(0,index),samples.length-1);
  const sample=samples[selected];
  const baselines=useMemo(()=>{
    const baseline=createMuseBaseline();
    return samples.map(sample=>{baseline.add(sample.frame,sample.activeMs);return baseline.snapshot(sample.activeMs);});
  },[samples]);
  const start=Math.floor(selected/60)*60;
  const window=samples.slice(start,start+60);
  if(!sample)return <p>Sin muestras EEG.</p>;
  return <>
    <p className="muse-explanation">Amplitud y potencia por electrodo. Los cambios se comparan con las primeras cinco ventanas válidas de esta partida. No representan atención, fatiga ni relajación.</p>
    <label className="muse-history-position">Muestra {selected+1} de {samples.length} · {(sample.activeMs/1000).toLocaleString('es-ES')} s de juego activo
      <input type="range" aria-label="Muestra EEG" min={0} max={Math.max(0,samples.length-1)} step={1} value={selected} onChange={event=>setIndex(Number(event.target.value))}/>
    </label>
    <div className="muse-history-plots">{MUSE_CHANNELS.map((channel,c)=>{
      const max=Math.max(1,...window.map(sample=>sample.frame.channels[c].rms??0))*1.1;
      const first=window[0].activeMs,last=window.at(-1)!.activeMs;
      const x=(at:number)=>30+(at-first)/Math.max(1,last-first)*500;
      const y=(rms:number)=>100-rms/max*80;
      const path=window.map((sample,i)=>{
        const rms=sample.frame.channels[c].rms;if(rms===null)return '';
        const previous=window[i-1];const join=previous && previous.frame.channels[c].rms!==null && sample.activeMs-previous.activeMs<=3000;
        return `${join?'L':'M'}${x(sample.activeMs)},${y(rms)}`;
      }).join(' ');
      return <figure key={channel}><figcaption>{channel} · µV RMS</figcaption><svg viewBox="0 0 560 130" role="img" aria-label={`${channel}: muestras ${start+1} a ${start+window.length}; los huecos indican señal ausente o inválida`}><path d="M30 20V100H530" className="stats-grid-line" fill="none"/><text x="0" y="15">{max.toFixed(1)}</text><path d={path} fill="none" stroke="currentColor" strokeWidth="2"/>{window.flatMap(sample=>sample.frame.channels[c].rms===null?[]:[<circle key={sample.activeMs} cx={x(sample.activeMs)} cy={y(sample.frame.channels[c].rms!)} r="2" fill="currentColor"/>])}<text x="30" y="122">{first/1000} s</text><text x="530" y="122" textAnchor="end">{last/1000} s</text></svg></figure>;
    })}</div>
    <p className="soft-label">Gráficas: muestras {start+1}–{start+window.length}. Mueve el selector para recorrer todo el registro. Cada gráfica ajusta su propia escala.</p>
    <MuseChannels frame={sample.frame} baseline={baselines[selected]}/>
    <p className="muse-explanation">Cambio (pp): diferencia de proporción por banda, en puntos porcentuales. Cinco ventanas posteriores válidas permiten compararla con la referencia.</p>
  </>;
}
