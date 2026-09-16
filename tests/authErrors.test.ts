import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authErrorMessage } from '../src/services/authErrors.ts';

test('login failures explain recovery without exposing provider internals', () => {
  assert.match(authErrorMessage({ code: 'auth/popup-blocked' }), /ventanas emergentes/);
  assert.match(authErrorMessage({ code: 'auth/popup-closed-by-user' }), /navegador habitual/);
  assert.match(authErrorMessage({ code: 'auth/unauthorized-domain' }), /no está autorizada/);
  assert.match(authErrorMessage({ code: 'auth/operation-not-allowed' }), /no está habilitado/);
  assert.match(authErrorMessage({ code: 'auth/network-request-failed' }), /conexión/);
  assert.equal(authErrorMessage({ message: 'private internal details' }), authErrorMessage(null));
});
