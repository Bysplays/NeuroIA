import { exerciseStages } from '../services/sessionProgress';
import { gameConfig } from '../services/difficulty';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getFirestore } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';
import { auth } from '../services/firebase';
import { firestoreSessions } from '../services/firestoreSessions';
import { assignmentResult, matchesAssignedStep, completedSessionSteps, type AssignedSession, type SessionLink } from '../services/assignedSessions';
import { DIFFICULTY_VERSION } from '../services/difficulty';
import type { ProgressSync } from '../services/progressSync';
import type { UserProfile, ExerciseResult } from '../types';
import { GameSession } from './GameSession';
import { GameExercise } from './GameExercise';
import { TabletPager } from './TabletTabs';
import { SessionSteps } from './ProfessionalSessions';

function useAdapter({ professionalId, seatId, patientId }: SessionLink) {
  return useMemo(() => firestoreSessions(getFirestore(auth.app), { professionalId, seatId, patientId }), [professionalId, seatId, patientId]);
}
export function AssignedSessionInbox({ link, onStart }: { link: SessionLink; onStart: (session: AssignedSession) => void }) {
  const adapter = useAdapter(link);
  const [sessions, setSessions] = useState<AssignedSession[] | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => adapter.watch(values => { setSessions(values); setError(false); }, () => { setSessions(null); setError(true); }, true), [adapter, retry]);
  const [page, setPage] = useState(0);
  const available = sessions?.filter(session => ['assigned', 'in-progress'].includes(session.status));
  const currentPage = Math.min(page, Math.max(0, (available?.length ?? 0) - 1));
  const shown = available?.[currentPage];
  const shownId = shown?.id;
  const [archive, setArchive] = useState<{ id: string; results: ExerciseResult[] }>();
  useEffect(() => shownId ? adapter.watchResults(shownId, results => setArchive({ id: shownId, results }), () => setArchive(undefined)) : undefined, [adapter, shownId]);
  const completed = shown ? completedSessionSteps(shown, archive && archive.id === shownId ? archive.results : []) : new Set<number>();
  return <section className="session-inbox" aria-labelledby="assigned-inbox-title"><header className="proposal-heading"><h2 id="assigned-inbox-title">Sesiones propuestas para ti</h2><button className="stats-quiet-button session-refresh" onClick={() => { setError(false); setSessions(null); setRetry(value => value + 1); }}>Refrescar</button></header>
    {error ? <div className="professional-notice" role="alert"><p>No hemos podido consultar tus sesiones propuestas.</p></div> : !sessions ? <p role="status">Buscando sesiones…</p> : !available?.length ? <div className="professional-notice" role="status"><p>Aún no tienes sesiones propuestas.</p></div> : available.slice(currentPage, currentPage + 1).map(session => <article className="stats-card session-card" key={session.id}><header className="proposal-heading"><div><span className="soft-label">Propuesta de {session.professionalName}</span><h3>{session.title}</h3></div><span className="soft-label">{completed.size} de {session.steps.length} completados</span></header>{session.note && <p className="session-note">{session.note}</p>}<SessionSteps session={session} completedSteps={completed}/><button className="touch-btn touch-btn-primary" disabled={session.configVersion !== DIFFICULTY_VERSION} onClick={() => onStart(session)}>{session.completedCount || session.status === 'in-progress' ? 'Retomar sesión' : 'Empezar sesión'}</button>{session.configVersion !== DIFFICULTY_VERSION && <p>Actualiza la aplicación para abrir esta sesión.</p>}</article>)}
    <TabletPager page={currentPage} pages={available?.length ?? 0} onChange={setPage} label="Sesiones propuestas"/>
    {sessions?.length === 50 && <p className="soft-label">Mostramos hasta 50 sesiones pendientes.</p>}
  </section>;
}
export function AssignedSessionPlayer({ selected, profile, sync, onBack, externalPause = false, singleStep }: { singleStep?: number; selected: AssignedSession; profile: UserProfile; sync: ProgressSync; onBack: () => void; externalPause?: boolean }) {
  const adapter = useAdapter(selected);
  const [session, setSession] = useState<AssignedSession | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [savedLocally, setSavedLocally] = useState(false);
  const [confirmedStep, setConfirmedStep] = useState<number | null>(null);
  const reconcile = useRef<() => void>(() => {});
  const indexRef = useRef<number | null>(null);
  const alive = useRef(false);
  useEffect(() => {
    alive.current = true;
    let current = true, running = false;
    const accept = (value: AssignedSession | null) => {
      if (!current) return;
      setSession(previous => previous && value && (previous.updatedAt ?? 0) > (value.updatedAt ?? 0) ? previous : value);
      setError(value ? '' : 'Esta sesión ya no está disponible.');
    };
    const recover = async () => {
      if (!current || running) return;
      running = true;
      try {
        let value = await adapter.load(selected.id);
        if (!value) throw new Error('missing');
        if (value.status === 'assigned') await adapter.start(selected.id);
        // The archived result survives a reload between saving and advancing.
        for (let i = 0; i < 8; i++) {
          const next = await adapter.advance(selected.id);
          if (next.completedCount === value.completedCount || next.status !== 'in-progress') { value = next; break; }
          value = next;
        }
        if (!current) return;
        value = await adapter.load(selected.id);
        if (!current || !value) return;
        const chosen = indexRef.current ?? singleStep ?? value.completedCount;
        const results = await adapter.loadResults(value);
        if (!current) return;
        setConfirmedStep(results.some(result => matchesAssignedStep(value!, chosen, result)) ? chosen : null);
        accept(value);
        if (indexRef.current === null) { indexRef.current = chosen; setIndex(chosen); }
      } catch { if (current) setError('No hemos podido confirmar el avance. Comprueba la conexión y vuelve a intentarlo.'); }
      finally { running = false; }
    };
    reconcile.current = () => { void recover(); };
    const unsubscribe = adapter.watchOne(selected.id, accept, () => { if (current) setError('No hemos podido comprobar la sesión. Recupera la conexión para continuar.'); });
    void recover();
    window.addEventListener('online', reconcile.current);
    return () => { current = false; alive.current = false; unsubscribe(); window.removeEventListener('online', reconcile.current); };
  }, [adapter, selected.id, retry, singleStep]);
  useEffect(() => {
    if (!savedLocally || index === null || (session?.completedCount ?? 0) > index || session?.status === 'cancelled') return;
    const timer = window.setInterval(() => reconcile.current(), 3000);
    return () => clearInterval(timer);
  }, [savedLocally, index, session?.completedCount, session?.status]);
  const stopped = session?.status === 'cancelled' || (session && session.configVersion !== DIFFICULTY_VERSION);
  const done = session?.status === 'completed' && index === session.steps.length;
  const nextReady = session !== null && index !== null && (session.completedCount > index || confirmedStep === index) && !error;
  const step = index !== null ? session?.steps[index] : null;
  function save(result: ExerciseResult) {
    if (!alive.current || !session || index === null) return;
    const value = assignmentResult(session, index, result);
    sync.enqueue({ id: `result:${value.id}`, kind: 'result', result: value });
    setSavedLocally(true); reconcile.current();
  }
  return <section className="assigned-player">
    <header className="proposal-heading session-player-bar"><button className="paper-nav-button" onClick={onBack}><ArrowLeft size={20}/>Volver al inicio</button><p>{selected.title}</p></header>
    {error && <div className="professional-notice" role="alert"><p>{error}</p><button className="stats-quiet-button" onClick={() => { sync.retry(); setRetry(value => value + 1); }}>Reintentar</button></div>}
    {stopped ? <div className="professional-empty"><h1>{session?.status === 'cancelled' ? 'Esta propuesta se ha cancelado' : 'Actualiza la aplicación para continuar'}</h1><p>Los ejercicios completados se conservan en tu actividad.</p></div> : done ? <div className="professional-empty"><h1>Sesión completada</h1><p>Has terminado todos los juegos de esta propuesta.</p><button className="touch-btn touch-btn-primary" onClick={onBack}>Volver al inicio</button></div> : step && session && index !== null ? <>
      {savedLocally && !nextReady && !error && <p className="professional-notice" role="status">Guardando el ejercicio y confirmando el avance…</p>}
      {nextReady && !savedLocally && <div className="professional-notice" role="status"><p>Este ejercicio ya se ha completado en otro dispositivo.</p><button className="stats-quiet-button" onClick={() => { if (singleStep !== undefined) { onBack(); return; } indexRef.current = session.completedCount; setIndex(session.completedCount); }}>Continuar</button></div>}
      <div hidden={!!error || (nextReady && !savedLocally)}><GameSession progressScope={{ before: session.steps.slice(0, index).reduce((sum, item) => sum + exerciseStages(item.exerciseId, gameConfig(item.level)), 0), after: session.steps.slice(index + 1).reduce((sum, item) => sum + exerciseStages(item.exerciseId, gameConfig(item.level)), 0) }} key={index} id={step.exerciseId} initialLevel={step.level} lockedLevel nextReady={nextReady} paused={!!error || externalPause || (nextReady && !savedLocally)} step={`Ejercicio ${index + 1} de ${session.steps.length} · Sesión propuesta`} onBack={onBack}>
        <GameExercise id={step.exerciseId} profile={profile} onBack={onBack} onSaveResult={save} planProgress={singleStep === undefined ? { current: index + 1, total: session.steps.length, isLast: index + 1 === session.steps.length } : undefined} onNextPlanExercise={() => {
          if (!nextReady) return;
          setSavedLocally(false); indexRef.current = session.completedCount; setIndex(session.completedCount); window.scrollTo(0, 0);
        }}/>
      </GameSession></div>
    </> : !error && <p className="professional-empty" role="status">Preparando tu sesión…</p>}
  </section>;
}
