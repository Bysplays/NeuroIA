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
  env = await initializeTestEnvironment({ projectId: 'demo-neuroia', firestore: { rules: await readFile(new URL('../vendor/firebase/firestore.rules', import.meta.url), 'utf8') } });
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
  await first.commit({ id: 'rename-a', kind: 'settings', settings: {}, name: 'Ana María' });
  await second.commit(op('after-name'));
  assert.equal((await first.load()).profile.name, 'Ana María');
  assert.equal((await second.load()).profile.totalSessions, 3);
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

test('patients cannot grant access, create invitations, claim professional roles or forge care links', async () => {
  const db = env.authenticatedContext('patient-a').firestore();
  await assertSucceeds(getDoc(doc(db, 'users/patient-a/access/main')));
  await assertFails(getDoc(doc(db, 'users/patient-b/access/main')));
  for (const path of ['users/patient-a/access/main', 'invitations/CEOABERTO', 'professionals/ceoaberto', 'professionals/ceoaberto/patients/patient-a', 'billing/patient-a']) {
    await assertFails(setDoc(doc(db, path), { kind: 'invitation', active: true }));
    await assertFails(deleteDoc(doc(db, path)));
  }
  await assertFails(getDoc(doc(db, 'invitations/CEOABERTO')));
  await assertFails(getDoc(doc(db, 'billing/patient-a')));
});

// Exercise the production browser adapter against actual server-side rules.
const { firestoreAccess } = await import('../src/services/firestoreAccess.ts');
test('Spark: first CEOABERTO redemption creates a permanent entitlement and reserved professional atomically', async () => {
  const db = env.authenticatedContext('spark-a').firestore();
  await firestoreAccess('spark-a', db).invite(' ceoaberto ');
  const access = await firestoreAccess('spark-a', db).load();
  assert.equal(access.active, true);
  assert.equal(access.expiresAt, null);
  assert.equal(access.professionalId, 'ceoaberto');
  assert.equal((await getDoc(doc(db, 'professionals/ceoaberto'))).data().ownerUid, null);
  const first = (await getDoc(doc(db, 'users/spark-a/access/main'))).data().linkedAt;
  await firestoreAccess('spark-a', db).invite('CEOABERTO');
  const second = (await getDoc(doc(db, 'users/spark-a/access/main'))).data().linkedAt;
  assert.ok(first.isEqual(second));
  assert.ok(first.isEqual((await getDoc(doc(db, 'professionals/ceoaberto/patients/spark-a'))).data().linkedAt));
});
test('Spark: code is reusable across accounts and returning users retain their access and progress', async () => {
  for (const uid of ['spark-b', 'spark-c']) {
    const db = env.authenticatedContext(uid).firestore();
    const progress = firestoreProgress(uid, db);
    await progress.initialize(fresh());
    await progress.commit(op(uid));
    await firestoreAccess(uid, db).invite('CEOABERTO');
    assert.equal((await firestoreAccess(uid, env.authenticatedContext(uid).firestore()).load()).active, true);
    assert.equal((await progress.load()).profile.totalSessions, 1);
  }
});
test('Spark: deny forged code, entitlement without reverse link, ownership theft and professional reassignment', async () => {
  const uid = 'spark-attacker'; const db = env.authenticatedContext(uid).firestore();
  await assert.rejects(firestoreAccess(uid, db).invite('OTHER'), {code:'invitation/invalid-code'});
  await assertFails(setDoc(doc(db, `users/${uid}/access/main`), {
    kind:'invitation',invitationCode:'CEOABERTO',professionalId:'ceoaberto',professionalName:'CeoAberto',expiresAt:null,linkedAt:serverTimestamp(),
  }));
  await assertFails(updateDoc(doc(db, 'professionals/ceoaberto'), {ownerUid:uid}));
  await assertFails(setDoc(doc(db, `professionals/ceoaberto/patients/${uid}`), {patientId:uid,linkedAt:serverTimestamp()}));
  const owner = env.authenticatedContext('spark-a').firestore();
  await assertFails(updateDoc(doc(owner, 'users/spark-a/access/main'), {professionalId:'other'}));
  await assertFails(updateDoc(doc(owner, 'users/spark-a/access/main'), {kind:'subscription',expiresAt:9999999999999}));
  await assertFails(deleteDoc(doc(owner, 'users/spark-a/access/main')));
  await assertFails(getDoc(doc(db, 'professionals/ceoaberto/patients/spark-a')));
});
test('Spark: trial uses server time, cannot restart and can become a permanent invitation', async () => {
  const uid = 'spark-trial'; const db = env.authenticatedContext(uid).firestore();
  const adapter = firestoreAccess(uid, db);
  await adapter.trial();
  const trial = await adapter.load();
  assert.equal(trial.expiresAt - trial.trialStartedAt, 7*86400000);
  await assert.rejects(adapter.trial());
  await assertFails(updateDoc(doc(db, `users/${uid}/access/main`), {trialStartedAt:serverTimestamp()}));
  await adapter.invite('CEOABERTO');
  const permanent = await adapter.load();
  assert.equal(permanent.trialStartedAt, trial.trialStartedAt);
  assert.equal(permanent.active, true);
  assert.equal(permanent.expiresAt, null);
});
test('Spark: pending billing prevents free redemption and inactive professionals cannot be used', async () => {
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'billing/spark-paid'), {attempt:'pending'});
  });
  const db = env.authenticatedContext('spark-paid').firestore();
  await assertFails(firestoreAccess('spark-paid', db).invite('CEOABERTO'));
  await env.withSecurityRulesDisabled(async context => {
    await updateDoc(doc(context.firestore(), 'professionals/ceoaberto'), {active:false});
  });
  await assert.rejects(firestoreAccess('spark-off', env.authenticatedContext('spark-off').firestore()).invite('CEOABERTO'), {code:'invitation/inactive'});
  await env.withSecurityRulesDisabled(async context => {
    await updateDoc(doc(context.firestore(), 'professionals/ceoaberto'), {active:true});
  });
});

test('Spark: leaving removes both access and care link atomically, preserves progress and allows explicit re-entry', async () => {
  const uid = 'spark-leave'; const db = env.authenticatedContext(uid).firestore();
  const adapter = firestoreAccess(uid, db);
  await adapter.invite('CEOABERTO');
  const progress = firestoreProgress(uid, db);
  await progress.initialize(fresh());
  const ref = doc(db, `users/${uid}/access/main`);
  const patient = doc(db, `professionals/ceoaberto/patients/${uid}`);
  await assertFails(setDoc(ref, {kind:'revoked',leftAt:serverTimestamp()}));
  await assertFails(deleteDoc(patient));
  await assertFails(firestoreAccess(uid, env.authenticatedContext('other-leaver').firestore()).leaveInvitation());
  await adapter.leaveInvitation();
  assert.equal((await adapter.load()).active, false);
  assert.equal((await getDoc(patient)).exists(), false);
  assert.ok(await progress.load());
  await assert.rejects(adapter.trial());
  await assert.rejects(adapter.leaveInvitation());
  await adapter.invite('CEOABERTO');
  assert.equal((await adapter.load()).active, true);
  assert.equal((await getDoc(patient)).exists(), true);
});

const { firestoreProfessional } = await import('../src/services/firestoreProfessional.ts');
test('professionals can open a free self-owned workspace but cannot claim another owner or create seats', async () => {
  const uid = 'professional-new'; const db = env.authenticatedContext(uid).firestore();
  const adapter = firestoreProfessional(uid, db);
  assert.equal(await adapter.load(), null);
  assert.equal((await adapter.register('Ana')).name, 'Ana');
  assert.equal((await adapter.register('Changed')).name, 'Ana');
  assert.equal((await getDoc(doc(db, `users/${uid}/access/main`))).exists(), false);
  await assertFails(setDoc(doc(db, 'professionals/someone-else'), { ownerUid: uid, name: 'Forged', active: true, createdAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(db, `professionals/${uid}`), { ownerUid: 'someone-else' }));
  await assertFails(setDoc(doc(db, `professionals/${uid}/seats/forged`), { status: 'active', expiresAt: 9999999999999 }));
  await assertFails(setDoc(doc(db, 'seatInvitations/forged'), { professionalId: uid }));
  await assertFails(setDoc(doc(db, `professionals/${uid}/patients/other`), { patientId: 'other' }));
  await assertFails(getDoc(doc(db, 'users/patient-a/progress/main')));
});

test('professional analytics are read-only, scoped to reciprocal active seats and revoked immediately on expiry or departure', async () => {
  const professional = 'professional-linked'; const patient = 'linked-person'; const seatId = 'seat-paid';
  const owner = env.authenticatedContext(professional).firestore();
  const personDb = env.authenticatedContext(patient).firestore();
  await firestoreProfessional(professional, owner).register('Profesional');
  await firestoreProgress(patient, personDb).initialize(fresh());
  await firestoreProgress(patient, personDb).commit(op('linked-result'));
  const until = Date.now() + 86400000;
  const seatPath = `professionals/${professional}/seats/${seatId}`;
  const accessPath = `users/${patient}/access/main`;
  const linkPath = `professionals/${professional}/patients/${patient}`;
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, seatPath), { status: 'active', expiresAt: until, occupantUid: patient });
    await setDoc(doc(db, accessPath), { kind: 'invitation', professionalId: professional, seatId, expiresAt: until });
    await setDoc(doc(db, linkPath), { patientId: patient, seatId });
  });
  const progress = doc(owner, `users/${patient}/progress/main`);
  await assertSucceeds(getDoc(progress));
  await assertSucceeds(getDoc(doc(owner, `users/${patient}/results/linked-result`)));
  await assertFails(getDoc(doc(owner, `users/${patient}/operations/result%3Alinked-result`)));
  await assertFails(getDoc(doc(owner, accessPath)));
  await assertFails(updateDoc(progress, { 'data.profile.name': 'Not allowed', updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(doc(owner, `users/${patient}/results/linked-result`), { accuracy: 0 }));
  await assertFails(getDoc(doc(env.authenticatedContext('another-professional').firestore(), `users/${patient}/progress/main`)));
  await assertFails(setDoc(doc(personDb, accessPath), { kind: 'revoked', leftAt: serverTimestamp() }));
  await assertFails(deleteDoc(doc(personDb, linkPath)));
  await env.withSecurityRulesDisabled(async context => { await updateDoc(doc(context.firestore(), seatPath), { expiresAt: 1 }); });
  await assertFails(getDoc(progress));
  await env.withSecurityRulesDisabled(async context => { await updateDoc(doc(context.firestore(), seatPath), { expiresAt: until }); await deleteDoc(doc(context.firestore(), linkPath)); });
  await assertFails(getDoc(progress));
  await assertSucceeds(getDoc(doc(personDb, `users/${patient}/progress/main`)));
});

test('seat invitations respect expiry while the permanent invitation remains compatible', async () => {
  const uid = 'seat-expiry'; const db = env.authenticatedContext(uid).firestore();
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), `users/${uid}/access/main`), { kind: 'invitation', invitationCode: 'NIA-TEST', seatId: 'seat', expiresAt: 1 });
  });
  assert.equal((await firestoreAccess(uid, db).load()).active, false);
  await env.withSecurityRulesDisabled(async context => { await updateDoc(doc(context.firestore(), `users/${uid}/access/main`), { expiresAt: Date.now() + 60000 }); });
  assert.equal((await firestoreAccess(uid, db).load()).active, true);
});
