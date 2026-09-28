import type { CSSProperties } from 'react';
import artwork from '../services/gameArtwork.json';
import illustratedArtwork from '../services/illustratedArtwork.json';
import illustratedBounds from '../services/illustratedAtlasBounds.json';
import organizationArtwork from '../services/organizationArtwork.json';

const standaloneObjects: Record<string, string> = { table: 'table.png', towel: 'towel.png', soup: 'soup.png' };
const illustratedObjects = new Map(illustratedArtwork.map(item => [item.symbol, item]));
const objects = new Map(artwork.map(item => [item.symbol, item]));

/** Consistent illustrations; symbols remain stable keys for the existing game rules. */
export function GameObject({ symbol, transparent = false }: { symbol: string; transparent?: boolean }) {
  const standalone = standaloneObjects[symbol];
  if (standalone) return <span className="game-object game-object-illustrated" aria-hidden="true" style={{
    backgroundImage: `url('${import.meta.env.BASE_URL}images/objects/${standalone}')`,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  }} />;
  const illustration = illustratedObjects.get(symbol);
  if (illustration) {
    const sheet = illustratedBounds[illustration.sheet];
    const crop = sheet.boxes[illustration.cell];
    const size = Math.max(crop.width, crop.height) / .88;
    return <span className="game-object game-object-illustrated" aria-hidden="true">
      <span className="game-object-crop" style={{
        width: `${crop.width / size * 100}%`,
        height: `${crop.height / size * 100}%`,
        backgroundImage: `url('${import.meta.env.BASE_URL}images/objects/illustrated/sheet-${illustration.sheet}.png')`,
        backgroundSize: `${sheet.width / crop.width * 100}% ${sheet.height / crop.height * 100}%`,
        backgroundPosition: `${crop.x / (sheet.width - crop.width) * 100}% ${crop.y / (sheet.height - crop.height) * 100}%`,
      }}/>
    </span>;
  }
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
