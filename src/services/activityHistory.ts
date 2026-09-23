import { collection, documentId, getDocsFromServer, getFirestore, limit, orderBy, query, startAfter } from 'firebase/firestore';
import { auth } from './firebase';
import type { ExerciseResult } from '../types';

// Account ownership is enforced by Firestore rules. Cursor order avoids date-format assumptions.
export async function loadActivityPage(uid: string, cursor?: string) {
  const ref = collection(getFirestore(auth.app), 'users', uid, 'results');
  const snapshot = await getDocsFromServer(query(ref, orderBy(documentId()), ...(cursor ? [startAfter(cursor)] : []), limit(200)));
  return { results: snapshot.docs.map(d => d.data() as ExerciseResult), cursor: snapshot.docs.at(-1)?.id, more: snapshot.size === 200 };
}
