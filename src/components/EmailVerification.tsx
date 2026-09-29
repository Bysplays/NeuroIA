import { Brand } from './Brand';
import { useState } from 'react';
import { CircleAlert, Mail } from 'lucide-react';
import { ModalFrame } from './ModalFrame';
import type { User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { refreshVerification, sendVerification } from '../services/emailAuth';
import { authErrorMessage } from '../services/authErrors';

export function EmailVerification({ user, onVerified, onSignOut, signingOut, externalError, initialDelivery = 'idle' }: {
  user: User; onVerified: () => void; onSignOut: () => void; signingOut: boolean; externalError: string;
  initialDelivery?: 'idle' | 'sending' | 'sent' | 'failed';
}) {
  const [pendingAction, setPendingAction] = useState<'send' | 'check' | null>(null);
  const busy = pendingAction !== null;
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const act = async (send: boolean) => {
    if (busy || signingOut) return;
    setPendingAction(send ? 'send' : 'check'); setError(''); setNotice('');
    try {
      if (send) {
        await sendVerification(user);
        setSent(true);
        setNotice('Correo enviado. Abre el enlace y vuelve aquí. Revisa también la carpeta de spam.');
      } else if (await refreshVerification(user)) {
        if (auth.currentUser === user) onVerified();
      } else setError('Tu correo aún no está verificado. Abre el enlace recibido y vuelve a comprobarlo.');
    } catch (error) { setError(authErrorMessage(error, 'email')); }
    finally { setPendingAction(null); }
  };
  return <main className="entry-page email-verification">
    {error && <ModalFrame labelledBy="verification-error-title" onClose={() => setError('')}>
      <section className="entry-error-notification">
        <div className="entry-error-heading">
          <CircleAlert size={24} aria-hidden="true"/>
          <h2 id="verification-error-title">No hemos podido continuar</h2>
        </div>
        <div className="entry-error-message" role="alert"><p>{error}</p></div>
        <button className="touch-btn touch-btn-primary" onClick={() => setError('')}>Volver</button>
      </section>
    </ModalFrame>}
    <header className="entry-header"><Brand/></header>
    <div className="verification-layout">
    <section className="verification-card" aria-labelledby="verification-title">
      <header className="verification-heading">
        <div className="verification-title-row"><Mail size={24} aria-hidden="true"/><h1 id="verification-title">Verifica tu correo</h1></div>
        <p>Un último paso para abrir tu espacio.</p>
      </header>
      <div className="verification-body">
        <p>Abre el enlace de verificación de tu correo <strong data-selectable="true">{user.email}</strong>. Revisa también la carpeta de spam.</p>
        <div className="verification-actions">
          <button className="touch-btn touch-btn-primary" disabled={busy || signingOut || initialDelivery === 'sending'} onClick={() => act(true)} aria-busy={pendingAction === 'send'}>{pendingAction === 'send' ? 'Enviando…' : 'Reenviar'}</button>
          <button className="email-text-button" disabled={busy || signingOut} onClick={() => act(false)} aria-busy={pendingAction === 'check'}>{pendingAction === 'check' ? 'Comprobando…' : 'Ya he verificado mi correo'}</button>
        </div>
        {notice && <p className="email-feedback" role="status">{notice}</p>}
        {!notice && !error && initialDelivery === 'sending' && <p className="email-feedback" role="status">Enviando el correo de verificación…</p>}
        {!notice && !error && initialDelivery === 'sent' && <p className="email-feedback" role="status">Correo de verificación enviado.</p>}
        {!sent && !notice && !error && initialDelivery === 'failed' && <p className="email-feedback" role="alert">Tu cuenta está creada, pero no hemos podido enviar el correo. Pulsa Reenviar para intentarlo de nuevo.</p>}
        {externalError && <p className="email-feedback" role="alert">{externalError}</p>}
        <footer className="verification-footer">
          <button className="email-text-button" disabled={busy || signingOut} onClick={onSignOut}>Cerrar sesión</button>
        </footer>
      </div>
    </section>
    </div>
  </main>;
}
