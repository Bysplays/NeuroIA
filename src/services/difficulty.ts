import { validAssessmentLevel, type AssessmentLevel } from './placementAssessment.ts';
import type { ExerciseId, ExerciseResult, UserProfile } from '../types/index.ts';

export const DIFFICULTY_VERSION = 1;
export const EXERCISE_IDS: ExerciseId[] = ['visual-scanning', 'language-naming', 'word-completion', 'memory-path', 'memory-pairs', 'categorization', 'motor-target', 'motor-tracking'];
export interface GameLevel { level: number; evidence: number[]; qualifyingRuns?: number }
export type GameLevels = Record<ExerciseId, GameLevel>;
export interface PlacementTrial { assessedLevel?: AssessmentLevel | 5; accuracy: number; questions: number; hints: number; skipped: boolean }
export interface Placement { version: number; trials: Partial<Record<ExerciseId, PlacementTrial>>; completed: boolean }
export type GameMode = 'normal' | 'practice' | 'placement';
export function validLevel(value: unknown): value is number { return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 10; }
export function placementTrials(profile: UserProfile): Partial<Record<ExerciseId, PlacementTrial>> {
  if (profile.placement?.version !== DIFFICULTY_VERSION) return {};
  // A completed record with missing levels must be reassessed, not trap entry.
  if (profile.placement.completed && !EXERCISE_IDS.every(id => validLevel(profile.gameLevels?.[id]?.level))) return {};
  return Object.fromEntries(Object.entries(profile.placement.trials ?? {}).filter(([id, trial]) => EXERCISE_IDS.includes(id as ExerciseId)
    && trial && (trial.assessedLevel === undefined || validAssessmentLevel(trial.assessedLevel)) && Number.isFinite(trial.accuracy) && trial.accuracy >= 0 && trial.accuracy <= 100
    && Number.isInteger(trial.questions) && trial.questions >= 0 && trial.questions <= 1000 && Number.isInteger(trial.hints) && trial.hints >= 0 && trial.hints <= 1000 && typeof trial.skipped === 'boolean'));
}
export function hasPlacement(profile: UserProfile) {
  return profile.placement?.version === DIFFICULTY_VERSION && profile.placement.completed === true
    && EXERCISE_IDS.every(id => validLevel(profile.gameLevels?.[id]?.level) && placementTrials(profile)[id] !== undefined);
}
export function assignedLevel(profile: UserProfile, id: ExerciseId) { return validLevel(profile.gameLevels?.[id]?.level) ? profile.gameLevels![id]!.level : 1; }

/** Explicit versioned rows: no timers or randomness in the level contract. */
export function gameConfig(level: number, mode: GameMode = 'normal') {
  if (!validLevel(level)) throw new Error('invalid-game-level');
  const i = level - 1;
  return Object.freeze({
    level, version: DIFFICULTY_VERSION, mode,
    rounds: mode !== 'normal' ? 1 : [3,4,4,5,5,6,6,7,7,8][i],
    choices: [2,2,3,3,3,4,4,4,4,4][i],
    vocabularySize: [8,10,12,14,16,18,20,24,28,30][i],
    scanRows: [2,2,3,3,4,4,5,5,6,6][i],
    scanCols: [3,4,3,4,3,4,4,5,5,6][i],
    pairs: mode === 'practice' ? 2 : [2,2,3,3,4,4,5,5,6,6][i],
    previewSeconds: [8,7,7,6,6,5,5,4,4,3][i],
    sequenceLength: [2,2,3,3,4,4,5,5,6,6][i],
    sequenceStepMs: [1300,1200,1200,1100,1100,1000,1000,900,900,800][i],
    targetSize: [160,152,144,136,128,120,112,104,96,88][i],
    targets: mode === 'practice' ? 3 : [5,6,7,8,9,10,11,12,13,14][i],
    trackingSpeed: [0.06,0.08,0.10,0.12,0.14,0.16,0.18,0.20,0.22,0.24][i],
    contactSeconds: mode === 'practice' ? 3 : mode === 'placement' ? 6 : [6,7,8,9,10,11,12,13,14,15][i],
  });
}
export type GameConfig = ReturnType<typeof gameConfig>;

export function placementLevel(trial: PlacementTrial, id?: ExerciseId) {
  if (validAssessmentLevel(trial.assessedLevel)) return trial.assessedLevel;
  if (id === 'motor-tracking') return 1;
  if (trial.skipped || trial.questions < 3) return 1;
  return trial.accuracy >= 85 && trial.hints === 0 ? 4 : trial.accuracy >= 60 ? 3 : 1;
}
export function applyPlacement(profile: UserProfile, id: ExerciseId, trial: PlacementTrial) {
  if (!EXERCISE_IDS.includes(id) || (trial.assessedLevel !== undefined && !validAssessmentLevel(trial.assessedLevel)) || !Number.isFinite(trial.accuracy) || trial.accuracy < 0 || trial.accuracy > 100
    || !Number.isInteger(trial.questions) || trial.questions < 0 || trial.questions > 1000
    || !Number.isInteger(trial.hints) || trial.hints < 0 || trial.hints > 1000 || typeof trial.skipped !== 'boolean') throw new Error('invalid-placement');
  if (hasPlacement(profile)) return;
  const previous = placementTrials(profile);
  if (previous[id]) return; // First committed trial wins across devices and retry IDs.
  const trials = { ...previous, [id]: { ...trial } };
  const completed = EXERCISE_IDS.every(key => trials[key]);
  profile.placement = { version: DIFFICULTY_VERSION, trials, completed };
  profile.gameLevels = Object.fromEntries(EXERCISE_IDS.filter(key => trials[key]).map(key => [key, { level: placementLevel(trials[key]!, key), evidence: [] }]));
}

export function adaptDifficulty(profile: UserProfile, result: ExerciseResult) {
  const id = result.exerciseId as ExerciseId;
  const current = profile.gameLevels?.[id];
  if (!current || result.configVersion !== DIFFICULTY_VERSION
    || result.practice === true || !validLevel(result.level) || result.totalQuestions <= 0) return;
  // Easier/manual sessions break the run; they must not raise the recommended base.
  const validTiming = Number.isFinite(result.durationSeconds) && result.durationSeconds > 0;
  const measured = 100 * result.correctAnswers / result.totalQuestions;
  const eligible = result.level >= current.level && validTiming;
  const perfect = eligible && result.correctAnswers === result.totalQuestions && result.durationSeconds < 60;
  const strong = eligible && measured > 90 && result.durationSeconds < 180;
  const runs = strong ? (current.qualifyingRuns ?? 0) + 1 : 0;
  current.evidence = []; // Old precision-only evidence cannot establish a timed streak.
  if (current.level < 10 && (perfect || runs >= 2)) {
    current.level += 1;
    current.qualifyingRuns = 0;
  } else {
    current.qualifyingRuns = current.level === 10 ? 0 : Math.min(1, runs);
  }
}
