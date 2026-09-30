import { ExerciseAnalytics } from './ExerciseAnalytics';
import { ProfessionalPageHeader } from './ProfessionalPageHeader';
import { ActivityLineChart } from './ActivityLineChart';
import { EXERCISE_IDS } from '../services/difficulty';
import { levelTimeline, historicalLevelMean } from '../services/levelStatistics';
import { LevelStatistics } from './LevelStatistics';
import type { ReactNode } from 'react';
import { TabletTabs } from './TabletTabs';
import { useViewportPanel } from '../services/viewport';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ChartNoAxesCombined, RotateCcw } from 'lucide-react';
import type { CognitiveDomain, ExerciseResult, UserProfile } from '../types';
import { ACTIVITY_EXERCISES, activityExerciseTitle as title } from '../services/activityExercises';
import { dailyActivity, formatActivityDate, localDay, mergeActivity, secondsPerQuestion, historicalMean } from '../services/activityStats';
import { loadActivityPage } from '../services/activityHistory';
import { ActivityAssistant } from './ActivityAssistant';
import { buildActivityInsights } from '../services/activityInsights';

const domains: [CognitiveDomain, string][] = [['attention', 'Atención'], ['language', 'Lenguaje'], ['memory', 'Memoria'], ['executive', 'Organización'], ['motor', 'Coordinación']];
const number = (n: number | null) => n === null || !Number.isFinite(n) ? '—' : n.toLocaleString('es-ES', { maximumFractionDigits: 1 });

function ActivityTimestamp({ date }: { date: string }) {
  const formatted = formatActivityDate(date);
  return <time dateTime={date}><span>{formatted.day}</span>{formatted.time !== null && <small>{formatted.time}</small>}</time>;
}

function LineChart({ results, history, complete, metric }: { results: ExerciseResult[]; history: ExerciseResult[]; complete: boolean; metric: 'accuracy' | 'speed' }) {
  const points = dailyActivity(results, metric);
  const average = complete ? historicalMean(history, metric) : null;
  const ids = [...new Set(points.map(p => p.exerciseId))];
  const max = metric === 'accuracy' ? 100 : Math.max(1, average ?? 0, ...points.map(p => p.value)) * 1.1;
  return <ActivityLineChart title={metric === 'accuracy' ? 'Precisión' : 'Velocidad'} description={metric === 'accuracy' ? 'Porcentaje de aciertos · media diaria por juego' : 'Segundos por pregunta · media diaria por juego'} max={max} unit={metric === 'accuracy' ? '%' : ' s/pregunta'} average={average}
    series={ids.map(id => ({ id, points: points.filter(p => p.exerciseId === id).map(p => ({ id: p.day, date: p.day, time: Date.parse(`${p.day}T12:00:00Z`), value: p.value })) }))}/>;
}

function LevelChart({ results, history, complete }: { results: ExerciseResult[]; history: ExerciseResult[]; complete: boolean }) {
  const series = EXERCISE_IDS.map(id => ({ id, points: levelTimeline(results, id).map(p => ({ ...p, value: p.level })) })).filter(s => s.points.length);
  return <ActivityLineChart title="Niveles" description="Evolución de los juegos a lo largo del tiempo" series={series} average={complete ? historicalLevelMean(history) : null} min={1} max={10} ticks={[1, 4, 7, 10]} unit=""/>;
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

export function ActivityStatistics(props: ActivityStatisticsProps) {
  return <AccountActivityStatistics key={props.uid} {...props}/>;
}
type ActivityStatisticsProps = { active?: boolean; tapsOnly?: boolean; levels?: UserProfile['gameLevels']; selectedTab?: string; onTabChange?: (tab: string) => void; embedded?: boolean; achievements?: ReactNode; uid: string; history: ExerciseResult[]; onBack: () => void; heading?: string; subtitle?: string; backLabel?: string };
function AccountActivityStatistics({ uid, history, levels, onBack, heading = 'Tu actividad', subtitle, backLabel = 'Volver al inicio', embedded = false, achievements, selectedTab, onTabChange, active = true, tapsOnly = false }: ActivityStatisticsProps) {
  const panel = useViewportPanel<HTMLDivElement>();
  const [localTab, setLocalTab] = useState('overview');
  const tab = selectedTab ?? localTab;
  const setTab = onTabChange ?? setLocalTab;
  const pageSize = 10;
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
  const [selectedResult, setSelectedResult] = useState<ExerciseResult | null>(null);
  const all = useMemo(() => mergeActivity(archive, history), [archive, history]);
  const results = all.filter(r => (!exercise || r.exerciseId === exercise) && (!domain || r.domain === domain) && (!from || localDay(r.date) >= from) && (!to || localDay(r.date) <= to));
  const insights = useMemo(() => from && to && from > to ? null : buildActivityInsights(all, levels,
    { from, to, exercise, domain, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }, { partial: more, tapsOnly }), [all, levels, from, to, exercise, domain, more, tapsOnly]);
  const currentPage = Math.min(page, Math.max(0, Math.ceil(results.length / pageSize) - 1));
  const loadMore = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true; setBusy(true); setError(false);
    try { const next = await loadActivityPage(uid, cursor); if (mounted.current) { setArchive(a => mergeActivity(a, next.results)); setCursor(next.cursor); setMore(next.more); } }
    catch { if (mounted.current) setError(true); }
    finally { fetching.current = false; if (mounted.current) setBusy(false); }
  }, [uid, cursor]);
  useEffect(() => {
    if (tab !== 'charts' || !more || busy || error) return;
    const timer = window.setTimeout(() => { void loadMore(); }, 0);
    return () => window.clearTimeout(timer);
  }, [tab, more, busy, error, loadMore]);
  const resetPage = () => setPage(0);
  return <div ref={panel} className={`tablet-screen ${embedded ? 'activity-statistics activity-embedded' : 'professional-panel activity-professional'}`}>
    {embedded && <header className="workspace-section-heading"><span className="workspace-section-icon" aria-hidden="true"><Activity size={26}/></span><div><h1>Actividad</h1><p>Consulta tus juegos, resultados y niveles.</p></div></header>}
    {!embedded && <ProfessionalPageHeader title={heading} icon={<ChartNoAxesCombined size={24}/>} name={subtitle} backLabel={backLabel} onBack={onBack}/> }
    {selectedResult ? <ExerciseAnalytics result={selectedResult} onBack={() => setSelectedResult(null)}/> : <TabletTabs position="top" label="Actividad" value={tab} onChange={setTab} tabs={[
      { id: 'overview', label: 'Resumen', content: <>
    <div className="stats-overview"><CategoryRadar results={results}/>
    <LevelStatistics levels={levels}/></div>
    {active && tab === 'overview' && insights && <ActivityAssistant key={JSON.stringify(insights)} uid={uid} insights={insights} subjectLabel={subtitle}/>}
    {!insights && <p role="alert">Revisa el intervalo de fechas en Filtros para preparar recomendaciones.</p>}
    </> }, { id: 'charts', label: 'Gráficas', content:
    <>
      {more && <div className="stats-archive-notice" role="status">{error ? <>No se pudo cargar todo el historial. <button className="stats-quiet-button" onClick={loadMore}>Reintentar</button></> : 'Cargando el historial completo para calcular las medias…'}</div>}
      <div className="stats-lines"><LineChart results={results} history={all} complete={!more} metric="accuracy"/><LineChart results={results} history={all} complete={!more} metric="speed"/><LevelChart results={results} history={all} complete={!more}/></div>
    </>
    }, { id: 'history', label: 'Historial', content: <section className="stats-card stats-history" aria-labelledby="stats-history-title"><div className="stats-section-heading"><div><h2 id="stats-history-title">Ejercicios resueltos</h2><p>{more ? 'Historial reciente · Puedes cargar más registros' : 'Todo el historial disponible'}</p></div><span className="stats-count" role="status">{results.length} registros</span></div>
      <div className="stats-table-scroll" role="region" aria-label="Historial de ejercicios" tabIndex={0}><table><thead><tr>{['Ejercicio', 'Fecha y hora', 'Aciertos', 'Precisión', 'Duración', 'Seg./pregunta', 'Analíticas'].map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{results.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(r => <tr key={r.id}><th scope="row">{title(r.exerciseId)}</th><td><ActivityTimestamp date={r.date}/></td><td>{r.correctAnswers} / {r.totalQuestions}</td><td>{number(r.accuracy)}%</td><td>{number(r.durationSeconds)} s</td><td>{number(secondsPerQuestion(r))}</td><td><button className="header-icon-btn" aria-label={`Ver partida de ${title(r.exerciseId)} del ${formatActivityDate(r.date).day}`} onClick={() => setSelectedResult(r)}><ChartNoAxesCombined size={20}/></button></td></tr>)}</tbody></table></div>
      {!results.length && <p className="stats-empty">No hay ejercicios registrados con estos filtros.</p>}
      <div className="stats-history-footer"><div className="stats-pagination"><button className="stats-quiet-button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Anterior</button><span>Página {currentPage + 1} de {Math.max(1, Math.ceil(results.length / pageSize))}</span><button className="stats-quiet-button" disabled={(currentPage + 1) * pageSize >= results.length} onClick={() => setPage(currentPage + 1)}>Siguiente</button></div>
      {more && <button className="stats-quiet-button stats-load" disabled={busy} onClick={loadMore}>{busy ? 'Cargando historial…' : error ? 'Reintentar' : 'Cargar más historial'}</button>}</div>
      {error && <p role="alert">No hemos podido consultar el historial. Puedes volver a intentarlo.</p>}
    </section> },
    { id: 'filters', label: 'Filtros', content: <>
    <section className="stats-card stats-filter-panel" aria-labelledby="stats-filter-title">
      <div className="stats-filter-heading"><div><h2 id="stats-filter-title">Filtros</h2><p>Elige qué actividad quieres ver.</p></div>
        <button className="stats-filter-reset" disabled={!domain && !exercise && !from && !to} onClick={() => { setDomain(''); setExercise(''); setFrom(''); setTo(''); resetPage(); }}><RotateCcw size={16} aria-hidden="true"/>Restablecer</button>
      </div>
      <div className="stats-filters" onChange={resetPage}>
      <label>Área<select aria-label="Área" value={domain} onChange={e => { setDomain(e.target.value); setExercise(''); }}><option value="">Todas las áreas</option>{domains.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label>Ejercicio<select aria-label="Ejercicio" value={exercise} onChange={e => setExercise(e.target.value)}><option value="">Todos los ejercicios</option>{ACTIVITY_EXERCISES.filter(e => (!domain || e.domain === domain) && (!e.retired || all.some(r => r.exerciseId === e.id))).map(e => <option key={e.id} value={e.id}>{e.title}{e.retired ? ' (retirado)' : ''}</option>)}</select></label>
      <fieldset className="stats-date-range"><legend>Fechas</legend><div className="stats-date-fields">
      <label>Desde<input aria-label="Desde" type="date" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)}/></label>
      <label>Hasta<input aria-label="Hasta" type="date" value={to} min={from || undefined} onChange={e => setTo(e.target.value)}/></label>
      </div></fieldset>
      </div>
    </section>
    {from && to && from > to && <p role="alert">La fecha inicial debe ser anterior a la final.</p>}
    </> },
    ...(achievements ? [{ id: 'achievements', label: 'Logros', content: achievements }] : [])
    ]}/>}
  </div>;
}
