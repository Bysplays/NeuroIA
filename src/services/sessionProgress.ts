import type { ExerciseId } from '../types/index.ts';
import type { GameConfig } from './difficulty.ts';

/** Grouped activities count complete rounds; solo targets count successful taps. */
export function exerciseStages(id: ExerciseId, config: GameConfig, individual = false): number {
  if (individual && config.mode === 'normal' && id === 'motor-target') return config.targets;
  if (individual && config.mode === 'normal' && id === 'memory-pairs') return 3;
  if (id === 'memory-path') return config.mode === 'normal' ? 3 : 1;
  if (['visual-scanning', 'language-naming', 'word-completion', 'categorization'].includes(id)) return config.rounds;
  return 1;
}
export function sessionProgress(done: number, total: number, surrounding?: { before: number; after: number }) {
  const before = surrounding?.before ?? 0;
  return { value: before + Math.max(0, Math.min(Math.floor(done), total)), max: before + total + (surrounding?.after ?? 0) };
}
