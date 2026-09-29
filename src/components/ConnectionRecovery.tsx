import { Brand } from './Brand';
import { RotateCw } from 'lucide-react';
import { FullscreenButton } from './FullscreenButton';
import { HeaderIllustration } from './HeaderIllustration';

export function ConnectionRecovery({ title = 'Vamos a reconectar', message = 'Comprueba tu conexión y vuelve a intentarlo.', onRetry, onSignOut }: {
  title?: string; message?: string; onRetry: () => void; onSignOut: () => void;
}) {
  return <main className="login-screen connection-recovery">
    <header className="login-brand"><Brand/><FullscreenButton/></header>
    <section className="login-card" aria-labelledby="connection-title">
      <div className="login-welcome"><HeaderIllustration scene="rest" className="login-art"/></div>
      <div className="login-actions">
        <h1 id="connection-title">{title}</h1>
        <p role="alert">{message}</p>
        <button className="touch-btn touch-btn-primary" onClick={onRetry}><RotateCw size={20} aria-hidden="true"/>Reintentar conexión</button>
        <button className="placement-text-action" onClick={onSignOut}>Cerrar sesión</button>
      </div>
    </section>
  </main>;
}
