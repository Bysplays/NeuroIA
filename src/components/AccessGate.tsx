import { AppLoading } from './AppLoading';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { accessService, accessError, type AccountAccess } from '../services/accessService';
import { OnboardingModal } from './OnboardingModal';
import { usePortrait } from '../services/orientation';
import { soundService } from '../services/soundService';

export default function AccessGate({ onSignOut, children }: { onSignOut: () => void; children: ReactNode }) {
  const [access, setAccess] = useState<AccountAccess | null>(null);
  const [error, setError] = useState('');
  const [invitationIssue, setInvitationIssue] = useState<{ code: string; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkoutReturn, setCheckoutReturn] = useState(() => new URLSearchParams(location.search).get('checkout'));
  const portrait = usePortrait();
  const alive = useRef(true);
  const locked = useRef(false);
  const version = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++version.current;
    try {
      const value = await accessService.load();
      if (alive.current && request === version.current) {
        setAccess(value); setError('');
        if (value.active) {
          const url = new URL(location.href);
          url.searchParams.delete('checkout'); window.history.replaceState(null, '', url);
          setCheckoutReturn(null);
        }
      }
    } catch (error) {
      if (alive.current && request === version.current) { setError(accessError(error)); setAccess(current => current?.active ? current : null); }
    }
  }, []);
  useEffect(() => {
    alive.current = true;
    const initial = window.setTimeout(() => { void refresh(); }, 0);
    const interval = window.setInterval(() => { if (!locked.current) void refresh(); }, 30000);
    const onFocus = () => { if (!locked.current) void refresh(); };
    window.addEventListener('focus', onFocus);
    const onAccessChanged = () => { version.current++; setAccess(null); void refresh(); };
    window.addEventListener('neuroia-access-changed', onAccessChanged);
    return () => { alive.current = false; clearTimeout(initial); clearInterval(interval); window.removeEventListener('focus', onFocus); window.removeEventListener('neuroia-access-changed', onAccessChanged); };
  }, [refresh]);
  useEffect(() => {
    if (!access?.active || !access.expiresAt) return;
    const remaining = access.expiresAt - access.serverNow;
    const timeout = window.setTimeout(() => {
      if (remaining <= 2147483647) setAccess(value => value ? { ...value, active: false } : null);
      void refresh();
    }, Math.max(0, Math.min(remaining, 2147483647)));
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
  const redirect = async (kind: 'checkout' | 'portal') => {
    const url = new URL(await accessService[kind]());
    if (!alive.current) return;
    if (url.protocol !== 'https:' || !['checkout.stripe.com', 'billing.stripe.com'].includes(url.hostname)) throw new Error('invalid-checkout');
    window.location.assign(url.href);
  };
  // Unknown entitlement is not a denied entitlement: never show purchase options yet.
  if (!access) {
    if (!error) return <AppLoading />;
    return <main className="cloud-entry">
      <h1>No hemos podido abrir tu espacio</h1>
      <p role="alert">Comprueba la conexión y vuelve a intentarlo.</p>
      <button className="touch-btn touch-btn-primary" onClick={() => { setError(''); void refresh(); }}>Reintentar</button>
      <button className="paper-nav-button" onClick={onSignOut}>Cerrar sesión</button>
    </main>;
  }
  if (access.active) return <>{children}</>;
  return <main className="access-entry">
    <img src={`${import.meta.env.BASE_URL}brand/neuroia-logo.svg`} alt="NeuroIA" width="160" />
    {!portrait && <OnboardingModal access={access} loadFailed={Boolean(error)} invitationIssue={invitationIssue} busy={busy}
      onSignOut={onSignOut} onTrial={() => { void run(async () => { await accessService.trial(); await refresh(); }); }}
      onInvite={code => { void run(async () => {
        setInvitationIssue(null);
        try { await accessService.invite(code); }
        catch (cause) {
          const errorCode = cause && typeof cause === 'object' && 'code' in cause ? cause.code : '';
          if (alive.current && (String(errorCode).startsWith('invitation/') || ['functions/not-found', 'functions/invalid-argument', 'functions/failed-precondition'].includes(String(errorCode)))) {
            setInvitationIssue({ code, message: accessError(cause) });
          }
          throw cause;
        }
        await refresh();
      }); }}
      onCheckout={() => { void run(() => redirect('checkout')); }} onPortal={() => { void run(() => redirect('portal')); }}
      checkoutReturn={checkoutReturn}
      onCancelCheckout={() => { void run(async () => { await accessService.cancelCheckout(); clearReturn(); await refresh(); }); }} />}
  </main>;
}
