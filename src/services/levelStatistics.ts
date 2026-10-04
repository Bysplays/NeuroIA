import type { ExerciseId, ExerciseResult } from '../types/index.ts';
import { EXERCISE_IDS, validLevel } from './difficulty.ts';
import { normalizeRoundResult } from './roundResult.ts';
import { mergeActivity, localDay } from './activityStats.ts';

/** Read played levels without mutating saved results or treating the final recommendation as played. */
export function playedLevels(result: ExerciseResult): number[] | null {
  if (result.roundAdaptation !== undefined) {
    try { return normalizeRoundResult({...result})?.levels ?? null; } catch { return null; }
  }
  return validLevel(result.level) ? [result.level!] : null;
}
export function playedLevelLabel(result: ExerciseResult): string {
  const levels=playedLevels(result);
  if (!levels) return 'Nivel no registrado';
  const low=Math.min(...levels),high=Math.max(...levels);
  return low===high ? `Nivel ${low}` : `Niveles ${low}–${high}`;
}
/** One point per exercise: last played level plus its range, all at the known completion date. */
export function levelTimeline(history: ExerciseResult[], id: ExerciseId) {
  return mergeActivity(history).filter(result => result.exerciseId === id && !result.practice)
    .flatMap(result => {
      const levels=playedLevels(result);
      return levels ? [{id:result.id,date:result.date,day:localDay(result.date),level:levels.at(-1)!,low:Math.min(...levels),high:Math.max(...levels),
        time:Date.parse(result.date.length===10 ? `${result.date}T12:00:00Z` : result.date)}] : [];
    }).sort((a,b)=>a.time-b.time || a.id.localeCompare(b.id));
}

/** Only constant-level sessions have a single level eligible for this historical mean. */
export function historicalLevelMean(history: ExerciseResult[]) {
  const values=mergeActivity(history).filter(result=>EXERCISE_IDS.includes(result.exerciseId as ExerciseId)&&!result.practice)
    .flatMap(result=>{const levels=playedLevels(result);return levels&&levels.every(n=>n===levels[0])?[levels[0]]:[];});
  return values.length ? values.reduce((sum,value)=>sum+value,0)/values.length : null;
}
