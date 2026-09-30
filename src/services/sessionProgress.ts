import type { ExerciseId } from '../types/index.ts';
import type { GameConfig } from './difficulty.ts';

/** Count complete rounds, not individual matches, taps or seconds of contact. */
export function exerciseStages(id: ExerciseId, config: GameConfig): number {
  if (id === 'memory-path') return config.mode === 'normal' ? 3 : 1;
  if (['visual-scanning', 'language-naming', 'word-completion', 'categorization'].includes(id)) return config.rounds;
  return 1;
}
export function sessionProgress(done: number, total: number, surrounding?: { before: number; after: number }) {
  const before = surrounding?.before ?? 0;
  return { value: before + Math.max(0, Math.min(Math.floor(done), total)), max: before + total + (surrounding?.after ?? 0) };
}
