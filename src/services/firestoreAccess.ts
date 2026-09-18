import { doc, getDocFromServer, runTransaction, serverTimestamp, type Firestore } from 'firebase/firestore';

export const INVITATION_CODE = 'CEOABERTO';
export const PROFESSIONAL_ID = 'ceoaberto';
export const TRIAL_DURATION = 7 * 24 * 60 * 60 * 1000;
function failure(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}
export function firestoreAccess(uid: string, db: Firestore) {
  const accessRef = doc(db, 'users', uid, 'access', 'main');
  const professionalRef = doc(db, 'professionals', PROFESSIONAL_ID);
  const patientRef = doc(db, 'professionals', PROFESSIONAL_ID, 'patients', uid);
  return {
    async load() {
      const snapshot = await getDocFromServer(accessRef);
      const data = snapshot.data();
      const now = Date.now();
      const trialStartedAt = typeof data?.trialStartedAt === 'number'
        ? data.trialStartedAt : data?.trialStartedAt?.toMillis();
      const expiresAt = data?.kind === 'trial' && trialStartedAt != null
        ? trialStartedAt + TRIAL_DURATION : data?.expiresAt ?? null;
      return {
        active: data?.kind === 'invitation' || (['trial', 'subscription'].includes(data?.kind) && typeof expiresAt === 'number' && expiresAt > now),
        kind: data?.kind as 'trial' | 'subscription' | 'invitation' | undefined,
        serverNow: now, expiresAt, trialStartedAt,
        professionalId: data?.professionalId as string | undefined,
        professionalName: data?.professionalName as string | undefined,
        invitationCode: data?.invitationCode as string | undefined,
      };
    },
    async invite(value: string) {
      if (value.trim().toUpperCase() !== INVITATION_CODE) {
        throw failure('invitation/invalid-code', 'El código no es válido. Revísalo con tu profesional.');
      }
      await runTransaction(db, async tx => {
        const [access, professional, patient] = await Promise.all([
          tx.get(accessRef), tx.get(professionalRef), tx.get(patientRef),
        ]);
        const current = access.data();
        if (current?.professionalId && current.professionalId !== PROFESSIONAL_ID) {
          throw failure('invitation/already-linked', 'Tu cuenta ya está vinculada a otro profesional.');
        }
        if (current?.kind === 'subscription') {
          throw failure('invitation/subscription', 'Gestiona tu suscripción antes de usar una invitación.');
        }
        if (professional.exists() && !professional.data().active) {
          throw failure('invitation/inactive', 'Esta invitación no está disponible.');
        }
        // Reserved public profile, never a role or a claim on an Auth account.
        // Its actual owner can only be assigned by an administrator later.
        if (!professional.exists()) tx.set(professionalRef, { name: 'CeoAberto', active: true, ownerUid: null });
        const linkedAt = current?.professionalId === PROFESSIONAL_ID && current.linkedAt != null
          ? current.linkedAt : serverTimestamp();
        if (current?.kind !== 'invitation' || current.invitationCode !== INVITATION_CODE) tx.set(accessRef, {
          kind: 'invitation', invitationCode: INVITATION_CODE, professionalId: PROFESSIONAL_ID,
          professionalName: 'CeoAberto', expiresAt: null, linkedAt,
        }, { merge: true });
        if (!patient.exists()) tx.set(patientRef, { patientId: uid, linkedAt });
      });
    },
    async trial() {
      await runTransaction(db, async tx => {
        const current = await tx.get(accessRef);
        if (current.exists()) throw failure('invitation/trial-used', 'Esta cuenta ya ha utilizado su prueba o tiene acceso.');
        tx.set(accessRef, { kind: 'trial', trialStartedAt: serverTimestamp() });
      });
    },
  };
}
