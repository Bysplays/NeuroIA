import { useState } from 'react';
import { GoogleAuthProvider, reauthenticateWithPopup } from 'firebase/auth';
import { auth } from '../services/firebase';
import { addPassword, submitEmailAuth } from '../services/emailAuth';
import { authErrorMessage } from '../services/authErrors';

export function AccountPassword() {
  const user = auth.currentUser;
  const [linked, setLinked] = useState(() => user?.providerData.some(provider => provider.providerId === 'password') ?? false);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [reauth, setReauth] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  if (!user?.email) return null;
  const email = user.email;

  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setError(''); setNotice('');
    if (password !== confirmation) { setError('Las contraseñas no coinciden.'); return; }
    setBusy(true);
    try {
      await addPassword(auth, user, password);
      setLinked(true); setOpen(false); setPassword(''); setConfirmation('');
      setNotice('Contraseña añadida. Puedes entrar con Google o con tu correo y contraseña. Tu progreso sigue en esta cuenta.');
    } catch (error) {
      setReauth(Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'auth/requires-recent-login'));
      setError(authErrorMessage(error, 'email'));
    } finally { setBusy(false); }
  };
  const confirmIdentity = async () => {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ login_hint: email, prompt: 'select_account' });
      await reauthenticateWithPopup(user, provider);
      setReauth(false); setNotice('Identidad confirmada. Ya puedes guardar tu contraseña.');
    } catch (error) { setError(authErrorMessage(error)); }
    finally { setBusy(false); }
  };
  const reset = async () => {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await submitEmailAuth(auth, 'reset', email);
      setNotice('Solicitud confirmada. Revisa tu correo para cambiar la contraseña.');
    } catch (error) { setError(authErrorMessage(error, 'email')); }
    finally { setBusy(false); }
  };
  return <section className="preferences-section account-password" aria-labelledby="account-password-title">
    <div className="account-password-heading">
      <div>
        <h3 id="account-password-title">Acceso a tu cuenta</h3>
        <p>{user.email}</p>
      </div>
      {linked ? <button className="subscription-upgrade" disabled={busy} onClick={reset}>Cambiar contraseña</button>
        : !open && <button className="paper-nav-button" onClick={() => setOpen(true)}>Añadir contraseña</button>}
    </div>
    {!linked && open && <form className="email-form" onSubmit={submit} aria-busy={busy}>
          <p className="entry-note">Podrás entrar con este correo y seguir usando Google. Al menos 6 caracteres.</p>
          <input type="text" name="username" autoComplete="username" value={user.email} readOnly hidden />
          <label htmlFor="account-password">Nueva contraseña</label>
          <input id="account-password" name="password" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={event => setPassword(event.target.value)} disabled={busy} />
          <label htmlFor="account-confirmation">Repite la contraseña</label>
          <input id="account-confirmation" name="confirmation" type="password" autoComplete="new-password" required value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={busy} />
          {reauth ? <button className="paper-nav-button" type="button" disabled={busy} onClick={confirmIdentity}>Confirmar con Google</button>
            : <button className="paper-nav-button" type="submit" disabled={busy}>Guardar contraseña</button>}
          <button className="paper-nav-button" type="button" disabled={busy} onClick={() => { setOpen(false); setPassword(''); setConfirmation(''); setError(''); setNotice(''); setReauth(false); }}>Cancelar</button>
        </form>}
    {busy && <p role="status">Un momento…</p>}
    {notice && <p className="entry-note" role="status">{notice}</p>}
    {error && <p className="entry-note" role="alert">{error}</p>}
  </section>;
}
