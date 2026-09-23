import type { ExerciseResult } from '../types/index.ts';

const isDateOnly = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date);
const activityDate = (date: string) => new Date(isDateOnly(date) ? `${date}T12:00:00` : date);

export function formatActivityDate(date: string) {
  const d = activityDate(date);
  return {
    day: d.toLocaleDateString('es-ES'),
    time: isDateOnly(date) ? null : d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
  };
}

export function localDay(date: string) {
  const d = activityDate(date);
  if (!Number.isFinite(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
// Resolve historical result IDs for display without rewriting saved activity.
const legacyExerciseIds: Record<string, string> = {
  'visual-scan': 'visual-scanning',
  'daily-seq': 'daily-sequencing',
  'motor-coord': 'motor-target',
};

export function mergeActivity(...sources: ExerciseResult[][]): ExerciseResult[] {
  return [...new Map(sources.flat().map(r => [r.id, r])).values()]
    .map(r => Object.hasOwn(legacyExerciseIds, r.exerciseId) ? { ...r, exerciseId: legacyExerciseIds[r.exerciseId] } : r)
    .filter(r => localDay(r.date)).sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}
export function secondsPerQuestion(r: ExerciseResult) {
  return r.totalQuestions > 0 && Number.isFinite(r.durationSeconds) && r.durationSeconds >= 0 ? r.durationSeconds / r.totalQuestions : null;
}
export function dailyActivity(results: ExerciseResult[], metric: 'accuracy' | 'speed') {
  const groups = new Map<string, { day: string; exerciseId: string; sum: number; count: number }>();
  for (const r of results) {
    const day = localDay(r.date);
    const value = metric === 'accuracy' ? r.accuracy : secondsPerQuestion(r);
    if (!day || value === null || !Number.isFinite(value)) continue;
    const key = `${day}:${r.exerciseId}`;
    const group = groups.get(key) ?? { day, exerciseId: r.exerciseId, sum: 0, count: 0 };
    group.sum += value; group.count++; groups.set(key, group);
  }
  return [...groups.values()].map(g => ({ ...g, value: g.sum / g.count })).sort((a, b) => a.day.localeCompare(b.day));
}
