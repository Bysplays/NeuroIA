import { collection, doc, getDocFromServer, limit, onSnapshot, orderBy, query, where, runTransaction, serverTimestamp, type DocumentSnapshot, type Firestore } from 'firebase/firestore';
import { assignedResultId, canAdvanceSession, validateSessionDraft, type AssignedSession, type SessionDraft, type SessionLink } from './assignedSessions.ts';
import { DIFFICULTY_VERSION } from './difficulty.ts';
import type { ExerciseResult } from '../types/index.ts';

export function firestoreSessions(db: Firestore, link: SessionLink) {
  for (const value of Object.values(link)) if (!/^[A-Za-z0-9_-]{1,128}$/.test(value)) throw new Error('invalid-session-link');
  const sessions = collection(db, 'professionals', link.professionalId, 'seats', link.seatId, 'participants', link.patientId, 'sessions');
  const read = (snapshot: DocumentSnapshot): AssignedSession => {
    const data = snapshot.data()!;
    return { ...data, ...link, id: snapshot.id, createdAt: data.createdAt?.toMillis?.() ?? 0, updatedAt: data.updatedAt?.toMillis?.() ?? 0 } as AssignedSession;
  };
  return {
    watch(next: (sessions: AssignedSession[]) => void, error: () => void, activeOnly = false) {
      const list = activeOnly ? query(sessions, where('status', 'in', ['assigned', 'in-progress']), limit(50)) : query(sessions, orderBy('createdAt', 'desc'), limit(50));
      return onSnapshot(list, { includeMetadataChanges: true }, snapshot => {
        // The initial cache snapshot is not a failed server query (often empty on first entry).
        if (snapshot.metadata.fromCache) {
          if (typeof navigator !== 'undefined' && !navigator.onLine) error();
          return;
        }
        if (!snapshot.metadata.hasPendingWrites) next(snapshot.docs.map(read).sort((a, b) => b.createdAt - a.createdAt));
      }, error);
    },
    watchOne(id: string, next: (session: AssignedSession | null) => void, error: () => void) {
      return onSnapshot(doc(sessions, id), { includeMetadataChanges: true }, snapshot => {
        if (snapshot.metadata.fromCache) { error(); return; }
        if (!snapshot.metadata.hasPendingWrites) next(snapshot.exists() ? read(snapshot) : null);
      }, error);
    },
    async publish(id: string, draft: SessionDraft) {
      const value = validateSessionDraft(draft);
      const ref = doc(sessions, id);
      await runTransaction(db, async tx => {
        const existing = await tx.get(ref);
        if (existing.exists()) return; // Stable draft ID also covers an ambiguous network acknowledgement.
        const owner = await tx.get(doc(db, 'professionals', link.professionalId));
        if (!owner.exists()) throw new Error('No se ha podido comprobar el perfil profesional.');
        tx.set(ref, { ...link, ...value, professionalName: owner.data().name, configVersion: DIFFICULTY_VERSION,
          status: 'assigned', completedCount: 0, resultIds: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      });
    },
    async edit(original: AssignedSession, draft: SessionDraft) {
      const value = validateSessionDraft(draft);
      const ref = doc(sessions, original.id);
      await runTransaction(db, async tx => {
        const snapshot = await tx.get(ref);
        if (!snapshot.exists() || snapshot.data().status !== 'assigned') throw new Error('Esta sesión ya ha empezado o no está disponible para editar.');
        const current = snapshot.data();
        if (current.title === value.title && current.note === value.note && JSON.stringify(current.steps) === JSON.stringify(value.steps)) return;
        if (current.title !== original.title || current.note !== original.note || JSON.stringify(current.steps) !== JSON.stringify(original.steps)) throw new Error('La sesión ha cambiado. Cierra el editor y vuelve a abrirla.');
        tx.update(ref, { ...value, updatedAt: serverTimestamp() });
      });
    },
    async cancel(id: string) {
      const ref = doc(sessions, id);
      await runTransaction(db, async tx => {
        const snapshot = await tx.get(ref);
        if (!snapshot.exists() || ['cancelled','completed'].includes(snapshot.data().status)) return;
        tx.update(ref, { status: 'cancelled', updatedAt: serverTimestamp() });
      });
    },
    async start(id: string) {
      const ref = doc(sessions, id);
      await runTransaction(db, async tx => {
        const snapshot = await tx.get(ref);
        if (!snapshot.exists()) throw new Error('Sesión no disponible.');
        if (snapshot.data().status === 'assigned') tx.update(ref, { status: 'in-progress', updatedAt: serverTimestamp() });
        else if (snapshot.data().status !== 'in-progress') throw new Error('Esta sesión ya ha terminado o se ha cancelado.');
      });
    },
    async advance(id: string): Promise<AssignedSession> {
      const ref = doc(sessions, id);
      let observedCount = -1;
      try { return await runTransaction(db, async tx => {
        const snapshot = await tx.get(ref);
        if (!snapshot.exists()) throw new Error('Sesión no disponible.');
        const session = read(snapshot);
        observedCount = session.completedCount;
        if (session.status !== 'in-progress') return session;
        const result = await tx.get(doc(db, 'users', link.patientId, 'results', assignedResultId(id, session.completedCount)));
        if (!result.exists() || !canAdvanceSession(session, result.data() as ExerciseResult)) return session;
        const completedCount = session.completedCount + 1;
        const status = completedCount === session.steps.length ? 'completed' : 'in-progress';
        const resultIds = [...session.resultIds, result.id];
        tx.update(ref, { completedCount, status, resultIds, updatedAt: serverTimestamp() });
        return { ...session, completedCount, status, resultIds };
      }); } catch (error) {
        if ((error as { code?: string }).code === 'permission-denied' && observedCount >= 0) {
          try {
            const latest = await getDocFromServer(ref);
            if (latest.exists()) {
              const session = read(latest);
              if (session.completedCount > observedCount || session.status === 'cancelled') return session;
            }
          } catch { /* Revoked access must remain an error. */ }
        }
        throw error;
      }
    },
    watchResults(id: string, next: (results: ExerciseResult[]) => void, error: () => void) {
      return onSnapshot(query(collection(db, 'users', link.patientId, 'results'), where('assignmentId', '==', id)), { includeMetadataChanges: true }, snapshot => {
        if (snapshot.metadata.fromCache) return;
        if (!snapshot.metadata.hasPendingWrites) next(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as ExerciseResult));
      }, error);
    },
    async loadResults(session: AssignedSession): Promise<ExerciseResult[]> {
      const snapshots = await Promise.all(session.steps.map((_, index) =>
        getDocFromServer(doc(db, 'users', link.patientId, 'results', assignedResultId(session.id, index)))));
      return snapshots.filter(snapshot => snapshot.exists()).map(snapshot => ({ ...snapshot.data(), id: snapshot.id }) as ExerciseResult);
    },
    async load(id: string) {
      const snapshot = await getDocFromServer(doc(sessions, id));
      return snapshot.exists() ? read(snapshot) : null;
    },
  };
}
