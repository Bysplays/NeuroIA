import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exerciseStages, sessionProgress } from '../src/services/sessionProgress.ts';
import { gameConfig } from '../src/services/difficulty.ts';

test('a path sums stages instead of weighting each game equally', () => {
  const naming = exerciseStages('language-naming', gameConfig(1));
  const targets = exerciseStages('motor-target', gameConfig(1));
  assert.equal(naming, 3);
  assert.equal(targets, 5);
  assert.deepEqual(sessionProgress(2, naming, { before: 0, after: targets }), { value: 2, max: 8 });
  assert.deepEqual(sessionProgress(0, targets, { before: naming, after: 0 }), { value: 3, max: 8 });
});
test('standalone and continuous arenas retain bounded progress', () => {
  assert.deepEqual(sessionProgress(.5, 1), { value: .5, max: 1 });
  assert.deepEqual(sessionProgress(4, 3), { value: 3, max: 3 });
});
