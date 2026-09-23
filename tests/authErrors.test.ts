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

test('blocked API-key referrers explain the configuration problem without echoing URLs', () => {
  const message = authErrorMessage({ code: 'auth/requests-from-referer-http://localhost:5173/-are-blocked.' });
  assert.match(message, /dirección está bloqueada/);
  assert.match(message, /autorizarla/);
  assert.doesNotMatch(message, /localhost|5173/);
  assert.equal(authErrorMessage({ code: 'auth/requests-from-referer-https://private.example/-are-blocked.' }), message);
  assert.doesNotThrow(() => authErrorMessage({ code: 403 }));
});
