import type { ExerciseId } from '../types/index.ts';
import type { GameConfig } from './difficulty.ts';

/** Number of playable stages; continuous arenas count as one stage. */
export function exerciseStages(id: ExerciseId, config: GameConfig): number {
  switch (id) {
    case 'language-naming': case 'word-completion': case 'categorization': return config.rounds;
    case 'memory-path': return config.mode === 'normal' ? 3 : 1;
    case 'memory-pairs': return config.pairs;
    case 'motor-target': return config.targets;
    default: return 1;
  }
}
export function sessionProgress(done: number, total: number, surrounding?: { before: number; after: number }) {
  const before = surrounding?.before ?? 0;
  return { value: before + Math.max(0, Math.min(done, total)), max: before + total + (surrounding?.after ?? 0) };
}
