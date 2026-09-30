import { Brand } from './Brand';
import { CircleAlert, RotateCw } from 'lucide-react';

export function ConnectionRecovery({ title = 'No hemos podido continuar', message = 'No hemos podido cargar tu cuenta. Vuelve a intentarlo en unos instantes.', onRetry, onSignOut }: {
  title?: string; message?: string; onRetry: () => void; onSignOut: () => void;
}) {
  return <main className="entry-page connection-recovery">
    <header className="entry-header"><Brand/></header>
    <div className="connection-recovery-body">
    <section className="connection-recovery-panel" aria-labelledby="connection-title">
        <div className="connection-recovery-heading"><CircleAlert size={24} aria-hidden="true"/><h1 id="connection-title">{title}</h1></div>
        <p role="alert">{message}</p>
        <button className="touch-btn touch-btn-primary" onClick={onRetry}><RotateCw size={20} aria-hidden="true"/>Volver a intentar</button>
        <button className="placement-text-action" onClick={onSignOut}>Cerrar sesión</button>
    </section>
    </div>
  </main>;
}
