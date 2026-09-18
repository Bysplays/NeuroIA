import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasAccess, trialPatch, invitationPatch, normalizeCode, TRIAL_MS } from './access.js';
test('trial grants exactly seven days and cannot be restarted after expiry', () => {
  const data = trialPatch({}, 1000);
  assert.equal(data.expiresAt, 1000 + TRIAL_MS);
  assert.equal(hasAccess(data, data.expiresAt - 1), true);
  assert.equal(hasAccess(data, data.expiresAt), false);
  assert.throws(() => trialPatch(data, data.expiresAt + 1));
  assert.throws(() => trialPatch({ trialStartedAt: 0 }, 1000));
  assert.throws(() => trialPatch({ kind: 'invitation' }, 1000));
});
test('subscription expires and unknown access never unlocks the workspace', () => {
  assert.equal(hasAccess({kind:'subscription',expiresAt:2000}, 1000), true);
  assert.equal(hasAccess({kind:'subscription',expiresAt:1000}, 1000), false);
  assert.equal(hasAccess({kind:'trial'}, 1000), false);
  assert.equal(hasAccess({}, 1000), false);
});
test('codes normalize and reject document paths', () => {
  assert.equal(normalizeCode(' ceoaberto '), 'CEOABERTO');
  for (const code of ['', '../admin', {}, null, 'x'.repeat(65)]) assert.throws(() => normalizeCode(code));
});
test('invitation links the professional and rejects inactive, expired or consumed codes', () => {
  const invite = {active:true,professionalId:'ceoaberto'};
  const professional = {active:true,name:'CeoAberto'};
  const data = invitationPatch(invite,professional,'patient',1000);
  assert.equal(data.professionalId, 'ceoaberto');
  assert.equal(data.professionalName, 'CeoAberto');
  assert.equal(hasAccess(data, Number.MAX_SAFE_INTEGER), true);
  for (const invalid of [{...invite, active:false},{...invite,expiresAt:1000},{...invite,usedBy:'other'}]) assert.throws(() => invitationPatch(invalid,professional,'patient',1000));
  assert.throws(() => invitationPatch(invite,{...professional,active:false},'patient',1000));
});
