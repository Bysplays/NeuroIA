import { InformationPage, type InformationKind } from "./InformationPage";
import { Brand } from './Brand';
import { TabletTabs, TabletPager } from './TabletTabs';
import { useCompactViewport, useViewportPanel } from '../services/viewport';
import { ProfessionalSessions } from './ProfessionalSessions';
import { AccessibilityModal } from './AccessibilityModal';
import { applyAppearance } from '../services/appearance';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getFirestore } from 'firebase/firestore';
import { Copy, Plus, Settings, Users, UserRound, Armchair, ListOrdered, ChartNoAxesCombined, BriefcaseBusiness, CreditCard, CircleCheck, CirclePause } from 'lucide-react';
import { auth } from '../services/firebase';
import { billingEnabled, billingRequest } from '../services/accessService';
import { firestoreProfessional, type ProfessionalSeat } from '../services/firestoreProfessional';
import type { ExerciseResult, UserProfile, AccessibilitySettings } from '../types';
import { ActivityStatistics } from './ActivityStatistics';
import { AppLoading } from './AppLoading';

function PersonActivity({ uid, seat, onBack }: { uid: string; seat: ProfessionalSeat; onBack: () => void }) {
  const [activity, setActivity] = useState<{ name: string; history: ExerciseResult[]; levels?: UserProfile['gameLevels'] } | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => firestoreProfessional(uid, getFirestore(auth.app)).subscribeActivity(seat.occupantUid!, setActivity, () => {
    setActivity(null); setError(true);
  }), [uid, seat.occupantUid]);
  if (error) return <section className="cloud-entry"><h1>No hemos podido consultar esta actividad</h1><p role="alert">Comprueba la conexión y que la invitación siga activa.</p><button className="stats-quiet-button" onClick={onBack}>Volver al panel</button></section>;
  if (!activity) return <AppLoading />;
  return <ActivityStatistics uid={seat.occupantUid!} history={activity.history} levels={activity.levels} heading="Actividad" subtitle={activity.name || seat.patientName || 'Persona invitada'} backLabel="Volver al panel" onBack={onBack} />;
}

export function ProfessionalDashboard({ uid, onSignOut, profile, onUpdateSettings, onUpdateName }: {
  uid: string; onSignOut: () => void; profile: UserProfile;
  onUpdateSettings: (settings: Partial<AccessibilitySettings>) => void;
  onUpdateName: (name: string) => void;
}) {
  const panel = useViewportPanel<HTMLElement>();
  const [navigation, setNavigation] = useState<HTMLDivElement | null>(null);
  const [section, setSection] = useState('people');
  const [peoplePage, setPeoplePage] = useState(0);
  const [seatsPage, setSeatsPage] = useState(0);
  const compact = useCompactViewport();
  const pageSize = compact ? 2 : 3;
  const seatPageSize = compact ? 1 : 2;
  const [information, setInformation] = useState<InformationKind | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  useLayoutEffect(() => { applyAppearance(profile.settings); }, [profile.settings]);
  const adapter = useMemo(() => firestoreProfessional(uid, getFirestore(auth.app)), [uid]);
  const [seats, setSeats] = useState<ProfessionalSeat[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [personView, setPersonView] = useState<'activity' | 'sessions'>('activity');
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [clockError, setClockError] = useState(false);
  const [checkoutReturn, setCheckoutReturn] = useState(() => new URLSearchParams(location.search).get('seatCheckout'));
  const locked = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const unsubscribe = adapter.subscribeSeats(values => { setSeats(values); setLoadError(false); }, () => { setSeats(null); setLoadError(true); });
    let current = true;
    let request = 0;
    let anchor: { server: number; monotonic: number; wall: number; lifetime: number } | null = null;
    const tick = () => {
      if (!anchor) return;
      const elapsed = Math.max(performance.now() - anchor.monotonic, Date.now() - anchor.wall);
      if (elapsed >= anchor.lifetime) { anchor = null; setNow(null); setClockError(true); }
      else setNow(anchor.server + elapsed);
    };
    const confirmTime = async () => {
      const version = ++request;
      const started = performance.now();
      try {
        const value = await billingRequest<{ serverNow: number; validForMs: number }>('/professional/status');
        const elapsed = performance.now() - started;
        if (!current || version !== request) return;
        if (!Number.isFinite(value.serverNow) || !Number.isFinite(value.validForMs) || value.validForMs <= elapsed) throw new Error('expired-confirmation');
        anchor = { server: value.serverNow + elapsed, monotonic: performance.now(), wall: Date.now(), lifetime: Math.min(60000, value.validForMs) - elapsed };
        setClockError(false); tick();
      } catch { if (current && version === request) { anchor = null; setNow(null); setClockError(true); } }
    };
    const invalidate = () => { request++; anchor = null; setNow(null); setClockError(true); };
    const resume = () => { invalidate(); void confirmTime(); };
    const visible = () => { if (document.visibilityState === 'visible') resume(); };
    void confirmTime();
    const timer = window.setInterval(tick, 1000);
    const refresh = window.setInterval(() => { void confirmTime(); }, 30000);
    window.addEventListener('offline', invalidate);
    window.addEventListener('online', resume);
    window.addEventListener('focus', resume);
    document.addEventListener('visibilitychange', visible);
    return () => {
      current = false; alive.current = false; unsubscribe(); clearInterval(timer); clearInterval(refresh);
      window.removeEventListener('offline', invalidate); window.removeEventListener('online', resume); window.removeEventListener('focus', resume); document.removeEventListener('visibilitychange', visible);
    };
  }, [adapter, retry]);
  const active = (seat: ProfessionalSeat) => now !== null && seat.status === 'active' && seat.expiresAt > now;
  const pending = seats?.find(seat => seat.status === 'pending');
  const people = seats?.filter(seat => seat.occupantUid) || [];
  const currentPeoplePage = Math.min(peoplePage, Math.max(0, Math.ceil(people.length / pageSize) - 1));
  const currentSeatsPage = Math.min(seatsPage, Math.max(0, Math.ceil((seats?.length ?? 0) / seatPageSize) - 1));
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
  return <>{information && <InformationPage kind={information} onBack={() => setInformation(null)}/>}<div hidden={information !== null}><div className="professional-workspace">
    <header className="main-header">
      <button className="header-left" onClick={returnToPanel} aria-label="NeuroIA, volver al panel profesional"><Brand/></button>
      <div className="professional-account-actions"><button className="header-icon-btn header-icon-accessibility" aria-label="Ajustes de accesibilidad" title="Ajustar tamaño del texto y estilo de la página" onClick={() => setSettingsOpen(true)}><Settings size={20} /></button></div>
    </header>
    {currentSeat ? personView === 'sessions' ? <ProfessionalSessions key={currentSeat.id + currentSeat.occupantUid} link={{ professionalId: uid, seatId: currentSeat.id, patientId: currentSeat.occupantUid! }} name={currentSeat.patientName || 'la persona invitada'} onBack={returnToPanel}/> : <PersonActivity key={currentSeat.occupantUid} uid={uid} seat={currentSeat} onBack={returnToPanel} /> : <main ref={panel} className="professional-panel tablet-screen">
      <div className="professional-overview-heading"><header className="workspace-section-heading"><span className="workspace-section-icon"><BriefcaseBusiness size={26}/></span><div><h1>Espacio profesional</h1><p>Personas, propuestas y actividad.</p></div></header><button className="touch-btn touch-btn-primary" disabled={!billingEnabled || !seats || busy} onClick={() => void run(() => redirect('/professional/checkout', { seatId: pending?.id || crypto.randomUUID() }))}><Plus size={20}/>{busy ? 'Un momento…' : pending ? 'Continuar compra' : 'Comprar un asiento'}</button></div>
      {checkoutReturn && <div className="professional-notice" role="status"><p>{checkoutReturn === 'managed' ? 'Los cambios de tu suscripción aparecerán cuando se confirmen.' : checkoutReturn === 'cancelled' ? 'La compra no se ha completado. Puedes retomarla o cancelarla.' : 'El código estará disponible en «Tus asientos» cuando se confirme el pago.'}</p><button className="stats-quiet-button" onClick={clearReturn}>Cerrar aviso</button></div>}
      {clockError && <div className="professional-notice" role="alert"><p>No hemos podido comprobar la validez de los asientos. Los códigos y la actividad estarán disponibles al recuperar la conexión.</p><button className="stats-quiet-button" onClick={() => setRetry(value => value + 1)}>Reintentar</button></div>}
      {error && <p className="professional-notice" role="alert">{error}</p>}
      {!billingEnabled && <p className="entry-note">La compra de asientos todavía no está disponible.</p>}
      {loadError ? <div className="professional-notice" role="alert"><p>No hemos podido cargar tus asientos.</p><button className="stats-quiet-button" onClick={() => { setLoadError(false); setRetry(value => value + 1); }}>Reintentar</button></div> : !seats ? <p role="status">Cargando tu panel…</p> : <>
        <TabletTabs navigationTarget={navigation} label="Espacio profesional" value={section} onChange={setSection} tabs={[
        { id: 'people', label: 'Personas', icon: <Users size={18}/>, content: <>
        <section className="stats-card professional-people" aria-labelledby="professional-people-title"><div className="professional-list-heading"><span className="professional-section-icon"><Users size={22}/></span><h2 id="professional-people-title">Personas vinculadas</h2><span className="stats-count">{people.length}</span></div>
          {!people.length ? <div className="professional-empty"><Users size={36} aria-hidden="true"/><h3>Aún no hay personas vinculadas</h3><p>Compra un asiento y comparte su código. Cuando una persona lo use, podrás consultar aquí su actividad.</p></div> : <ul className="professional-person-list">{people.slice(currentPeoplePage * pageSize, (currentPeoplePage + 1) * pageSize).map(seat => <li key={seat.id}><div className="professional-person-identity"><span className="professional-avatar" aria-hidden="true"><UserRound size={24}/></span><div><h3>{seat.patientName || 'Persona invitada'}</h3><p className="professional-person-status">{active(seat) ? <CircleCheck size={14} aria-hidden="true"/> : <CirclePause size={14} aria-hidden="true"/>}{now === null ? 'Comprobando acceso…' : active(seat) ? 'Invitación activa' : 'Asiento sin acceso activo'}</p></div></div><div className="proposal-actions"><button className="header-icon-btn professional-person-action" title="Sesiones" aria-label={`Sesiones de ${seat.patientName || 'la persona invitada'}`} disabled={!active(seat)} onClick={() => { setPersonView('sessions'); setSelected(seat.occupantUid); window.scrollTo(0, 0); }}><ListOrdered size={20}/><span>Sesiones</span></button><button className="header-icon-btn professional-person-action" title="Ver actividad" aria-label={`Ver actividad de ${seat.patientName || 'la persona invitada'}`} disabled={!active(seat)} onClick={() => { setPersonView('activity'); setSelected(seat.occupantUid); window.scrollTo(0, 0); }}><ChartNoAxesCombined size={20}/><span>Actividad</span></button></div></li>)}</ul>}
        </section>
        <TabletPager page={currentPeoplePage} pages={Math.ceil(people.length / pageSize)} onChange={setPeoplePage} label="Páginas de personas"/>
        </> }, { id: 'seats', label: 'Asientos', icon: <Armchair size={18}/>, content: <>
        <section className="stats-card professional-seats" aria-labelledby="professional-seats-title"><div className="stats-section-heading"><div className="professional-list-heading"><span className="professional-section-icon"><Armchair size={22}/></span><h2 id="professional-seats-title">Tus asientos</h2><span className="stats-count">{seats.length}</span></div>{seats.some(seat => seat.subscriptionId) && <button className="stats-quiet-button" disabled={!billingEnabled || busy} onClick={() => void run(() => redirect('/professional/portal'))}><CreditCard size={18}/>Gestionar suscripciones</button>}</div>
          {!seats.length ? <p>Todavía no has comprado asientos.</p> : <ul className="professional-seat-list">{seats.slice(currentSeatsPage * seatPageSize, (currentSeatsPage + 1) * seatPageSize).map((seat, index) => <li key={seat.id}><div className="professional-seat-details"><span className="professional-section-icon">{seats.length - currentSeatsPage * seatPageSize - index}</span><div className="professional-seat-copy"><h3 className="professional-seat-name">{seat.occupantUid ? seat.patientName || 'Persona invitada' : 'Sin asignar'}</h3><p>{seat.status === 'pending' ? 'Pago pendiente' : seat.status === 'cancelled' ? 'Compra cancelada' : now === null ? 'Comprobando acceso…' : active(seat) ? 'Suscripción activa' : 'Suscripción inactiva'}{seat.expiresAt > 0 && <>. Hasta el {new Date(seat.expiresAt).toLocaleDateString('es-ES')}{seat.autoRenew ? '. Renovación automática' : active(seat) && seat.autoRenew === false ? '. No se renovará' : ''}</>}</p></div></div>
            {active(seat) && !seat.occupantUid && <div className="professional-code"><label htmlFor={`seat-${seat.id}`}>Código de invitación</label><div><input id={`seat-${seat.id}`} value={seat.invitationCode} readOnly onFocus={event => event.target.select()}/><button className="stats-quiet-button" disabled={busy} onClick={() => copy(seat)} aria-label={`Copiar código del asiento ${seats.length - currentSeatsPage * seatPageSize - index}`}><Copy size={18}/>{copied === seat.id ? 'Copiado' : 'Copiar'}</button></div></div>}
            {seat.subscriptionId && seat.autoRenew === false && active(seat) && <button className="stats-quiet-button" disabled={!billingEnabled || busy} onClick={() => void run(() => redirect('/professional/portal'))}>Reactivar suscripción</button>}
            {seat.subscriptionId && seat.autoRenew === true && <button className="stats-quiet-button" disabled={!billingEnabled || busy} onClick={() => void run(() => redirect('/professional/portal', { seatId: seat.id }))}>Cancelar suscripción</button>}
            {seat.status === 'pending' && <button className="stats-quiet-button" disabled={!billingEnabled || busy} onClick={() => void run(async () => { await billingRequest('/professional/cancel-checkout'); if (alive.current) clearReturn(); })}>Cancelar compra pendiente</button>}
          </li>)}</ul>}
        </section>
        <TabletPager page={currentSeatsPage} pages={Math.ceil(seats.length / seatPageSize)} onChange={setSeatsPage} label="Páginas de asientos"/>
        </> } ]}/>
      </>}
    </main>}
    <div className="header-navigation professional-navigation" ref={setNavigation}/>
    <AccessibilityModal onInformation={setInformation} isOpen={settingsOpen && information === null} showSubscription={false} settings={profile.settings} name={profile.name} onUpdateName={onUpdateName} onUpdateSettings={onUpdateSettings} onSignOut={onSignOut} signingOut={false} onClose={() => setSettingsOpen(false)} />
  </div></div></>;
}
