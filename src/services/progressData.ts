import { adaptDifficulty, applyPlacement, hasPlacement, EXERCISE_IDS, type PlacementTrial } from './difficulty.ts';
import type { ExerciseId } from '../types/index.ts';
import type { AccessibilitySettings, ExerciseResult, UserProfile } from '../types/index.ts';

export interface ProgressData { profile: UserProfile; history: ExerciseResult[] }
export type ProgressOperation =
  | { id: string; kind: 'placement'; trials: Record<ExerciseId, PlacementTrial> }
  | { id: string; kind: 'placement'; exerciseId: ExerciseId; trial: PlacementTrial }
  | { id: string; kind: 'result'; result: ExerciseResult }
  | { id: string; kind: 'settings'; settings: Partial<AccessibilitySettings>; name?: string };

/** Same exercise counters as local storage; safe to call repeatedly in a transaction. */
export function applyProgressOperation(data: ProgressData, operation: ProgressOperation): ProgressData {
  const next = structuredClone(data);
  const profile = next.profile;
  if (operation.kind === 'placement') {
    if ('trials' in operation) {
      if (Object.keys(operation.trials).length !== EXERCISE_IDS.length || EXERCISE_IDS.some(id => !operation.trials[id])) throw new Error('incomplete-reassessment');
      if (!hasPlacement(profile)) throw new Error('missing-initial-placement');
      const assessment = structuredClone(profile);
      delete assessment.placement;
      delete assessment.gameLevels;
      for (const id of EXERCISE_IDS) applyPlacement(assessment, id, operation.trials[id]);
      // Preserve the original onboarding record; a retake recalibrates base levels only.
      profile.gameLevels = assessment.gameLevels;
    } else applyPlacement(profile, operation.exerciseId, operation.trial);
    return next;
  }
  if (operation.kind === 'settings') {
    if (operation.name !== undefined) {
      const name = operation.name.trim();
      if (!name || name.length > 200) throw new Error('invalid-profile-name');
      profile.name = name;
    }
    profile.settings = { ...profile.settings, ...operation.settings };
    return next;
  }
  const result = structuredClone(operation.result);
  if (next.history.some(item => item.id === result.id)) return next;
  result.accuracy = Math.min(100, Math.max(0, result.accuracy));
  result.correctAnswers = Math.min(result.totalQuestions, Math.max(0, result.correctAnswers));
  adaptDifficulty(profile, result);
  const date = result.date.slice(0, 10);
  if (date > profile.lastActiveDate) {
    const days = Math.round((Date.parse(date) - Date.parse(profile.lastActiveDate)) / 86400000);
    profile.streakDays = days === 1 ? profile.streakDays + 1 : 1;
    profile.lastActiveDate = date;
    profile.dailyPlanCompletedToday = false;
  }
  if (!profile.streakDays) profile.streakDays = 1;
  profile.totalSessions += 1;
  profile.totalMinutes += Math.round(result.durationSeconds / 60) || 1;
  profile.totalScore = (profile.totalScore || 0) + result.score;
  const domain = profile.domainProgress[result.domain];
  const total = domain.totalCompleted + 1;
  domain.avgAccuracy = Math.min(100, Math.round((domain.avgAccuracy * domain.totalCompleted + result.accuracy) / total));
  domain.totalCompleted = total;
  if (result.accuracy >= 85 && total % 3 === 0 && domain.level < 3) domain.level += 1;
  domain.history.push({ date: result.date, accuracy: result.accuracy, score: result.score });
  domain.history = domain.history.slice(-60);
  next.history = [result, ...next.history].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60);
  return next;
}

/** Clinical access is a separate future feature, never imported from local demo data. */
export function patientProgress(data: ProgressData): ProgressData {
  const copy = structuredClone(data);
  // Placement is cloud-owned; a legacy/local import must complete the guided flow.
  delete copy.profile.placement;
  delete copy.profile.gameLevels;
  delete copy.profile.strokeDate;
  delete copy.profile.affectedSide;
  delete copy.profile.prescribedDomain;
  copy.profile.therapistNotes = [];
  copy.profile.prescribedDomains = [];
  copy.profile.therapistGuidanceNote = '';
  copy.history = copy.history.slice(0, 60);
  for (const domain of Object.values(copy.profile.domainProgress)) domain.history = domain.history.slice(-60);
  return copy;
}
