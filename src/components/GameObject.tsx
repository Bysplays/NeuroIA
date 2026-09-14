import type { CSSProperties } from 'react';
import artwork from '../services/gameArtwork.json';
import organizationArtwork from '../services/organizationArtwork.json';

const objects = new Map(artwork.map(item => [item.symbol, item]));

/** Consistent illustrations; symbols remain stable keys for the existing game rules. */
export function GameObject({ symbol, transparent = false }: { symbol: string; transparent?: boolean }) {
  const item = objects.get(symbol);
  if (!item) return <span aria-hidden="true">{symbol}</span>;
  if (transparent && item.sheet < 2) {
    const crop = organizationArtwork.boxes[item.sheet * 40 + item.cell];
    const x = Math.max(0, crop.x - 1);
    const y = Math.max(0, crop.y - 1);
    const width = crop.width + 2;
    const height = crop.height + 2;
    const size = Math.max(width, height);
    return <span className="game-object game-object-transparent" aria-hidden="true">
      <span className="game-object-crop" style={{
        width: `${width / size * 100}%`,
        height: `${height / size * 100}%`,
        backgroundImage: `url('${import.meta.env.BASE_URL}images/organization-objects.png')`,
        backgroundSize: `${organizationArtwork.width / width * 100}% ${organizationArtwork.height / height * 100}%`,
        backgroundPosition: `${x / (organizationArtwork.width - width) * 100}% ${y / (organizationArtwork.height - height) * 100}%`,
      }} />
    </span>;
  }
  return <span className="game-object" aria-hidden="true" style={{
    backgroundImage: `url('${import.meta.env.BASE_URL}images/game-objects-${item.sheet}.png')`,
    backgroundPosition: `${(item.cell % 8 + .06) / 7.12 * 100}% ${(Math.floor(item.cell / 8) + .06) / 4.12 * 100}%`,
  } as CSSProperties} />;
}
