import { Brand } from './Brand';
import { ConnectionRecovery } from './ConnectionRecovery';
import { ModalFrame } from './ModalFrame';
import { AccountAccessContext, AccessSuspendedContext } from '../services/accountAccessContext';
import { AppLoading } from './AppLoading';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { accessService, accessError, type AccountAccess } from '../services/accessService';
import { OnboardingModal } from './OnboardingModal';
import { soundService } from '../services/soundService';

export default function AccessGate({ onSignOut, children }: { onSignOut: () => void; children: ReactNode }) {
  const [access, setAccess] = useState<AccountAccess | null>(null);
  const [retainedAccess, setRetainedAccess] = useState<AccountAccess | null>(null);
  const [error, setError] = useState('');
  const [invitationIssue, setInvitationIssue] = useState<{ code: string; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkoutReturn, setCheckoutReturn] = useState(() => new URLSearchParams(location.search).get('checkout'));
  const alive = useRef(true);
  const locked = useRef(false);
  const version = useRef(0);
  const confirmedUntil = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++version.current;
    try {
      const value = await accessService.load();
      if (alive.current && request === version.current) {
        confirmedUntil.current = value.active ? Date.now() + Math.max(0, Math.min(value.validForMs ?? 0, value.expiresAt ? value.expiresAt - value.serverNow : Infinity)) : 0;
        setAccess(value); setRetainedAccess(value.active ? value : null); setError('');
        if (value.active) {
          const url = new URL(location.href);
          url.searchParams.delete('checkout'); window.history.replaceState(null, '', url);
          setCheckoutReturn(null);
        }
      }
    } catch (error) {
      if (alive.current && request === version.current) { confirmedUntil.current = 0; setError(accessError(error)); setAccess(null); }
    }
  }, []);
  useEffect(() => {
    alive.current = true;
    const initial = window.setTimeout(() => { void refresh(); }, 0);
    const interval = window.setInterval(() => { if (!locked.current) void refresh(); }, 30000);
    // Focus moves between controls and dialogs are not access transitions.
    // Keep a still-valid server lease visible while checking in the background.
    const recheck = () => {
      if (locked.current) return;
      if (Date.now() >= confirmedUntil.current) setAccess(null);
      setError('');
      void refresh();
    };
    const invalidate = () => { version.current++; confirmedUntil.current = 0; setAccess(null); setError('Comprueba la conexión y vuelve a intentarlo.'); };
    const onVisibility = () => { if (document.visibilityState === 'visible') recheck(); };
    window.addEventListener('offline', invalidate);
    window.addEventListener('online', recheck);
    document.addEventListener('visibilitychange', onVisibility);
    const onAccessChanged = () => { confirmedUntil.current = 0; setAccess(null); void refresh(); };
    window.addEventListener('neuroia-access-changed', onAccessChanged);
    return () => { alive.current = false; clearTimeout(initial); clearInterval(interval); window.removeEventListener('offline', invalidate); window.removeEventListener('online', recheck); document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('neuroia-access-changed', onAccessChanged); };
  }, [refresh]);
  useEffect(() => {
    if (!access?.active) return;
    const remaining = Math.max(0, Math.min(access.validForMs ?? 0, access.expiresAt ? access.expiresAt - access.serverNow : Infinity));
    const timeout = window.setTimeout(() => {
      setAccess(null);
      void refresh();
    }, remaining);
    return () => clearTimeout(timeout);
  }, [access, refresh]);
  useEffect(() => { if (!access?.active) soundService.stopSpeaking(); }, [access?.active]);
  const run = async (action: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(''); version.current++;
    try { await action(); }
    catch (error) { if (alive.current) setError(accessError(error)); }
    finally { locked.current = false; if (alive.current) setBusy(false); }
  };
  const clearReturn = () => {
    const url = new URL(location.href); url.searchParams.delete('checkout');
    window.history.replaceState(null, '', url); setCheckoutReturn(null);
  };
  const prepareAccessChoice = async () => {
    // Check the server even if this tab has not observed another tab's checkout.
    await accessService.cancelCheckout();
    clearReturn();
    setInvitationIssue(null);
  };
  const redirect = async (kind: 'checkout' | 'portal') => {
    const url = new URL(await accessService[kind]());
    if (!alive.current) return;
    if (url.protocol !== 'https:' || !['checkout.stripe.com', 'billing.stripe.com'].includes(url.hostname)) throw new Error('invalid-checkout');
    window.location.assign(url.href);
  };
  // Keep the React tree during transient revalidation, but block interaction and its clock.
  if (access?.active || retainedAccess) {
    const suspended = !access?.active;
    return <AccountAccessContext.Provider value={access ?? { ...retainedAccess!, active: false }}>
      <AccessSuspendedContext.Provider value={suspended}>
        <div inert={suspended}>{children}</div>
        {suspended && <ModalFrame labelledBy="access-recheck-title" onClose={() => {}} dismissOnBackdrop={false}>
          <section className="entry-error-notification access-recheck-dialog">
            <h2 id="access-recheck-title">{error ? 'Vamos a reconectar' : 'Comprobando tu acceso'}</h2>
            <p role="status">{error || 'Tu actividad sigue aquí. Un momento…'}</p>
            {error && <><button className="touch-btn touch-btn-primary" onClick={() => { setError(''); void refresh(); }}>Reintentar</button><button className="text-link" onClick={onSignOut}>Cerrar sesión</button></>}
          </section>
        </ModalFrame>}
      </AccessSuspendedContext.Provider>
    </AccountAccessContext.Provider>;
  }
  // Unknown entitlement is not a denied entitlement: never show purchase options yet.
  if (!access) {
    if (!error) return <AppLoading />;
    return <ConnectionRecovery message={error} onRetry={() => { setError(''); void refresh(); }} onSignOut={onSignOut}/>;
  }
  return <main className="entry-page access-entry">
    <header className="entry-header"><Brand/></header>
    {<OnboardingModal access={access} loadFailed={Boolean(error)} errorMessage={error} invitationIssue={invitationIssue} busy={busy}
      onSignOut={onSignOut} onTrial={() => { void run(async () => { await prepareAccessChoice(); await accessService.trial(); await refresh(); }); }}
      onInvite={code => { void run(async () => {
        setInvitationIssue(null);
        try {
          await prepareAccessChoice();
          await accessService.invite(code);
        }
        catch (cause) {
          if (alive.current) {
            setInvitationIssue({ code, message: accessError(cause) });
          }
          throw cause;
        }
        await refresh();
      }); }}
      onCheckout={() => { void run(async () => { await prepareAccessChoice(); await redirect('checkout'); }); }} onPortal={() => { void run(() => redirect('portal')); }}
      checkoutReturn={checkoutReturn} />}
  </main>;
}
