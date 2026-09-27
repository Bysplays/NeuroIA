import { ALL_EXERCISES } from './exerciseCatalog.ts';
import type { CognitiveDomain } from '../types/index.ts';

// Stable historical series styles must not change when a game leaves the catalog.
const series: Record<string, { color: string; dashed: boolean }> = {
  'visual-scanning': { color: '#247f89', dashed: false },
  'language-naming': { color: '#a85578', dashed: true },
  'word-completion': { color: '#6656ac', dashed: false },
  'memory-path': { color: '#ac661f', dashed: true },
  'memory-pairs': { color: '#427639', dashed: false },
  'daily-sequencing': { color: '#b34245', dashed: true },
  categorization: { color: '#3570ae', dashed: false },
  'motor-target': { color: '#88752a', dashed: true },
  'motor-tracking': { color: '#8d558c', dashed: false },
};

export const ACTIVITY_EXERCISES: { id: string; domain: CognitiveDomain; title: string; retired?: boolean }[] = [
  ...ALL_EXERCISES,
  { id: 'daily-sequencing', domain: 'executive', title: 'Secuencias de la Vida Diaria', retired: true },
];

export function activityExerciseTitle(id: string) {
  return ACTIVITY_EXERCISES.find(exercise => exercise.id === id)?.title ?? id;
}

export function activityExerciseStyle(id: string) {
  return series[id] ?? { color: '#247f89', dashed: false };
}
