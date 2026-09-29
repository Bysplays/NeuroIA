import { useState } from 'react';
import { CloudOff } from 'lucide-react';
import { ModalFrame } from './ModalFrame';
import type { SyncStatus } from '../services/progressSync';

export function ProgressSaveNotice({ status, onRetry }: { status: SyncStatus; onRetry: () => Promise<void> }) {
  const [dismissed, setDismissed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  if (status === 'saved' && dismissed) setDismissed(false);
  const retry = async () => {
    if (retrying) return;
    setRetrying(true);
    try { await onRetry(); } finally { setRetrying(false); }
  };
  if (status === 'saved') return null;
  if (dismissed) return <div className="account-notice cloud-status" role="status">
    <span>Guardado pendiente.</span><button className="paper-nav-button" onClick={() => { setDismissed(false); void retry(); }}>Reintentar</button>
  </div>;
  if (status !== 'pending' && !retrying) return null;
  return <ModalFrame labelledBy="save-error-title" onClose={() => setDismissed(true)}>
    <section className="entry-error-notification">
      <div className="entry-error-heading"><CloudOff size={24} aria-hidden="true"/><h2 id="save-error-title">No hemos podido guardar</h2></div>
      <div className="entry-error-message"><p>Tus cambios siguen pendientes de sincronizar. Puedes reintentarlo o continuar en esta sesión. Mantén esta página abierta hasta que se guarden.</p></div>
      <button className="touch-btn touch-btn-primary" disabled={retrying} onClick={() => void retry()}>{retrying ? 'Reintentando…' : 'Reintentar'}</button>
      <button className="email-text-button save-continue" onClick={() => setDismissed(true)}>Avanzar sin sincronizar</button>
    </section>
  </ModalFrame>;
}
