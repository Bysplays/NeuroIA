import { useState } from 'react';
import { ArrowRight, Check, Ticket, Layers } from 'lucide-react';
import { ModalFrame } from './ModalFrame';
import type { AccountAccess } from '../services/accessService';

export function OnboardingModal({ access, busy, loadFailed, invitationIssue, onTrial, onInvite, onCheckout, onSignOut, onPortal, checkoutReturn, onCancelCheckout }: {
  access: AccountAccess | null; busy: boolean; loadFailed: boolean;
  invitationIssue: { code: string; message: string } | null;
  onTrial: () => void; onInvite: (code: string) => void; onCheckout: () => void;
  onSignOut: () => void; onPortal: () => void;
  checkoutReturn: string | null; onCancelCheckout: () => void;
}) {
  const [code, setCode] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const codeError = invitationIssue?.code === code ? invitationIssue.message : '';
  const expired = access?.kind != null;
  return <div className="access-choice-page">
    <section className="onboarding">
      <header className="onboarding-heading">
        <h1 id="onboarding-title" tabIndex={-1} autoFocus>{expired ? 'Continúa con NeuroIA' : 'Empieza con NeuroIA'}</h1>
        <p>{expired ? (access?.kind === 'trial' ? 'Tu prueba gratuita ha terminado.' : 'Tu acceso no está activo.') : 'Un espacio para practicar a tu ritmo.'}</p>
      </header>
      {!access && !loadFailed && <p role="status">Preparando tus opciones…</p>}
      {checkoutReturn === 'success' && <p role="status">Estamos comprobando tu pago. El acceso se abrirá cuando se confirme.</p>}
      {checkoutReturn === 'cancelled' && <p>Has vuelto sin terminar el pago. Puedes retomarlo o elegir otra opción.</p>}
      <div className="onboarding-options" aria-busy={busy}>
        <div className="onboarding-benefits">
          <span className="onboarding-plan-icon" aria-hidden="true"><Layers size={30}/></span>
          <h2>Tu momento para practicar.</h2>
          <ul>
            <li><Check size={19} aria-hidden="true"/><span>Ocho juegos para practicar</span></li>
            <li><Check size={19} aria-hidden="true"/><span>Dificultad adaptada a tu ritmo</span></li>
            <li><Check size={19} aria-hidden="true"/><span>Tu actividad y tus logros, a mano</span></li>
          </ul>
        </div>
        <section className="onboarding-option onboarding-paid" aria-labelledby="membership-title">
          <span className="onboarding-plan-label">TU ACCESO</span>
          <h2 id="membership-title">NeuroIA mensual</h2>
          <p>Todos los ejercicios, mes a mes.</p>
          <div className="onboarding-actions">
            <button className="touch-btn touch-btn-primary" disabled={busy || !access?.checkoutAvailable} onClick={onCheckout}>Suscribirme<ArrowRight size={20} aria-hidden="true"/></button>
            <small>{access?.checkoutAvailable ? 'Verás el precio y las condiciones antes de confirmar el pago.' : 'La suscripción no está disponible en este momento.'}</small>
            {!expired && <button className="onboarding-trial-link" disabled={busy || !access} onClick={onTrial}>Probar gratis 7 días</button>}
            {access?.canManageSubscription && <button className="paper-nav-button" disabled={busy} onClick={onPortal}>Gestionar suscripción</button>}
          </div>
        </section>
      </div>
      <button className="onboarding-invite" aria-haspopup="dialog" disabled={busy} onClick={() => setInviteOpen(true)}><Ticket size={20} aria-hidden="true"/><span>Tengo un código de invitación</span><ArrowRight size={20} aria-hidden="true"/></button>
      {inviteOpen && <ModalFrame labelledBy="invitation-title" onClose={() => setInviteOpen(false)}>
        <section className="invitation-dialog">
        <div className="entry-error-heading"><Ticket size={24} aria-hidden="true"/><h2 id="invitation-title">Tu invitación</h2></div>
        <p>Tu profesional cubre el acceso y puede consultar tu actividad.</p>
        <form className="onboarding-invite-form" onSubmit={event => { event.preventDefault(); if (!busy && access && code.trim()) onInvite(code); }}>
          <label htmlFor="invitation-code">Código de invitación</label>
          <div className="onboarding-code-row">
            <input id="invitation-code" value={code} onChange={event => setCode(event.target.value)} maxLength={64} autoCapitalize="characters" autoComplete="off" spellCheck={false} aria-invalid={Boolean(codeError)} aria-describedby={codeError ? 'invitation-error' : undefined} placeholder="Escribe tu código" required disabled={busy} />
            <button className="touch-btn touch-btn-primary" disabled={busy || !access || !code.trim()} type="submit">Usar mi código</button>
          </div>
          {codeError && <p id="invitation-error" role="alert" aria-atomic="true">{codeError}</p>}
        </form>
        {busy && <p role="status">Comprobando tu código…</p>}
        <button className="email-text-button invitation-close" onClick={() => setInviteOpen(false)}>Cerrar</button>
        </section>
      </ModalFrame>}
      <footer className="onboarding-footer">
        {busy && <span role="status">Un momento…</span>}
        {(checkoutReturn || access?.pendingCheckout) && <button className="paper-nav-button" disabled={busy} onClick={onCancelCheckout}>Cancelar pago pendiente</button>}
        <button className="paper-nav-button" disabled={busy} onClick={onSignOut}>Cerrar sesión</button>
      </footer>
    </section>
  </div>;
}
