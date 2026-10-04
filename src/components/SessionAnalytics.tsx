import { ExerciseAnalytics } from './ExerciseAnalytics';
import { ProfessionalPageHeader } from './ProfessionalPageHeader';
import { useEffect, useState } from 'react';
import { Activity, ChartNoAxesCombined, ListOrdered, RotateCcw } from 'lucide-react';
import type { AssignedSession } from '../services/assignedSessions';
import { sessionStatusLabel } from '../services/assignedSessions';
import { sessionAnalytics } from '../services/sessionAnalytics';
import { getExerciseById } from '../services/exerciseCatalog';
import { formatActivityDate } from '../services/activityStats';
import type { ExerciseResult } from '../types';

const number = (value: number) => value.toLocaleString('es-ES', { maximumFractionDigits: 1 });
export function SessionAnalytics({ session, name, loadResults, onBack }: {
  session: AssignedSession; name: string; loadResults: (session: AssignedSession) => Promise<ExerciseResult[]>; onBack: () => void;
}) {
  const [response, setResponse] = useState<{ session: AssignedSession; retry: number; results: ExerciseResult[]; error: boolean }>();
  const [retry, setRetry] = useState(0);
  const [selectedResult, setSelectedResult] = useState<ExerciseResult | null>(null);
  useEffect(() => {
    let active = true;
    loadResults(session).then(results => { if (active) setResponse({ session, retry, results, error: false }); },
      () => { if (active) setResponse({ session, retry, results: [], error: true }); });
    return () => { active = false; };
  }, [session, loadResults, retry]);
  const current = response?.session === session && response.retry === retry;
  const state = !current ? 'loading' : response.error ? 'error' : 'ready';
  const data = sessionAnalytics(session, current ? response.results : []);
  const ready = state === 'ready';
  if (selectedResult) return <ExerciseAnalytics uid={session.patientId} result={selectedResult} onBack={() => setSelectedResult(null)}/>;
  return <section className="session-dashboard">
    <ProfessionalPageHeader title={session.title} icon={<ChartNoAxesCombined size={24}/>} name={name} detail={sessionStatusLabel[session.status]} backLabel="Volver a sesiones" onBack={onBack} action={<button className="stats-quiet-button" disabled={state === 'loading'} onClick={() => setRetry(value => value + 1)}><RotateCcw size={16}/>Actualizar</button>}/>
    <div className="session-summary">
      <article className="stats-card"><span>Juegos completados</span><strong>{ready ? Math.max(session.completedCount, data.available) : session.completedCount} <small>/ {session.steps.length}</small></strong><progress aria-label="Juegos completados" value={ready ? Math.max(session.completedCount, data.available) : session.completedCount} max={session.steps.length}/></article>
      <article className="stats-card"><span>Precisión</span><strong>{ready && data.accuracy !== null ? number(data.accuracy) + ' %' : '—'}</strong><small>Aciertos sobre respuestas registradas</small></article>
      <article className="stats-card"><span>Tiempo de juego</span><strong>{ready && data.seconds !== null ? number(data.seconds / 60) + ' min' : '—'}</strong><small>Suma de los ejercicios registrados</small></article>
    </div>
    {state === 'loading' && <p role="status">Cargando los resultados de esta sesión…</p>}
    {state === 'error' && <p role="alert">No se han podido consultar los resultados. Pulsa Actualizar para reintentarlo.</p>}
    {ready && data.missing > 0 && <p role="status">Faltan {data.missing} resultados por consultar. Las métricas muestran solo los disponibles.</p>}
    {ready && session.completedCount === 0 && data.available === 0 && <p className="session-empty-note">Las analíticas aparecerán al completar los juegos.</p>}
    <section className="stats-card session-breakdown"><header className="stats-section-heading"><div className="professional-list-heading"><span className="professional-section-icon" aria-hidden="true"><ListOrdered size={22}/></span><h2>Recorrido de la sesión</h2></div><span className="soft-label">Creada el {new Date(session.createdAt).toLocaleDateString('es-ES')}</span></header>
      {session.note && <p className="session-note">{session.note}</p>}
      <ol>{session.steps.map((step, index) => {
        const result = ready ? data.steps[index] : undefined;
        return <li key={index}><span className="session-step-number">{index + 1}</span>
          <div><h3>{getExerciseById(step.exerciseId)?.title}</h3><p>Nivel {step.level} · {result || index < session.completedCount ? 'Completado' : session.status === 'cancelled' ? 'Sin realizar' : 'Pendiente'}</p>
          {result && <small>{formatActivityDate(result.date).day}{formatActivityDate(result.date).time ? ' · ' + formatActivityDate(result.date).time : ''}</small>}</div>
          <div className="session-result-metrics">{result ? <><strong>{result.totalQuestions ? number(result.correctAnswers / result.totalQuestions * 100) + ' %' : '—'}</strong><span>{result.correctAnswers}/{result.totalQuestions} aciertos · {number(result.durationSeconds)} s</span></> : <span>{index < session.completedCount ? ready ? 'Resultado no disponible' : '—' : 'Sin datos todavía'}</span>}</div>
          <button className="header-icon-btn session-explore session-eeg-action" disabled={!result} title={result ? 'Ver EEG y analíticas' : 'Disponible al guardar el resultado'} aria-label={`Ver EEG y analíticas del ejercicio ${index + 1}: ${getExerciseById(step.exerciseId)?.title}`} onClick={() => { if (result) setSelectedResult(result); }}><Activity size={20}/></button>
        </li>;
      })}</ol>
    </section>
  </section>;
}
