import test from 'node:test';
import assert from 'node:assert/strict';
import { levelTimeline } from '../src/services/levelStatistics.ts';
import type { ExerciseResult } from '../src/types/index.ts';
const result = (id: string, date: string, level?: number): ExerciseResult => ({ id, date, level, exerciseId:'visual-scanning', domain:'attention', durationSeconds:20, accuracy:100, correctAnswers:5, totalQuestions:5, score:0, feedbackMessage:'' });
test('level history deduplicates, orders real dates and excludes missing levels, other games and practice', () => {
  const a = result('a', '2026-09-01', 2);
  const b = result('b', '2026-09-04', 5);
  const values = levelTimeline([b, a, b, result('legacy','2026-09-02'), { ...a, id:'practice', practice:true }, { ...a, id:'other', exerciseId:'memory-pairs' }, result('invalid','2026-09-03',11)], 'visual-scanning');
  assert.deepEqual(values.map(x => [x.id, x.level]), [['a',2], ['b',5]]);
  assert.equal(values[1].time - values[0].time, 3 * 86400000);
  assert.equal(values[0].date, '2026-09-01');
});
