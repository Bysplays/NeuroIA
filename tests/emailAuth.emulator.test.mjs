import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';

if (process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099') throw Error('Only the local demo Auth emulator is allowed');
const projectId = 'demo-neuroia';
// Firebase CLI 15.30.1 does not implement getPasswordPolicy. Stub only this
// read-only endpoint; creation, credentials, linking and OOB codes use the emulator.
const originalFetch = globalThis.fetch;
let rejectVerificationDelivery = false;
globalThis.fetch = (input, init) => {
  const url = new URL(typeof input === 'string' ? input : input.url ?? input);
  if (rejectVerificationDelivery && url.origin === 'http://127.0.0.1:9099' && url.pathname.endsWith('/accounts:sendOobCode')) {
    return Promise.resolve(Response.json({error:{message:'TOO_MANY_ATTEMPTS_TRY_LATER'}}, {status:400}));
  }
  if (url.origin === 'http://127.0.0.1:9099' && url.pathname === '/identitytoolkit.googleapis.com/v2/passwordPolicy') {
    return Promise.resolve(Response.json({ customStrengthOptions: { minPasswordLength: 6 }, enforcementState: 'ENFORCE', schemaVersion: 1 }));
  }
  return originalFetch(input, init);
};
const {
  initializeAuth, inMemoryPersistence, connectAuthEmulator, signOut, applyActionCode,
  verifyPasswordResetCode, confirmPasswordReset, getIdTokenResult, signInWithCredential, GoogleAuthProvider,
} = await import('firebase/auth');
const { submitEmailAuth, needsEmailVerification, refreshVerification, sendVerification, addPassword } = await import('../src/services/emailAuth.ts');
const app = initializeApp({ projectId, apiKey: 'demo-key', authDomain: `${projectId}.firebaseapp.com` }, 'email-tests');
const auth = initializeAuth(app, { persistence: inMemoryPersistence });
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
after(async () => { await deleteApp(app); globalThis.fetch = originalFetch; });
const suffix = crypto.randomUUID();
const email = `email-${suffix}@example.test`;
const password = 'A-long-test-password-7!';
async function code(address, type) {
  const response = await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${projectId}/oobCodes`);
  assert.ok(response.ok);
  const codes = (await response.json()).oobCodes;
  const result = codes.findLast(item => item.email === address && item.requestType === type);
  assert.ok(result, `Missing ${type}`);
  return result.oobCode;
}

test('register, verify, sign in again, reject wrong credentials and recover password', async () => {
  await assert.rejects(submitEmailAuth(auth, 'register', email, 'x'));
  assert.equal(auth.currentUser, null);
  const { user } = await submitEmailAuth(auth, 'register', ` ${email} `, password);
  const uid = user.uid;
  assert.equal(needsEmailVerification(user), true);
  assert.equal(await refreshVerification(user), false);
  // Registration itself must issue the verification email.
  const verification = await code(email, 'VERIFY_EMAIL');
  await sendVerification(user); // Explicit resend remains available.
  await assert.rejects(applyActionCode(auth, 'invalid-code'));
  await applyActionCode(auth, verification);
  assert.equal(await refreshVerification(user), true);
  assert.equal((await getIdTokenResult(user)).claims.email_verified, true);
  await signOut(auth);
  await assert.rejects(submitEmailAuth(auth, 'signin', email, 'incorrect'));
  assert.equal(auth.currentUser, null);
  assert.equal((await submitEmailAuth(auth, 'signin', email, password)).user.uid, uid);
  await signOut(auth);
  await assert.rejects(submitEmailAuth(auth, 'register', email, password));
  await submitEmailAuth(auth, 'reset', `absent-${suffix}@example.test`);
  await submitEmailAuth(auth, 'reset', email);
  const reset = await code(email, 'PASSWORD_RESET');
  assert.equal(await verifyPasswordResetCode(auth, reset), email);
  const replacement = 'Replacement-password-8!';
  await confirmPasswordReset(auth, reset, replacement);
  await assert.rejects(confirmPasswordReset(auth, reset, replacement));
  await assert.rejects(submitEmailAuth(auth, 'signin', email, password));
  assert.equal((await submitEmailAuth(auth, 'signin', email, replacement)).user.uid, uid);
  await signOut(auth);
});

test('link a password to Google without changing UID; an old user cannot link after sign-out', async () => {
  const address = `google-${suffix}@example.test`;
  const credential = GoogleAuthProvider.credential(JSON.stringify({ sub: `google-${suffix}`, email: address, email_verified: true }));
  const { user } = await signInWithCredential(auth, credential);
  assert.equal(needsEmailVerification(user), false);
  const uid = user.uid;
  await addPassword(auth, user, password);
  assert.equal(auth.currentUser.uid, uid);
  assert.deepEqual(user.providerData.map(provider => provider.providerId).sort(), ['google.com', 'password']);
  await signOut(auth);
  await assert.rejects(addPassword(auth, user, password), error => error.code === 'auth/user-mismatch');
  assert.equal((await submitEmailAuth(auth, 'signin', address, password)).user.uid, uid);
  assert.equal(needsEmailVerification(auth.currentUser), false);
  await signOut(auth);
});


test('failed automatic verification preserves the account and allows explicit resend', async () => {
  const address = `delivery-${suffix}@example.test`;
  rejectVerificationDelivery = true;
  let result;
  try { result = await submitEmailAuth(auth, 'register', address, password); }
  finally { rejectVerificationDelivery = false; }
  assert.ok(result.verificationError);
  assert.equal(auth.currentUser.uid, result.user.uid);
  assert.equal(needsEmailVerification(result.user), true);
  await sendVerification(result.user);
  await code(address, 'VERIFY_EMAIL');
  const uid = result.user.uid;
  await signOut(auth);
  assert.equal((await submitEmailAuth(auth, 'signin', address, password)).user.uid, uid);
  await signOut(auth);
});

test('Worker Auth adapter looks up verified identity and deletes idempotently; recreation changes UID', async () => {
  const { authAdmin } = await import('../vendor/cloudflare/index.mjs');
  const address=`delete-${suffix}@example.test`;
  const credential=GoogleAuthProvider.credential(JSON.stringify({sub:`delete-${suffix}`,email:address,email_verified:true}));
  const {user}=await signInWithCredential(auth,credential);
  const uid=user.uid;
  const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',hash:'SHA-256',modulusLength:2048,publicExponent:new Uint8Array([1,0,1])},true,['sign','verify']);
  const privateKey=Buffer.from(await crypto.subtle.exportKey('pkcs8',keys.privateKey)).toString('base64');
  const env={FIREBASE_PROJECT_ID:projectId,FIREBASE_SERVICE_ACCOUNT:JSON.stringify({project_id:projectId,client_email:'demo@example.test',private_key:`-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`})};
  const previousFetch=globalThis.fetch;
  globalThis.fetch=(input,init)=>{
    const url=String(input);
    if(url==='https://oauth2.googleapis.com/token')return Promise.resolve(Response.json({access_token:'owner',expires_in:3600}));
    if(url.startsWith(`https://identitytoolkit.googleapis.com/v1/projects/${projectId}/`)) return originalFetch(url.replace('https://identitytoolkit.googleapis.com','http://127.0.0.1:9099/identitytoolkit.googleapis.com'),init);
    return previousFetch(input,init);
  };
  try {
    assert.equal((await authAdmin(env,'lookup',uid)).email,address);
    await authAdmin(env,'delete',uid);
    await authAdmin(env,'delete',uid);
    await assert.rejects(authAdmin(env,'lookup',uid),{status:403});
    await signOut(auth);
    const recreated=await signInWithCredential(auth,credential);
    assert.notEqual(recreated.user.uid,uid);
    await signOut(auth);
  } finally {globalThis.fetch=previousFetch;}
});
