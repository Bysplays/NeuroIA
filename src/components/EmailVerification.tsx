import { Brand } from './Brand';
import { useState } from 'react';
import { Mail } from 'lucide-react';
import type { User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { refreshVerification, sendVerification } from '../services/emailAuth';
import { authErrorMessage } from '../services/authErrors';

export function EmailVerification({ user, onVerified, onSignOut, signingOut, externalError }: {
  user: User; onVerified: () => void; onSignOut: () => void; signingOut: boolean; externalError: string;
}) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const act = async (send: boolean) => {
    if (busy || signingOut) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (send) {
        await sendVerification(user);
        setSent(true);
        setNotice('Correo enviado. Abre el enlace y vuelve aquí. Revisa también la carpeta de spam.');
      } else if (await refreshVerification(user)) {
        if (auth.currentUser === user) onVerified();
      } else setNotice('Tu correo aún no está verificado. Abre el enlace recibido y vuelve a comprobarlo.');
    } catch (error) { setError(authErrorMessage(error, 'email')); }
    finally { setBusy(false); }
  };
  return <main className="entry-page email-verification">
    <header className="entry-header"><Brand/></header>
    <div className="verification-layout">
    <section className="verification-card" aria-labelledby="verification-title">
      <header className="verification-heading">
        <div className="verification-title-row"><Mail size={24} aria-hidden="true"/><h1 id="verification-title">Verifica tu correo</h1></div>
        <p>Un último paso para abrir tu espacio.</p>
      </header>
      <div className="verification-body">
        <p>Te enviaremos un enlace de verificación a <strong data-selectable="true">{user.email}</strong>.</p>
        <div className="verification-actions">
          <button className="touch-btn touch-btn-primary" disabled={busy || signingOut} onClick={() => act(true)}>{sent ? 'Reenviar correo' : 'Enviar correo'}</button>
          <button className="email-text-button" disabled={busy || signingOut} onClick={() => act(false)}>Ya he verificado mi correo</button>
        </div>
        {busy && <p className="entry-note" role="status">Un momento…</p>}
        {notice && <p className="email-feedback" role="status">{notice}</p>}
        {(error || externalError) && <p className="email-feedback" role="alert">{error || externalError}</p>}
        <footer className="verification-footer">
          <button className="email-text-button" disabled={busy || signingOut} onClick={onSignOut}>Cerrar sesión</button>
        </footer>
      </div>
    </section>
    </div>
  </main>;
}
