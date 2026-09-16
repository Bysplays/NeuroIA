import { doc, getDocFromServer, onSnapshot, runTransaction, serverTimestamp, type Firestore } from 'firebase/firestore';
import { applyProgressOperation, patientProgress, type ProgressData, type ProgressOperation } from './progressData.ts';

export function firestoreProgress(uid: string, db: Firestore) {
  const ref = doc(db, 'users', uid, 'progress', 'main');
  const clean = (value: unknown) => JSON.parse(JSON.stringify(value));
  return {
    async load(): Promise<ProgressData | null> {
      const snapshot = await getDocFromServer(ref);
      return snapshot.exists() ? snapshot.data().data as ProgressData : null;
    },
    async initialize(initial: ProgressData): Promise<ProgressData> {
      return runTransaction(db, async tx => {
        const existing = await tx.get(ref);
        if (existing.exists()) return existing.data().data as ProgressData;
        const data = patientProgress(initial);
        tx.set(ref, { schemaVersion: 1, data: clean(data), updatedAt: serverTimestamp() });
        // Imported history must also be protected from later result retries.
        for (const result of data.history) tx.set(doc(db, 'users', uid, 'operations', encodeURIComponent(`result:${result.id}`)), { kind: 'result', createdAt: serverTimestamp() });
        return data;
      });
    },
    async commit(operation: ProgressOperation): Promise<ProgressData> {
      const receipt = doc(db, 'users', uid, 'operations', encodeURIComponent(operation.id));
      return runTransaction(db, async tx => {
        const current = await tx.get(ref);
        const applied = await tx.get(receipt);
        if (!current.exists()) throw new Error('missing-progress');
        const before = current.data().data as ProgressData;
        if (applied.exists()) return before;
        const data = applyProgressOperation(before, operation);
        tx.set(ref, { schemaVersion: 1, data: clean(data), updatedAt: serverTimestamp() });
        tx.set(receipt, { kind: operation.kind, createdAt: serverTimestamp() });
        if (operation.kind === 'result') tx.set(doc(db, 'users', uid, 'results', encodeURIComponent(operation.result.id)), clean(operation.result));
        return data;
      });
    },
    watch(next: (data: ProgressData) => void, error: (error: unknown) => void) {
      return onSnapshot(ref, { includeMetadataChanges: true }, snapshot => {
        if (snapshot.exists() && !snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) next(snapshot.data().data as ProgressData);
      }, error);
    },
  };
}
