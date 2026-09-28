import type { ExerciseId, ExerciseResult } from '../types/index.ts';
import { validLevel } from './difficulty.ts';
import { mergeActivity, localDay } from './activityStats.ts';

/** Recorded game levels, not reconstructed historical recommendations. */
export function levelTimeline(history: ExerciseResult[], id: ExerciseId) {
  return mergeActivity(history).filter(result => result.exerciseId === id && !result.practice && validLevel(result.level))
    .map(result => ({ id: result.id, date: result.date, day: localDay(result.date), level: result.level!, time: Date.parse(result.date.length === 10 ? `${result.date}T12:00:00Z` : result.date) }))
    .sort((a, b) => a.time - b.time || a.id.localeCompare(b.id));
}
