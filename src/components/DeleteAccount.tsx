import { useState } from 'react';
import { EmailAuthProvider, GoogleAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, signOut } from 'firebase/auth';
import { Trash2, X } from 'lucide-react';
import { ModalFrame } from './ModalFrame';
import { auth } from '../services/firebase';
import { billingRequest, accessService } from '../services/accessService';
import { StorageService } from '../services/storageService';
import { authErrorMessage } from '../services/authErrors';

type Eligibility = { allowed?: boolean; accepted?: boolean; reason?: 'subscription' | 'pending'; professional?: boolean; message?: string };
export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<Eligibility | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const user = auth.currentUser;
  const google = user?.providerData.some(provider => provider.providerId === 'google.com');
  const close = () => { if (!busy) { setOpen(false); setPassword(''); setConfirmation(''); setError(''); } };
  const check = async () => {
    setOpen(true); setState(null); setBusy(true); setError('');
    try { setState(await billingRequest<Eligibility>('/account/deletion-status')); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No hemos podido comprobar tu cuenta.'); }
    finally { setBusy(false); }
  };
  const manage = async () => {
    setBusy(true); setError('');
    try {
      if (state?.reason === 'pending') { if (state.professional) await billingRequest('/professional/cancel-checkout'); else await accessService.cancelCheckout(); await check(); }
      else window.location.assign((await billingRequest(state?.professional ? '/professional/portal' : '/portal')).url);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No hemos podido abrir tu suscripción.'); }
    finally { setBusy(false); }
  };
  const remove = async (event: React.SubmitEvent) => {
    event.preventDefault();
    if (busy || confirmation !== 'ELIMINAR MI CUENTA' || !user?.email) return;
    setBusy(true); setError('');
    try {
      if (google) await reauthenticateWithPopup(user, new GoogleAuthProvider());
      else await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
      await user.getIdToken(true);
      const result = await billingRequest<Eligibility>('/account/delete', { confirmation });
      if (!result.accepted) { setState(result); return; }
      // Stop authenticated progress writers before clearing this device's cache.
      await signOut(auth);
      StorageService.forgetAccount(user.uid);
    } catch (reason) {
      setError(reason && typeof reason === 'object' && 'code' in reason && String(reason.code).startsWith('auth/') ? authErrorMessage(reason) : reason instanceof Error ? reason.message : 'No hemos podido solicitar el borrado. Inténtalo de nuevo.');
    } finally { setPassword(''); setBusy(false); }
  };
  return <section className="preferences-section" aria-labelledby="delete-account-section">
    <div className="preferences-action-row">
      <div><h3 id="delete-account-section">Eliminar cuenta</h3><p>Borra tu cuenta y tus datos de NeuroIA.</p></div>
      <button className="subscription-upgrade preferences-action-button account-delete-trigger" onClick={check}>Borrar cuenta</button>
    </div>
    {open && <ModalFrame onClose={close} labelledBy="delete-account-title">
      <div className="entry-error-notification account-delete-dialog" aria-busy={busy}>
        <header className="account-delete-heading"><h2 id="delete-account-title"><Trash2 size={22} aria-hidden="true"/>Borrar cuenta</h2><button className="preferences-close" onClick={close} disabled={busy} aria-label="Cerrar"><X size={18}/></button></header>
        {busy && !state && <p role="status">Comprobando tu cuenta…</p>}
        {state?.allowed && <form className="email-form" onSubmit={remove}>
          <p>Se eliminarán tu perfil, tus partidas y tus vínculos con profesionales. Esta acción no se puede deshacer.</p>
          <p>Si ya usaste la prueba gratuita, conservaremos un identificador protegido y su fecha de inicio.<br/>Si vuelves a crear la cuenta con el mismo correo, podrás recuperar el tiempo restante, sin ampliarlo.</p>
          <label htmlFor="delete-confirmation">Escribe <span className="account-delete-phrase">ELIMINAR MI CUENTA</span></label>
          <input id="delete-confirmation" autoComplete="off" value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={busy}/>
          {!google && <><label htmlFor="delete-password">Tu contraseña</label><input id="delete-password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} disabled={busy}/></>}
          {google && <p className="entry-note">Confirmarás tu identidad con Google antes de borrar la cuenta.</p>}
          <button className="touch-btn touch-btn-primary" disabled={busy || confirmation !== 'ELIMINAR MI CUENTA' || (!google && !password)}>{busy ? 'Solicitando borrado…' : 'Borrar mi cuenta'}</button>
        </form>}
        {state && !state.allowed && <><p>{state.reason === 'pending' ? state.message : 'Antes de borrar tu cuenta, cancela tus suscripciones en Stripe y espera a que termine su periodo vigente. La prueba gratuita y las invitaciones no impiden borrar la cuenta.'}</p><button className="touch-btn touch-btn-primary" disabled={busy} onClick={manage}>{busy ? 'Un momento…' : state.reason === 'pending' ? 'Cancelar pago pendiente' : 'Gestionar suscripción'}</button><button className="text-link" disabled={busy} onClick={check}>Volver a comprobar</button></>}
        {error && <p role="alert">{error}</p>}
        {error && !state && <button className="paper-nav-button" disabled={busy} onClick={check}>Reintentar</button>}
      </div>
    </ModalFrame>}
  </section>;
}
