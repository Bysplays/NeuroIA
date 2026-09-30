import { Brand } from './Brand';
import { ConnectionRecovery } from './ConnectionRecovery';
import { ModalFrame } from './ModalFrame';
import { AccountAccessContext, AccessSuspendedContext, AccessRecoveryContext } from '../services/accountAccessContext';
import { AppLoading } from './AppLoading';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { accessService, accessError, type AccountAccess } from '../services/accessService';
import { OnboardingModal } from './OnboardingModal';
import { soundService } from '../services/soundService';

export default function AccessGate({ onSignOut, children }: { onSignOut: () => void; children: ReactNode }) {
  const [gameRecovery, setGameRecovery] = useState(false);
  const [access, setAccess] = useState<AccountAccess | null>(null);
  const [retainedAccess, setRetainedAccess] = useState<AccountAccess | null>(null);
  const [error, setError] = useState('');
  const [invitationIssue, setInvitationIssue] = useState<{ code: string; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkoutReturn, setCheckoutReturn] = useState(() => new URLSearchParams(location.search).get('checkout'));
  const alive = useRef(true);
  const locked = useRef(false);
  const version = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++version.current;
    try {
      const value = await accessService.load();
      if (alive.current && request === version.current) {
        setAccess(value); setRetainedAccess(value.active ? value : null); setError('');
        if (value.active) {
          const url = new URL(location.href);
          url.searchParams.delete('checkout'); window.history.replaceState(null, '', url);
          setCheckoutReturn(null);
        }
      }
    } catch (error) {
      if (alive.current && request === version.current) { setError(accessError(error)); setAccess(null); }
    }
  }, []);
  useEffect(() => {
    alive.current = true;
    const initial = window.setTimeout(() => { void refresh(); }, 0);
    const interval = window.setInterval(() => { if (!locked.current) void refresh(); }, 30000);
    let windowLeft = false;
    let blurTimer: ReturnType<typeof setTimeout>;
    const onBlur = (event: FocusEvent) => {
      if (event.target !== window) return;
      clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        if (!event.isTrusted || !document.hasFocus()) windowLeft = true;
      }, 0);
    };
    window.addEventListener('blur', onBlur);
    const onFocus = (event?: Event) => {
      if (event?.type === 'focus') {
        if (event.target !== window) return;
        clearTimeout(blurTimer);
        if (!windowLeft) return;
        windowLeft = false;
      }
      if (!locked.current) { version.current++; setAccess(null); setError(''); void refresh(); } };
    window.addEventListener('focus', onFocus);
    const invalidate = () => { version.current++; setAccess(null); setError('Comprueba la conexión y vuelve a intentarlo.'); };
    const onVisibility = () => { if (document.visibilityState === 'visible') { invalidate(); onFocus(); } };
    window.addEventListener('offline', invalidate);
    window.addEventListener('online', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    const onAccessChanged = () => { version.current++; setAccess(null); void refresh(); };
    window.addEventListener('neuroia-access-changed', onAccessChanged);
    return () => { alive.current = false; clearTimeout(initial); clearTimeout(blurTimer); clearInterval(interval); window.removeEventListener('blur', onBlur); window.removeEventListener('focus', onFocus); window.removeEventListener('offline', invalidate); window.removeEventListener('online', onFocus); document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('neuroia-access-changed', onAccessChanged); };
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
        <AccessRecoveryContext.Provider value={{ setGameRecovery, error, retry: () => { setError(''); void refresh(); }, signOut: onSignOut }}>
          <div hidden={suspended} inert={suspended}>{children}</div>
        </AccessRecoveryContext.Provider>
        {suspended && !gameRecovery && <ModalFrame labelledBy="access-recheck-title" onClose={() => {}} dismissOnBackdrop={false}>
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
