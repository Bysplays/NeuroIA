import type { ExerciseId, ExerciseResult } from '../types/index.ts';
import { DIFFICULTY_VERSION, EXERCISE_IDS, validLevel } from './difficulty.ts';

export interface SessionLink { professionalId: string; seatId: string; patientId: string }
export interface SessionStep { exerciseId: ExerciseId; level: number }
export interface SessionDraft { title: string; note: string; steps: SessionStep[] }
export interface AssignedSession extends SessionDraft, SessionLink {
  id: string;
  professionalName: string;
  configVersion: number;
  status: 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  completedCount: number;
  resultIds: string[];
  createdAt: number;
  updatedAt?: number;
}
export function validateSessionDraft(draft: SessionDraft): SessionDraft {
  const title = draft.title.trim(), note = draft.note.trim();
  if (!title || title.length > 80 || note.length > 280 || !Array.isArray(draft.steps) || draft.steps.length < 1 || draft.steps.length > 8
    || draft.steps.some(step => !EXERCISE_IDS.includes(step.exerciseId) || !validLevel(step.level))) throw new Error('Revisa el título, los juegos y sus niveles. La sesión admite entre 1 y 8 juegos.');
  return { title, note, steps: draft.steps.map(step => ({ exerciseId: step.exerciseId, level: step.level })) };
}
export const assignedResultId = (id: string, step: number) => `assigned-${id}-${step}`;
export function assignmentResult(session: AssignedSession, step: number, result: ExerciseResult): ExerciseResult {
  const expected = session.steps[step];
  if (!expected || expected.exerciseId !== result.exerciseId || expected.level !== result.level || result.configVersion !== session.configVersion) throw new Error('El ejercicio no coincide con la sesión propuesta.');
  return { ...result, id: assignedResultId(session.id, step), assignmentId: session.id, assignmentStep: step, assignmentSeatId: session.seatId, assignmentOwnerId: session.professionalId };
}
export function canAdvanceSession(session: AssignedSession, result: ExerciseResult) {
  const index = session.completedCount, step = session.steps[index];
  return session.status === 'in-progress' && session.configVersion === DIFFICULTY_VERSION && !!step
    && result.id === assignedResultId(session.id, index) && result.assignmentId === session.id && result.assignmentStep === index
    && result.assignmentOwnerId === session.professionalId && result.assignmentSeatId === session.seatId
    && result.exerciseId === step.exerciseId && result.level === step.level && result.configVersion === session.configVersion && result.practice !== true;
}
export const sessionStatusLabel: Record<AssignedSession['status'], string> = {
  assigned: 'Por empezar', 'in-progress': 'En curso', completed: 'Completada', cancelled: 'Cancelada',
};
