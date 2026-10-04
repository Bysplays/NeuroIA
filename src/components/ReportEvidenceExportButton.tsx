import {onAuthStateChanged} from 'firebase/auth';
import {getFirestore} from 'firebase/firestore';
import {auth} from '../services/firebase';
import {activityAi} from '../services/activityAi';
import {loadReportEvidenceExport} from '../services/reportEvidenceArchive';
import {EvidenceDownload} from './EvidenceExportButton';
export function ReportEvidenceExportButton() {
  const uid=auth.currentUser?.uid;
  if(!uid)return null;
  const load=async(signal:AbortSignal)=>{
    const identity=new AbortController();
    const unsubscribe=onAuthStateChanged(auth,user=>{if(user?.uid!==uid)identity.abort();});
    const combined=AbortSignal.any([signal,identity.signal]);
    try{
      if(auth.currentUser?.uid!==uid)throw Error('account-changed');
      const result=await loadReportEvidenceExport(getFirestore(auth.app),uid,cursor=>activityAi.reportEvidence(combined,cursor),combined);
      combined.throwIfAborted();if(auth.currentUser?.uid!==uid)throw Error('account-changed');
      return result;
    }finally{unsubscribe();}
  };
  return <ReportEvidenceDownload uid={uid} load={load}/>;
}
export function ReportEvidenceDownload({uid,load}:{uid:string;load:(signal:AbortSignal)=>Promise<unknown>}) {
  return <EvidenceDownload key={uid} uid={uid} load={load} label="Exportar registro de informes" filename="neuroia-registro-informes.json"
    description="Descarga el registro de los informes que has solicitado desde esta cuenta, sin su contenido ni los datos de las personas. Incluye los intentos incompletos y sus limitaciones."/>;
}
