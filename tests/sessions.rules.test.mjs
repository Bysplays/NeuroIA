import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { EXERCISE_IDS } from '../src/services/difficulty.ts';
import { firestoreSessions } from '../src/services/firestoreSessions.ts';
import { assignmentResult } from '../src/services/assignedSessions.ts';
import { firestoreProgress } from '../src/services/firestoreProgress.ts';
import { getInitialProfile } from '../src/services/storageService.ts';
import { patientProgress } from '../src/services/progressData.ts';
let env;
const link = { professionalId: 'session-owner', seatId: 'seat-a', patientId: 'session-player' };
const path = 'professionals/session-owner/seats/seat-a/participants/session-player/sessions';
const draft = { title: 'Mi propuesta', note: 'A tu ritmo', steps: [{ exerciseId: 'visual-scanning', level: 2 }, { exerciseId: 'visual-scanning', level: 4 }] };
let ownerDb, playerDb, owner, player;
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-neuroia', firestore: { rules: await readFile(new URL('../vendor/firebase/firestore.rules', import.meta.url), 'utf8') } });
  await env.clearFirestore();
  ownerDb = env.authenticatedContext(link.professionalId).firestore(); playerDb = env.authenticatedContext(link.patientId).firestore();
  owner = firestoreSessions(ownerDb, link); player = firestoreSessions(playerDb, link);
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore(), expiresAt = Date.now() + 86400000;
    await setDoc(doc(db, 'professionals/session-owner'), { active: true, ownerUid: 'session-owner', name: 'Profesional' });
    await setDoc(doc(db, 'professionals/session-owner/seats/seat-a'), { status: 'active', expiresAt, occupantUid: 'session-player', invitationCode: 'NIA-TEST-AA' });
    await setDoc(doc(db, 'users/session-player/access/main'), { kind: 'invitation', ...link, expiresAt, invitationCode: 'NIA-TEST-AA' });
    await setDoc(doc(db, 'professionals/session-owner/patients/session-player'), { patientId: 'session-player', seatId: 'seat-a' });
  });
  const progress = firestoreProgress(link.patientId, playerDb);
  await progress.initialize(patientProgress({ profile: getInitialProfile(), history: [] }));
  for (const exerciseId of EXERCISE_IDS) await progress.commit({ id: `placement:1:${exerciseId}`, kind: 'placement', exerciseId, trial: { accuracy: 80, questions: 4, hints: 0, skipped: false } });
});
after(async () => { await env?.cleanup(); });
function result(session, step) {
  return assignmentResult(session, step, { id: 'ignored', exerciseId: 'visual-scanning', domain: 'attention', date: new Date().toISOString(), durationSeconds: 60, accuracy: 100, score: 10, correctAnswers: 1, totalQuestions: 1, feedbackMessage: '', level: session.steps[step].level, configVersion: 1, practice: false });
}
async function save(value, db = playerDb) {
  return firestoreProgress(link.patientId, db).commit({ id: `result:${value.id}`, kind: 'result', result: value });
}
test('an empty participant inbox resolves without a cache error', async () => {
  const errors = [];
  let unsubscribe;
  try {
    const sessions = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Inbox did not reach the server')), 10000);
      unsubscribe = player.watch(values => { clearTimeout(timeout); resolve(values); }, () => errors.push('query-error'), true);
    });
    assert.deepEqual(sessions, []);
    assert.deepEqual(errors, []);
  } finally { unsubscribe?.(); }
});
test('publish, list, start and durable result reconciliation across devices are idempotent', async () => {
  await owner.publish('proposal', draft); await owner.publish('proposal', draft);
  assert.equal((await getDocs(collection(playerDb, path))).size, 1);
  await player.start('proposal'); await player.start('proposal');
  const initial = await player.load('proposal');
  assert.equal((await player.advance('proposal')).completedCount, 0);
  const first = result(initial, 0);
  const secondDevice = env.authenticatedContext(link.patientId).firestore();
  await Promise.all([save(first), save(first, secondDevice)]);
  const recovered = firestoreSessions(secondDevice, link);
  await Promise.all([player.advance('proposal'), recovered.advance('proposal')]);
  assert.equal((await recovered.load('proposal')).completedCount, 1);
  await save(result(initial, 1)); await recovered.advance('proposal');
  assert.equal((await owner.load('proposal')).status, 'completed');
  assert.equal((await firestoreProgress(link.patientId, playerDb).load()).profile.totalSessions, 2);
  await assertFails(updateDoc(doc(playerDb, path, 'proposal'), { status: 'in-progress', updatedAt: serverTimestamp() }));
});
test('only owner can publish or edit; isolation and completion cannot be forged', async () => {
  await assertFails(player.publish('forged', draft));
  await owner.publish('secured', draft);
  for (const db of [env.unauthenticatedContext().firestore(), env.authenticatedContext('stranger').firestore()]) {
    await assertFails(getDoc(doc(db, path, 'secured'))); await assertFails(getDocs(collection(db, path)));
  }
  for (const db of [ownerDb, playerDb]) {
    if (db === playerDb) await assertFails(updateDoc(doc(db, path, 'secured'), { steps: draft.steps.slice(0, 1), updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(db, path, 'secured'), { status: 'completed', completedCount: 2, resultIds: ['fake', 'fake2'], updatedAt: serverTimestamp() }));
  }
  await assertFails(player.cancel('secured'));
  await player.start('secured');
  await assertFails(updateDoc(doc(playerDb, path, 'secured'), { completedCount: 1, resultIds: ['assigned-proposal-0'], updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(ownerDb, 'users/session-player/progress/main'), { 'data.profile.totalSessions': 99, updatedAt: serverTimestamp() }));
  await assertFails(setDoc(doc(ownerDb, path, 'bad-level'), { ...(await getDoc(doc(ownerDb, path, 'secured'))).data(), status: 'assigned', steps: [{ exerciseId: 'visual-scanning', level: 11 }], createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
});
test('cancelled sessions keep ordinary results savable but cannot advance', async () => {
  await owner.publish('cancelled', draft); await player.start('cancelled'); const initial = await player.load('cancelled');
  await owner.cancel('cancelled'); await save(result(initial, 0));
  assert.equal((await player.advance('cancelled')).completedCount, 0);
  await assert.rejects(player.start('cancelled'));
});
test('expired, departed and replaced links deny both owners and participants', async () => {
  const seatPath = 'professionals/session-owner/seats/seat-a';
  const accessPath = 'users/session-player/access/main';
  const patches = [[seatPath, { expiresAt: 1 }], [seatPath, { occupantUid: 'someone-else' }], [accessPath, { kind: 'revoked' }], [accessPath, { invitationCode: 'NIA-OTHER-AA' }]];
  for (const [target, patch] of patches) {
    let original;
    await env.withSecurityRulesDisabled(async ctx => { original = (await getDoc(doc(ctx.firestore(), target))).data(); await updateDoc(doc(ctx.firestore(), target), patch); });
    await assertFails(owner.load('secured')); await assertFails(player.load('secured'));
    await assertFails(player.advance('secured'));
    await env.withSecurityRulesDisabled(ctx => setDoc(doc(ctx.firestore(), target), original));
  }
});

test('wrong saved level cannot advance; unverified email and invalid drafts cannot author sessions', async () => {
  await owner.publish('wrong-level', draft); await player.start('wrong-level');
  const session = await player.load('wrong-level');
  const wrong = { ...result(session, 0), level: 10 };
  await save(wrong);
  assert.equal((await player.advance('wrong-level')).completedCount, 0);
  await assertFails(updateDoc(doc(playerDb, path, 'wrong-level'), { completedCount: 1, resultIds: [wrong.id], updatedAt: serverTimestamp() }));
  const unverified = env.authenticatedContext(link.professionalId, { firebase: { sign_in_provider: 'password' }, email_verified: false }).firestore();
  await assertFails(firestoreSessions(unverified, link).publish('unverified', draft));
  await assertFails(getDoc(doc(unverified, path, 'proposal')));
  const template = (await getDoc(doc(ownerDb, path, 'secured'))).data();
  for (const steps of [[], Array(9).fill(draft.steps[0]), [{ exerciseId: 'daily-sequencing', level: 1 }]]) await assertFails(setDoc(doc(ownerDb, path, 'invalid-draft'), { ...template, status: 'assigned', steps, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  await owner.publish('eight', { ...draft, steps: Array(8).fill(draft.steps[0]) });
  assert.equal((await player.load('eight')).steps.length, 8);
});

test('owner edits only unstarted sessions, with validation, conflict protection and stable identity', async () => {
  await owner.publish('editable', draft);
  const original = await owner.load('editable');
  const changed = { ...draft, title: 'Nueva propuesta', steps: [{ exerciseId: 'memory-pairs', level: 7 }] };
  await owner.edit(original, changed);
  await owner.edit(original, changed); // Ambiguous acknowledgement can safely retry.
  const updated = await owner.load('editable');
  assert.equal(updated.title, changed.title);
  assert.equal(updated.createdAt, original.createdAt);
  assert.equal(updated.completedCount, 0);
  await assert.rejects(owner.edit(original, { ...draft, title: 'Stale edit' }));
  await assertFails(player.edit(updated, draft));
  await assertFails(updateDoc(doc(ownerDb, path, 'editable'), { steps: [{ exerciseId: 'memory-pairs', level: 11 }], updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(ownerDb, path, 'editable'), { patientId: 'another', updatedAt: serverTimestamp() }));
  await player.start('editable');
  await assert.rejects(owner.edit(updated, draft));
  await assertFails(updateDoc(doc(ownerDb, path, 'editable'), { title: 'After start', updatedAt: serverTimestamp() }));
});
