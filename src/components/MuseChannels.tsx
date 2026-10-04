import {useEffect,useState,useSyncExternalStore} from 'react';
import {eegService} from '../services/eegService';
import {MUSE_BANDS,MUSE_CHANNELS,type MuseFeatureFrame,type ChannelQuality} from '../services/museFeatures';
import type {createMuseBaseline} from '../services/museBaseline';

type Baseline=ReturnType<ReturnType<typeof createMuseBaseline>['snapshot']>;
const quality:Record<ChannelQuality,string>={valid:'Señal válida',missing:'Sin señal',malformed:'Datos incompletos',flat:'Señal plana',clipped:'Señal saturada'};
const format=(n:number)=>n.toLocaleString('es-ES',{maximumFractionDigits:1});
const delta=(n:number)=>{const rounded=Math.round(n*1000)/10;return `${rounded>0?'+':''}${format(rounded===0?0:rounded)}`;};
export function MuseChannels({frame,baseline,compact=false}:{frame:MuseFeatureFrame|null;baseline?:Baseline;compact?:boolean}) {
  return <div className={compact?'muse-compact-grid':'muse-channel-grid'} aria-label="Cuatro canales EEG">
    {MUSE_CHANNELS.map((name,i)=>{
      const channel=frame?.channels[i];const state=channel?.quality??'missing';
      const reference=baseline?.[i];
      const total=channel?.power ? MUSE_BANDS.reduce((sum,band)=>sum+channel.power![band],0) : 0;
      return <section key={name} className="muse-channel" aria-label={`Canal ${name}`}>
        <header><strong>{name}</strong><span>{quality[state]}</span></header>
        <p className="muse-rms"><b>{channel?.rms===null||channel?.rms===undefined?'—':format(channel.rms)}</b> <span>µV RMS</span></p>
        {!compact && <>
          <table><caption>Potencia por banda</caption><thead><tr><th>Banda</th><th>µV²</th><th>Cambio (pp)</th></tr></thead><tbody>
            {MUSE_BANDS.map((band,index)=><tr key={band}><th scope="row">{band}<span className="muse-band-bar" aria-hidden="true"><i style={{width:`${total ? 100*channel!.power![band]/total : 0}%`}}/></span></th><td>{channel?.power ? format(channel.power[band]) : '—'}</td><td>{reference?.deltas ? delta(reference.deltas[index]) : '—'}</td></tr>)}
          </tbody></table>
          <p className="soft-label">{reference?.deltas ? 'Comparación con la referencia inicial' : `Referencia: ${reference?.baselineWindows??0}/5 ventanas · esperando señal suficiente`}</p>
        </>}
      </section>;
    })}
  </div>;
}
export function LiveMuseChannels({compact=false}:{compact?:boolean}) {
  const state=useSyncExternalStore(eegService.subscribe,eegService.getSnapshot);
  const [now,setNow]=useState(()=>Date.now());
  useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer);},[]);
  const fresh=state.status==='connected' && now-state.channelsReceivedAt<=3000;
  return <><MuseChannels frame={fresh?state.channels:null} baseline={fresh?eegService.getBaseline(now):undefined} compact={compact}/>
    {!compact && <p className="muse-explanation">Los canales son electrodos distintos. El cambio compara la proporción de cada banda con las primeras cinco ventanas válidas de esta conexión, en puntos porcentuales (pp). No mide atención, fatiga ni relajación.</p>}</>;
}
