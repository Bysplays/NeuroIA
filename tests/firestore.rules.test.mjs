import {loadPracticeAdherence} from '../src/services/practiceScheduleArchive.ts';
import {loadReportEvidenceExport} from '../src/services/reportEvidenceArchive.ts';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import {ProgressSync} from '../src/services/progressSync.ts';
import {createSessionEvidence} from '../src/services/sessionEvidence.ts';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { firestoreProgress } from '../src/services/firestoreProgress.ts';
import { getInitialProfile } from '../src/services/storageService.ts';
import { patientProgress } from '../src/services/progressData.ts';
import { loadEvidencePage, loadEvidenceExport, loadSessionEvidence } from '../src/services/evidenceArchive.ts';
import { decideAdaptation } from '../src/services/adaptivePolicy.ts';

let env;
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-neuroia', firestore: { rules: await readFile(new URL('../vendor/firebase/firestore.rules', import.meta.url), 'utf8') } });
  await env.clearFirestore();
});
after(async () => { await env?.cleanup(); });
const fresh = () => patientProgress({ profile: getInitialProfile(), history: [] });
const op = id => ({ id: `result:${id}`, kind: 'result', result: { id, exerciseId: 'visual-scanning', domain: 'attention', date: '2026-09-16T12:00:00.000Z', durationSeconds: 60, accuracy: 100, score: 10, correctAnswers: 1, totalQuestions: 1, feedbackMessage: '' } });

test('proposal learned decisions persist with results and retries do not apply another level change',async()=>{
  const uid='learned-policy';const db=env.authenticatedContext(uid).firestore();const backend=firestoreProgress(uid,db);
  await backend.initialize(fresh());
  await env.withSecurityRulesDisabled(async context=>{
    await updateDoc(doc(context.firestore(),`users/${uid}/progress/main`),{'data.profile.gameLevels':{'visual-scanning':{level:5,evidence:[]}}});
  });
  const vector=Array(40).fill(0);vector[0]=1;vector[8]=4/9;vector[9]=1;vector[13]=1;
  const decision=decideAdaptation({vector,level:5,eligible:true},{locked:false,mode:'normal',baseLevel:5});
  assert.equal(decision.action,-1);
  const operation=op('learned-result');Object.assign(operation.result,{level:5,configVersion:1,adaptation:JSON.stringify(decision)});
  await backend.commit(operation);await backend.commit(operation);
  assert.equal((await backend.load()).profile.gameLevels['visual-scanning'].level,4);
  assert.equal((await backend.load()).profile.totalSessions,1);
  assert.deepEqual(JSON.parse((await getDoc(doc(db,`users/${uid}/results/learned-result`))).data().adaptation),{...decision,application:'applied'});
  await assertFails(setDoc(doc(db,`users/${uid}/results/oversized-policy`),{...operation.result,adaptation:'x'.repeat(12001)}));
});

test('proposal evidence export paginates beyond 200 documents and enforces isolation and cancellation', async () => {
  const uid='evidence-export';
  await env.withSecurityRulesDisabled(async context => {
    const db=context.firestore();
    await Promise.all(Array.from({length:201},(_,i)=>setDoc(doc(db,`users/${uid}/evidence/chunk-${String(i).padStart(3,'0')}`),{
      version:1,sessionId:`session-${i}`,exerciseId:'language-naming',firstSequence:0,count:1,
      events:JSON.stringify([{kind:'start',level:1,configVersion:1,mode:'normal',locked:false,sequence:0,activeMs:0,at:'2026-10-04T12:00:00.000Z'}]),
      receivedAt:serverTimestamp(),
    })));
    await Promise.all(Array.from({length:201},(_,i)=>setDoc(doc(db,`users/${uid}/saveEvents/save-${i}`),{version:1,attemptId:`save-${i}`,resultId:`result-${i}`,mode:'normal',status:'started',elapsedMs:0,at:'2026-10-04T12:00:00.000Z',errorCategory:'none',receivedAt:serverTimestamp()})));
  });
  const db=env.authenticatedContext(uid).firestore();
  const first=await loadEvidencePage(db,uid);
  assert.equal(first.records.length,200);assert.equal(first.more,true);
  const second=await loadEvidencePage(db,uid,{cursor:first.cursor});
  assert.equal(second.records.length,1);assert.equal(second.more,false);
  assert.equal((await loadEvidencePage(db,uid,{sessionId:'session-17'})).records.length,1);
  const session=await loadSessionEvidence(db,uid,'session-17',new AbortController().signal);
  assert.equal(session.status,'unfinished');assert.equal(session.sessionId,'session-17');
  const exported=await loadEvidenceExport(db,uid,new AbortController().signal);
  assert.equal(exported.coverage.documents,201);assert.equal(exported.coverage.complete,true);
  assert.equal(exported.counts.unfinished,201);assert.equal(exported.counts.completed,0);
  assert.equal(exported.saves.coverage.documents,201);assert.equal(exported.saves.counts.unfinished,201);
  await assertFails(loadEvidencePage(env.authenticatedContext('stranger-export').firestore(),uid));
  const controller=new AbortController();controller.abort();
  await assert.rejects(loadEvidenceExport(db,uid,controller.signal),{name:'AbortError'});
});

test('proposal result links round-trip and malformed evidence identities are denied', async () => {
  const uid = 'proposal-result-link';
  const db = env.authenticatedContext(uid).firestore();
  const backend = firestoreProgress(uid, db);
  await backend.initialize(fresh());
  const operation = op('linked-result');
  operation.result.evidenceSessionId = '0-attempt-123';
  await backend.commit(operation);
  assert.equal((await backend.load()).history[0].evidenceSessionId, '0-attempt-123');
  assert.equal((await getDoc(doc(db, `users/${uid}/results/linked-result`))).data().evidenceSessionId, '0-attempt-123');
  for (const value of ['', 'invalid/path', 123, 'x'.repeat(129)]) {
    await assertFails(setDoc(doc(db, `users/${uid}/results/invalid-link`), {...operation.result, evidenceSessionId:value}));
  }
});

test('password accounts must verify email before progress, trials, invitations or professional entry', async () => {
  const uid = 'email-account';
  for (const email_verified of [false, undefined]) {
    const db = env.authenticatedContext(uid, { firebase: { sign_in_provider: 'password' }, ...(email_verified === undefined ? {} : { email_verified }) }).firestore();
    await assertFails(getDoc(doc(db, `users/${uid}/progress/main`)));
    await assertFails(setDoc(doc(db, `users/${uid}/access/main`), { kind: 'trial', trialStartedAt: serverTimestamp() }));
    await assertFails(getDoc(doc(db, 'professionals/ceoaberto')));
    await assertFails(setDoc(doc(db, `professionals/${uid}`), { ownerUid: uid, name: 'Persona', active: true, createdAt: serverTimestamp() }));
  }
  const db = env.authenticatedContext(uid, { firebase: { sign_in_provider: 'password' }, email_verified: true }).firestore();
  await assertFails(setDoc(doc(db, `users/${uid}/access/main`), { kind: 'trial', trialStartedAt: serverTimestamp() }));
  await assertSucceeds(firestoreProgress(uid, db).initialize(fresh()));
});

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

test('AI usage and daily recommendations are server-only even for the account owner', async () => {
  for (const path of ['users/quota-owner/aiUsage/daily', 'users/quota-owner/aiRecommendations/player', 'users/quota-owner/reportAttempts/attempt']) {
    await env.withSecurityRulesDisabled(async context => {
      await setDoc(doc(context.firestore(), path), { day: '2026-09-30', analysis: 'private-cache' });
    });
    for (const db of [env.unauthenticatedContext().firestore(), env.authenticatedContext('quota-owner').firestore(), env.authenticatedContext('another-user').firestore()]) {
      await assertFails(getDoc(doc(db, path)));
      await assertFails(setDoc(doc(db, path), { count: 0 }));
      await assertFails(deleteDoc(doc(db, path)));
    }
  }
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
  await env.withSecurityRulesDisabled(async context => setDoc(doc(context.firestore(), `users/${uid}/access/main`), { kind: 'trial', trialStartedAt: Date.now() }));
  const trial = await adapter.load();
  assert.equal(trial.expiresAt - trial.trialStartedAt, 7*86400000);
  await assertFails(setDoc(doc(db, `users/${uid}/access/main`), { kind: 'trial', trialStartedAt: serverTimestamp() }));
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
  await assertFails(setDoc(doc(db, `users/${uid}/access/main`), { kind: 'trial', trialStartedAt: serverTimestamp() }));
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
    await setDoc(doc(db, `users/${patient}/evidence/linked-chunk`), { version:1, sessionId:'linked-attempt', exerciseId:'language-naming', firstSequence:0, count:1, events:'[]', receivedAt:serverTimestamp() });
  });
  const progress = doc(owner, `users/${patient}/progress/main`);
  await assertSucceeds(getDoc(progress));
  const evidence = doc(owner, `users/${patient}/evidence/linked-chunk`);
  await assertSucceeds(getDoc(evidence));
  await assertFails(updateDoc(evidence, {events:'[]'}));
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
  await assertFails(getDoc(evidence));
  await env.withSecurityRulesDisabled(async context => { await updateDoc(doc(context.firestore(), seatPath), { expiresAt: until }); await deleteDoc(doc(context.firestore(), linkPath)); });
  await assertFails(getDoc(progress));
  await assertFails(getDoc(evidence));
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

test('a subscribed player can also register a professional profile without changing personal access or progress', async () => {
  const uid = 'dual-profile';
  const db = env.authenticatedContext(uid).firestore();
  const access = { kind: 'subscription', expiresAt: Date.now() + 86400000, autoRenew: true };
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'users/' + uid + '/access/main'), access);
    await setDoc(doc(context.firestore(), 'billing/' + uid), { customerId: 'personal-customer', subscriptionId: 'personal-subscription' });
  });
  const progress = firestoreProgress(uid, db);
  await progress.initialize(fresh());
  await progress.commit(op('dual-before'));
  const before = await progress.load();
  const professional = firestoreProfessional(uid, db);
  await professional.register('Perfil profesional');
  assert.equal((await professional.load()).ownerUid, uid);
  assert.deepEqual((await getDoc(doc(db, 'users/' + uid + '/access/main'))).data(), access);
  assert.deepEqual(await progress.load(), before);
  await progress.commit(op('dual-after'));
  assert.equal((await progress.load()).history.length, 2);
  await env.withSecurityRulesDisabled(async context => {
    assert.deepEqual((await getDoc(doc(context.firestore(), 'billing/' + uid))).data(), { customerId: 'personal-customer', subscriptionId: 'personal-subscription' });
    assert.equal((await getDoc(doc(context.firestore(), 'professionalBilling/' + uid))).exists(), false);
  });
});

test('placement is durable, atomic with levels, isolated and does not create exercise history', async () => {
  const uid = 'placement-owner';
  const db = env.authenticatedContext(uid).firestore();
  const backend = firestoreProgress(uid, db);
  await backend.initialize(fresh());
  const ids = ['visual-scanning','language-naming','word-completion','memory-path','memory-pairs','categorization','motor-target','motor-tracking'];
  const trial = { accuracy: 90, questions: 3, hints: 0, skipped: false };
  const first = { id:'placement:1:visual-scanning', kind:'placement', exerciseId:ids[0], trial };
  await backend.commit(first);
  await backend.commit(first);
  for (const id of ids.slice(1)) await backend.commit({ ...first, id:`placement:1:${id}`, exerciseId:id });
  const saved = await backend.load();
  assert.equal(saved.profile.placement.completed, true);
  assert.equal(saved.profile.gameLevels['memory-path'].level, 4);
  assert.equal(saved.profile.totalSessions, 0);
  assert.deepEqual(saved.history, []);
  await assertFails(getDoc(doc(env.authenticatedContext('other-placement').firestore(), `users/${uid}/progress/main`)));
  const invalid = structuredClone(saved); invalid.profile.gameLevels['memory-path'].level = 11;
  await assertFails(setDoc(doc(db, `users/${uid}/progress/main`), { schemaVersion:1, data:invalid, updatedAt:serverTimestamp() }));
  await assertSucceeds(backend.commit({ ...op('leveled'), result:{ ...op('leveled').result, level:4, configVersion:1, hintsUsed:0, practice:false } }));
  await assertFails(backend.commit({ ...op('invalid-level'), result:{ ...op('invalid-level').result, level:0, configVersion:1 } }));
  for (let i = 0; i < 3; i++) {
    const operation = op(`adapt-${i}`);
    await assertSucceeds(backend.commit({ ...operation, result: { ...operation.result, level:4, configVersion:1, practice:false, correctAnswers:3, totalQuestions:3 } }));
  }
  assert.equal((await backend.load()).profile.gameLevels['visual-scanning'].level, 5);

});


test('timed promotion keeps independent durable runs and rejects invalid counters', async () => {
  const uid = 'timed-levels';
  const db = env.authenticatedContext(uid).firestore();
  const backend = firestoreProgress(uid, db);
  await backend.initialize(fresh());
  for (const exerciseId of ['visual-scanning', 'language-naming']) {
    await backend.commit({ id:`placement:1:${exerciseId}`, kind:'placement', exerciseId,
      trial:{ accuracy:90, questions:3, hints:0, skipped:false } });
  }
  const strong = (id, exerciseId) => ({ ...op(id), result:{ ...op(id).result,
    exerciseId, domain:exerciseId === 'language-naming' ? 'language' : 'attention',
    level:4, configVersion:1, durationSeconds:120, accuracy:95, correctAnswers:19, totalQuestions:20 } });
  await assertSucceeds(backend.commit(strong('scan-one', 'visual-scanning')));
  await assertSucceeds(backend.commit(strong('naming-one', 'language-naming')));
  let saved = await backend.load();
  assert.equal(saved.profile.gameLevels['visual-scanning'].qualifyingRuns, 1);
  assert.equal(saved.profile.gameLevels['language-naming'].qualifyingRuns, 1);
  const second = strong('scan-two', 'visual-scanning');
  await assertSucceeds(backend.commit(second));
  await assertSucceeds(backend.commit(second));
  saved = await backend.load();
  assert.equal(saved.profile.gameLevels['visual-scanning'].level, 5);
  assert.equal(saved.profile.gameLevels['visual-scanning'].qualifyingRuns, 0);
  assert.equal(saved.profile.gameLevels['language-naming'].qualifyingRuns, 1);
  for (const count of [-1, 2, 0.5, '1']) {
    const invalid = structuredClone(saved);
    invalid.profile.gameLevels['language-naming'].qualifyingRuns = count;
    await assertFails(setDoc(doc(db, `users/${uid}/progress/main`), { schemaVersion:1, data:invalid, updatedAt:serverTimestamp() }));
  }
});

test('reassessment uses existing placement rules and receipts without resetting saved activity', async () => {
  const uid = 'reassessment-owner';
  const backend = firestoreProgress(uid, env.authenticatedContext(uid).firestore());
  await backend.initialize(fresh());
  await backend.commit(op('before-reassessment'));
  const ids = ['visual-scanning','language-naming','word-completion','memory-path','memory-pairs','categorization','motor-target','motor-tracking'];
  for (const exerciseId of ids) await backend.commit({ id:`initial:${exerciseId}`, kind:'placement', exerciseId, trial:{ accuracy:100, questions:3, hints:0, skipped:false } });
  const trials = Object.fromEntries(ids.map((id, i) => [id, { accuracy:65 + i, questions:3 + i, hints:0, skipped:false }]));
  const retake = { id:'retake:one', kind:'placement', trials };
  await assertSucceeds(backend.commit(retake));
  let saved = await backend.load();
  assert.equal(saved.profile.gameLevels['visual-scanning'].level, 3);
  assert.equal(saved.profile.totalSessions, 1);
  assert.equal(saved.history[0].id, 'before-reassessment');
  await backend.commit({ ...op('after-retake'), result:{ ...op('after-retake').result, level:3, configVersion:1, durationSeconds:30 } });
  await backend.commit(retake);
  saved = await backend.load();
  assert.equal(saved.profile.gameLevels['visual-scanning'].level, 4);
  assert.equal(saved.profile.totalSessions, 2);
});

test('1/4/7/10 placement saves with existing records, rejects invalid levels and assigns tracking', async () => {
  const uid='ladder-placement';
  const db=env.authenticatedContext(uid).firestore();
  const backend=firestoreProgress(uid,db);
  await backend.initialize(fresh());
  const ids=['visual-scanning','language-naming','word-completion','memory-path','memory-pairs','categorization','motor-target','motor-tracking'];
  for (const [i,exerciseId] of ids.entries()) {
    await assertSucceeds(backend.commit({id:`ladder:${exerciseId}`,kind:'placement',exerciseId,
      trial:{accuracy:100,questions:3,hints:0,skipped:false,assessedLevel:[1,4,7,10][i%4]}}));
  }
  const saved=await backend.load();
  assert.equal(saved.profile.placement.completed,true);
  assert.equal(saved.profile.gameLevels['motor-tracking'].level,10);
  assert.equal(saved.profile.totalSessions,0);
  assert.deepEqual(saved.history,[]);
  for(const assessedLevel of [0,2,6,11,'5']) {
    const invalid=structuredClone(saved);
    invalid.profile.placement.trials['word-completion'].assessedLevel=assessedLevel;
    await assertFails(setDoc(doc(db,`users/${uid}/progress/main`),{schemaVersion:1,data:invalid,updatedAt:serverTimestamp()}));
  }
});

test('bounded EEG and PPG recordings persist with its result and receipt, with existing account isolation', async () => {
  const uid = 'eeg-player'; const db = env.authenticatedContext(uid).firestore();
  const backend = firestoreProgress(uid, db); await backend.initialize(fresh());
  const operation = op('eeg-game');
  operation.result.ppg = { version: 1, adapter: 'test-sdk', metric: { id: 'ppg', label: 'PPG', unit: 'kADC', min: 0, max: 8388.608 }, points: '[[1,1],[2,null],[3,2]]' };
  operation.result.eeg = { version: 1, adapter: 'test-sdk', metric: { id: 'indicator', label: 'Indicador de prueba', unit: '%', min: 0, max: 100 }, points: '[[1,40],[2,null],[3,45]]' };
  await assertSucceeds(backend.commit(operation)); await backend.commit(operation);
  assert.deepEqual((await getDoc(doc(db, `users/${uid}/results/eeg-game`))).data().eeg, operation.result.eeg);
  assert.deepEqual((await getDoc(doc(db, `users/${uid}/results/eeg-game`))).data().ppg, operation.result.ppg);
  await assertFails(setDoc(doc(db, `users/${uid}/results/oversized-ppg`), { ...operation.result, id: 'oversized-ppg', ppg: { ...operation.result.ppg, points: '0'.repeat(6001) } }));
  assert.equal((await backend.load()).profile.totalSessions, 1);
  assert.deepEqual((await backend.load()).history[0].eeg, operation.result.eeg);
  assert.deepEqual((await backend.load()).history[0].ppg, operation.result.ppg);
  await assertFails(updateDoc(doc(db, `users/${uid}/results/eeg-game`), { ppg: operation.result.ppg }));
  const stranger = env.authenticatedContext('other-eeg-player').firestore();
  await assertFails(setDoc(doc(stranger, `users/${uid}/results/forged-eeg`), { ...operation.result, id: 'forged-eeg' }));
  for (const [index, patch] of [
    { version: 2 }, { adapter: '' }, { points: [] }, { raw: [1, 2, 3] },
    { metric: { ...operation.result.ppg.metric, min: 2, max: 1 } },
    { metric: { ...operation.result.ppg.metric, max: 1000001 } },
  ].entries()) {
    await assertFails(setDoc(doc(db, `users/${uid}/results/invalid-ppg-${index}`), { ...operation.result, id: `invalid-ppg-${index}`, ppg: { ...operation.result.ppg, ...patch } }));
  }
  const ppgOnly = op('ppg-only-game');
  ppgOnly.result.ppg = operation.result.ppg;
  await assertSucceeds(backend.commit(ppgOnly));
  assert.deepEqual((await getDoc(doc(db, `users/${uid}/results/ppg-only-game`))).data().ppg, operation.result.ppg);

  await assertFails(getDoc(doc(env.authenticatedContext('other-eeg-player').firestore(), `users/${uid}/results/eeg-game`)));
  await assertFails(setDoc(doc(db, `users/${uid}/results/oversized`), { ...operation.result, id: 'oversized', eeg: { ...operation.result.eeg, points: '0'.repeat(6001) } }));
  await assertFails(setDoc(doc(db, `users/${uid}/results/raw-eeg`), { ...operation.result, id: 'raw-eeg', eeg: { ...operation.result.eeg, raw: [1,2,3] } }));
});

test('thematic interests, intermediate stages and partial completion round-trip across devices', async () => {
  const uid = 'thematic-placement';
  const db = env.authenticatedContext(uid).firestore();
  const backend = firestoreProgress(uid, db);
  const otherDevice = firestoreProgress(uid, env.authenticatedContext(uid).firestore());
  await backend.initialize(fresh());
  const preferences = { interests: ['memory'], movement: 'taps' };
  await assert.doesNotReject(() => backend.commit({ id: 'interests', kind: 'placement', preferences }), 'save preferences');
  const trial = { accuracy: 100, questions: 2, hints: 0, skipped: false, assessedLevel: 1 };
  const stage = { id: 'stage-4', kind: 'placement', exerciseId: 'memory-path', stage: { level: 4, best: trial } };
  await assert.doesNotReject(() => Promise.all([backend.commit(stage), otherDevice.commit(stage)]), 'save stage');
  let data = await otherDevice.load();
  assert.deepEqual(data.profile.placement.preferences, preferences);
  assert.equal(data.profile.placement.stages['memory-path'].level, 4);
  await assert.doesNotReject(() => backend.commit({ id: 'path', kind: 'placement', exerciseId: 'memory-path', trial }), 'finish path');
  await assert.doesNotReject(() => otherDevice.commit({ id: 'pairs', kind: 'placement', exerciseId: 'memory-pairs', trial: { ...trial, skipped: true, questions: 0, accuracy: 0 } }), 'finish pairs');
  data = await backend.load();
  assert.equal(data.profile.placement.completed, true);
  assert.equal(data.profile.gameLevels['motor-target'], undefined);
  assert.equal(data.profile.totalSessions, 0);
  assert.deepEqual(data.history, []);
  await assert.doesNotReject(() => backend.commit({ id: 'thematic-retake', kind: 'placement', preferences: { interests: ['motor'], movement: 'taps' }, trials: { 'motor-target': trial } }), 'save retake');
  await backend.commit({ id: 'retake-preferences', kind: 'placement', retakePreferences: { interests: ['motor'], movement: 'taps' } });
  assert.equal((await backend.load()).profile.placement.retakePreferences.interests[0], 'motor');
  for (const preferences of [{ interests: [], movement: 'taps' }, { interests: ['memory', 'memory'], movement: 'taps' }, { interests: ['memory'], movement: 'other' }, { interests: ['memory'], movement: 'taps', diagnosis: 'not-allowed' }]) {
    const invalid = structuredClone(data); invalid.profile.placement.preferences = preferences;
    await assertFails(setDoc(doc(db, `users/${uid}/progress/main`), { schemaVersion: 1, data: invalid, updatedAt: serverTimestamp() }));
  }
  const invalid = structuredClone(data); delete invalid.profile.placement.trials['memory-pairs'];
  await assertFails(setDoc(doc(db, `users/${uid}/progress/main`), { schemaVersion: 1, data: invalid, updatedAt: serverTimestamp() }));
  const badStage = structuredClone(data); badStage.profile.placement.stages = { 'memory-path': { level: 7, best: trial } };
  await assertFails(setDoc(doc(db, `users/${uid}/progress/main`), { schemaVersion: 1, data: badStage, updatedAt: serverTimestamp() }));
  await assertFails(getDoc(doc(env.authenticatedContext('unrelated-thematic').firestore(), `users/${uid}/progress/main`)));
});

test('all-area preferences and retake stay within the rules budget and preserve initial trials', async () => {
  const uid = 'all-area-placement';
  const backend = firestoreProgress(uid, env.authenticatedContext(uid).firestore());
  await backend.initialize(fresh());
  const preferences = { interests: ['attention', 'memory', 'language', 'executive', 'motor'], movement: 'unspecified' };
  await assert.doesNotReject(() => backend.commit({ id: 'all-preferences', kind: 'placement', preferences }), 'all preferences');
  const ids = ['visual-scanning','language-naming','word-completion','memory-path','memory-pairs','categorization','motor-target','motor-tracking'];
  const trial = { accuracy: 100, questions: 2, hints: 0, skipped: false, assessedLevel: 1 };
  for (const id of ids) {
    await assert.doesNotReject(() => backend.commit({ id: 'stage:' + id, kind: 'placement', exerciseId: id, stage: { level: 4, best: trial } }), 'stage ' + id);
    await assert.doesNotReject(() => backend.commit({ id: 'trial:' + id, kind: 'placement', exerciseId: id, trial }), 'trial ' + id);
  }
  await assert.doesNotReject(() => backend.commit({ id: 'all-retake', kind: 'placement', preferences, trials: Object.fromEntries(ids.map(id => [id, { ...trial, assessedLevel: 7 }])) }), 'eight-game retake');
  await backend.commit({ id: 'all-retake-preferences', kind: 'placement', retakePreferences: preferences });
  const saved = await backend.load();
  for (const id of ids) {
    assert.equal(saved.profile.gameLevels[id].level, 7);
    assert.equal(saved.profile.placement.trials[id].assessedLevel, 1);
  }
});


test('optional condition context round-trips with bounded values and consent', async () => {
  const uid = 'condition-context';
  const db = env.authenticatedContext(uid).firestore();
  const backend = firestoreProgress(uid, db);
  await backend.initialize(fresh());
  const condition = {kind:'stroke',side:'left',mobility:'support',consentVersion:1};
  const preferences = {interests:['memory'],movement:'unspecified',condition};
  await backend.commit({id:'context',kind:'placement',preferences});
  const data = await backend.load();
  assert.deepEqual(data.profile.placement.preferences.condition,condition);
  for (const invalid of [{...condition,consentVersion:0},{...condition,side:'invalid'},{...condition,diagnosis:'private'},{...condition,kind:'none'}]) {
    const next = structuredClone(data); next.profile.placement.preferences.condition = invalid;
    await assertFails(setDoc(doc(db, `users/${uid}/progress/main`), {schemaVersion:1,data:next,updatedAt:serverTimestamp()}));
  }
  await backend.commit({id:'remove-context',kind:'placement',preferences:{interests:['memory'],movement:'unspecified'}});
  assert.equal((await backend.load()).profile.placement.preferences.condition,undefined);
  const personal = {kind:'other',side:'unspecified',mobility:'unspecified'};
  await backend.commit({id:'personal-context',kind:'placement',preferences:{interests:['memory'],movement:'unspecified',condition:personal}});
  assert.deepEqual((await backend.load()).profile.placement.preferences.condition,personal);
});


test('deletion locks deny old-token writes and trial ledgers are server-only', async () => {
  const uid='deleting-user'; const db=env.authenticatedContext(uid).firestore();
  await assertSucceeds(firestoreProgress(uid,db).initialize(fresh()));
  await env.withSecurityRulesDisabled(async context=>setDoc(doc(context.firestore(),`accountDeletions/${uid}`),{phase:'seats'}));
  await assertFails(getDoc(doc(db,`users/${uid}/progress/main`)));
  await assertFails(setDoc(doc(db,`professionals/${uid}`),{ownerUid:uid,name:'Private',active:true,createdAt:serverTimestamp()}));
  await assertFails(setDoc(doc(db,`users/${uid}/access/main`),{kind:'trial',trialStartedAt:serverTimestamp()}));
  await assertFails(deleteDoc(doc(db,`accountDeletions/${uid}`)));
  await assertFails(setDoc(doc(db,'trialUsage/forged'),{used:false}));
  await assertFails(getDoc(doc(db,'trialUsage/forged')));
});

test('completed placement profiles save all game results with Muse EEG/PPG and settings', async () => {
  const uid='muse-completed-placement';const db=env.authenticatedContext(uid).firestore();
  const backend=firestoreProgress(uid,db);await backend.initialize(fresh());
  const ids=['visual-scanning','language-naming','word-completion','memory-path','memory-pairs','categorization','motor-target','motor-tracking'];
  const domains=['attention','language','language','memory','memory','executive','motor','motor'];
  for(const exerciseId of ids)await backend.commit({id:`placement:${exerciseId}`,kind:'placement',exerciseId,trial:{assessedLevel:4,accuracy:100,questions:1,hints:0,skipped:false}});
  const points=JSON.stringify(Array.from({length:119},(_,i)=>[i*1.017,12.375]));
  for(const [i,exerciseId] of ids.entries()) {
    const operation=op(`muse-${exerciseId}`);
    Object.assign(operation.result,{exerciseId,domain:domains[i],practice:false,level:4,configVersion:1,hintsUsed:0,
      eeg:{version:1,adapter:'muse2-webbluetooth-v1',metric:{id:'muse2-ac-rms-v1',label:'Amplitud EEG',unit:'µV',min:0,max:1000},points},
      ppg:{version:1,adapter:'muse2-webbluetooth-v1',metric:{id:'muse2-ppg-ir-rms-v1',label:'Amplitud PPG infrarroja',unit:'kADC',min:0,max:8388.608},points}});
    await assertSucceeds(backend.commit(operation));
  }
  await assertSucceeds(backend.commit({id:'after-muse-settings',kind:'settings',settings:{fontSize:'xlarge'}}));
  assert.equal((await backend.load()).profile.totalSessions,8);
});

test('reassessment can replace all eight legacy level entries in one durable operation', async () => {
  const uid = 'all-levels-retake';
  const db = env.authenticatedContext(uid).firestore();
  const backend = firestoreProgress(uid, db);
  const ids = ['visual-scanning','language-naming','word-completion','memory-path','memory-pairs','categorization','motor-target','motor-tracking'];
  const data = fresh();
  data.profile.placement = { version:1, completed:true, trials:Object.fromEntries(ids.map(id => [id, { accuracy:100, questions:3, hints:0, skipped:false }])) };
  data.profile.gameLevels = Object.fromEntries(ids.map(id => [id, { level:4, evidence:[], qualifyingRuns:0 }]));
  data.history = [op('preserved-activity').result];
  data.profile.totalSessions = 1;
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), `users/${uid}/progress/main`), { schemaVersion:1, data, updatedAt:serverTimestamp() });
  });
  const retake = { id:'placement:retake:all', kind:'placement', trials:Object.fromEntries(ids.map(id => [id, { accuracy:0, questions:0, hints:0, skipped:true }])) };
  await assertSucceeds(backend.commit(retake));
  await assertSucceeds(backend.commit(retake));
  const saved = await backend.load();
  for (const id of ids) assert.deepEqual(saved.profile.gameLevels[id], { level:1, evidence:[] });
  assert.deepEqual(saved.history, data.history);
  assert.deepEqual(saved.profile.placement, data.profile.placement);
  assert.equal(saved.profile.totalSessions, 1);
  await assertSucceeds(backend.commit(op('after-all-levels-retake')));
  assert.equal((await backend.load()).profile.totalSessions, 2);
  for (const evidence of [[0], [0, 100]]) {
    await assertSucceeds(updateDoc(doc(db, `users/${uid}/progress/main`), {
      'data.profile.gameLevels.motor-tracking.evidence': evidence, updatedAt:serverTimestamp(),
    }));
  }
  for (const evidence of [null, {}, [0, 0, 0], [-1], [101], [1.5], ['0'], [0, 101], [0, 1.5]]) {
    await assertFails(updateDoc(doc(db, `users/${uid}/progress/main`), {
      'data.profile.gameLevels.motor-tracking.evidence': evidence, updatedAt:serverTimestamp(),
    }));
  }
});

test('proposal evidence archives are durable, immutable, idempotent and isolated from profile totals', async () => {
  const uid='proposal-evidence'; const db=env.authenticatedContext(uid).firestore();
  const backend=firestoreProgress(uid,db); await backend.initialize(fresh());
  const before=await backend.load();
  const chunk={version:1,sessionId:'attempt-1',exerciseId:'language-naming',firstSequence:0,count:1,
    events:JSON.stringify([{sequence:0,activeMs:0,at:'2026-10-04T12:00:00.000Z',kind:'start',level:1,configVersion:1,mode:'normal',locked:false}])};
  const operation={id:'evidence:attempt-1:0',kind:'evidence',chunk};
  await assertSucceeds(backend.commit(operation));
  await assertSucceeds(backend.commit(operation));
  assert.deepEqual(await backend.load(),before);
  const path=`users/${uid}/evidence/${encodeURIComponent(operation.id)}`;
  const stored=await assertSucceeds(getDoc(doc(db,path)));
  assert.equal(stored.data().events,chunk.events);assert.ok(stored.data().receivedAt);
  await assertFails(updateDoc(doc(db,path),{events:'[]'}));
  await assertFails(deleteDoc(doc(db,path)));
  const stranger=env.authenticatedContext('evidence-stranger').firestore();
  await assertFails(getDoc(doc(stranger,path)));
  await assertFails(setDoc(doc(stranger,`users/${uid}/evidence/forged`),{...chunk,receivedAt:serverTimestamp()}));
  await assertFails(setDoc(doc(db,`users/${uid}/evidence/oversize`),{...chunk,events:'x'.repeat(24001),receivedAt:serverTimestamp()}));
  await assertFails(setDoc(doc(db,`users/${uid}/evidence/fake-time`),{...chunk,receivedAt:new Date(0)}));
  await assert.rejects(backend.commit({...operation,id:'evidence:attempt-1:8',chunk:{...chunk,firstSequence:8,events:'[]'}}),/invalid-evidence/);
});

test('report lifecycle uses immutable owner-only archives and idempotent outbox receipts without changing progress',async()=>{
  const uid='report-events',db=env.authenticatedContext(uid).firestore(),backend=firestoreProgress(uid,db);
  const before=await backend.initialize(fresh());
  const event={version:1,attemptId:'fixture',sequence:0,phase:'started',source:'ai',elapsedMs:0,at:'2026-10-04T12:00:00.000Z'};
  const operation={id:'report:fixture:0',kind:'report',event};
  assert.deepEqual(await backend.commit(operation),before);assert.deepEqual(await backend.commit(operation),before);
  const path=`users/${uid}/reportEvents/${encodeURIComponent(operation.id)}`;
  assert.equal((await getDoc(doc(db,path))).data().phase,'started');
  await assertFails(updateDoc(doc(db,path),{phase:'download-requested'}));
  await assertFails(deleteDoc(doc(db,path)));
  await assertFails(getDoc(doc(env.authenticatedContext('other').firestore(),path)));
  await assertFails(setDoc(doc(db,`users/${uid}/reportEvents/bad`),{...event,draft:'not allowed',receivedAt:serverTimestamp()}));
  await assert.rejects(backend.commit({...operation,id:'wrong'}),/invalid-report-operation/);
});

test('report export reads beyond 200 events, follows server cursors and refuses partial failures',async()=>{
  const uid='report-export-pages',db=env.authenticatedContext(uid).firestore();
  await env.withSecurityRulesDisabled(async context=>{
    await Promise.all(Array.from({length:201},(_,i)=>setDoc(doc(context.firestore(),`users/${uid}/reportEvents/${i}`),{version:1,attemptId:`attempt-${i}`,sequence:0,phase:'started',source:'ai',elapsedMs:0,at:'2026-10-04T12:00:00.000Z',receivedAt:serverTimestamp()})));
  });
  const cursors=[];
  const page=async cursor=>{cursors.push(cursor);return {records:[],nextCursor:cursor?null:'next'};};
  const result=await loadReportEvidenceExport(db,uid,page,new AbortController().signal);
  assert.equal(result.coverage.clientDocuments,201);assert.equal(result.counts.unfinished,201);
  assert.deepEqual(cursors,[undefined,'next',undefined]);
  await assert.rejects(loadReportEvidenceExport(db,uid,async cursor=>{if(cursor)throw Error('page-failed');return {records:[],nextCursor:'next'};},new AbortController().signal),/page-failed/);
  await assert.rejects(loadReportEvidenceExport(db,uid,async()=>({records:[],nextCursor:'loop'}),new AbortController().signal),/stalled-server-pagination/);
  const cancelled=new AbortController();cancelled.abort();await assert.rejects(loadReportEvidenceExport(db,uid,page,cancelled.signal),{name:'AbortError'});
  await assert.rejects(loadReportEvidenceExport(env.authenticatedContext('unrelated-report').firestore(),uid,page,new AbortController().signal));
});

test('save observations are immutable, receipt-idempotent and exported with result reconciliation',async()=>{
  const uid='save-observations',db=env.authenticatedContext(uid).firestore(),backend=firestoreProgress(uid,db);
  await backend.initialize(fresh());await backend.commit(op('save-result'));
  const start={version:1,attemptId:'save-attempt',resultId:'save-result',mode:'normal',status:'started',elapsedMs:0,at:'2026-10-04T12:00:00.000Z',errorCategory:'none'};
  for(const event of [start,{...start,status:'failed',elapsedMs:25,errorCategory:'network'}]){
    const operation={id:`save:${event.attemptId}:${event.status}`,kind:'save-evidence',event};
    await backend.commit(operation);await backend.commit(operation);
  }
  const archive=await loadEvidenceExport(db,uid,new AbortController().signal);
  assert.equal(archive.saves.coverage.documents,2);assert.equal(archive.saves.counts.failed,1);
  assert.equal(archive.saves.counts.distinctNormalResultsArchived,1);assert.equal((await backend.load()).profile.totalSessions,1);
  const path=`users/${uid}/saveEvents/${encodeURIComponent('save:save-attempt:started')}`;
  await assertFails(updateDoc(doc(db,path),{status:'acknowledged'}));await assertFails(deleteDoc(doc(db,path)));
  await assertFails(getDoc(doc(env.authenticatedContext('save-stranger').firestore(),path)));
  await assertFails(setDoc(doc(db,`users/${uid}/saveEvents/leak`),{...start,errorMessage:'private',receivedAt:serverTimestamp()}));
});

test('practice calendars are server-owned, immutable to clients and paginated without losing revisions',async()=>{
  const uid='calendar-owner',db=env.authenticatedContext(uid).firestore();
  const revision={version:1,revision:1,timeZone:'Europe/Madrid',createdAt:Date.parse('2026-01-01T12:00:00Z'),effectiveFrom:'2026-01-02',daysMask:127,dailyExercises:1};
  await env.withSecurityRulesDisabled(async context=>{
    await Promise.all(Array.from({length:201},(_,i)=>setDoc(doc(context.firestore(),`users/${uid}/scheduleRevisions/${String(i+1).padStart(10,'0')}`),{...revision,revision:i+1,createdAt:revision.createdAt+i})));
  });
  const path=`users/${uid}/scheduleRevisions/0000000001`;
  await assertSucceeds(getDoc(doc(db,path)));await assertFails(updateDoc(doc(db,path),{daysMask:0}));await assertFails(deleteDoc(doc(db,path)));
  await assertFails(setDoc(doc(db,`users/${uid}/practiceSchedule/current`),revision));
  await assertFails(getDoc(doc(env.authenticatedContext('calendar-stranger').firestore(),path)));
  const data=await loadPracticeAdherence(db,uid,Date.parse('2026-01-05T12:00:00Z'),new AbortController().signal);
  assert.equal(data.revisions.length,201);assert.equal(data.adherence.plannedDays,3);assert.equal(data.adherence.ratio,0);
  await env.withSecurityRulesDisabled(async context=>{
    const admin=context.firestore(),until=Date.now()+60000;
    await setDoc(doc(admin,'professionals/calendar-professional'),{ownerUid:'calendar-professional',active:true});
    await setDoc(doc(admin,`users/${uid}/access/main`),{kind:'invitation',professionalId:'calendar-professional',seatId:'seat',expiresAt:until});
    await setDoc(doc(admin,'professionals/calendar-professional/seats/seat'),{status:'active',occupantUid:uid,expiresAt:until});
    await setDoc(doc(admin,`professionals/calendar-professional/patients/${uid}`),{patientId:uid,seatId:'seat'});
  });
  const professional=env.authenticatedContext('calendar-professional').firestore();
  await assertSucceeds(getDoc(doc(professional,path)));await assertFails(updateDoc(doc(professional,path),{daysMask:0}));

});

test('adaptive response pipeline measures real queued emulator persistence separately from actor time',async()=>{
  const samples=[];
  for(let index=0;index<3;index++){
    const uid=`latency-policy-${index}`,id=`latency-result-${index}`;
    const db=env.authenticatedContext(uid).firestore(),backend=firestoreProgress(uid,db);
    await backend.initialize(fresh());
    await env.withSecurityRulesDisabled(async context=>updateDoc(doc(context.firestore(),`users/${uid}/progress/main`),{'data.profile.gameLevels':{'visual-scanning':{level:5,evidence:[]}}}));
    const initial=await backend.load();let queue=[];let activeMs=0;let localAt;
    let resolveSaved,rejectSaved;
    const saved=new Promise((resolve,reject)=>{resolveSaved=resolve;rejectSaved=reject;});
    const sync=new ProgressSync(initial,[],backend,next=>queue=structuredClone(next),(data,status,error)=>{
      if(error)rejectSaved(error);
      if(data.history.some(row=>row.id===id)){
        if(localAt===undefined)localAt=performance.now();
        if(status==='saved')resolveSaved(performance.now());
      }
    },{recordSaves:true});
    try{
      const recorder=createSessionEvidence({sessionId:`latency-session-${index}`,exerciseId:'visual-scanning',activeNow:()=>activeMs,sink:chunk=>sync.enqueue({id:`evidence:${chunk.sessionId}:${chunk.firstSequence}`,kind:'evidence',chunk})});
      recorder.start(5,'normal',false);
      for(let response=0;response<2;response++){recorder.present(`q${response}`,5);activeMs+=1000;recorder.respond(false);}
      recorder.present('q2',5);activeMs+=1000;
      const start=performance.now();recorder.respond(false);
      const decision=decideAdaptation(recorder.observation(),{locked:false,mode:'normal',baseLevel:5});
      const decidedAt=performance.now();recorder.finish(id);
      const operation=op(id);Object.assign(operation.result,{level:5,configVersion:1,correctAnswers:0,totalQuestions:3,accuracy:0,durationSeconds:3,evidenceSessionId:recorder.id,adaptation:JSON.stringify(decision)});
      sync.enqueue(operation);
      const savedAt=await saved;
      const archived=(await getDoc(doc(db,`users/${uid}/results/${id}`))).data();
      const confirmed=await backend.load();
      assert.equal(JSON.parse(archived.adaptation).application,'applied');
      assert.equal(confirmed.profile.gameLevels['visual-scanning'].level,decision.nextLevel);
      assert.equal(queue.length,0);
      samples.push({model:decision.model,responseToDecisionMs:decidedAt-start,actorMs:decision.inferenceMs,responseToLocalStateMs:localAt-start,responseToSyncedMs:savedAt-start,responseToVerifiedReadMs:performance.now()-start,level:decision.nextLevel});
    }finally{sync.stop();}
  }
  await writeFile('/tmp/neuroia-adaptation-emulator-latency.json',JSON.stringify({version:1,generatedAt:new Date().toISOString(),node:process.version,scope:'Synthetic final response -> observation -> actor -> real ProgressSync evidence/save queue -> Firestore emulator transactions -> verified archive/profile reads. Excludes physical input, BLE, React paint and production network.',samples,allSyncedUnderOneSecond:samples.every(row=>row.responseToSyncedMs<1000),hardwareAcceptance:false},null,2));
  // Persist the measured outcome even if the environment misses the performance
  // target. Correctness must pass independently; emulator timing is not release acceptance.
  assert.equal(samples.length,3);
});
