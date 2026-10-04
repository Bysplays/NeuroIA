import {collection,documentId,getDocsFromServer,limit,orderBy,query,startAfter,type Firestore,type QuerySnapshot} from 'firebase/firestore';
import {calculateAdherence,validScheduleRevision} from './practiceSchedule.ts';
import type {ExerciseResult} from '../types/index.ts';
export async function loadPracticeAdherence(db:Firestore,uid:string,asOf:number,signal:AbortSignal) {
  const read=async(name:string)=>{
    const rows:unknown[]=[];let cursor:string|undefined;
    while(true){
      signal.throwIfAborted();
      const page:QuerySnapshot=await getDocsFromServer(query(collection(db,'users',uid,name),orderBy(documentId()),...(cursor?[startAfter(cursor)]:[]),limit(200)));
      signal.throwIfAborted();rows.push(...page.docs.map(doc=>doc.data()));
      if(page.size<200)break;
      const next=page.docs.at(-1)!.id;if(next===cursor)throw Error('schedule-pagination-stalled');cursor=next;
    }
    return rows;
  };
  const raw=await read('scheduleRevisions');const results=await read('results');
  // Recheck permission after reading the entire archive; no partial-success export.
  await getDocsFromServer(query(collection(db,'users',uid,'scheduleRevisions'),limit(1)));signal.throwIfAborted();
  return {revisions:raw.filter(validScheduleRevision).sort((a,b)=>a.revision-b.revision),adherence:calculateAdherence(raw,results as ExerciseResult[],{asOf,complete:true})};
}
