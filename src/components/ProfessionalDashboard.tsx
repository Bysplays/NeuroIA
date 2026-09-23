import { ProfileSwitch } from './ProfileSwitch';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getFirestore } from 'firebase/firestore';
import { Copy, Plus, Users } from 'lucide-react';
import { auth } from '../services/firebase';
import { billingEnabled, billingRequest } from '../services/accessService';
import { firestoreProfessional, type ProfessionalSeat } from '../services/firestoreProfessional';
import type { ExerciseResult } from '../types';
import { ActivityStatistics } from './ActivityStatistics';
import { AppLoading } from './AppLoading';
import { ProductInformation } from './ProductInformation';

function PersonActivity({ uid, seat, onBack }: { uid: string; seat: ProfessionalSeat; onBack: () => void }) {
  const [activity, setActivity] = useState<{ name: string; history: ExerciseResult[] } | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => firestoreProfessional(uid, getFirestore(auth.app)).subscribeActivity(seat.occupantUid!, setActivity, () => {
    setActivity(null); setError(true);
  }), [uid, seat.occupantUid]);
  if (error) return <section className="cloud-entry"><h1>No hemos podido consultar esta actividad</h1><p role="alert">Comprueba la conexión y que la invitación siga activa.</p><button className="stats-quiet-button" onClick={onBack}>Volver al panel</button></section>;
  if (!activity) return <AppLoading />;
  return <ActivityStatistics uid={seat.occupantUid!} history={activity.history} heading={`Actividad de ${activity.name || seat.patientName || 'la persona invitada'}`} backLabel="Volver al panel" onBack={onBack} />;
}

export function ProfessionalDashboard({ uid, onSignOut }: { uid: string; onSignOut: () => void }) {
  const adapter = useMemo(() => firestoreProfessional(uid, getFirestore(auth.app)), [uid]);
  const [seats, setSeats] = useState<ProfessionalSeat[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now);
  const [checkoutReturn, setCheckoutReturn] = useState(() => new URLSearchParams(location.search).get('seatCheckout'));
  const locked = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const unsubscribe = adapter.subscribeSeats(values => { setSeats(values); setLoadError(false); }, () => { setSeats(null); setLoadError(true); });
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { alive.current = false; unsubscribe(); clearInterval(timer); };
  }, [adapter, retry]);
  const active = (seat: ProfessionalSeat) => seat.status === 'active' && seat.expiresAt > now;
  const pending = seats?.find(seat => seat.status === 'pending');
  const people = seats?.filter(seat => seat.occupantUid) || [];
  const currentSeat = seats?.find(seat => seat.occupantUid === selected && seat.occupantUid && active(seat));
  const returnToPanel = () => { setSelected(null); window.scrollTo(0, 0); };
  const clearReturn = () => {
    const url = new URL(location.href); url.searchParams.delete('seatCheckout');
    window.history.replaceState(null, '', url); setCheckoutReturn(null);
  };
  const run = async (action: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try { await action(); }
    catch (cause) { if (alive.current) setError(cause instanceof Error ? cause.message : 'No hemos podido completar la acción. Vuelve a intentarlo.'); }
    finally { locked.current = false; if (alive.current) setBusy(false); }
  };
  const redirect = async (path: string, body?: object) => {
    const result = await billingRequest(path, body);
    const url = new URL(result.url);
    if (url.protocol !== 'https:' || !['checkout.stripe.com', 'billing.stripe.com'].includes(url.hostname)) throw new Error('No hemos podido abrir el pago.');
    if (alive.current) window.location.assign(url.href);
  };
  const copy = (seat: ProfessionalSeat) => void run(async () => {
    try { await navigator.clipboard.writeText(seat.invitationCode); if (alive.current) setCopied(seat.id); }
    catch { throw new Error('No hemos podido copiar el código. Puedes seleccionarlo y copiarlo manualmente.'); }
  });
  return <div className="professional-workspace">
    <header className="main-header">
      <button className="header-left" onClick={returnToPanel} aria-label="NeuroIA, volver al panel profesional"><img src={`${import.meta.env.BASE_URL}brand/neuroia-mark.svg`} alt="" width="32" height="40"/><span className="header-title">Neuro<span className="brand-light">IA</span></span></button>
      <div className="professional-account-actions"><ProfileSwitch /><button className="stats-quiet-button" onClick={onSignOut}>Cerrar sesión</button></div>
    </header>
    {currentSeat ? <PersonActivity key={currentSeat.occupantUid} uid={uid} seat={currentSeat} onBack={returnToPanel} /> : <main className="professional-panel">
      <div className="professional-heading"><h1>Espacio profesional</h1>
        <button className="touch-btn touch-btn-primary" disabled={!billingEnabled || !seats || busy} onClick={() => void run(() => redirect('/professional/checkout', { seatId: pending?.id || crypto.randomUUID() }))}><Plus size={20}/>{busy ? 'Un momento…' : pending ? 'Continuar compra' : 'Comprar un asiento'}</button>
      </div>
      {checkoutReturn && <div className="professional-notice" role="status"><p>{checkoutReturn === 'cancelled' ? 'La compra no se ha completado. Puedes retomarla o cancelarla.' : 'El código estará disponible en «Tus asientos» cuando se confirme el pago.'}</p><button className="stats-quiet-button" onClick={clearReturn}>Cerrar aviso</button></div>}
      {error && <p className="professional-notice" role="alert">{error}</p>}
      {!billingEnabled && <p className="entry-note">La compra de asientos todavía no está disponible.</p>}
      {loadError ? <div className="professional-notice" role="alert"><p>No hemos podido cargar tus asientos.</p><button className="stats-quiet-button" onClick={() => { setLoadError(false); setRetry(value => value + 1); }}>Reintentar</button></div> : !seats ? <p role="status">Cargando tu panel…</p> : <>
        <section className="stats-card professional-people" aria-labelledby="professional-people-title"><h2 id="professional-people-title">Personas vinculadas <span className="stats-count">{people.length}</span></h2>
          {!people.length ? <div className="professional-empty"><Users size={36} aria-hidden="true"/><h3>Aún no hay personas vinculadas</h3><p>Compra un asiento y comparte su código. Cuando una persona lo use, podrás consultar aquí su actividad.</p></div> : <ul className="professional-person-list">{people.map(seat => <li key={seat.id}><div><h3>{seat.patientName || 'Persona invitada'}</h3><p>{active(seat) ? 'Invitación activa' : 'Asiento sin acceso activo'}</p></div><button className="stats-quiet-button" disabled={!active(seat)} onClick={() => { setSelected(seat.occupantUid); window.scrollTo(0, 0); }}>Ver actividad</button></li>)}</ul>}
        </section>
        <section className="stats-card professional-seats" aria-labelledby="professional-seats-title"><div className="stats-section-heading"><div><h2 id="professional-seats-title">Tus asientos</h2></div>{seats.some(seat => seat.subscriptionId) && <button className="stats-quiet-button" disabled={!billingEnabled || busy} onClick={() => void run(() => redirect('/professional/portal'))}>Gestionar suscripciones</button>}</div>
          {!seats.length ? <p>Todavía no has comprado asientos.</p> : <ul className="professional-seat-list">{seats.map((seat, index) => <li key={seat.id}><div className="professional-seat-details"><h3>Asiento {seats.length - index}</h3><p>{seat.status === 'pending' ? 'Pago pendiente' : seat.status === 'cancelled' ? 'Compra cancelada' : active(seat) ? seat.occupantUid ? `Asignado a ${seat.patientName || 'una persona'}` : 'Disponible para invitar' : 'Suscripción inactiva'}</p>{seat.expiresAt > 0 && <p>Hasta el {new Date(seat.expiresAt).toLocaleDateString('es-ES')}{seat.autoRenew && '. Renovación automática'}</p>}</div>
            {active(seat) && !seat.occupantUid && <div className="professional-code"><label htmlFor={`seat-${seat.id}`}>Código de invitación</label><div><input id={`seat-${seat.id}`} value={seat.invitationCode} readOnly onFocus={event => event.target.select()}/><button className="stats-quiet-button" disabled={busy} onClick={() => copy(seat)} aria-label={`Copiar código del asiento ${seats.length - index}`}><Copy size={18}/>{copied === seat.id ? 'Copiado' : 'Copiar'}</button></div></div>}
            {seat.status === 'pending' && <button className="stats-quiet-button" disabled={!billingEnabled || busy} onClick={() => void run(async () => { await billingRequest('/professional/cancel-checkout'); if (alive.current) clearReturn(); })}>Cancelar compra pendiente</button>}
          </li>)}</ul>}
        </section>
      </>}
      <ProductInformation />
    </main>}
  </div>;
}
