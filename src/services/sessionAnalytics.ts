import { matchesAssignedStep, type AssignedSession } from './assignedSessions.ts';
import type { ExerciseResult } from '../types/index.ts';

/** Only confirmed, attributable steps count; repeated exercise types stay distinct. */
export function sessionAnalytics(session: AssignedSession, results: ExerciseResult[]) {
  const steps = session.steps.map((_, index) => results.find(result => matchesAssignedStep(session, index, result)));
  const available = steps.filter((result): result is ExerciseResult => !!result);
  const questions = available.reduce((sum, result) => sum + result.totalQuestions, 0);
  const correct = available.reduce((sum, result) => sum + result.correctAnswers, 0);
  const seconds = available.reduce((sum, result) => sum + result.durationSeconds, 0);
  return { steps, available: available.length, missing: Math.max(0, session.completedCount - available.length),
    accuracy: questions ? correct / questions * 100 : null,
    seconds: available.length ? seconds : null };
}
