import { ModalFrame } from './ModalFrame';
import { useEffect, useRef, useState } from 'react';
import { accessService, type AccountAccess } from '../services/accessService';

export function SubscriptionSettings() {
  const [access, setAccess] = useState<AccountAccess | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const leave = async () => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try { await accessService.leaveInvitation(); }
    catch { if (alive.current) setError('No hemos podido abandonar la invitación. Comprueba la conexión y vuelve a intentarlo.'); }
    finally { locked.current = false; if (alive.current) setBusy(false); }
  };
  const alive = useRef(false);
  const locked = useRef(false);

  useEffect(() => {
    alive.current = true;
    let active = true;
    accessService.load().then(value => {
      if (active) { setAccess(value); setError(''); }
    }).catch(() => { if (active) setError('No hemos podido cargar tu suscripción.'); });
    return () => { active = false; alive.current = false; };
  }, [attempt]);

  const openBilling = async (kind: 'checkout' | 'portal') => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true); setError('');
    try {
      const url = new URL(await accessService[kind]());
      if (url.protocol !== 'https:' || !['checkout.stripe.com', 'billing.stripe.com'].includes(url.hostname)) throw new Error('invalid-payment-url');
      if (alive.current) window.location.assign(url.href);
    } catch {
      if (alive.current) setError('No hemos podido abrir la gestión de pagos. Vuelve a intentarlo.');
    } finally {
      locked.current = false;
      if (alive.current) setBusy(false);
    }
  };

  const invitation = access?.kind === 'invitation';
  const subscription = access?.kind === 'subscription';
  const until = access?.expiresAt ? new Date(access.expiresAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  return <section className="preferences-section preferences-subscription" aria-label="Tu plan">
    {!access && !error && <p role="status">Cargando tu plan…</p>}
    {access && <>
      <div className="subscription-status">
        <div>
          <h3>{invitation ? 'Acceso gratuito por invitación' : subscription ? 'Plan mensual' : access.kind === 'trial' ? 'Prueba gratuita de 7 días' : 'Sin plan activo'}</h3>
          <p className="subscription-date">{invitation ? 'Sin fecha de caducidad' : until ? `${access.active ? 'Hasta el' : 'Finalizó el'} ${until}` : access.active ? 'Fecha no disponible' : 'Sin acceso activo'}</p>
          {subscription && <p className="subscription-date">Renovación automática</p>}
        </div>
      {subscription && <button className="subscription-upgrade" disabled={busy || !access.checkoutAvailable || !access.canManageSubscription} onClick={() => void openBilling('portal')}>{busy ? 'Abriendo Stripe…' : 'Gestionar'}</button>}
        {invitation && <button className="subscription-upgrade" onClick={() => { setError(''); setConfirmLeave(true); }}>Abandonar</button>}
        {!subscription && !invitation && <button className="subscription-upgrade" disabled={busy || !access.checkoutAvailable} onClick={() => void openBilling('checkout')}>{busy ? 'Abriendo…' : 'Mejorar'}</button>}
      </div>
      {invitation && access.professionalName && <p className="subscription-detail">Vinculado a {access.professionalName}.</p>}
    </>}
    {confirmLeave && <ModalFrame labelledBy="leave-invitation-title" onClose={() => { if (!busy) { setConfirmLeave(false); setError(''); } }}>
      <div className="leave-invitation">
        <h2 id="leave-invitation-title">¿Abandonar la invitación?</h2>
        <p>Vas a abandonar tu acceso por invitación y dejarás de estar vinculado a tu profesional. Necesitarás una nueva invitación o un plan de pago para seguir usando la aplicación.</p>
        <p>Tu progreso se conservará.</p>
        {error && <p role="alert">{error}</p>}
        <div className="leave-invitation-actions">
          <button className="paper-nav-button" disabled={busy} onClick={() => { setConfirmLeave(false); setError(''); }}>Volver</button>
          <button className="subscription-upgrade" disabled={busy} onClick={() => void leave()}>{busy ? 'Abandonando…' : 'Abandonar invitación'}</button>
        </div>
      </div>
    </ModalFrame>}
    {error && !confirmLeave && <div className="subscription-error" role="alert"><p>{error}</p>{!access && <button className="paper-nav-button" onClick={() => { setError(''); setAttempt(value => value + 1); }}>Reintentar</button>}</div>}
  </section>;
}
