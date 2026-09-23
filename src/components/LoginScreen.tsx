import { useEffect, useRef, useState } from 'react';
import { HeaderIllustration } from './HeaderIllustration';
import { ProductInformation } from './ProductInformation';

export function LoginScreen({ onSignIn, busy, error }: { onSignIn: (professional: boolean) => void; busy: boolean; error: string }) {
  const [professional, setProfessional] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const changedMode = useRef(false);
  useEffect(() => {
    if (changedMode.current) titleRef.current?.focus();
  }, [professional]);

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
    <button className="google-login-button" onClick={() => onSignIn(professional)} disabled={busy} aria-describedby={professional ? undefined : 'login-disclaimer'}><span className="google-login-mark" aria-hidden="true">G</span>{busy ? 'Conectando con Google…' : 'Continuar con Google'}</button>
    {error && <p className="entry-note" role="alert">{error}</p>}
    {!professional && <p id="login-disclaimer" className="entry-note">Tu progreso, contigo en cada dispositivo.</p>}
  </div>;

  return <main className={`login-screen${professional ? ' login-screen-professional' : ''}`}>
    <div className="login-brand"><img src={`${import.meta.env.BASE_URL}brand/neuroia-mark.svg`} alt="" width="40" height="40" /><span>Neuro<strong>IA</strong></span></div>
    <section className="login-card" aria-labelledby="login-title">
      {professional ? [actions, illustration] : [illustration, actions]}
    </section>
    <ProductInformation>
      <button disabled={busy} onClick={() => { changedMode.current = true; setProfessional(value => !value); }}>{professional ? 'Volver al acceso personal' : '¿Eres un profesional?'}</button>
    </ProductInformation>
  </main>;
}
