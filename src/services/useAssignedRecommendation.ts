import { useEffect, useMemo, useState } from 'react';
import { getFirestore } from 'firebase/firestore';
import { auth } from './firebase';
import { firestoreSessions } from './firestoreSessions';
import { completedSessionSteps, type AssignedSession, type SessionLink } from './assignedSessions';
import type { ExerciseResult } from '../types';
import { localDay } from './activityStats';

export function useAssignedRecommendation(link: SessionLink | null, history: ExerciseResult[]) {
  const owner = link?.professionalId, seat = link?.seatId, patient = link?.patientId;
  const adapter = useMemo(() => owner && seat && patient ? firestoreSessions(getFirestore(auth.app), { professionalId: owner, seatId: seat, patientId: patient }) : null, [owner, seat, patient]);
  const [state, setState] = useState<{ adapter: typeof adapter; sessions: AssignedSession[] }>();
  const [archive, setArchive] = useState<{ key: string; results: ExerciseResult[] }>();
  useEffect(() => adapter?.watch(sessions => setState({ adapter, sessions }), () => setState(undefined)), [adapter]);
  const sessions = state?.adapter === adapter ? state?.sessions ?? [] : [];
  const session = sessions.find(s => s.status === 'in-progress') ?? sessions.find(s => s.status === 'assigned')
    ?? sessions.find(s => s.status === 'completed' && localDay(new Date(s.updatedAt || s.createdAt).toISOString()) === localDay(new Date().toISOString()));
  const sessionId = session?.id;
  const key = `${owner}:${seat}:${patient}:${session?.id}`;
  useEffect(() => sessionId && adapter ? adapter.watchResults(sessionId, results => setArchive({ key, results }), () => setArchive(undefined)) : undefined, [adapter, sessionId, key]);
  return session ? { session, completed: completedSessionSteps(session, [...history, ...(archive?.key === key ? archive.results : [])]) } : undefined;
}
