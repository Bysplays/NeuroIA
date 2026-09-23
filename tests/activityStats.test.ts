import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dailyActivity, formatActivityDate, localDay, mergeActivity, secondsPerQuestion } from '../src/services/activityStats.ts';
import type { ExerciseResult } from '../src/types/index.ts';
const result = (id: string, overrides: Partial<ExerciseResult> = {}): ExerciseResult => ({ id, exerciseId: 'categorization', domain: 'executive', date: '2026-09-21T12:00:00Z', durationSeconds: 60, accuracy: 80, score: 0, correctAnswers: 4, totalQuestions: 5, feedbackMessage: '', ...overrides });
test('daily averages separate exercises, skip missing days and average per-session speed', () => {
 const records = [result('1'), result('2', { accuracy: 100, durationSeconds: 20 }), result('3', { exerciseId: 'memory-pairs', date: '2026-09-23T12:00:00Z' })];
 const accuracy = dailyActivity(records, 'accuracy');
 assert.equal(accuracy.length, 2); assert.equal(accuracy[0].value, 90);
 assert.equal(dailyActivity(records, 'speed')[0].value, 8);
 assert.equal(accuracy[1].exerciseId, 'memory-pairs');
});
test('archive and recent activity deduplicate by result ID; recent data wins', () => {
 const merged = mergeActivity([result('1'), result('2', { date: 'invalid' })], [result('1', { accuracy: 100 })]);
 assert.equal(merged.length, 1); assert.equal(merged[0].accuracy, 100);
});
test('zero-question and invalid timings are not plotted as zero-speed performances', () => {
 assert.equal(secondsPerQuestion(result('1', { totalQuestions: 0 })), null);
 assert.equal(secondsPerQuestion(result('1', { durationSeconds: -1 })), null);
 assert.deepEqual(dailyActivity([result('1', { totalQuestions: 0 })], 'speed'), []);
 assert.deepEqual(dailyActivity([], 'accuracy'), []);
 assert.equal(localDay('invalid'), '');
});

test('legacy result IDs share catalog names, filters and daily series without mutating saved records', () => {
 const legacy = [
  result('scan-old', { exerciseId: 'visual-scan', accuracy: 60 }),
  result('sequence-old', { exerciseId: 'daily-seq' }),
  result('motor-old', { exerciseId: 'motor-coord' }),
 ];
 const merged = mergeActivity(legacy, [result('scan-new', { exerciseId: 'visual-scanning', accuracy: 100 })]);
 assert.deepEqual(merged.map(r => r.exerciseId), ['visual-scanning', 'daily-sequencing', 'motor-target', 'visual-scanning']);
 assert.deepEqual(legacy.map(r => r.exerciseId), ['visual-scan', 'daily-seq', 'motor-coord']);
 const filtered = merged.filter(r => r.exerciseId === 'visual-scanning');
 assert.equal(filtered.length, 2);
 const points = dailyActivity(filtered, 'accuracy');
 assert.equal(points.length, 1);
 assert.equal(points[0].value, 80);
 assert.equal(points[0].exerciseId, 'visual-scanning');
 assert.equal(merged[0].id, 'scan-old');
});

test('date-only history never invents a time or shifts its saved day across time zones', () => {
 const previousTZ = process.env.TZ;
 try {
  for (const zone of ['Europe/Madrid', 'America/Los_Angeles']) {
   process.env.TZ = zone;
   assert.deepEqual(formatActivityDate('2026-09-23'), { day: '23/9/2026', time: null });
   assert.equal(localDay('2026-09-23'), '2026-09-23');
   assert.equal(dailyActivity([result('old', { date: '2026-09-23' })], 'accuracy')[0].day, '2026-09-23');
  }
  process.env.TZ = 'Europe/Madrid';
  assert.deepEqual(formatActivityDate('2026-09-23T13:45:00.000Z'), { day: '23/9/2026', time: '15:45' });
  assert.deepEqual(formatActivityDate('2026-09-23T22:30:00.000Z'), { day: '24/9/2026', time: '00:30' });
  assert.equal(localDay('2026-09-23T22:30:00.000Z'), '2026-09-24');
  assert.equal(formatActivityDate('2026-01-23T13:45:00.000Z').time, '14:45');
 } finally {
  if (previousTZ === undefined) delete process.env.TZ;
  else process.env.TZ = previousTZ;
 }
});
