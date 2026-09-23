import { collection, doc, getDocFromServer, onSnapshot, runTransaction, serverTimestamp, type Firestore } from 'firebase/firestore';
import type { ExerciseResult } from '../types/index.ts';

export interface ProfessionalProfile { ownerUid: string; name: string; active: boolean }
export interface ProfessionalSeat {
  id: string;
  status: 'pending' | 'active' | 'inactive' | 'cancelled';
  invitationCode: string;
  occupantUid: string | null;
  patientName: string | null;
  expiresAt: number;
  createdAt: number;
  autoRenew?: boolean;
  subscriptionId?: string | null;
}

export function firestoreProfessional(uid: string, db: Firestore) {
  const ref = doc(db, 'professionals', uid);
  const checked = (value: ProfessionalProfile) => {
    if (value.ownerUid !== uid || !value.active) throw new Error('professional-unavailable');
    return value;
  };
  return {
    async load(): Promise<ProfessionalProfile | null> {
      const snapshot = await getDocFromServer(ref);
      return snapshot.exists() ? checked(snapshot.data() as ProfessionalProfile) : null;
    },
    async register(name: string): Promise<ProfessionalProfile> {
      return runTransaction(db, async tx => {
        const snapshot = await tx.get(ref);
        if (snapshot.exists()) return checked(snapshot.data() as ProfessionalProfile);
        const profile = { ownerUid: uid, name: name.trim().slice(0, 200) || 'Profesional', active: true };
        tx.set(ref, { ...profile, createdAt: serverTimestamp() });
        return profile;
      });
    },
    subscribeSeats(onData: (seats: ProfessionalSeat[]) => void, onError: () => void) {
      return onSnapshot(collection(db, 'professionals', uid, 'seats'), { includeMetadataChanges: true }, snapshot => {
        // Do not present a cached list as a confirmed professional relationship.
        if (snapshot.metadata.fromCache) return;
        onData(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as ProfessionalSeat)).sort((a, b) => b.createdAt - a.createdAt));
      }, onError);
    },
    subscribeActivity(patientUid: string, onData: (value: { name: string; history: ExerciseResult[] }) => void, onError: () => void) {
      return onSnapshot(doc(db, 'users', patientUid, 'progress', 'main'), { includeMetadataChanges: true }, snapshot => {
        if (snapshot.metadata.fromCache) return;
        const data = snapshot.data()?.data;
        onData({ name: data?.profile?.name || '', history: data?.history || [] });
      }, onError);
    },
  };
}
