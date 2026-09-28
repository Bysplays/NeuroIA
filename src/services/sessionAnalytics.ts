import { assignedResultId, type AssignedSession } from './assignedSessions.ts';
import type { ExerciseResult } from '../types/index.ts';

/** Only confirmed, attributable steps count; repeated exercise types stay distinct. */
export function sessionAnalytics(session: AssignedSession, results: ExerciseResult[]) {
  const steps = session.steps.map((step, index) => results.find(result =>
    index < session.completedCount && session.resultIds.includes(result.id)
    && result.id === assignedResultId(session.id, index)
    && result.assignmentId === session.id && result.assignmentStep === index
    && result.assignmentOwnerId === session.professionalId && result.assignmentSeatId === session.seatId
    && result.exerciseId === step.exerciseId && result.level === step.level
    && result.configVersion === session.configVersion && result.practice !== true));
  const available = steps.filter((result): result is ExerciseResult => !!result);
  const questions = available.reduce((sum, result) => sum + result.totalQuestions, 0);
  const correct = available.reduce((sum, result) => sum + result.correctAnswers, 0);
  const seconds = available.reduce((sum, result) => sum + result.durationSeconds, 0);
  return { steps, available: available.length, missing: session.completedCount - available.length,
    accuracy: questions ? correct / questions * 100 : null,
    seconds: available.length ? seconds : null };
}
