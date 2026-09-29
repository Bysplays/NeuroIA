import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Brand } from "./Brand";
import { PracticeMotif } from "./PracticeMotif";
import { HeaderIllustration } from "./HeaderIllustration";
import { ProductInformation } from "./ProductInformation";
import { ProjectFunding } from "./ProjectFunding";
import { authErrorMessage } from "../services/authErrors";
import type { EmailAction } from "../services/emailAuth";

export function LoginScreen({
  onSignIn,
  onEmail,
  onClearError,
  busy,
  error,
}: {
  onSignIn: (professional: boolean) => void;
  onEmail: (
    action: EmailAction,
    email: string,
    password: string,
    professional: boolean,
  ) => Promise<void>;
  onClearError: () => void;
  busy: boolean;
  error: string;
}) {
  const [professional, setProfessional] = useState(false);
  const [mode, setMode] = useState<EmailAction | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [mode, professional]);
  const changeMode = (next: EmailAction | null) => {
    setMode(next);
    setPassword("");
    setConfirmation("");
    setFormError("");
    setNotice("");
    onClearError();
  };
  const submit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !mode) return;
    setFormError("");
    setNotice("");
    onClearError();
    if (mode === "register" && password !== confirmation) {
      setFormError("Las contraseñas no coinciden.");
      return;
    }
    try {
      await onEmail(mode, email, password, professional);
      setPassword("");
      setConfirmation("");
      if (mode === "reset")
        setNotice(
          "Si hay una cuenta con ese correo, recibirás un enlace para recuperar la contraseña. Revisa también la carpeta de spam.",
        );
    } catch (cause) {
      setFormError(authErrorMessage(cause, "email"));
    }
  };
  return (
    <main className="entry-page">
      <header className="entry-header">
        <button
          className="brand-button"
          aria-label="NeuroIA, presentación"
          disabled={busy}
          onClick={() => changeMode(null)}
        >
          <Brand />
        </button>
        <div className="entry-header-actions">
          <button
            className="text-link"
            disabled={busy}
            onClick={() => changeMode("signin")}
          >
            Iniciar sesión
          </button>
          {mode !== null && (
            <button
              className="paper-nav-button"
              disabled={busy}
              onClick={() => changeMode("register")}
            >
              Crear cuenta
            </button>
          )}
        </div>
      </header>
      {mode === null ? (
        <>
          <section className="public-hero" aria-labelledby="entry-title">
            <div>
              <h1 ref={title} tabIndex={-1} id="entry-title">
                {professional ? (
                  <>
                    Un espacio para <em>acompañar.</em>
                  </>
                ) : (
                  <>
                    Juega a <em>tu ritmo.</em>
                  </>
                )}
              </h1>
              <p>
                {professional
                  ? "Propón juegos y consulta la actividad de las personas vinculadas contigo."
                  : "Juegos para practicar memoria, atención y coordinación."}
              </p>
              <div className="public-actions">
                <button
                  className="touch-btn touch-btn-primary"
                  disabled={busy}
                  onClick={() => changeMode("register")}
                >
                  Crear mi cuenta
                  <ArrowRight size={21} />
                </button>
              </div>
              <button
                className="entry-purchase-link"
                disabled={busy}
                onClick={() => {
                  changeMode("register");
                  setNotice(
                    "Después de entrar podrás elegir suscripción o prueba gratuita, antes de jugar.",
                  );
                }}
              >
                Quiero suscribirme
              </button>
            </div>
            <div className="public-art">
              <PracticeMotif />
            </div>
          </section>
          <ProjectFunding />
        </>
      ) : (
        <section className="account-entry-layout" aria-labelledby="entry-title">
          <aside className="account-entry-welcome">
            <p className="editorial-eyebrow">
              {professional
                ? "Tu espacio profesional"
                : "Un comienzo a tu medida"}
            </p>
            <h2>
              Empieza por
              <br />
              un pequeño
              <br />
              <em>momento.</em>
            </h2>
            <HeaderIllustration scene={professional ? "therapist" : "home"} />
          </aside>
          <div className="account-entry-form">
            <button
              className="text-link"
              disabled={busy}
              onClick={() => changeMode(null)}
            >
              <ArrowLeft size={18} />
              Volver
            </button>
            <div
              className="entry-mode-switch"
              role="group"
              aria-label="Tipo de acceso"
            >
              <button
                aria-pressed={mode === "register"}
                disabled={busy}
                onClick={() => changeMode("register")}
              >
                Crear cuenta
              </button>
              <button
                aria-pressed={mode === "signin"}
                disabled={busy}
                onClick={() => changeMode("signin")}
              >
                Iniciar sesión
              </button>
            </div>
            <h1 ref={title} tabIndex={-1} id="entry-title">
              {mode === "register"
                ? "Un buen comienzo."
                : mode === "reset"
                  ? "Volvamos a tu cuenta."
                  : "Qué bien verte de nuevo."}
            </h1>
            <p>
              {mode === "reset"
                ? "Te enviaremos un enlace para recuperar tu contraseña."
                : "Elige cómo quieres entrar."}
            </p>
            {mode !== "reset" && (
              <>
                <button
                  className="google-login-button"
                  disabled={busy}
                  onClick={() => onSignIn(professional)}
                >
                  <span className="google-login-mark" aria-hidden="true">
                    G
                  </span>
                  {busy ? "Un momento…" : "Continuar con Google"}
                </button>
                <div className="entry-divider">
                  <span>o con tu correo</span>
                </div>
              </>
            )}
            <form className="email-form" onSubmit={submit} aria-busy={busy}>
              <label htmlFor="login-email">Correo electrónico</label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={busy}
              />
              {mode !== "reset" && (
                <>
                  <label htmlFor="login-password">Contraseña</label>
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete={
                      mode === "register" ? "new-password" : "current-password"
                    }
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={mode === "register" ? 6 : undefined}
                    disabled={busy}
                    aria-describedby={
                      mode === "register" ? "password-hint" : undefined
                    }
                  />
                </>
              )}
              {mode === "register" && (
                <>
                  <p id="password-hint" className="entry-note">
                    Al menos 6 caracteres. Después verificaremos tu correo.
                  </p>
                  <label htmlFor="login-confirmation">
                    Repite la contraseña
                  </label>
                  <input
                    id="login-confirmation"
                    name="confirmation"
                    type="password"
                    autoComplete="new-password"
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    required
                    disabled={busy}
                  />
                </>
              )}
              <button
                className="touch-btn touch-btn-primary"
                disabled={busy}
                type="submit"
              >
                {busy
                  ? "Un momento…"
                  : mode === "register"
                    ? "Crear cuenta"
                    : mode === "reset"
                      ? "Enviar enlace"
                      : "Entrar"}
                <ArrowRight size={20} />
              </button>
              {mode === "signin" && (
                <button
                  className="email-text-button"
                  type="button"
                  disabled={busy}
                  onClick={() => changeMode("reset")}
                >
                  He olvidado mi contraseña
                </button>
              )}
              {mode === "reset" && (
                <button
                  className="email-text-button"
                  type="button"
                  disabled={busy}
                  onClick={() => changeMode("signin")}
                >
                  Volver a iniciar sesión
                </button>
              )}
              {(error || formError) && (
                <p className="email-feedback" role="alert">
                  {formError || error}
                </p>
              )}
              {notice && (
                <p className="email-feedback" role="status">
                  {notice}
                </p>
              )}
            </form>
          </div>
        </section>
      )}
      <ProductInformation>
        <button
          disabled={busy}
          onClick={() => {
            setProfessional((value) => !value);
            changeMode(null);
          }}
        >
          {professional ? "Volver al acceso personal" : "¿Eres un profesional?"}
        </button>
      </ProductInformation>
    </main>
  );
}
