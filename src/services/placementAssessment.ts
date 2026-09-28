import type { ExerciseResult } from '../types/index.ts';
import type { PlacementTrial } from './difficulty.ts';

export const ASSESSMENT_LEVELS = [1, 4, 7, 10] as const;
export type AssessmentLevel = typeof ASSESSMENT_LEVELS[number];
export function validAssessmentLevel(value: unknown): value is AssessmentLevel | 5 {
  return value === 1 || value === 4 || value === 5 || value === 7 || value === 10;
}

/** A failed/omitted stage ends this game at the last level actually passed. */
export function advanceAssessment(level: AssessmentLevel, best?: PlacementTrial, result?: ExerciseResult): {
  next?: AssessmentLevel; best?: PlacementTrial; finished?: PlacementTrial;
} {
  const passed = result && result.totalQuestions > 0 && result.correctAnswers === result.totalQuestions;
  const trial: PlacementTrial = result
    ? { accuracy: result.accuracy, questions: result.totalQuestions, hints: result.hintsUsed ?? 0, skipped:false, assessedLevel:level }
    : { accuracy:0, questions:0, hints:0, skipped:true, assessedLevel:1 };
  if (passed) {
    const next = ASSESSMENT_LEVELS[ASSESSMENT_LEVELS.indexOf(level) + 1];
    return next ? { next, best: trial } : { finished: trial };
  }
  return { finished: best ?? { ...trial, assessedLevel:1 } };
}

/** Pick another unfinished game whenever possible; each game owns its next stage. */
export function nextAssessmentGame<T extends string>(available: readonly T[], previous?: T, random = Math.random): T | undefined {
  const others = available.filter(id => id !== previous);
  const candidates = others.length ? others : available;
  return candidates.length ? candidates[Math.floor(random() * candidates.length)] : undefined;
}
