import {collection,documentId,getDocsFromServer,limit,orderBy,query,startAfter,type Firestore,type QuerySnapshot} from 'firebase/firestore';
import {buildReportEvidenceExport} from './reportEvidenceExport.ts';
export async function loadReportEvidenceExport(db:Firestore,uid:string,serverPage:(cursor?:string)=>Promise<{records:unknown[];nextCursor:string|null}>,signal:AbortSignal) {
  const client:unknown[]=[],server:unknown[]=[];let cursor:string|undefined;
  while(true){
    signal.throwIfAborted();
    const page:QuerySnapshot=await getDocsFromServer(query(collection(db,'users',uid,'reportEvents'),orderBy(documentId()),...(cursor?[startAfter(cursor)]:[]),limit(200)));
    signal.throwIfAborted();
    client.push(...page.docs.map(doc=>{const {receivedAt:_,...event}=doc.data();return event;}));
    if(page.size<200)break;
    const next=page.docs.at(-1)!.id;if(next===cursor)throw Error('stalled-client-pagination');cursor=next;
  }
  const cursors=new Set<string>();cursor=undefined;
  while(true){
    signal.throwIfAborted();const page=await serverPage(cursor);signal.throwIfAborted();
    if(!Array.isArray(page.records) || page.nextCursor!==null&&typeof page.nextCursor!=='string')throw Error('invalid-report-page');
    server.push(...page.records);
    if(page.nextCursor===null)break;
    if(!page.nextCursor||cursors.has(page.nextCursor))throw Error('stalled-server-pagination');
    cursors.add(page.nextCursor);cursor=page.nextCursor;
  }
  // Recheck both permissions before releasing the complete export.
  await getDocsFromServer(query(collection(db,'users',uid,'reportEvents'),limit(1)));
  await serverPage();signal.throwIfAborted();
  return buildReportEvidenceExport(client,server);
}
