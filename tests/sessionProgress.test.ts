import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exerciseStages, sessionProgress } from '../src/services/sessionProgress.ts';
import { gameConfig } from '../src/services/difficulty.ts';

test('stages count complete boards or questions, never individual selections', () => {
  for (const level of [1,4,10]) {
    const config=gameConfig(level);
    for (const id of ['visual-scanning','language-naming','word-completion','categorization'] as const) {
      assert.equal(exerciseStages(id,config),config.rounds);
      assert.equal(exerciseStages(id,gameConfig(level,'placement')),1);
    }
    assert.equal(exerciseStages('memory-path',config),3);
    for(const id of ['memory-pairs','motor-target','motor-tracking'] as const) assert.equal(exerciseStages(id,config),1);
  }
  assert.deepEqual(sessionProgress(1,3,{before:3,after:2}),{value:4,max:8});
  assert.deepEqual(sessionProgress(3,3,{before:3,after:2}),{value:6,max:8});
});
test('partial selections never fill a stage and completion is bounded', () => {
  assert.deepEqual(sessionProgress(.9,3),{value:0,max:3});
  assert.deepEqual(sessionProgress(9,3),{value:3,max:3});
});
