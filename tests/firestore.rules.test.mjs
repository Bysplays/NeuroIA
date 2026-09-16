import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { firestoreProgress } from '../src/services/firestoreProgress.ts';
import { getInitialProfile } from '../src/services/storageService.ts';
import { patientProgress } from '../src/services/progressData.ts';

let env;
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-neuroia', firestore: { rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') } });
  await env.clearFirestore();
});
after(async () => { await env?.cleanup(); });
const fresh = () => patientProgress({ profile: getInitialProfile(), history: [] });
const op = id => ({ id: `result:${id}`, kind: 'result', result: { id, exerciseId: 'visual-scanning', domain: 'attention', date: '2026-09-16T12:00:00.000Z', durationSeconds: 60, accuracy: 100, score: 10, correctAnswers: 1, totalQuestions: 1, feedbackMessage: '' } });

test('owner can initialize, save, and reload from another device; retries are idempotent', async () => {
  const first = firestoreProgress('patient-a', env.authenticatedContext('patient-a').firestore());
  const second = firestoreProgress('patient-a', env.authenticatedContext('patient-a').firestore());
  assert.equal(await first.load(), null);
  await first.initialize(fresh());
  await Promise.all([first.commit(op('a')), second.commit(op('b'))]);
  await first.commit(op('a'));
  const remote = await second.load();
  assert.equal(remote.profile.totalSessions, 2);
  assert.equal(remote.history.length, 2);
  await first.commit({ id: 'settings-a', kind: 'settings', settings: { contrast: 'high-contrast' } });
  assert.equal((await second.load()).profile.settings.contrast, 'high-contrast');
});

test('anonymous users and another patient cannot read or write patient progress or results', async () => {
  for (const db of [env.unauthenticatedContext().firestore(), env.authenticatedContext('patient-b').firestore()]) {
    await assertFails(getDoc(doc(db, 'users/patient-a/progress/main')));
    await assertFails(getDoc(doc(db, 'users/patient-a/results/a')));
    await assertFails(getDoc(doc(db, 'users/patient-a/operations/result%3Aa')));
    await assertFails(setDoc(doc(db, 'users/patient-a/progress/main'), { schemaVersion: 1, data: fresh(), updatedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(db, 'users/patient-a/results/attack'), op('attack').result));
  }
});

test('roles, clinical data, result edits/deletes and receipt forgery formats are rejected', async () => {
  const db = env.authenticatedContext('patient-a').firestore();
  await assertFails(setDoc(doc(db, 'users/patient-a'), { role: 'professional' }));
  await assertFails(updateDoc(doc(db, 'users/patient-a/progress/main'), { 'data.profile.role': 'professional', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(db, 'users/patient-a/progress/main'), { 'data.profile.therapistGuidanceNote': 'unauthorized', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(db, 'users/patient-a/results/a'), { accuracy: 50 }));
  await assertFails(deleteDoc(doc(db, 'users/patient-a/results/a')));
  await assertFails(setDoc(doc(db, 'users/patient-a/operations/bad'), { kind: 'admin', createdAt: serverTimestamp() }));
  await assertSucceeds(getDoc(doc(db, 'users/patient-a/progress/main')));
});

test('initial import is atomic, excludes clinical fields, and cannot replace existing cloud progress', async () => {
  const backend = firestoreProgress('import-patient', env.authenticatedContext('import-patient').firestore());
  const data = fresh(); data.profile.totalSessions = 7; data.profile.strokeDate = '2000-01-01'; data.history = [op('imported').result];
  await backend.initialize(data);
  await backend.initialize(fresh());
  await backend.commit(op('imported'));
  const remote = await backend.load();
  assert.equal(remote.profile.totalSessions, 7);
  assert.equal(remote.profile.strokeDate, undefined);
});
