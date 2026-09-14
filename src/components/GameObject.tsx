import type { CSSProperties } from 'react';
import artwork from '../services/gameArtwork.json';

const objects = new Map(artwork.map(item => [item.symbol, item]));

/** Consistent illustrations; symbols remain stable keys for the existing game rules. */
export function GameObject({ symbol }: { symbol: string }) {
  const item = objects.get(symbol);
  if (!item) return <span aria-hidden="true">{symbol}</span>;
  return <span className="game-object" aria-hidden="true" style={{
    backgroundImage: `url('/images/game-objects-${item.sheet}.png')`,
    backgroundPosition: `${(item.cell % 8 + .06) / 7.12 * 100}% ${(Math.floor(item.cell / 8) + .06) / 4.12 * 100}%`,
  } as CSSProperties} />;
}
