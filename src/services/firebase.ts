import { initializeApp } from 'firebase/app';
import { browserPopupRedirectResolver, indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence, initializeAuth } from 'firebase/auth';

// Public web configuration. Authorization must be enforced by server-side rules.
const app = initializeApp({
  apiKey: 'AIzaSyAbEc1z8GzzNTl1vOziMJypSHagIrukilQ',
  authDomain: 'ceoaberto-neuroia.firebaseapp.com',
  projectId: 'ceoaberto-neuroia',
  storageBucket: 'ceoaberto-neuroia.firebasestorage.app',
  messagingSenderId: '1049872074432',
  appId: '1:1049872074432:web:59858bb2b50b9e1f58cf25',
});

// Firebase restores the signed-in account across reloads and browser restarts.
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
});
auth.languageCode = 'es';
