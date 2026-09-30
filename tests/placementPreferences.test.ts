import test from 'node:test';
import assert from 'node:assert/strict';
import { placementExercises, nextThematicGame, validPlacementPreferences } from '../src/services/placementPreferences.ts';
import { applyProgressOperation, patientProgress, type ProgressOperation } from '../src/services/progressData.ts';
import { assignedLevel, hasPlacement } from '../src/services/difficulty.ts';
import { getInitialProfile } from '../src/services/storageService.ts';
import { ProgressSync } from '../src/services/progressSync.ts';
const fresh = () => patientProgress({ profile: getInitialProfile(), history: [] });
const memory = { interests: ['memory' as const], movement: 'unspecified' as const };
const trial = { assessedLevel: 1 as const, accuracy: 100, questions: 2, hints: 0, skipped: false };
const plan: ProgressOperation = { id: 'plan', kind: 'placement', preferences: memory };
const finish = (exerciseId: 'memory-path' | 'memory-pairs'): ProgressOperation => ({ id: exerciseId, kind: 'placement', exerciseId, trial });

test('interests map to real games, taps exclude only tracking, and empty/invalid choices are rejected', () => {
  assert.deepEqual(placementExercises(memory), ['memory-path', 'memory-pairs']);
  assert.deepEqual(placementExercises({ interests: ['motor'], movement: 'taps' }), ['motor-target']);
  assert.equal(placementExercises().length, 8);
  for (const value of [{ ...memory, interests: [] }, { ...memory, interests: ['clinical'] }, { ...memory, interests: ['memory', 'memory'] }, { ...memory, movement: 'invalid' }, { ...memory, diagnosis: 'private' }]) {
    assert.equal(validPlacementPreferences(value), false);
    assert.throws(() => applyProgressOperation(fresh(), { ...plan, preferences: value } as ProgressOperation));
  }
  assert.equal(nextThematicGame(['memory-path', 'memory-pairs', 'categorization'], 'memory-path'), 'memory-pairs');
  assert.equal(nextThematicGame(['memory-path', 'categorization'], 'memory-path'), 'memory-path');
});
test('only selected trials are needed; untested games have no fabricated level or evidence', () => {
  let data = applyProgressOperation(fresh(), plan);
  data = applyProgressOperation(data, finish('memory-path'));
  assert.equal(hasPlacement(data.profile), false);
  data = applyProgressOperation(data, finish('memory-pairs'));
  assert.equal(hasPlacement(data.profile), true);
  assert.equal(data.profile.gameLevels?.['motor-target'], undefined);
  assert.equal(data.profile.placement?.trials['motor-target'], undefined);
  assert.equal(assignedLevel(data.profile, 'motor-target'), 1);
  assert.equal(data.profile.totalSessions, 0);
  assert.deepEqual(data.history, []);
  assert.equal(patientProgress(data).profile.placement, undefined);
});
test('changing interests preserves saved evidence, ignores stale excluded trials and can later resume an area', () => {
  let data = applyProgressOperation(fresh(), plan);
  data = applyProgressOperation(data, finish('memory-path'));
  data = applyProgressOperation(data, { id: 'change', kind: 'placement', preferences: { interests: ['language'], movement: 'taps' } });
  const before = structuredClone(data);
  data = applyProgressOperation(data, finish('memory-pairs'));
  assert.deepEqual(data, before);
  data = applyProgressOperation(data, { ...plan, id: 'restore' });
  assert.ok(data.profile.placement?.trials['memory-path']);
  assert.equal(data.profile.placement?.trials['memory-pairs'], undefined);
});
test('durable stage progress resumes at the next level and old retries cannot move it backwards', () => {
  let data = applyProgressOperation(fresh(), plan);
  const stage: ProgressOperation = { id: 'stage-4', kind: 'placement', exerciseId: 'memory-path', stage: { level: 4, best: trial } };
  assert.throws(() => applyProgressOperation(data, { ...stage, stage: { level: 10, best: { ...trial, assessedLevel: 7 } } }));
  data = applyProgressOperation(data, stage);
  data = applyProgressOperation(data, { ...stage, id: 'stage-7', stage: { level: 7, best: { ...trial, assessedLevel: 4 } } });
  assert.deepEqual(applyProgressOperation(data, stage), data);
  assert.equal(data.profile.placement?.stages?.['memory-path']?.level, 7);
  data = applyProgressOperation(data, finish('memory-path'));
  assert.equal(data.profile.placement?.stages?.['memory-path'], undefined);
  assert.deepEqual(applyProgressOperation(data, stage), data);
});
test('queued interests and passed stages survive restart and replay through ProgressSync', async () => {
  const stage: ProgressOperation = { id: 'stage', kind: 'placement', exerciseId: 'memory-path', stage: { level: 4, best: trial } };
  let remote = fresh(); let shown = fresh();
  const receipts = new Set<string>();
  const sync = new ProgressSync(remote, [plan, stage], {
    load: async () => remote, initialize: async data => data, watch: () => () => {},
    commit: async operation => { if (!receipts.has(operation.id)) { remote = applyProgressOperation(remote, operation); receipts.add(operation.id); } return remote; },
  }, () => {}, data => { shown = data; });
  sync.start();
  assert.deepEqual(shown.profile.placement?.preferences, memory);
  assert.equal(shown.profile.placement?.stages?.['memory-path']?.level, 4);
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(sync.hasPendingWork, false);
  assert.equal(remote.profile.placement?.stages?.['memory-path']?.level, 4);
  sync.stop();
});
test('thematic retakes replace chosen levels only and preserve original activity and unselected levels', () => {
  let data = applyProgressOperation(fresh(), plan);
  data = applyProgressOperation(data, finish('memory-path'));
  data = applyProgressOperation(data, finish('memory-pairs'));
  const after = applyProgressOperation(data, { id: 'retake', kind: 'placement', preferences: { interests: ['motor'], movement: 'taps' }, trials: { 'motor-target': { ...trial, assessedLevel: 7 } } });
  assert.equal(after.profile.gameLevels?.['motor-target']?.level, 7);
  assert.equal(after.profile.gameLevels?.['motor-tracking'], undefined);
  assert.deepEqual(after.profile.gameLevels?.['memory-path'], data.profile.gameLevels?.['memory-path']);
  assert.deepEqual(after.history, data.history);
  assert.equal(hasPlacement(after.profile), true);
  assert.deepEqual(after.profile.placement?.trials, data.profile.placement?.trials);
  const preferencesSaved = applyProgressOperation(after, { id: 'retake-preferences', kind: 'placement', retakePreferences: { interests: ['motor'], movement: 'taps' } });
  assert.deepEqual(preferencesSaved.profile.placement?.retakePreferences, { interests: ['motor'], movement: 'taps' });
  assert.throws(() => applyProgressOperation(data, { id: 'missing', kind: 'placement', preferences: memory, trials: { 'memory-path': trial } }));
});


test('optional condition context is strictly bounded and never affects exercise selection', () => {
  const condition = { kind: 'stroke' as const, side: 'left' as const, mobility: 'support' as const, consentVersion: 1 as const };
  const preferences = { ...memory, condition };
  assert.equal(validPlacementPreferences(preferences), true);
  assert.deepEqual(placementExercises(preferences), placementExercises(memory));
  const result = applyProgressOperation(fresh(), {id:'condition',kind:'placement',preferences});
  assert.deepEqual(result.profile.placement?.preferences?.condition, condition);
  for (const invalid of [{...condition,consentVersion:0},{...condition,side:'unknown'},{...condition,diagnosis:'free text'},{...condition,kind:'none'}]) {
    assert.equal(validPlacementPreferences({...memory,condition:invalid}), false);
  }
  const removed = applyProgressOperation(result, {id:'remove-condition',kind:'placement',preferences:memory});
  assert.equal(removed.profile.placement?.preferences?.condition, undefined);
});
