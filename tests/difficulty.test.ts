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
test('one perfect result under a minute promotes once; retry and easier games do not promote', () => {
  let data = placed();
  const save = (r: ExerciseResult) => { data = applyProgressOperation(data, { id: `result:${r.id}`, kind: 'result', result: r }); };
  save(result('fast'));
  assert.equal(data.profile.gameLevels!['visual-scanning']!.level, 5);
  save(result('fast')); save(result('easy', 10, 4));
  save({ ...result('practice', 10, 5), practice: true });
  assert.equal(data.profile.gameLevels!['visual-scanning']!.level, 5);
  assert.equal(data.profile.gameLevels!['language-naming']!.level, 4);
});
test('two consecutive qualifying games promote independently, failures break only their own streak', () => {
  let data = placed();
  const strong = (id: string, overrides: Partial<ExerciseResult> = {}) => ({ ...result(id, 19), correctAnswers: 19, totalQuestions: 20, accuracy: 95, durationSeconds: 120, ...overrides });
  const save = (r: ExerciseResult) => { data = applyProgressOperation(data, { id: `result:${r.id}`, kind: 'result', result: r }); };
  save(strong('one')); assert.equal(data.profile.gameLevels!['visual-scanning']!.qualifyingRuns, 1);
  save(strong('other', { exerciseId: 'language-naming', domain: 'language' }));
  save(strong('two')); assert.equal(data.profile.gameLevels!['visual-scanning']!.level, 5);
  assert.equal(data.profile.gameLevels!['language-naming']!.qualifyingRuns, 1);
  save(strong('bad', { exerciseId: 'language-naming', domain: 'language', correctAnswers: 2 }));
  save(strong('again', { exerciseId: 'language-naming', domain: 'language' }));
  assert.equal(data.profile.gameLevels!['language-naming']!.level, 4);
  assert.equal(data.profile.gameLevels!['language-naming']!.qualifyingRuns, 1);
});
test('thresholds are strict, no automatic demotion, old evidence is not timed evidence', () => {
  let data = placed(); data.profile.gameLevels!['visual-scanning']!.evidence = [100, 100];
  const save = (r: ExerciseResult) => { data = applyProgressOperation(data, { id:r.id, kind:'result', result:r }); };
  save({ ...result('60'), durationSeconds: 60 });
  assert.equal(data.profile.gameLevels!['visual-scanning']!.level, 4);
  assert.equal(data.profile.gameLevels!['visual-scanning']!.qualifyingRuns, 1);
  save({ ...result('180'), durationSeconds: 180 });
  assert.equal(data.profile.gameLevels!['visual-scanning']!.qualifyingRuns, 0);
  save(result('90', 9)); assert.equal(data.profile.gameLevels!['visual-scanning']!.qualifyingRuns, 0);
  for(let i=0;i<4;i++) save(result('low'+i, 1));
  assert.equal(data.profile.gameLevels!['visual-scanning']!.level, 4);
  for(const time of [0, -1, NaN]) save({ ...result('time'+time), durationSeconds: time });
  assert.equal(data.profile.gameLevels!['visual-scanning']!.level, 4);
});
test('all scored exercise types use the rule and level ten is capped', () => {
  let data = placed();
  for(const id of EXERCISE_IDS) {
    const before = data.profile.gameLevels![id]!.level;
    const domain = id.startsWith('motor') ? 'motor' : 'attention';
    data = applyProgressOperation(data, { id, kind:'result', result:{ ...result(id), exerciseId:id, domain, level:before } });
    assert.equal(data.profile.gameLevels![id]!.level, before + 1);
  }
  data.profile.gameLevels!['visual-scanning']!.level = 10;
  data = applyProgressOperation(data, { id:'max', kind:'result', result:result('max', 10, 10) });
  assert.equal(data.profile.gameLevels!['visual-scanning']!.level, 10);
});

test('a completed reassessment replaces only levels and preserves activity and settings', () => {
  let data = placed();
  data = applyProgressOperation(data, { id:'before-retake', kind:'result', result:result('before-retake') });
  const before = structuredClone(data);
  const trials = Object.fromEntries(EXERCISE_IDS.map(id => [id, { ...trial, accuracy:65 }])) as Record<typeof EXERCISE_IDS[number], typeof trial>;
  const after = applyProgressOperation(data, { id:'retake', kind:'placement', trials });
  assert.deepEqual(after.history, before.history);
  assert.deepEqual(after.profile.placement, before.profile.placement);
  assert.equal(after.profile.totalSessions, before.profile.totalSessions);
  assert.deepEqual(after.profile.settings, before.profile.settings);
  assert.deepEqual(after.profile.domainProgress, before.profile.domainProgress);
  assert.equal(after.profile.gameLevels!['visual-scanning'].level, 3);
  assert.equal(after.profile.gameLevels!['motor-tracking'].level, 1);
  assert.ok(hasPlacement(after.profile));
  assert.deepEqual(data, before);
  const { 'memory-path': removed, ...partial } = trials;
  assert.ok(removed);
  assert.throws(() => applyProgressOperation(data, { id:'partial', kind:'placement', trials:partial as typeof trials }));
});
