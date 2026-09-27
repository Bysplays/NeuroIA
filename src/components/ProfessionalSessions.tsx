import { useEffect, useMemo, useState } from 'react';
import { getFirestore } from 'firebase/firestore';
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import { auth } from '../services/firebase';
import { firestoreSessions } from '../services/firestoreSessions';
import { sessionStatusLabel, validateSessionDraft, type AssignedSession, type SessionDraft, type SessionLink } from '../services/assignedSessions';
import { EXERCISE_IDS } from '../services/difficulty';
import { getExerciseById } from '../services/exerciseCatalog';
import type { ExerciseId } from '../types';
import { ModalFrame } from './ModalFrame';

export function SessionSteps({ session }: { session: SessionDraft & { completedCount?: number } }) {
  return <ol className="session-steps">{session.steps.map((step, index) => <li key={index}><span>{getExerciseById(step.exerciseId)?.title}</span><span className="soft-label">Nivel {step.level}{index < (session.completedCount ?? 0) ? ' · Completado' : ''}</span></li>)}</ol>;
}
function Composer({ onClose, onPublish }: { onClose: () => void; onPublish: (id: string, draft: SessionDraft) => Promise<void> }) {
  const [id] = useState(() => crypto.randomUUID());
  const [draft, setDraft] = useState<SessionDraft>({ title: '', note: '', steps: [{ exerciseId: 'visual-scanning', level: 1 }] });
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState('');
  const change = (index: number, patch: Partial<SessionDraft['steps'][number]>) => setDraft(value => ({ ...value, steps: value.steps.map((step, i) => i === index ? { ...step, ...patch } : step) }));
  const move = (index: number, delta: number) => setDraft(value => { const steps = [...value.steps]; [steps[index], steps[index + delta]] = [steps[index + delta], steps[index]]; return { ...value, steps }; });
  const close = () => { if (!busy) onClose(); };
  return <ModalFrame labelledBy="session-compose-title" onClose={close}><section className="session-composer">
    <header className="proposal-heading"><h2 id="session-compose-title">{review ? 'Revisar sesión' : 'Nueva sesión'}</h2><button className="stats-quiet-button" aria-label="Cerrar" disabled={busy} onClick={close}><X size={22}/></button></header>
    <form onSubmit={async event => {
      event.preventDefault(); if (busy) return; setError('');
      try { const valid = validateSessionDraft(draft); setDraft(valid); if (!review) { setReview(true); return; } setBusy(true); setAttempted(true); await onPublish(id, valid); onClose(); }
      catch { setError(review ? 'No hemos podido compartir la sesión. Comprueba la conexión y vuelve a intentarlo.' : 'Añade un título y entre 1 y 8 juegos con nivel del 1 al 10.'); }
      finally { setBusy(false); }
    }}>
      {review ? <><h3>{draft.title}</h3>{draft.note && <p className="session-note">{draft.note}</p>}<SessionSteps session={draft}/><p>Una vez compartida, podrás cancelarla y crear otra propuesta.</p></> : <>
        <label>Título de la sesión<input autoFocus required maxLength={80} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="Por ejemplo, un rato de memoria" /></label>
        <label>Mensaje de acompañamiento <span className="soft-label">(opcional)</span><textarea maxLength={280} rows={2} value={draft.note} onChange={event => setDraft({ ...draft, note: event.target.value })} placeholder="A tu ritmo. Puedes hacer una pausa cuando quieras." /></label>
        <p className="soft-label">Elige hasta 8 juegos y ordénalos como quieras.</p>
        <ol className="session-draft-steps">{draft.steps.map((step, index) => <li key={index}>
          <label>Juego {index + 1}<select value={step.exerciseId} onChange={event => change(index, { exerciseId: event.target.value as ExerciseId })}>{EXERCISE_IDS.map(id => <option key={id} value={id}>{getExerciseById(id)?.title}</option>)}</select></label>
          <label>Nivel<select value={step.level} aria-label={`Nivel del juego ${index + 1}`} onChange={event => change(index, { level: Number(event.target.value) })}>{Array.from({ length: 10 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label>
          <div className="proposal-actions"><button type="button" className="stats-quiet-button" disabled={index === 0} aria-label={`Subir juego ${index + 1}`} onClick={() => move(index, -1)}><ArrowUp size={18}/></button><button type="button" className="stats-quiet-button" disabled={index === draft.steps.length - 1} aria-label={`Bajar juego ${index + 1}`} onClick={() => move(index, 1)}><ArrowDown size={18}/></button><button type="button" className="stats-quiet-button" disabled={draft.steps.length === 1} aria-label={`Quitar juego ${index + 1}`} onClick={() => setDraft({ ...draft, steps: draft.steps.filter((_, i) => i !== index) })}><Trash2 size={18}/></button></div>
        </li>)}</ol>
        <button type="button" className="stats-quiet-button" disabled={draft.steps.length >= 8} onClick={() => setDraft({ ...draft, steps: [...draft.steps, { exerciseId: 'memory-pairs', level: 1 }] })}><Plus size={18}/>Añadir juego</button>
      </>}
      {error && <p role="alert">{error}</p>}
      <footer className="proposal-actions">{review && !attempted && <button type="button" className="stats-quiet-button" disabled={busy} onClick={() => setReview(false)}>Volver a editar</button>}<button className="touch-btn touch-btn-primary" disabled={busy}>{busy ? 'Compartiendo…' : review ? 'Compartir sesión' : 'Revisar sesión'}</button></footer>
    </form>
  </section></ModalFrame>;
}
export function ProfessionalSessions({ link, name, onBack }: { link: SessionLink; name: string; onBack: () => void }) {
  const { professionalId, seatId, patientId } = link;
  const adapter = useMemo(() => firestoreSessions(getFirestore(auth.app), { professionalId, seatId, patientId }), [professionalId, seatId, patientId]);
  const [sessions, setSessions] = useState<AssignedSession[] | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [compose, setCompose] = useState(false);
  const [cancel, setCancel] = useState<AssignedSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancelError, setCancelError] = useState('');
  useEffect(() => adapter.watch(values => { setSessions(values); setError(''); }, () => { setSessions(null); setError('No hemos podido consultar las sesiones. Comprueba la conexión y que la invitación siga activa.'); }), [adapter, retry]);
  return <main className="professional-panel"><div><button className="paper-nav-button" onClick={onBack}><ArrowLeft size={20}/>Volver al panel</button></div>
    <header className="proposal-heading"><h1>Sesiones de {name}</h1><button className="touch-btn touch-btn-primary" disabled={!sessions} onClick={() => setCompose(true)}><Plus size={20}/>Nueva sesión</button></header>
    {error ? <div className="professional-notice" role="alert"><p>{error}</p><button className="stats-quiet-button" onClick={() => setRetry(value => value + 1)}>Reintentar</button></div> : !sessions ? <p role="status">Cargando sesiones…</p> : !sessions.length ? <section className="stats-card professional-empty"><h2>Aún no hay sesiones propuestas</h2><p>Combina juegos, elige sus niveles y comparte la propuesta con {name}.</p></section> : <>
      {sessions.map(session => <article className="stats-card session-card" key={session.id}><header className="proposal-heading"><h2>{session.title}</h2><span className="soft-label">{sessionStatusLabel[session.status]} · {session.completedCount}/{session.steps.length}</span></header>{session.note && <p className="session-note">{session.note}</p>}<SessionSteps session={session}/><footer className="proposal-heading"><span className="soft-label">Compartida el {new Date(session.createdAt).toLocaleDateString('es-ES')}</span>{['assigned', 'in-progress'].includes(session.status) && <button className="stats-quiet-button" onClick={() => { setCancel(session); setCancelError(''); }}>Cancelar sesión</button>}</footer></article>)}
      {sessions.length === 50 && <p>Mostramos las últimas 50 sesiones.</p>}
    </>}
    {compose && <Composer onClose={() => setCompose(false)} onPublish={adapter.publish}/>}
    {cancel && <ModalFrame labelledBy="session-cancel-title" onClose={() => { if (!busy) setCancel(null); }}><section className="session-composer"><h2 id="session-cancel-title">¿Cancelar «{cancel.title}»?</h2><p>La persona dejará de ver esta propuesta disponible. Los ejercicios que haya completado se conservarán en su actividad.</p>{cancelError && <p role="alert">{cancelError}</p>}<div className="proposal-actions"><button className="stats-quiet-button" disabled={busy} onClick={() => setCancel(null)}>Volver</button><button className="touch-btn touch-btn-primary" disabled={busy} onClick={async () => { setBusy(true); try { await adapter.cancel(cancel.id); setCancel(null); } catch { setCancelError('No hemos podido cancelarla. Vuelve a intentarlo.'); } finally { setBusy(false); } }}>{busy ? 'Cancelando…' : 'Cancelar sesión'}</button></div></section></ModalFrame>}
  </main>;
}
