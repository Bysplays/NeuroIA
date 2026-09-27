import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authErrorMessage } from '../src/services/authErrors.ts';

test('email errors explain recovery without echoing provider details', () => {
  assert.match(authErrorMessage({ code: 'auth/operation-not-allowed' }, 'email'), /correo y contraseña/);
  for (const code of ['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password']) {
    assert.equal(authErrorMessage({ code }, 'email'), authErrorMessage({ code: 'auth/invalid-credential' }, 'email'));
  }
  assert.match(authErrorMessage({ code: 'auth/email-already-in-use' }, 'email'), /Google.*Ajustes/);
  assert.match(authErrorMessage({ code: 'auth/requires-recent-login' }, 'email'), /confirma tu identidad/);
  assert.match(authErrorMessage({ code: 'auth/too-many-requests' }, 'email'), /Espera/);
  assert.match(authErrorMessage({ code: 'auth/credential-already-in-use' }, 'email'), /no hemos combinado/);
});

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
