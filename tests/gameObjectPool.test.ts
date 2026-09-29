import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GAME_OBJECT_POOL, CLASSIFICATION_POOL, selectPool, namingChoices, completionRound, categoryChoices } from '../src/services/gameObjectPool.ts';
import { gameConfig } from '../src/services/difficulty.ts';

test('expanded pool has unique labels/identities and every stimulus has approved artwork', () => {
  const art = JSON.parse(readFileSync(new URL('../src/services/illustratedArtwork.json', import.meta.url), 'utf8'));
  const symbols = new Set([...art.map((x: { symbol: string }) => x.symbol), 'table', 'towel', 'soup']);
  assert.ok(GAME_OBJECT_POOL.length >= 80);
  assert.equal(new Set(GAME_OBJECT_POOL.map(x => x.name)).size, GAME_OBJECT_POOL.length);
  for (const item of GAME_OBJECT_POOL) assert.ok(symbols.has(item.symbol), item.name);
});
test('all levels provide enough unique alternatives, including the answer exactly once', () => {
  for (let level=1; level<=10; level++) {
    const config=gameConfig(level);
    for(const item of GAME_OBJECT_POOL) {
      const options=namingChoices(item, config);
      assert.equal(options.length, config.choices);
      assert.equal(new Set(options).size, options.length);
      assert.equal(options.filter(x=>x===item.name).length, 1);
      const word=completionRound(item, config);
      assert.equal(word.distractorLetters.length, config.choices-1);
      assert.ok(!word.distractorLetters.includes(word.word[word.missingIndex]));
    }
    for(const item of CLASSIFICATION_POOL) {
      const options=categoryChoices(item, config);
      assert.equal(options.length, config.choices);
      assert.equal(new Set(options).size, options.length);
      assert.ok(options.includes(item.category));
    }
  }
});
test('advanced rounds contain advanced objects rather than random easy-only sessions', () => {
  for(let n=0;n<20;n++) {
    assert.ok(selectPool(gameConfig(1)).every(item=>item.tier===1));
    assert.ok(selectPool(gameConfig(10)).every(item=>item.tier===3));
  }
});

test('specific and generic names never compete as answers for the same drawing', () => {
  for (const names of [['Flor', 'Girasol'], ['Llave', 'Llave inglesa'], ['Agua', 'Ola']]) {
    for (const name of names) {
      const item = GAME_OBJECT_POOL.find(item => item.name === name)!;
      for(let level=1;level<=10;level++) {
        assert.ok(!namingChoices(item, gameConfig(level)).includes(names.find(other => other !== name)!));
      }
    }
  }
});

test('classification avoids shared-room objects while preserving naming vocabulary', () => {
  for(const name of ['Vaso','Taza','Toalla','Jabón','Esponja','Tijeras']) {
    assert.ok(GAME_OBJECT_POOL.some(item=>item.name===name));
    assert.ok(!CLASSIFICATION_POOL.some(item=>item.name===name));
  }
  for(let level=1;level<=10;level++) assert.equal(selectPool(gameConfig(level),CLASSIFICATION_POOL).length,gameConfig(level).rounds);
});
