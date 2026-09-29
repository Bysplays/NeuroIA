import { eegService } from '../services/eegService';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { readEegPoints, type EegRecording } from '../services/eegData';

function SignalStrip({ name, recording, mean, current }: { name: string; recording?: EegRecording; mean?: number; current: boolean }) {
  const points = readEegPoints(recording).slice(-30);
  const values = points.flatMap(([, value]) => value === null ? [] : [value]);
  const max = Math.max(1, ...values) * 1.1;
  const path = points.map(([, value], i) => value === null ? '' : `${i > 0 && points[i - 1][1] !== null ? 'L' : 'M'}${i * 300 / Math.max(1, points.length - 1)},${36 - value / max * 30}`).join(' ');
  return <div className={`eeg-signal-strip eeg-signal-${name.toLowerCase()}`}>
    <strong>{name}</strong>
    <svg viewBox="0 0 300 42" preserveAspectRatio="none" role="img" aria-label={`${name}: ${current ? 'señal reciente' : 'sin señal actual'}`}>
      <path className="eeg-strip-grid" d="M0 12 H300 M0 24 H300 M0 36 H300"/>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2"/>
    </svg>
    <span><span className="soft-label">Media de la partida</span><b>{mean === undefined ? '—' : mean.toLocaleString('es-ES', { maximumFractionDigits: 1 })} <small>{recording?.metric.unit}</small></b>{!current && <small>Sin señal actual</small>}</span>
  </div>;
}
export function EegLive({ recording, ppg, eegMean, ppgMean, recordable = true }: { recording?: EegRecording; ppg?: EegRecording; eegMean?: number; ppgMean?: number; recordable?: boolean }) {
  const [now, setNow] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const state = useSyncExternalStore(eegService.subscribe, eegService.getSnapshot);
  if (state.status !== 'connected' && !recording && !ppg) return null;
  return <aside className="eeg-live" aria-label="EEG y PPG en directo">
    <SignalStrip name="EEG" recording={recording} mean={eegMean} current={state.status === 'connected' && state.value !== null && now - state.receivedAt <= 3000}/>
    <SignalStrip name="PPG" recording={ppg} mean={ppgMean} current={state.status === 'connected' && state.ppgValue !== null && now - state.ppgReceivedAt <= 3000}/>
    <span className="soft-label">{state.status !== 'connected' ? 'Diadema desconectada' : state.recording && recordable ? 'Se guardarán con la partida' : 'Solo en directo'}</span>
  </aside>;
}
