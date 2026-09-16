export function LoginScreen({ onSignIn, busy, error }: { onSignIn: () => void; busy: boolean; error: string }) {
  return <main className="login-screen">
    <div className="login-brand"><img src={`${import.meta.env.BASE_URL}brand/neuroia-mark.svg`} alt="" width="40" height="40" /><span>Neuro<strong>IA</strong></span></div>
    <section className="login-card" aria-labelledby="login-title">
      <div className="login-welcome">
        <svg className="login-paper-edge" viewBox="0 0 64 400" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path d="M38 0 C-12 100 76 155 30 245 C4 300 12 350 38 400 H64 V0 Z" fill="currentColor" opacity=".35" transform="translate(-10 0)" />
          <path d="M38 0 C-12 100 76 155 30 245 C4 300 12 350 38 400 H64 V0 Z" fill="currentColor" />
        </svg>
        <img src={`${import.meta.env.BASE_URL}images/headers/login-transparent.png`} className="login-art" alt="" aria-hidden="true" width="512" height="512" />
      </div>
      <div className="login-actions">
        <h1 id="login-title">Tu espacio, a tu ritmo</h1>
        <button className="google-login-button" onClick={onSignIn} disabled={busy} aria-describedby="login-disclaimer"><span className="google-login-mark" aria-hidden="true">G</span>{busy ? 'Conectando con Google…' : 'Continuar con Google'}</button>
        {error && <p className="entry-note" role="alert">{error}</p>}
        <p id="login-disclaimer" className="entry-note">Tu progreso, contigo en cada dispositivo.</p>
      </div>
    </section>
  </main>;
}
