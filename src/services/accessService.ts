import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore } from 'firebase/firestore';
import { firestoreAccess } from './firestoreAccess';
import { auth } from './firebase';

export interface AccountAccess {
  active: boolean;
  serverNow: number;
  checkoutAvailable: boolean;
  pendingCheckout?: boolean;
  canManageSubscription?: boolean;
  kind?: 'trial' | 'subscription' | 'invitation';
  trialStartedAt?: number;
  expiresAt?: number | null;
  professionalName?: string;
  professionalId?: string;
  invitationCode?: string;
}
const functions = getFunctions(auth.app, 'europe-west1');
function accountAccess() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('authentication-required');
  return firestoreAccess(uid, getFirestore(auth.app));
}
export const accessService = {
  async load(): Promise<AccountAccess> {
    const access = await accountAccess().load();
    return { ...access, checkoutAvailable: import.meta.env.VITE_STRIPE_ENABLED === 'true',
      canManageSubscription: access.kind === 'subscription' };
  },
  async trial() { await accountAccess().trial(); },
  async invite(code: string) { await accountAccess().invite(code); },
  async cancelCheckout() { await httpsCallable(functions, 'cancelCheckout')(); },
  async checkout() { return (await httpsCallable<void, { url: string }>(functions, 'createCheckout')()).data.url; },
  async portal() { return (await httpsCallable<void, { url: string }>(functions, 'createBillingPortal')()).data.url; },
};
export function accessError(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  if (code.startsWith('invitation/') && error instanceof Error) return error.message;
  if (['functions/not-found', 'functions/invalid-argument'].includes(code)) return 'El código no es válido. Revísalo con tu profesional.';
  if (['functions/failed-precondition', 'functions/already-exists'].includes(code) && error instanceof Error) return error.message;
  return 'No hemos podido confirmar tu acceso. Comprueba la conexión y vuelve a intentarlo.';
}
