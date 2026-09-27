import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gameConfig, EXERCISE_IDS, hasPlacement, placementLevel } from '../src/services/difficulty.ts';
import { applyProgressOperation, patientProgress } from '../src/services/progressData.ts';
import { getInitialProfile } from '../src/services/storageService.ts';
import type { ExerciseResult } from '../src/types/index.ts';
const fresh = () => patientProgress({ profile: getInitialProfile(), history: [] });
const trial = { accuracy: 100, questions: 3, hints: 0, skipped: false };
function placed() {
  let data = fresh();
  for (const id of EXERCISE_IDS) data = applyProgressOperation(data, { id: `placement:1:${id}`, kind: 'placement', exerciseId: id, trial });
  return data;
}
const result = (id: string, correctAnswers = 10, level = 4): ExerciseResult => ({ id, exerciseId: 'visual-scanning', domain: 'attention', date: '2026-09-27T12:00:00Z', durationSeconds: 30, accuracy: correctAnswers * 10, score: 0, correctAnswers, totalQuestions: 10, level, configVersion: 1, feedbackMessage: '' });
test('all ten configurations stay bounded, distinct and large enough for touch', () => {
  for (const level of [0, 11, 1.2, NaN]) assert.throws(() => gameConfig(level));
  const rows = Array.from({ length: 10 }, (_, i) => gameConfig(i + 1));
  for (const row of rows) {
    assert.ok(row.targetSize >= 88); assert.ok(row.scanCols <= 6); assert.ok(row.pairs <= 6);
    assert.ok(row.rounds >= 3); assert.ok(row.sequenceStepMs >= 800);
  }
  for (const fields of [['scanRows','scanCols'], ['rounds','vocabularySize'], ['pairs','previewSeconds'], ['sequenceLength','sequenceStepMs'], ['targets','targetSize'], ['trackingSpeed','contactSeconds']] as const) {
    assert.equal(new Set(rows.map(row => JSON.stringify(fields.map(key => row[key])))).size, 10);
  }
});
test('placement resumes one trial at a time, keeps counters unchanged and commits independent levels', () => {
  let data = fresh(); assert.equal(hasPlacement(data.profile), false);
  for (const id of EXERCISE_IDS) {
    const op = { id: `placement:1:${id}`, kind: 'placement' as const, exerciseId: id, trial: id === 'motor-tracking' ? { ...trial, skipped: true, questions: 0 } : trial };
    data = applyProgressOperation(data, op);
    assert.deepEqual(applyProgressOperation(data, { ...op, id: 'retry', trial: { ...trial, accuracy: 0 } }), data);
  }
  assert.equal(hasPlacement(data.profile), true);
  assert.equal(data.profile.gameLevels?.['visual-scanning'].level, 4);
  assert.equal(data.profile.gameLevels?.['motor-tracking'].level, 1);
  assert.equal(data.profile.totalSessions, 0); assert.equal(data.profile.totalMinutes, 0); assert.deepEqual(data.history, []);
  assert.equal(placementLevel({ ...trial, hints: 1 }), 3);
  assert.equal(placementLevel({ ...trial, questions: 1 }), 1);
});
test('three eligible sessions adjust at most one level and retries/easier practice cannot promote', () => {
  let data = placed();
  const save = (r: ExerciseResult) => { data = applyProgressOperation(data, { id: `result:${r.id}`, kind: 'result', result: r }); };
  save(result('a')); save(result('a')); save(result('b'));
  assert.equal(data.profile.gameLevels!['visual-scanning']!.level, 4);
  save(result('easy', 10, 1)); save({ ...result('practice'), practice: true });
  assert.equal(data.profile.gameLevels!['visual-scanning']!.evidence.length, 2);
  save(result('c')); assert.equal(data.profile.gameLevels!['visual-scanning']!.level, 5);
  assert.deepEqual(data.profile.gameLevels!['visual-scanning']!.evidence, []);
  for (let n = 0; n < 3; n++) save(result('low'+n, 2, 5));
  assert.equal(data.profile.gameLevels!['visual-scanning']!.level, 4);
  assert.equal(data.profile.gameLevels!['language-naming']!.level, 4);
});
test('adaptation respects bounds and hints, and does not infer motor tracking ability', () => {
  for (const level of [1,10]) {
    let data = placed(); data.profile.gameLevels!['visual-scanning']!.level = level;
    for (let i=0;i<3;i++) data = applyProgressOperation(data, { id: String(i), kind: 'result', result: result(String(i), level === 1 ? 0 : 10, level) });
    assert.equal(data.profile.gameLevels!['visual-scanning']!.level, level);
  }
  let data = placed();
  for (let i=0;i<3;i++) data = applyProgressOperation(data, { id: String(i), kind: 'result', result: { ...result(String(i)), hintsUsed: 1 } });
  assert.equal(data.profile.gameLevels!['visual-scanning']!.level, 4);
  assert.throws(() => applyProgressOperation(fresh(), { id:'bad', kind:'placement', exerciseId:'memory-path', trial:{ ...trial, accuracy:NaN } }));
});
