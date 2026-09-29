import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exerciseStages, sessionProgress } from '../src/services/sessionProgress.ts';
import { gameConfig, EXERCISE_IDS } from '../src/services/difficulty.ts';

test('each complete level contributes one stage regardless of objects and rounds', () => {
  for (const id of EXERCISE_IDS) for (const level of [1, 4, 10]) {
    assert.equal(exerciseStages(id, gameConfig(level)), 1);
    assert.equal(exerciseStages(id, gameConfig(level, 'placement')), 1);
  }
  assert.deepEqual(sessionProgress(0, 1, {before: 2, after: 3}), {value: 2, max: 6});
  assert.deepEqual(sessionProgress(1, 1, {before: 2, after: 3}), {value: 3, max: 6});
});
test('partial object progress never fills a stage', () => {
  assert.deepEqual(sessionProgress(.9, 1), {value: 0, max: 1});
  assert.deepEqual(sessionProgress(4, 1), {value: 1, max: 1});
});
