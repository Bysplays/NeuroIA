import { initializeApp } from 'firebase/app';
import { browserPopupRedirectResolver, browserSessionPersistence, inMemoryPersistence, initializeAuth } from 'firebase/auth';

// Public web configuration. Authorization must be enforced by server-side rules.
const app = initializeApp({
  apiKey: 'AIzaSyAbEc1z8GzzNTl1vOziMJypSHagIrukilQ',
  authDomain: 'ceoaberto-neuroia.firebaseapp.com',
  projectId: 'ceoaberto-neuroia',
  storageBucket: 'ceoaberto-neuroia.firebasestorage.app',
  messagingSenderId: '1049872074432',
  appId: '1:1049872074432:web:59858bb2b50b9e1f58cf25',
});

// Shared-device friendly: restore on reload, not after closing the tab.
export const auth = initializeAuth(app, {
  persistence: [browserSessionPersistence, inMemoryPersistence],
  popupRedirectResolver: browserPopupRedirectResolver,
});
auth.languageCode = 'es';
