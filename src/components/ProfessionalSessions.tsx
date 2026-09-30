import { ProfessionalPageHeader } from './ProfessionalPageHeader';
import { useEffect, useMemo, useState } from 'react';
import { getFirestore } from 'firebase/firestore';
import { ArrowDown, ArrowUp, Plus, Trash2, X, ListOrdered, ChartNoAxesCombined, Pencil } from 'lucide-react';
import { auth } from '../services/firebase';
import { firestoreSessions } from '../services/firestoreSessions';
import { validateSessionDraft, type AssignedSession, type SessionDraft, type SessionLink, sessionStatusLabel } from '../services/assignedSessions';
import { EXERCISE_IDS } from '../services/difficulty';
import { getExerciseById } from '../services/exerciseCatalog';
import type { ExerciseId } from '../types';
import { TabletPager } from './TabletTabs';
import { useViewportPanel } from '../services/viewport';
import { SessionAnalytics } from './SessionAnalytics';
import { ModalFrame } from './ModalFrame';

export function SessionSteps({ session, completedSteps }: { session: SessionDraft & { completedCount?: number }; completedSteps?: ReadonlySet<number> }) {
  return <ol className="session-steps">{session.steps.map((step, index) => <li key={index}><span>{getExerciseById(step.exerciseId)?.title}</span><span className="soft-label">Nivel {step.level}{(completedSteps?.has(index) || index < (session.completedCount ?? 0)) ? ' · Completado' : ''}</span></li>)}</ol>;
}
function Composer({ initial, onClose, onPublish }: { initial?: AssignedSession; onClose: () => void; onPublish: (id: string, draft: SessionDraft) => Promise<void> }) {
  const [id] = useState(() => initial?.id ?? crypto.randomUUID());
  const [draft, setDraft] = useState<SessionDraft>(() => initial ? { title: initial.title, note: initial.note, steps: initial.steps.map(step => ({ ...step })) } : { title: '', note: '', steps: [{ exerciseId: 'visual-scanning', level: 1 }] });
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState('');
  const change = (index: number, patch: Partial<SessionDraft['steps'][number]>) => setDraft(value => ({ ...value, steps: value.steps.map((step, i) => i === index ? { ...step, ...patch } : step) }));
  const move = (index: number, delta: number) => setDraft(value => { const steps = [...value.steps]; [steps[index], steps[index + delta]] = [steps[index + delta], steps[index]]; return { ...value, steps }; });
  const close = () => { if (!busy) onClose(); };
  return <ModalFrame labelledBy="session-compose-title" onClose={close}><section className="session-composer session-builder">
    <header className="session-compose-header"><span className="session-compose-icon"><ListOrdered size={24}/></span><div><h2 id="session-compose-title">{review ? 'Revisar sesión' : initial ? 'Editar sesión' : 'Nueva sesión'}</h2><p>{review ? 'Todo listo para compartir.' : 'Prepara una propuesta a su ritmo.'}</p></div><button className="header-icon-btn" aria-label="Cerrar" disabled={busy} onClick={close}><X size={22}/></button></header>
    <form onSubmit={async event => {
      event.preventDefault(); if (busy) return; setError('');
      try { const valid = validateSessionDraft(draft); setDraft(valid); if (!review) { setReview(true); return; } setBusy(true); setAttempted(true); await onPublish(id, valid); onClose(); }
      catch (error) { setError(review && initial && error instanceof Error && !('code' in error) ? error.message : review ? 'No hemos podido compartir la sesión. Comprueba la conexión y vuelve a intentarlo.' : 'Añade un título y entre 1 y 8 juegos con nivel del 1 al 10.'); }
      finally { setBusy(false); }
    }}>
      {review ? <><h3>{draft.title}</h3>{draft.note && <p className="session-note">{draft.note}</p>}<SessionSteps session={draft}/><p>Podrás editarla mientras no haya empezado.</p></> : <>
        <div className="session-details"><label>Título de la sesión<input autoFocus required maxLength={80} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="Por ejemplo, un rato de memoria" /></label>
        <label><span>Mensaje <span className="soft-label">(opcional)</span></span><textarea maxLength={280} rows={1} value={draft.note} onChange={event => setDraft({ ...draft, note: event.target.value })} placeholder="Un mensaje para acompañar la sesión" /></label></div>
        <div className="session-games-heading"><h3>Juegos de la sesión</h3><span className="soft-label">{draft.steps.length} / 8</span></div>
        <ol className="session-draft-steps">{draft.steps.map((step, index) => <li key={index}>
          <span className="session-step-number" aria-hidden="true">{index + 1}</span>
          <label className="session-select"><select aria-label={`Juego ${index + 1}`} value={step.exerciseId} onChange={event => change(index, { exerciseId: event.target.value as ExerciseId })}>{EXERCISE_IDS.map(id => <option key={id} value={id}>{getExerciseById(id)?.title}</option>)}</select></label>
          <label className="session-select session-level-select"><select value={step.level} aria-label={`Nivel del juego ${index + 1}`} onChange={event => change(index, { level: Number(event.target.value) })}>{Array.from({ length: 10 }, (_, i) => <option key={i} value={i + 1}>Nivel {i + 1}</option>)}</select></label>
          <div className="proposal-actions"><button type="button" className="stats-quiet-button" disabled={index === 0} aria-label={`Subir juego ${index + 1}`} onClick={() => move(index, -1)}><ArrowUp size={18}/></button><button type="button" className="stats-quiet-button" disabled={index === draft.steps.length - 1} aria-label={`Bajar juego ${index + 1}`} onClick={() => move(index, 1)}><ArrowDown size={18}/></button><button type="button" className="stats-quiet-button" disabled={draft.steps.length === 1} aria-label={`Quitar juego ${index + 1}`} onClick={() => setDraft({ ...draft, steps: draft.steps.filter((_, i) => i !== index) })}><Trash2 size={18}/></button></div>
        </li>)}</ol>
        <button type="button" className="stats-quiet-button session-add-game" disabled={draft.steps.length >= 8} onClick={() => setDraft({ ...draft, steps: [...draft.steps, { exerciseId: 'memory-pairs', level: 1 }] })}><Plus size={18}/>Añadir juego</button>
      </>}
      {error && <p role="alert">{error}</p>}
      <footer className="proposal-actions session-compose-footer">{review && !attempted && <button type="button" className="stats-quiet-button" disabled={busy} onClick={() => setReview(false)}>Volver a editar</button>}<button className="touch-btn touch-btn-primary" disabled={busy}>{busy ? 'Compartiendo…' : review ? initial ? 'Guardar cambios' : 'Compartir sesión' : 'Revisar sesión'}</button></footer>
    </form>
  </section></ModalFrame>;
}
export function ProfessionalSessions({ link, name, onBack }: { link: SessionLink; name: string; onBack: () => void }) {
  const panel = useViewportPanel<HTMLElement>();
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const { professionalId, seatId, patientId } = link;
  const adapter = useMemo(() => firestoreSessions(getFirestore(auth.app), { professionalId, seatId, patientId }), [professionalId, seatId, patientId]);
  const [sessions, setSessions] = useState<AssignedSession[] | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [compose, setCompose] = useState(false);
  const [editing, setEditing] = useState<AssignedSession | null>(null);
  const [cancel, setCancel] = useState<AssignedSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancelError, setCancelError] = useState('');
  useEffect(() => adapter.watch(values => { setSessions(values); setError(''); }, () => { setSessions(null); setError('No hemos podido consultar las sesiones. Comprueba la conexión y que la invitación siga activa.'); }), [adapter, retry]);
  const pageSize = 5;
  const currentPage = Math.min(page, Math.max(0, Math.ceil((sessions?.length ?? 0) / pageSize) - 1));
  const selectedSession = sessions?.find(session => session.id === selected);
  if (selectedSession) return <main ref={panel} className="professional-panel tablet-screen"><SessionAnalytics key={selectedSession.id} session={selectedSession} name={name} loadResults={adapter.loadResults} onBack={() => setSelected(null)}/></main>;
  return <main ref={panel} className="professional-panel tablet-screen">
    <ProfessionalPageHeader title="Sesiones" icon={<ListOrdered size={24}/>} name={name} backLabel="Volver al panel" onBack={onBack} action={<button className="touch-btn touch-btn-primary" disabled={!sessions} onClick={() => setCompose(true)}><Plus size={20}/>Nueva sesión</button>}/>
    {error ? <div className="professional-notice" role="alert"><p>{error}</p><button className="stats-quiet-button" onClick={() => setRetry(value => value + 1)}>Reintentar</button></div> : !sessions ? <p role="status">Cargando sesiones…</p> : !sessions.length ? <section className="stats-card professional-empty"><ListOrdered size={36} aria-hidden="true"/><h2>Aún no hay sesiones propuestas</h2><p>Combina juegos, elige sus niveles y comparte la propuesta con {name}.</p></section> : <>
      <section className="stats-card professional-session-list" aria-labelledby="professional-sessions-title">
        <div className="professional-list-heading"><span className="professional-section-icon" aria-hidden="true"><ListOrdered size={22}/></span><h2 id="professional-sessions-title">Sesiones propuestas</h2><span className="stats-count">{sessions.length}</span></div>
        <div className="session-list-labels" aria-hidden="true"><span>Fecha</span><span>Nombre</span><span>Acciones</span></div>
        <ul>{sessions.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(session => <li key={session.id}>
          <time dateTime={new Date(session.createdAt).toISOString()}>{new Date(session.createdAt).toLocaleDateString('es-ES')}</time><div><h3>{session.title}</h3><span className="professional-session-status">{sessionStatusLabel[session.status]} · {session.steps.length} juegos</span></div>
          <div className="proposal-actions"><button className="header-icon-btn session-explore" aria-label={`Ver analíticas de ${session.title}`} title="Ver analíticas" onClick={() => setSelected(session.id)}><ChartNoAxesCombined size={20}/></button>
          <button className="header-icon-btn" disabled={session.status !== 'assigned'} aria-label={`Editar sesión ${session.title}`} title={session.status === 'assigned' ? 'Editar sesión' : 'Solo se pueden editar sesiones sin empezar'} onClick={() => setEditing(session)}><Pencil size={20}/></button>
          {['assigned', 'in-progress'].includes(session.status) && <button className="header-icon-btn" aria-label={`Cancelar sesión ${session.title}`} title="Cancelar sesión" onClick={() => { setCancel(session); setCancelError(''); }}><Trash2 size={20}/></button>}</div>
        </li>)}</ul>
      </section>
      <TabletPager page={currentPage} pages={Math.ceil(sessions.length / pageSize)} onChange={setPage} label="Sesiones propuestas"/>
      {sessions.length === 50 && <p>Mostramos las últimas 50 sesiones.</p>}
    </>}
    {editing && <Composer initial={editing} onClose={() => setEditing(null)} onPublish={(_, draft) => adapter.edit(editing, draft)}/>}
    {compose && <Composer onClose={() => setCompose(false)} onPublish={adapter.publish}/>}
    {cancel && <ModalFrame labelledBy="session-cancel-title" onClose={() => { if (!busy) setCancel(null); }}><section className="session-composer"><h2 id="session-cancel-title">¿Cancelar «{cancel.title}»?</h2><p>La persona dejará de ver esta propuesta disponible. Los ejercicios que haya completado se conservarán en su actividad.</p>{cancelError && <p role="alert">{cancelError}</p>}<div className="proposal-actions"><button className="stats-quiet-button" disabled={busy} onClick={() => setCancel(null)}>Volver</button><button className="touch-btn touch-btn-primary" disabled={busy} onClick={async () => { setBusy(true); try { await adapter.cancel(cancel.id); setCancel(null); } catch { setCancelError('No hemos podido cancelarla. Vuelve a intentarlo.'); } finally { setBusy(false); } }}>{busy ? 'Cancelando…' : 'Cancelar sesión'}</button></div></section></ModalFrame>}
  </main>;
}
