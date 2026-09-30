import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignmentResult, canAdvanceSession, completedSessionSteps, visibleSessionSteps, validateSessionDraft, type AssignedSession } from '../src/services/assignedSessions.ts';
import { adaptDifficulty } from '../src/services/difficulty.ts';
import { getInitialProfile } from '../src/services/storageService.ts';
import type { ExerciseResult } from '../src/types/index.ts';
const session: AssignedSession = { id: 's', professionalId: 'o', patientId: 'p', seatId: 'seat', professionalName: 'Owner', title: 'Memoria', note: '', steps: [{ exerciseId: 'memory-pairs', level: 3 }], status: 'in-progress', completedCount: 0, resultIds: [], configVersion: 1, createdAt: 1 };
const base: ExerciseResult = { id: 'random', exerciseId: 'memory-pairs', domain: 'memory', date: '2026-09-28T12:00:00Z', durationSeconds: 60, accuracy: 100, score: 1, correctAnswers: 4, totalQuestions: 4, level: 3, configVersion: 1, practice: false, feedbackMessage: '' };
test('proposals validate bounds, retired games and levels without mutating input', () => {
  assert.equal(validateSessionDraft({ ...session, title: ' Memoria ' }).title, 'Memoria');
  for (const change of [{ title: ' ' }, { steps: [] }, { steps: Array(9).fill(session.steps[0]) }, { steps: [{ exerciseId: 'daily-sequencing', level: 3 }] }, { steps: [{ exerciseId: 'memory-pairs', level: 11 }] }, { note: 'x'.repeat(281) }]) assert.throws(() => validateSessionDraft({ ...session, ...change } as never));
});
test('deterministic per-step results only advance matching session, level and version', () => {
  const result = assignmentResult(session, 0, base);
  assert.equal(result.id, 'assigned-s-0');
  assert.equal(canAdvanceSession(session, result), true);
  for (const patch of [{ assignmentId: 'other' }, { assignmentStep: 1 }, { assignmentOwnerId: 'other' }, { level: 4 }, { practice: true }, { configVersion: 2 }, { exerciseId: 'visual-scanning' }]) assert.equal(canAdvanceSession(session, { ...result, ...patch } as ExerciseResult), false);
  assert.equal(canAdvanceSession({ ...session, status: 'cancelled' }, result), false);
  assert.throws(() => assignmentResult(session, 0, { ...base, level: 4 }));
});
test('qualifying assigned results update the personal base without changing prescribed levels', () => {
  const profile = getInitialProfile(); profile.gameLevels = { 'memory-pairs': { level: 3, evidence: [] } };
  const before = structuredClone(session);
  adaptDifficulty(profile, assignmentResult(session, 0, { ...base, durationSeconds:59 }));
  assert.equal(profile.gameLevels['memory-pairs'].level, 4);
  assert.deepEqual(session, before);
});

test('today keeps three pending step identities, including repeated games and out-of-order results', () => {
  const proposed = { ...session, steps: Array.from({ length: 6 }, () => session.steps[0]) };
  let completed = completedSessionSteps(proposed, [assignmentResult(proposed, 1, base)]);
  assert.deepEqual(visibleSessionSteps(6, completed), [0, 2, 3]);
  completed = completedSessionSteps(proposed, [0, 1, 2].map(index => assignmentResult(proposed, index, base)));
  assert.deepEqual(visibleSessionSteps(6, completed), [3, 4, 5]);
  completed = completedSessionSteps(proposed, [0, 1, 2, 3, 4].map(index => assignmentResult(proposed, index, base)));
  assert.deepEqual(visibleSessionSteps(6, completed), [5, 0, 1]);
  assert.equal(completedSessionSteps(proposed, [{ ...assignmentResult(proposed, 0, base), assignmentOwnerId: 'other' }]).size, 0);
});
