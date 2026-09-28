import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const readJson = (file: string) => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
const objects = readJson('../src/services/illustratedArtwork.json');
const sheets = readJson('../src/services/illustratedAtlasBounds.json');

test('active game objects have a unique illustrated mapping and valid transparent crop', () => {
  const symbols = new Set<string>();
  const slots = new Set<string>();
  for (const item of objects) {
    assert.ok(!symbols.has(item.symbol), `Duplicate symbol ${item.symbol}`);
    symbols.add(item.symbol);
    const slot = `${item.sheet}:${item.cell}`;
    assert.ok(!slots.has(slot), `Duplicate crop ${slot}`);
    slots.add(slot);
    const sheet = sheets[item.sheet];
    const crop = sheet.boxes[item.cell];
    assert.ok(crop.width > 0 && crop.height > 0);
    assert.ok(crop.x >= 0 && crop.y >= 0);
    assert.ok(crop.x + crop.width <= sheet.width);
    assert.ok(crop.y + crop.height <= sheet.height);
  }
  sheets.forEach((sheet: { width: number; height: number }, index: number) => {
    const png = readFileSync(new URL(`../public/images/objects/illustrated/sheet-${index}.png`, import.meta.url));
    assert.equal(png.readUInt32BE(16), sheet.width);
    assert.equal(png.readUInt32BE(20), sheet.height);
    assert.equal(png[25], 6, 'RGBA source required');
  });
  for (const key of ['table', 'towel', 'soup']) {
    symbols.add(key);
    const png = readFileSync(new URL(`../public/images/objects/${key}.png`, import.meta.url));
    assert.equal(png[25], 6);
  }
  for (const file of readdirSync(new URL('../src/games/', import.meta.url)).filter(file => file.endsWith('.tsx'))) {
    const source = readFileSync(new URL(`../src/games/${file}`, import.meta.url), 'utf8');
    for (const match of source.matchAll(/(?:emoji|symbol): '([^']+)'/g)) {
      assert.ok(symbols.has(match[1]), `${file}: missing illustrated stimulus ${match[1]}`);
    }
  }
});
