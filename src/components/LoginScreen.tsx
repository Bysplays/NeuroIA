import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CircleAlert } from "lucide-react";
import { ModalFrame } from "./ModalFrame";
import { Brand } from "./Brand";
import { PracticeMotif } from "./PracticeMotif";
import { ProductInformation } from "./ProductInformation";
import { InformationPage, type InformationKind } from "./InformationPage";
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
  const [information, setInformation] = useState<InformationKind | null>(null);
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
    <>
      {(error || formError) && (
        <ModalFrame labelledBy="entry-error-title" onClose={() => { setFormError(""); onClearError(); }}>
          <section className="entry-error-notification">
            <CircleAlert size={30} aria-hidden="true" />
            <h2 id="entry-error-title">No hemos podido continuar</h2>
            <div className="entry-error-message" role="alert">
              {(formError || error).split(/(?<=Google\.)\s+/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>
            <button className="touch-btn touch-btn-primary" onClick={() => { setFormError(""); onClearError(); }}>Volver al formulario</button>
          </section>
        </ModalFrame>
      )}
      {information && (
        <InformationPage
          kind={information}
          onBack={() => setInformation(null)}
        />
      )}
      <div hidden={information !== null}>
        <main className={`entry-page${mode === null ? " entry-home" : " entry-auth"}`}>
          <header className="entry-header">
            <button
              className="brand-button"
              aria-label="NeuroIA, presentación"
              disabled={busy}
              onClick={() => changeMode(null)}
            >
              <Brand />
            </button>
            {mode !== null && (
              <button className="text-link" disabled={busy} onClick={() => changeMode(mode === "reset" ? "signin" : null)}>
                <ArrowLeft size={18} /> Volver
              </button>
            )}
          </header>
          {mode === null ? (
            <>
              <section className="public-hero" aria-labelledby="entry-title">
                <div className="public-copy">
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
                      ? "Gestiona perfiles de varios jugadores"
                      : "Practica memoria, atención y coordinación"}
                  </p>
                  <div className="public-actions">
                    <button
                      className="touch-btn touch-btn-primary"
                      disabled={busy}
                      onClick={() => changeMode("signin")}
                    >
                      Comenzar
                      <ArrowRight size={21} />
                    </button>
                    <button
                      className="entry-funding-link"
                      data-information-link="funding"
                      onClick={() => setInformation("funding")}
                    >
                      Financiado por IGAPE
                    </button>
                  </div>
                </div>
                <div className="public-art">
                  <PracticeMotif />
                </div>
              </section>
            </>
          ) : (
            <section
              className="account-entry-layout"
              aria-labelledby="entry-title"
            >
              <div className={`account-entry-form${mode !== "reset" ? " account-entry-tabbed" : ""}`}>
                {mode !== "reset" && <div
                  className="entry-mode-switch"
                  role="group"
                  aria-label="Tipo de acceso"
                >
                  <button aria-pressed={mode === "signin"} disabled={busy} onClick={() => changeMode("signin")}>Iniciar sesión</button>
                  <button aria-pressed={mode === "register"} disabled={busy} onClick={() => changeMode("register")}>Crear cuenta</button>
                </div>}
                <h1 className={mode === "register" ? "entry-title-with-space" : undefined} ref={title} tabIndex={-1} id="entry-title">
                  {mode === "register"
                    ? "Crea tu cuenta"
                    : mode === "reset"
                      ? "Recupera tu contraseña"
                      : "Te damos la bienvenida"}
                </h1>
                {mode !== "register" && <p>
                  {mode === "reset"
                    ? "Te enviaremos un enlace para recuperar tu contraseña."
                    : professional ? "Accede a tu espacio profesional." : "Entra para continuar a tu ritmo."}
                </p>}
                {mode === "signin" && (
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
                  <div className="entry-field">
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
                  </div>
                  {mode !== "reset" && (
                    <div className="entry-field">
                      <label htmlFor="login-password">Contraseña</label>
                      <input
                        id="login-password"
                        name="password"
                        type="password"
                        autoComplete={
                          mode === "register"
                            ? "new-password"
                            : "current-password"
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
                    </div>
                  )}
                  {mode === "register" && (
                    <div className="entry-field">
                      <label htmlFor="login-confirmation">
                        Repite la contraseña
                      </label>
                      <input
                        id="login-confirmation"
                        name="confirmation"
                        aria-describedby="password-hint"
                        type="password"
                        autoComplete="new-password"
                        value={confirmation}
                        onChange={(event) =>
                          setConfirmation(event.target.value)
                        }
                        required
                        disabled={busy}
                      />
                      <p id="password-hint" className="entry-note">
                        Al menos 6 caracteres. Después verificaremos tu correo.
                      </p>
                    </div>
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
                  {mode === "register" && (
                    <p className="entry-provider-note">
                      Las cuentas de terceros no necesitan registro.<br />Accede desde «Iniciar sesión».
                    </p>
                  )}
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
                  {notice && (
                    <p className="email-feedback" role="status">
                      {notice}
                    </p>
                  )}
                </form>
              </div>
            </section>
          )}
          <ProductInformation onOpen={setInformation}>
            <button
              disabled={busy}
              onClick={() => {
                setProfessional((value) => !value);
                changeMode(null);
              }}
            >
              {professional
                ? "Volver al acceso personal"
                : "¿Eres un profesional?"}
            </button>
          </ProductInformation>
        </main>
      </div>
    </>
  );
}
