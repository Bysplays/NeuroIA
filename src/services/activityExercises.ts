import { ALL_EXERCISES } from './exerciseCatalog.ts';
import type { CognitiveDomain } from '../types/index.ts';

// Stable historical series styles must not change when a game leaves the catalog.
const series: Record<string, { color: string }> = {
  'visual-scanning': { color: '#007f86' },
  'language-naming': { color: '#d34887' },
  'word-completion': { color: '#5946c2' },
  'memory-path': { color: '#c56508' },
  'memory-pairs': { color: '#327b35' },
  'daily-sequencing': { color: '#bf302e' },
  categorization: { color: '#2876c7' },
  'motor-target': { color: '#82720d' },
  'motor-tracking': { color: '#7c466d' },
};

export const ACTIVITY_EXERCISES: { id: string; domain: CognitiveDomain; title: string; retired?: boolean }[] = [
  ...ALL_EXERCISES,
  { id: 'daily-sequencing', domain: 'executive', title: 'Secuencias de la Vida Diaria', retired: true },
];

export function activityExerciseTitle(id: string) {
  return ACTIVITY_EXERCISES.find(exercise => exercise.id === id)?.title ?? id;
}

export function activityExerciseStyle(id: string) {
  return series[id] ?? { color: '#007f86' };
}
