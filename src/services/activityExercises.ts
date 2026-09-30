import { ALL_EXERCISES } from './exerciseCatalog.ts';
import type { CognitiveDomain } from '../types/index.ts';

// Stable historical series styles must not change when a game leaves the catalog.
const series: Record<string, { color: string }> = {
  'visual-scanning': { color: '#276a93' },
  'language-naming': { color: '#548dba' },
  'word-completion': { color: '#173b55' },
  'memory-path': { color: '#398b8c' },
  'memory-pairs': { color: '#657fa0' },
  'daily-sequencing': { color: '#526675' },
  categorization: { color: '#2a5671' },
  'motor-target': { color: '#427571' },
  'motor-tracking': { color: '#788997' },
};

export const ACTIVITY_EXERCISES: { id: string; domain: CognitiveDomain; title: string; retired?: boolean }[] = [
  ...ALL_EXERCISES,
  { id: 'daily-sequencing', domain: 'executive', title: 'Secuencias de la Vida Diaria', retired: true },
];

export function activityExerciseTitle(id: string) {
  return ACTIVITY_EXERCISES.find(exercise => exercise.id === id)?.title ?? id;
}

export function activityExerciseStyle(id: string) {
  return series[id] ?? { color: '#276a93' };
}
