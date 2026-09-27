import { useState } from 'react';
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
  return <main className="cloud-entry email-verification">
    <img src={`${import.meta.env.BASE_URL}brand/neuroia-mark.svg`} alt="NeuroIA" width="64" height="64" />
    <h1>Verifica tu correo</h1>
    <p>Antes de abrir tu espacio, necesitamos verificar <strong>{user.email}</strong>.</p>
    <button className="touch-btn touch-btn-primary" disabled={busy || signingOut} onClick={() => act(true)}>{sent ? 'Reenviar correo' : 'Enviar correo de verificación'}</button>
    <button className="paper-nav-button" disabled={busy || signingOut} onClick={() => act(false)}>Ya he verificado mi correo</button>
    {busy && <p role="status">Un momento…</p>}
    {notice && <p role="status">{notice}</p>}
    {(error || externalError) && <p role="alert">{error || externalError}</p>}
    <button className="email-text-button" disabled={busy || signingOut} onClick={onSignOut}>Cerrar sesión</button>
  </main>;
}
