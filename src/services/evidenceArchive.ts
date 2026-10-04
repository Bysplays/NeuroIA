import { collection, documentId, getDocsFromServer, limit, orderBy, query, startAfter, where, type Firestore, type QuerySnapshot } from 'firebase/firestore';
import type { EvidenceChunk } from './sessionEvidence.ts';
import type { ExerciseResult } from '../types/index.ts';
import { buildEvidenceExport } from './evidenceExport.ts';

/** Explicit server pagination, with no client-side date cutoff or silent cap.
 * Authorization remains with owner/active-linked-professional Firestore rules.
 * Keep malformed documents in the export so a bad record cannot disappear from
 * coverage accounting. Only validated summaries may contribute measurements.
 */
export async function loadEvidencePage(db: Firestore, uid: string, options: {cursor?:string; sessionId?:string; signal?:AbortSignal} = {}) {
  options.signal?.throwIfAborted();
  const ref = collection(db,'users',uid,'evidence');
  const snapshot = await getDocsFromServer(query(ref,
    ...(options.sessionId ? [where('sessionId','==',options.sessionId)] : []),
    orderBy(documentId()), ...(options.cursor ? [startAfter(options.cursor)] : []), limit(200)));
  options.signal?.throwIfAborted();
  return {
    records:snapshot.docs.map(doc => ({documentId:doc.id, chunk:doc.data() as EvidenceChunk})),
    cursor:snapshot.docs.at(-1)?.id, more:snapshot.size===200,
  };
}

/** No partial-success download: cancellation, revocation or any page failure
 * rejects the whole export. Callers must cancel when the account/view changes.
 */
export async function loadEvidenceExport(db: Firestore, uid: string, signal: AbortSignal) {
  const chunks:EvidenceChunk[]=[];
  let cursor:string|undefined;
  while (true) {
    const page=await loadEvidencePage(db,uid,{cursor,signal});
    chunks.push(...page.records.map(record=>record.chunk));
    if (!page.more) break;
    if (!page.cursor || page.cursor===cursor) throw Error('evidence-pagination-stalled');
    cursor=page.cursor;
  }
  const results:ExerciseResult[]=[];
  cursor=undefined;
  while (true) {
    signal.throwIfAborted();
    const snapshot:QuerySnapshot=await getDocsFromServer(query(collection(db,'users',uid,'results'),orderBy(documentId()),
      ...(cursor ? [startAfter(cursor)] : []),limit(200)));
    signal.throwIfAborted();
    results.push(...snapshot.docs.map(doc=>doc.data() as ExerciseResult));
    if (snapshot.size<200) break;
    const next:string|undefined=snapshot.docs.at(-1)?.id;
    if (!next || next===cursor) throw Error('result-pagination-stalled');
    cursor=next;
  }
  // Recheck current read permission after pagination, immediately before release.
  await loadEvidencePage(db,uid,{signal});
  signal.throwIfAborted();
  return buildEvidenceExport(chunks,results,true);
}
