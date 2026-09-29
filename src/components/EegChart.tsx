import { readEegPoints, type EegRecording } from '../services/eegData';
export function EegChart({ recording, compact = false, signal = 'EEG' }: { recording?: EegRecording; compact?: boolean; signal?: string }) {
  const points = readEegPoints(recording);
  const values = points.filter(p => p[1] !== null);
  if (!recording || !values.length) return <p className="eeg-empty">Sin datos {signal} registrados.</p>;
  const { metric } = recording;
  const end = Math.max(1, points.at(-1)![0]);
  const x = (t: number) => 40 + t / end * 520;
  const axisMax = Math.min(metric.max, Math.max(metric.min + 1, ...values.map(p => p[1]!)) * 1.1);
  const y = (v: number) => 100 - (v - metric.min) / (axisMax - metric.min) * 80;
  const path = points.map(([t, v], i) => { if (v === null) return ''; const command = i > 0 && points[i - 1][1] !== null ? 'L' : 'M'; return `${command}${x(t)},${y(v)}`; }).join(' ');
  return <figure className={`eeg-chart${compact ? ' eeg-chart-compact' : ''}`}><figcaption>{metric.label} {metric.unit && `(${metric.unit})`}{compact && ` · ${values.at(-1)![1]}`}</figcaption><svg preserveAspectRatio={compact ? "none" : "xMidYMid meet"} viewBox="0 0 600 130" role="img" aria-label={`${metric.label}, durante ${Math.round(end)} segundos de juego activo. Los huecos indican ausencia de señal válida.`}><text x="2" y="24">{Number(axisMax.toPrecision(3))}</text><text x="2" y="104">{metric.min}</text><path d="M40,20 V100 H560" className="stats-grid-line" fill="none"/><path d={path} fill="none" stroke="currentColor" strokeWidth="2"/>{values.map(([t,v]) => <circle key={t} cx={x(t)} cy={y(v!)} r={compact ? 1.5 : 2.5} fill="currentColor"/>)}<text x="40" y="123">0 s</text><text x="560" y="123" textAnchor="end">{Math.round(end)} s</text></svg>{!compact && <><p>{metric.id === 'muse2-ppg-ir-rms-v1' ? 'Amplitud de la señal óptica infrarroja en miles de unidades del sensor; no son pulsaciones ni saturación de oxígeno.' : metric.id === 'muse2-ac-rms-v1' ? 'Amplitud de la señal EEG, no una medida de atención o esfuerzo mental.' : 'Indicador del dispositivo, no una evaluación médica.'} Los huecos son periodos sin señal válida.</p><details><summary>Ver datos de la gráfica</summary><div className="eeg-data"><table><thead><tr><th>Segundo</th><th>{metric.label}</th></tr></thead><tbody>{points.map(([t,v])=><tr key={t}><td>{t}</td><td>{v ?? 'Sin señal'}</td></tr>)}</tbody></table></div></details></>}</figure>;
}
