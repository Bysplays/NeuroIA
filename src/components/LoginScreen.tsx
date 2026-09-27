import { useEffect, useRef, useState } from 'react';
import { Mail, X } from 'lucide-react';
import { ModalFrame } from './ModalFrame';
import { usePortrait } from '../services/orientation';
import { HeaderIllustration } from './HeaderIllustration';
import { ProductInformation } from './ProductInformation';
import { authErrorMessage } from '../services/authErrors';
import type { EmailAction } from '../services/emailAuth';

export function LoginScreen({ onSignIn, onEmail, onClearError, busy, error }: {
  onSignIn: (professional: boolean) => void;
  onEmail: (action: EmailAction, email: string, password: string, professional: boolean) => Promise<void>;
  onClearError: () => void; busy: boolean; error: string;
}) {
  const portrait = usePortrait();
  const [professional, setProfessional] = useState(false);
  const [mode, setMode] = useState<EmailAction | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const formTitleRef = useRef<HTMLHeadingElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const changedMode = useRef(false);
  useEffect(() => {
    if (changedMode.current) titleRef.current?.focus();
  }, [professional]);
  useEffect(() => {
    if (!mode || portrait) return;
    const frame = requestAnimationFrame(() => {
      formTitleRef.current?.focus({ preventScroll: true });
      formTitleRef.current?.closest('dialog')?.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [mode, portrait]);
  const changeMode = (next: EmailAction | null) => {
    setMode(next); setPassword(''); setConfirmation(''); setFormError(''); setNotice(''); onClearError();
  };
  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !mode) return;
    setFormError(''); setNotice(''); onClearError();
    if (mode === 'register' && password !== confirmation) { setFormError('Las contraseñas no coinciden.'); return; }
    try {
      await onEmail(mode, email, password, professional);
      setPassword(''); setConfirmation('');
      if (mode === 'reset') setNotice('Si hay una cuenta con ese correo, recibirás un enlace para recuperar la contraseña. Revisa también la carpeta de spam.');
    } catch (error) { setFormError(authErrorMessage(error, 'email')); }
  };

  const illustration = <div className="login-welcome" key="illustration">
    <svg className="login-paper-edge" viewBox="0 0 64 400" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M38 0 C-12 100 76 155 30 245 C4 300 12 350 38 400 H64 V0 Z" fill="currentColor" opacity=".35" transform="translate(-10 0)" />
      <path d="M38 0 C-12 100 76 155 30 245 C4 300 12 350 38 400 H64 V0 Z" fill="currentColor" />
    </svg>
    {professional
      ? <HeaderIllustration scene="therapist" className="login-art login-professional-art" />
      : <img src={`${import.meta.env.BASE_URL}images/headers/login-transparent.png`} className="login-art" alt="" aria-hidden="true" width="512" height="512" />}
  </div>;
  const actions = <div className="login-actions" key="actions">
    {professional && <p className="login-audience">Para profesionales</p>}
    <h1 id="login-title" ref={titleRef} tabIndex={-1}>{professional ? 'Acompaña la práctica de otras personas' : 'Jugar también puede ser una forma de entrenar'}</h1>
    <div className="login-options">
      <button className="google-login-button" onClick={() => onSignIn(professional)} disabled={busy} aria-describedby={professional ? undefined : 'login-disclaimer'}><span className="google-login-mark" aria-hidden="true">G</span>{busy && !mode ? 'Conectando con Google…' : 'Continuar con Google'}</button>
      <button className="google-login-button email-entry-button" disabled={busy} onClick={() => changeMode('signin')}><Mail size={22} aria-hidden="true" />Continuar con correo</button>
    </div>
    {error && !mode && <p className="entry-note" role="alert">{error}</p>}
    {!professional && <p id="login-disclaimer" className="entry-note">Tu progreso, contigo en cada dispositivo.</p>}
  </div>;

  return <main className={`login-screen${professional ? ' login-screen-professional' : ''}`}>
    <div className="login-brand"><img src={`${import.meta.env.BASE_URL}brand/neuroia-mark.svg`} alt="" width="40" height="40" /><span>Neuro<strong>IA</strong></span></div>
    <section className="login-card" aria-labelledby="login-title">
      {professional ? [actions, illustration] : [illustration, actions]}
    </section>
    {mode && !portrait && <ModalFrame labelledBy="email-form-title" onClose={() => { if (!busy) changeMode(null); }}>
      <section className="email-login-dialog">
        <header className="email-login-heading">
          <span className="email-login-icon" aria-hidden="true"><Mail size={26} /></span>
          <button className="email-login-close" type="button" aria-label="Cerrar acceso por correo" disabled={busy} onClick={() => changeMode(null)}><X size={22} aria-hidden="true" /></button>
          <h2 id="email-form-title" tabIndex={-1} ref={formTitleRef}>{mode === 'register' ? 'Crear tu cuenta' : mode === 'reset' ? 'Recuperar contraseña' : 'Entrar con correo'}</h2>
          <p>{mode === 'register' ? 'Un pequeño paso para empezar a jugar.' : mode === 'reset' ? 'Te ayudamos a volver a tu cuenta.' : 'Tu espacio para seguir entrenando.'}</p>
        </header>
        <form className="email-form email-login-form" onSubmit={submit} aria-labelledby="email-form-title" aria-busy={busy}>
          <label htmlFor="login-email">Correo electrónico</label>
          <input id="login-email" name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} value={email} onChange={event => setEmail(event.target.value)} required disabled={busy} />
          {mode !== 'reset' && <>
            <label htmlFor="login-password">Contraseña</label>
            <input id="login-password" name="password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} required minLength={mode === 'register' ? 6 : undefined} disabled={busy} aria-describedby={mode === 'register' ? 'password-hint' : undefined} />
          </>}
          {mode === 'register' && <>
            <p id="password-hint" className="entry-note">Al menos 6 caracteres. Después verificaremos tu correo.</p>
            <label htmlFor="login-confirmation">Repite la contraseña</label>
            <input id="login-confirmation" name="confirmation" type="password" autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} required disabled={busy} />
          </>}
          <button className="touch-btn touch-btn-primary" disabled={busy} type="submit">{busy ? 'Un momento…' : mode === 'register' ? 'Crear cuenta' : mode === 'reset' ? 'Enviar enlace' : 'Entrar'}</button>
          {mode === 'signin' && <>
            <button className="email-text-button" type="button" disabled={busy} onClick={() => changeMode('reset')}>He olvidado mi contraseña</button>
            <button className="email-text-button" type="button" disabled={busy} onClick={() => changeMode('register')}>Crear una cuenta</button>
          </>}
          {mode !== 'signin' && <button className="email-text-button" type="button" disabled={busy} onClick={() => changeMode('signin')}>Ya tengo cuenta: entrar</button>}
          {(error || formError) && <p className="email-feedback" role="alert">{formError || error}</p>}
          {notice && <p className="email-feedback" role="status">{notice}</p>}
        </form>
      </section>
    </ModalFrame>}
    <ProductInformation>
      <button disabled={busy} onClick={() => { changedMode.current = true; setProfessional(value => !value); changeMode(null); }}>{professional ? 'Volver al acceso personal' : '¿Eres un profesional?'}</button>
    </ProductInformation>
  </main>;
}
