import type { ExerciseId } from '../types/index.ts';
import type { GameConfig } from './difficulty.ts';

/** A complete game at one level is one stage, regardless of its objects or rounds. */
export function exerciseStages(_id: ExerciseId, _config: GameConfig): number {
  return 1;
}
export function sessionProgress(done: number, total: number, surrounding?: { before: number; after: number }) {
  const before = surrounding?.before ?? 0;
  return { value: before + Math.max(0, Math.min(Math.floor(done), total)), max: before + total + (surrounding?.after ?? 0) };
}
