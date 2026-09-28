import { useState } from 'react';
import type { ExerciseId, ExerciseResult, UserProfile } from '../types';
import { EXERCISE_IDS, validLevel } from '../services/difficulty';
import { getExerciseById } from '../services/exerciseCatalog';
import { activityExerciseStyle } from '../services/activityExercises';
import { levelTimeline } from '../services/levelStatistics';
import { formatActivityDate } from '../services/activityStats';

const shortNames: Record<ExerciseId, string> = { 'visual-scanning': 'Búsqueda visual', 'language-naming': 'Nombrar objetos', 'word-completion': 'Completar palabras', 'memory-path': 'Secuencia de balizas', 'memory-pairs': 'Parejas de memoria', categorization: 'Categorías', 'motor-target': 'Tocar la diana', 'motor-tracking': 'Seguir la diana' };
const title = (id: ExerciseId) => getExerciseById(id)!.title;
export function LevelStatistics({ levels, history, complete, busy, onRetry, error }: {
  levels: UserProfile['gameLevels']; history: ExerciseResult[]; complete: boolean; busy: boolean; error: boolean; onRetry: () => void;
}) {
  const [selected, setSelected] = useState<ExerciseId>('visual-scanning');
  const values = EXERCISE_IDS.map(id => validLevel(levels?.[id]?.level) ? levels![id]!.level : null);
  const point = (i: number, level: number) => {
    const angle = i * Math.PI / 4 - Math.PI / 2;
    return [150 + Math.cos(angle) * level * 10, 135 + Math.sin(angle) * level * 10];
  };
  const series = levelTimeline(history, selected);
  const start = series[0]?.time ?? 0;
  const end = series.at(-1)?.time ?? start;
  const x = (i: number) => end === start ? 165 : 30 + (series[i].time - start) / (end - start) * 270;
  const y = (level: number) => 215 - (level - 1) * 20;
  return <div className="level-statistics">
    <section className="stats-card level-bars"><h2>Nivel actual</h2>
      {EXERCISE_IDS.map((id, i) => <div className="level-bar" key={id}>
        <div><span title={title(id)}>{i + 1}. {shortNames[id]}</span><strong>{values[i] === null ? 'Sin asignar' : `${values[i]} / 10`}</strong></div>
        <progress max={10} value={values[i] ?? 0} aria-label={`Nivel de ${title(id)}`} style={{ '--level-color': activityExerciseStyle(id).color } as import('react').CSSProperties}/>
      </div>)}
    </section>
    <section className="stats-card level-star"><h2>Mapa de niveles</h2><p>Cada número es un juego. Del 1 al 10.</p>
      <svg viewBox="0 0 300 285" role="img" aria-label="Niveles actuales del 1 al 10. Valores en las barras de nivel actual.">
        {[2, 4, 6, 8, 10].map(level => <polygon key={level} points={values.map((_, i) => point(i, level).join(',')).join(' ')} className="stats-grid-line" fill="none"/>)}
        {values.map((_, i) => <g key={i}><line x1="150" y1="135" x2={point(i, 10)[0]} y2={point(i, 10)[1]} className="stats-grid-line"/><text x={point(i, 12)[0]} y={point(i, 12)[1] + 5} textAnchor="middle">{i + 1}</text></g>)}
        <polygon points={values.map((value, i) => point(i, value ?? 0).join(',')).join(' ')} className="stats-radar-fill"/>
        {values.map((value, i) => value !== null && <circle key={i} cx={point(i, value)[0]} cy={point(i, value)[1]} r="4" fill={activityExerciseStyle(EXERCISE_IDS[i]).color}><title>{title(EXERCISE_IDS[i])}: nivel {value}</title></circle>)}
      </svg>
    </section>
    <section className="stats-card level-history"><h2>Evolución por juego</h2>
      <label className="level-game-label">Juego<select aria-label="Juego" value={selected} onChange={event => setSelected(event.target.value as ExerciseId)}>{EXERCISE_IDS.map(id => <option key={id} value={id}>{shortNames[id]}</option>)}</select></label>
      {!complete && <p role="status">{error ? <>No se pudo cargar todo el historial. <button className="stats-quiet-button" disabled={busy} onClick={onRetry}>Reintentar</button></> : 'Cargando historial…'}</p>}
      {series.length ? <svg viewBox="0 0 320 260" role="img" aria-label={`Nivel jugado en ${title(selected)}, por partida en orden temporal`}>
        {[1, 4, 7, 10].map(level => <g key={level}><line x1="30" x2="300" y1={y(level)} y2={y(level)} className="stats-grid-line"/><text x="22" y={y(level) + 4} textAnchor="end">{level}</text></g>)}
        <polyline fill="none" stroke={activityExerciseStyle(selected).color} strokeWidth="3" points={series.map((result, i) => `${x(i)},${y(result.level)}`).join(' ')}/>
        {series.map((result, i) => <circle key={result.id} cx={x(i)} cy={y(result.level)} r="4" fill={activityExerciseStyle(selected).color}><title>{formatActivityDate(result.date).day}: nivel {result.level}</title></circle>)}
        <text x="30" y="246">{formatActivityDate(series[0].date).day}</text>
        {series.length > 1 && <text x="300" y="246" textAnchor="end">{formatActivityDate(series.at(-1)!.date).day}</text>}
      </svg> : <p className="stats-empty">Aún no hay partidas con nivel registrado en este juego.</p>}
      <p className="level-chart-note">Nivel jugado en cada partida.</p>
    </section>
  </div>;
}
