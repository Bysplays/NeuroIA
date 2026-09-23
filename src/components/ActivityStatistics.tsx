import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { CognitiveDomain, ExerciseResult } from '../types';
import { ALL_EXERCISES } from '../services/exerciseCatalog';
import { dailyActivity, formatActivityDate, localDay, mergeActivity, secondsPerQuestion } from '../services/activityStats';
import { loadActivityPage } from '../services/activityHistory';

const domains: [CognitiveDomain, string][] = [['attention', 'Atención'], ['language', 'Lenguaje'], ['memory', 'Memoria'], ['executive', 'Organización'], ['motor', 'Coordinación']];
const colors = ['#247f89', '#a85578', '#6656ac', '#ac661f', '#427639', '#b34245', '#3570ae', '#88752a', '#8d558c'];
const title = (id: string) => ALL_EXERCISES.find(e => e.id === id)?.title ?? id;
const color = (id: string) => colors[Math.max(0, ALL_EXERCISES.findIndex(e => e.id === id)) % colors.length];
const number = (n: number | null) => n === null || !Number.isFinite(n) ? '—' : n.toLocaleString('es-ES', { maximumFractionDigits: 1 });

function ActivityTimestamp({ date }: { date: string }) {
  const formatted = formatActivityDate(date);
  return <time dateTime={date}><span>{formatted.day}</span>{formatted.time !== null && <small>{formatted.time}</small>}</time>;
}

function LineChart({ results, metric }: { results: ExerciseResult[]; metric: 'accuracy' | 'speed' }) {
  const points = dailyActivity(results, metric);
  const days = [...new Set(points.map(p => p.day))];
  const ids = [...new Set(points.map(p => p.exerciseId))];
  const max = metric === 'accuracy' ? 100 : Math.max(1, ...points.map(p => p.value)) * 1.1;
  const dayTime = (day: string) => Date.parse(`${day}T12:00:00Z`);
  const start = dayTime(days[0]); const end = dayTime(days.at(-1)!);
  const x = (day: string) => days.length === 1 ? 330 : 55 + (dayTime(day) - start) / (end - start) * 555;
  const y = (value: number) => 215 - value / max * 180;
  return <section className={`stats-card stats-chart stats-chart-${metric}`}><h2>{metric === 'accuracy' ? 'Precisión media' : 'Velocidad media'}</h2>
    <p>{metric === 'accuracy' ? 'Porcentaje de aciertos · media diaria por ejercicio' : 'Segundos por pregunta · media diaria por ejercicio'}</p>
    {!points.length ? <p className="stats-empty">Todavía no hay datos para esta gráfica.</p> : <>
      <svg viewBox="0 0 650 265" role="img" aria-label={`${metric === 'accuracy' ? 'Precisión' : 'Segundos por pregunta'} por día. Valores disponibles en la tabla inferior.`}>
        {[0, 1, 2, 3, 4].map(i => <g key={i}><line x1="55" x2="610" y1={y(max * i / 4)} y2={y(max * i / 4)} className="stats-grid-line" /><text x="44" y={y(max * i / 4) + 4} textAnchor="end">{number(max * i / 4)}</text></g>)}
        {days.filter((_, i) => i === 0 || i === days.length - 1 || (days.length > 2 && i === Math.floor(days.length / 2))).map(day => <text key={day} x={x(day)} y="245" textAnchor="middle">{day.slice(8)}/{day.slice(5, 7)}/{day.slice(2, 4)}</text>)}
        {ids.map(id => { const values = points.filter(p => p.exerciseId === id); return <g key={id} stroke={color(id)}><polyline fill="none" strokeWidth="2.5" strokeDasharray={ALL_EXERCISES.findIndex(e => e.id === id) % 2 ? '7 4' : undefined} points={values.map(p => `${x(p.day)},${y(p.value)}`).join(' ')} />{values.map(p => <circle key={p.day} cx={x(p.day)} cy={y(p.value)} r="4" fill={color(id)}><title>{title(id)} · {p.day}: {number(p.value)}{metric === 'accuracy' ? '%' : ' s/pregunta'}</title></circle>)}</g>; })}
      </svg>
      <ul className="stats-legend">{ids.map(id => <li key={id}><span style={{ background: color(id) }} />{title(id)}</li>)}</ul>
    </>}
  </section>;
}

function CategoryRadar({ results }: { results: ExerciseResult[] }) {
  const counts = domains.map(([id]) => results.filter(r => r.domain === id).length);
  const max = Math.max(1, ...counts);
  const point = (i: number, radius: number) => { const a = i * 2 * Math.PI / 5 - Math.PI / 2; return [160 + Math.cos(a) * radius, 125 + Math.sin(a) * radius]; };
  return <section className="stats-card stats-radar-card"><h2>Áreas que practicas</h2><p>Ejercicios completados en la selección</p><svg className="stats-radar" viewBox="0 0 320 260" role="img" aria-label={domains.map(([, name], i) => `${name}: ${counts[i]}`).join(', ')}>
    {[.25, .5, .75, 1].map(scale => <polygon key={scale} points={domains.map((_, i) => point(i, 83 * scale).join(',')).join(' ')} className="stats-grid-line" fill="none" />)}
    {domains.map(([, name], i) => { const [x, y] = point(i, 110); const [ax, ay] = point(i, 83); return <g key={name}><line x1="160" y1="125" x2={ax} y2={ay} className="stats-grid-line"/><text x={x} y={y} textAnchor="middle">{name}<tspan x={x} dy="17">{counts[i]}</tspan></text></g>; })}
    <polygon points={counts.map((n, i) => point(i, n / max * 83).join(',')).join(' ')} className="stats-radar-fill" />
  </svg></section>;
}

export function ActivityStatistics({ uid, history, onBack }: { uid: string; history: ExerciseResult[]; onBack: () => void }) {
  const [archive, setArchive] = useState<ExerciseResult[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [more, setMore] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const mounted = useRef(true); const fetching = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [exercise, setExercise] = useState(''); const [domain, setDomain] = useState('');
  const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const [page, setPage] = useState(0);
  const all = useMemo(() => mergeActivity(archive, history), [archive, history]);
  const results = all.filter(r => (!exercise || r.exerciseId === exercise) && (!domain || r.domain === domain) && (!from || localDay(r.date) >= from) && (!to || localDay(r.date) <= to));
  const currentPage = Math.min(page, Math.max(0, Math.ceil(results.length / 20) - 1));
  const loadMore = async () => {
    if (fetching.current) return;
    fetching.current = true; setBusy(true); setError(false);
    try { const next = await loadActivityPage(uid, cursor); if (mounted.current) { setArchive(a => mergeActivity(a, next.results)); setCursor(next.cursor); setMore(next.more); } }
    catch { if (mounted.current) setError(true); }
    finally { fetching.current = false; if (mounted.current) setBusy(false); }
  };
  const resetPage = () => setPage(0);
  return <div className="activity-statistics">
    <div className="stats-heading"><button className="stats-quiet-button" onClick={onBack}><ArrowLeft size={20}/> Volver al inicio</button><h1>Tu actividad</h1></div>
    <div className="stats-overview"><CategoryRadar results={results}/>
    <section className="stats-card stats-filter-panel" aria-labelledby="stats-filter-title">
      <div className="stats-section-heading"><div><h2 id="stats-filter-title">Explora tu actividad</h2><p>Filtra las gráficas y el historial.</p></div>
        <button className="stats-quiet-button" onClick={() => { setDomain(''); setExercise(''); setFrom(''); setTo(''); resetPage(); }}>Limpiar filtros</button>
      </div>
      <div className="stats-filters" onChange={resetPage}>
      <label>Área<select aria-label="Área" value={domain} onChange={e => { setDomain(e.target.value); setExercise(''); }}><option value="">Todas las áreas</option>{domains.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label>Ejercicio<select aria-label="Ejercicio" value={exercise} onChange={e => setExercise(e.target.value)}><option value="">Todos los ejercicios</option>{ALL_EXERCISES.filter(e => !domain || e.domain === domain).map(e => <option key={e.id} value={e.id}>{e.title}</option>)}</select></label>
      <label>Desde<input aria-label="Desde" type="date" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)}/></label>
      <label>Hasta<input aria-label="Hasta" type="date" value={to} min={from || undefined} onChange={e => setTo(e.target.value)}/></label>
      </div>
    </section></div>
    {from && to && from > to && <p role="alert">La fecha inicial debe ser anterior a la final.</p>}
    <div className="stats-lines"><LineChart results={results} metric="accuracy"/><LineChart results={results} metric="speed"/></div>
    <section className="stats-card stats-history" aria-labelledby="stats-history-title"><div className="stats-section-heading"><div><h2 id="stats-history-title">Ejercicios resueltos</h2><p>{more ? 'Historial reciente · Puedes cargar más registros' : 'Todo el historial disponible'}</p></div><span className="stats-count" role="status">{results.length} registros</span></div>
      <div className="stats-table-scroll" role="region" aria-label="Historial de ejercicios" tabIndex={0}><table><thead><tr>{['Ejercicio', 'Fecha y hora', 'Aciertos', 'Precisión', 'Duración', 'Seg./pregunta'].map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{results.slice(currentPage * 20, (currentPage + 1) * 20).map(r => <tr key={r.id}><th scope="row">{title(r.exerciseId)}</th><td><ActivityTimestamp date={r.date}/></td><td>{r.correctAnswers} / {r.totalQuestions}</td><td>{number(r.accuracy)}%</td><td>{number(r.durationSeconds)} s</td><td>{number(secondsPerQuestion(r))}</td></tr>)}</tbody></table></div>
      {!results.length && <p className="stats-empty">No hay ejercicios registrados con estos filtros.</p>}
      <div className="stats-history-footer"><div className="stats-pagination"><button className="stats-quiet-button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Anterior</button><span>Página {currentPage + 1} de {Math.max(1, Math.ceil(results.length / 20))}</span><button className="stats-quiet-button" disabled={(currentPage + 1) * 20 >= results.length} onClick={() => setPage(currentPage + 1)}>Siguiente</button></div>
      {more && <button className="stats-quiet-button stats-load" disabled={busy} onClick={loadMore}>{busy ? 'Cargando historial…' : error ? 'Reintentar' : 'Cargar más historial'}</button>}</div>
      {error && <p role="alert">No hemos podido consultar el historial. Puedes volver a intentarlo.</p>}
    </section>
  </div>;
}
