import { getFirestore } from 'firebase/firestore';
import { firestoreAccess } from './firestoreAccess';
import { auth } from './firebase';

export interface AccountAccess {
  active: boolean;
  serverNow: number;
  checkoutAvailable: boolean;
  pendingCheckout?: boolean;
  canManageSubscription?: boolean;
  kind?: 'trial' | 'subscription' | 'invitation' | 'revoked';
  trialStartedAt?: number;
  expiresAt?: number | null;
  autoRenew?: boolean;
  professionalName?: string;
  professionalId?: string;
  invitationCode?: string;
  seatId?: string;
}
const billingUrl = import.meta.env.VITE_BILLING_API_URL?.replace(/\/$/, '');
export const billingEnabled = Boolean(billingUrl) && import.meta.env.VITE_STRIPE_ENABLED === 'true';
export async function billingRequest<T = { url: string }>(path: string, body?: object): Promise<T> {
  if (!billingUrl || !auth.currentUser) throw new Error('billing-unavailable');
  const response = await fetch(`${billingUrl}${path}`, {
    method: 'POST', headers: { Authorization: `Bearer ${await auth.currentUser.getIdToken()}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error || 'No hemos podido gestionar el pago.'), { code: 'billing/request-failed' });
  return result;
}
function accountAccess() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('authentication-required');
  return firestoreAccess(uid, getFirestore(auth.app));
}
export const accessService = {
  async load(): Promise<AccountAccess> {
    const access = await accountAccess().load();
    const enabled = billingEnabled;
    if (!enabled) return { ...access, checkoutAvailable: false, canManageSubscription: false };
    try {
      const billing = await billingRequest<{ pendingCheckout: boolean; canManageSubscription: boolean }>('/status');
      return { ...access, ...billing, checkoutAvailable: true };
    } catch {
      // A billing outage must never remove already-confirmed Firestore access.
      return { ...access, checkoutAvailable: false, canManageSubscription: false };
    }
  },
  async trial() { await accountAccess().trial(); },
  async invite(code: string) {
    if (/^NIA-[A-F0-9]{32}$/.test(code.trim().toUpperCase())) {
      try { await billingRequest('/redeem-seat', { code, name: auth.currentUser?.displayName || 'Persona invitada' }); }
      catch (error) { throw Object.assign(error instanceof Error ? error : new Error('No hemos podido usar la invitación.'), { code: 'invitation/seat' }); }
    } else await accountAccess().invite(code);
  },
  async leaveInvitation() {
    const access = await accountAccess().load();
    if (access.seatId) await billingRequest('/leave-seat');
    else await accountAccess().leaveInvitation();
    window.dispatchEvent(new Event('neuroia-access-changed'));
  },
  async cancelCheckout() { await billingRequest('/cancel-checkout'); },
  async checkout() { return (await billingRequest('/checkout')).url; },
  async portal() { return (await billingRequest('/portal')).url; },
};
export function accessError(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  if (code.startsWith('billing/') && error instanceof Error) return error.message;
  if (code.startsWith('invitation/') && error instanceof Error) return error.message;
  if (['functions/not-found', 'functions/invalid-argument'].includes(code)) return 'El código no es válido';
  if (['functions/failed-precondition', 'functions/already-exists'].includes(code) && error instanceof Error) return error.message;
  return 'No hemos podido confirmar tu acceso. Comprueba la conexión y vuelve a intentarlo.';
}
