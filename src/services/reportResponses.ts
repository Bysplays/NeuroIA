import {getFirestore} from 'firebase/firestore';
import {auth} from './firebase';
import {loadEvidenceExport} from './evidenceArchive';
import {responseMetrics} from './responseMetrics';
/** Local deterministic appendix: never sent to the language-model provider. */
export async function loadReportResponses(uid:string,signal:AbortSignal){
  const caller=auth.currentUser?.uid;
  if(!caller)throw Error('No hay una sesión activa para consultar las respuestas.');
  const archive=await loadEvidenceExport(getFirestore(auth.app),uid,signal);
  signal.throwIfAborted();
  if(auth.currentUser?.uid!==caller)throw new DOMException('La cuenta ha cambiado.','AbortError');
  return responseMetrics(archive);
}
