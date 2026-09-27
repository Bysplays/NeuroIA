import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail,
  sendEmailVerification, reload, getIdToken, updatePassword,
  validatePassword, type Auth, type User,
} from 'firebase/auth';

export type EmailAction = 'signin' | 'register' | 'reset';

export function needsEmailVerification(user: Pick<User, 'emailVerified' | 'providerData'>) {
  return !user.emailVerified && user.providerData.some(provider => provider.providerId === 'password');
}

export async function checkNewPassword(auth: Auth, password: string) {
  const policy = await validatePassword(auth, password);
  if (!policy.isValid) throw { code: 'auth/password-does-not-meet-requirements' };
}

export async function submitEmailAuth(auth: Auth, action: EmailAction, email: string, password = '') {
  const address = email.trim();
  if (action === 'reset') {
    // Same response for an unknown address, including projects without enumeration protection.
    try { await sendPasswordResetEmail(auth, address); }
    catch (error) {
      if (!(error && typeof error === 'object' && 'code' in error && error.code === 'auth/user-not-found')) throw error;
    }
    return null;
  }
  if (action === 'register') {
    await checkNewPassword(auth, password);
    return createUserWithEmailAndPassword(auth, address, password);
  }
  return signInWithEmailAndPassword(auth, address, password);
}

export async function sendVerification(user: User) {
  await sendEmailVerification(user);
}

export async function refreshVerification(user: User) {
  await reload(user);
  // Rules and billing must receive the refreshed email_verified claim too.
  await getIdToken(user, true);
  return !needsEmailVerification(user);
}

export async function addPassword(auth: Auth, user: User, password: string) {
  if (!user.email || auth.currentUser !== user) throw { code: 'auth/user-mismatch' };
  if (user.providerData.some(provider => provider.providerId === 'password')) throw { code: 'auth/provider-already-linked' };
  await checkNewPassword(auth, password);
  if (auth.currentUser !== user) throw { code: 'auth/user-mismatch' };
  // Set a password on this authenticated user, retaining its existing email and
  // UID. Firebase enforces recent sign-in. No email lookup or account merging.
  await updatePassword(user, password);
  await reload(user);
  await getIdToken(user, true);
}
