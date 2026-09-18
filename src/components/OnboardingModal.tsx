import { useState } from 'react';
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
  const codeError = invitationIssue?.code === code ? invitationIssue.message : '';
  const expired = access?.trialStartedAt != null;
  return <ModalFrame labelledBy="onboarding-title" onClose={() => {}} dismissOnBackdrop={false}>
    <section className="onboarding">
      <header className="onboarding-heading">
        <h1 id="onboarding-title" tabIndex={-1} autoFocus>{expired ? 'Continúa con NeuroIA' : 'Empieza con NeuroIA'}</h1>
        {expired && <p>Tu prueba gratuita ha terminado.</p>}
        <svg className="onboarding-paper-edge" viewBox="0 0 400 32" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M0 18 C100 42 170 0 250 16 C310 30 360 28 400 12 V32 H0 Z" fill="currentColor" opacity=".35" transform="translate(0 -6)" />
          <path d="M0 18 C100 42 170 0 250 16 C310 30 360 28 400 12 V32 H0 Z" fill="currentColor" />
        </svg>
      </header>
      {!access && !loadFailed && <p role="status">Preparando tus opciones…</p>}
      {checkoutReturn === 'success' && <p role="status">Estamos comprobando tu pago. El acceso se abrirá cuando se confirme.</p>}
      {checkoutReturn === 'cancelled' && <p>Has vuelto sin terminar el pago. Puedes retomarlo o elegir otra opción.</p>}
      <div className="onboarding-options" aria-busy={busy}>
        <section className="onboarding-option onboarding-paid">
          <h2>Suscribirse</h2>
          <p>Todos los ejercicios, mes a mes.</p>
          <div className="onboarding-actions">
            <button className="touch-btn touch-btn-primary" disabled={busy || !access?.checkoutAvailable} onClick={onCheckout}>Suscribirme</button>
            <button className="onboarding-trial-link" disabled={busy || !access || expired} onClick={onTrial}>{expired ? 'Prueba gratuita ya utilizada' : 'Empezar prueba gratuita de 7 días'}</button>
            {access && !access.checkoutAvailable && <small>La suscripción estará disponible próximamente.</small>}
            {access?.canManageSubscription && <button className="paper-nav-button" disabled={busy} onClick={onPortal}>Gestionar suscripción</button>}
          </div>
        </section>
        <section className="onboarding-option onboarding-invite">
          <h2><label htmlFor="invitation-code">Invitación</label></h2>
          <p>Acceso gratuito vinculado a tu profesional.</p>
          <form className="onboarding-actions" onSubmit={event => { event.preventDefault(); onInvite(code); }}>
            <input id="invitation-code" value={code} onChange={event => setCode(event.target.value)} maxLength={64} autoCapitalize="characters" autoComplete="off" spellCheck={false} aria-invalid={Boolean(codeError)} aria-describedby={codeError ? 'invitation-error' : undefined} aria-label="Código de invitación" placeholder="Código de invitación" required disabled={busy} />
            {codeError && <p id="invitation-error" role="alert">{codeError}</p>}
            <button className="paper-nav-button" disabled={busy || !access || !code.trim()} type="submit">Usar mi código</button>
          </form>
        </section>
      </div>
      <footer className="onboarding-footer">
        {busy && <span role="status">Un momento…</span>}
        {(checkoutReturn || access?.pendingCheckout) && <button className="paper-nav-button" disabled={busy} onClick={onCancelCheckout}>Cancelar pago pendiente</button>}
        <button className="paper-nav-button" disabled={busy} onClick={onSignOut}>Cerrar sesión</button>
      </footer>
    </section>
  </ModalFrame>;
}
