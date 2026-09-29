import { useState } from 'react';
import { ArrowRight, Check, Ticket, Layers } from 'lucide-react';
import { ModalFrame } from './ModalFrame';
import type { AccountAccess } from '../services/accessService';

export function OnboardingModal({ access, busy, loadFailed, errorMessage, invitationIssue, onTrial, onInvite, onCheckout, onSignOut, onPortal, checkoutReturn }: {
  access: AccountAccess | null; busy: boolean; loadFailed: boolean;
  errorMessage?: string;
  invitationIssue: { code: string; message: string } | null;
  onTrial: () => void; onInvite: (code: string) => void; onCheckout: () => void;
  onSignOut: () => void; onPortal: () => void;
  checkoutReturn: string | null;
}) {
  const [code, setCode] = useState('');
  const [pendingAction, setPendingAction] = useState('');
  const invoke = (action: string, callback: () => void) => { setPendingAction(action); callback(); };
  const label = (action: string, text: string) => busy && pendingAction === action ? <span role="status">Un momento…</span> : text;
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
      {errorMessage && !inviteOpen && <p role="alert">{errorMessage}</p>}
      <div className="onboarding-options" aria-busy={busy}>
        <section className="onboarding-option onboarding-paid" aria-labelledby="membership-title">
          <span className="onboarding-plan-label">TU ACCESO</span>
          <h2 id="membership-title">NeuroIA mensual</h2>
          <p>Todos los ejercicios, mes a mes.</p>
          <div className="onboarding-actions">
            <button className="touch-btn touch-btn-primary" disabled={busy || !access?.checkoutAvailable} onClick={() => invoke('checkout', onCheckout)}>{label('checkout', 'Suscribirme')}<ArrowRight size={20} aria-hidden="true"/></button>
            {!access?.checkoutAvailable && <small>La suscripción no está disponible en este momento.</small>}
            {!expired && <button className="onboarding-trial-link" disabled={busy || !access} onClick={() => invoke('trial', onTrial)}>{label('trial', 'Probar gratis 7 días')}</button>}
            {access?.canManageSubscription && <button className="paper-nav-button" disabled={busy} onClick={() => invoke('portal', onPortal)}>{label('portal', 'Gestionar suscripción')}</button>}
          </div>
        </section>
      <button className="onboarding-invite" aria-haspopup="dialog" disabled={busy} onClick={() => setInviteOpen(true)}><Ticket size={20} aria-hidden="true"/><span>Tengo un código de invitación</span><ArrowRight size={20} aria-hidden="true"/></button>
        <div className="onboarding-benefits">
          <span className="onboarding-plan-icon" aria-hidden="true"><Layers size={30}/></span>
          <h2>Tu momento para practicar.</h2>
          <ul>
            <li><Check size={19} aria-hidden="true"/><span>Ocho juegos para practicar</span></li>
            <li><Check size={19} aria-hidden="true"/><span>Dificultad adaptada a tu ritmo</span></li>
            <li><Check size={19} aria-hidden="true"/><span>Tu actividad y tus logros, a mano</span></li>
          </ul>
        </div>
      </div>

      {inviteOpen && <ModalFrame labelledBy="invitation-title" onClose={() => setInviteOpen(false)}>
        <section className="invitation-dialog">
        <div className="entry-error-heading"><Ticket size={24} aria-hidden="true"/><h2 id="invitation-title">Tu invitación</h2></div>
        <p>Tu profesional cubre el acceso y puede consultar tu actividad.</p>
        <form className="onboarding-invite-form" onSubmit={event => { event.preventDefault(); if (!busy && access && code.trim()) invoke('invite', () => onInvite(code)); }}>
          <label htmlFor="invitation-code">Código de invitación</label>
          <div className="onboarding-code-row">
            <input id="invitation-code" value={code} onChange={event => setCode(event.target.value)} maxLength={64} autoCapitalize="characters" autoComplete="off" spellCheck={false} aria-invalid={Boolean(codeError)} aria-describedby={codeError ? 'invitation-error' : undefined} placeholder="Escribe tu código" required disabled={busy} />
            <button className="touch-btn touch-btn-primary" disabled={busy || !access || !code.trim()} type="submit">{label('invite', 'Usar mi código')}</button>
          </div>
          {codeError && <p id="invitation-error" role="alert" aria-atomic="true">{codeError}</p>}
        </form>
        {errorMessage && !codeError && <p role="alert">{errorMessage}</p>}
        <button className="email-text-button invitation-close" onClick={() => setInviteOpen(false)}>Cerrar</button>
        </section>
      </ModalFrame>}
      <footer className="onboarding-footer">
        <button className="paper-nav-button" disabled={busy} onClick={onSignOut}>Cerrar sesión</button>
      </footer>
    </section>
  </div>;
}
