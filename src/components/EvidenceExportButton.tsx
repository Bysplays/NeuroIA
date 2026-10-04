import { useEffect, useId, useRef, useState } from 'react';
import { getFirestore } from 'firebase/firestore';
import { Download } from 'lucide-react';
import { auth } from '../services/firebase';
import { loadEvidenceExport } from '../services/evidenceArchive';
import { ModalFrame } from './ModalFrame';

export function EvidenceExportButton({uid}:{uid:string}) {
  return <AccountEvidenceExport key={uid} uid={uid}/>;
}
function AccountEvidenceExport({uid}:{uid:string}) {
  const request=useRef<AbortController|null>(null);
  const button=useRef<HTMLButtonElement>(null);
  const [busy,setBusy]=useState(false), [error,setError]=useState(false), [notice,setNotice]=useState(false);
  const id=useId();
  const close=()=>{setNotice(false);requestAnimationFrame(()=>button.current?.focus());};
  useEffect(()=>()=>{request.current?.abort();},[uid]);
  const download=async()=>{
    if (request.current) return;
    const controller=new AbortController(); request.current=controller; setBusy(true);setError(false);
    try {
      const data=await loadEvidenceExport(getFirestore(auth.app),uid,controller.signal);
      controller.signal.throwIfAborted();
      const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download='neuroia-evaluacion.json';
      document.body.append(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
      setNotice(true);
    } catch { if (!controller.signal.aborted) setError(true); }
    finally { if (request.current===controller) request.current=null; if (!controller.signal.aborted) setBusy(false); }
  };
  return <div className="stats-evidence-export">
    <button ref={button} className="stats-quiet-button" disabled={busy} onClick={()=>void download()}><Download size={18} aria-hidden="true"/>{busy ? 'Preparando datos…' : 'Exportar datos de evaluación'}</button>
    <p>Descarga todos los registros de evaluación guardados, sin aplicar los filtros y sin nombres, notas ni identificadores de cuenta.</p>
    {error && <p role="alert">No hemos podido recuperar todos los datos. Vuelve a intentarlo.</p>}
    {notice && <ModalFrame labelledBy={id} onClose={close}><section className="entry-error-notification"><div className="entry-error-heading"><Download size={24} aria-hidden="true"/><h2 id={id}>Datos descargados</h2></div><div className="entry-error-message"><p>El archivo incluye la cobertura y las limitaciones de los registros.</p></div><button className="touch-btn touch-btn-primary" onClick={close}>Entendido</button></section></ModalFrame>}
  </div>;
}
