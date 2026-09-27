// Called only when a round starts, never while rendering its tiles.
export function createMemorySequence(tileIds: readonly number[], length: number, random = Math.random): number[] {
  if (!tileIds.length || !Number.isInteger(length) || length < 1) throw new Error('invalid-memory-sequence');
  return Array.from({ length }, () => tileIds[Math.floor(random() * tileIds.length)]);
}
