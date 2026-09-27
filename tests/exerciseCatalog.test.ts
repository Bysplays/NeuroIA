import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ALL_EXERCISES, getExerciseById, getExercisesForDomain } from '../src/services/exerciseCatalog.ts';
import { ACTIVITY_EXERCISES, activityExerciseTitle, activityExerciseStyle } from '../src/services/activityExercises.ts';
import { mergeActivity } from '../src/services/activityStats.ts';
import { StorageService, getInitialProfile } from '../src/services/storageService.ts';
import type { ExerciseId, ExerciseResult } from '../src/types/index.ts';

test('active catalog retires daily actions but preserves memory sequences and Organization entry', () => {
  assert.equal(ALL_EXERCISES.length, 8);
  assert.equal(getExerciseById('daily-sequencing' as ExerciseId), undefined);
  assert.ok(getExerciseById('memory-path'));
  assert.deepEqual(getExercisesForDomain('executive').map(exercise => exercise.id), ['categorization']);
});

test('daily plans with Organization can only select active exercises', () => {
  const profile = getInitialProfile();
  profile.prescribedDomains = ['executive'];
  for (let attempt = 0; attempt < 30; attempt++) {
    const queue = StorageService.generateDailyPlanQueue(profile);
    assert.ok(queue.includes('executive'));
    for (const domain of queue) {
      const choices = getExercisesForDomain(domain);
      assert.ok(choices.length);
      assert.ok(choices.every(exercise => exercise.id !== ('daily-sequencing' as ExerciseId)));
    }
  }
});

test('retired results keep their historical names, filters, colors and original records', () => {
  const result: ExerciseResult = { id: 'old', exerciseId: 'daily-seq', domain: 'executive', date: '2026-09-20', durationSeconds: 30, accuracy: 100, score: 450, correctAnswers: 3, totalQuestions: 3, feedbackMessage: '' };
  const [display] = mergeActivity([result]);
  assert.equal(activityExerciseTitle(display.exerciseId), 'Secuencias de la Vida Diaria');
  assert.ok(ACTIVITY_EXERCISES.find(exercise => exercise.id === display.exerciseId)?.retired);
  assert.deepEqual(activityExerciseStyle(display.exerciseId), { color: '#b34245', dashed: true });
  assert.deepEqual(activityExerciseStyle('categorization'), { color: '#3570ae', dashed: false });
  assert.equal(activityExerciseStyle('motor-target').color, '#88752a');
  assert.equal(result.exerciseId, 'daily-seq');
  assert.equal(display.score, 450);
});
