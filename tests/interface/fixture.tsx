import { InformationPage, type InformationKind } from "../../src/components/InformationPage";
// Browser-only fixture. No production entry imports this file, no authenticated writes.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Header } from "../../src/components/Header";
import { Dashboard } from "../../src/components/Dashboard";
import { LoginScreen } from "../../src/components/LoginScreen";
import { ConnectionRecovery } from "../../src/components/ConnectionRecovery";
import { EmailVerification } from "../../src/components/EmailVerification";
import { AppLoading } from "../../src/components/AppLoading";
import type { User } from "firebase/auth";
import { GameSession } from "../../src/components/GameSession";
import { GameExercise } from "../../src/components/GameExercise";
import { AccessibilityModal } from "../../src/components/AccessibilityModal";
import { ProductInformation } from "../../src/components/ProductInformation";
import { getInitialProfile } from "../../src/services/storageService";
import { applyAppearance } from "../../src/services/appearance";
import { soundService } from "../../src/services/soundService";
import { getExercisesForDomain } from "../../src/services/exerciseCatalog";
import type { ExerciseId, ExerciseResult } from "../../src/types";
import "../../src/index.css";
import "../../src/interface.css";
import "../../src/games.css";
const query = new URLSearchParams(location.search);
soundService.setSoundEnabled(false);
soundService.speak = (_text, end) => {
  queueMicrotask(() => end?.());
  return false;
};
export function Fixture() {
  const [profile, setProfile] = useState(() => {
    const p = getInitialProfile();
    p.name = "Lucía";
    p.settings.fontSize = query.has("large") ? "xlarge" : "normal";
    p.settings.contrast = query.has("contrast") ? "high-contrast" : "standard";
    p.settings.showCompanions = !query.has("hidden");
    applyAppearance(p.settings);
    return p;
  });
  const [game, setGame] = useState<ExerciseId | undefined>(
    (query.get("game") as ExerciseId) || undefined,
  );
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [information, setInformation] = useState<InformationKind | null>(null);
  const [settings, setSettings] = useState(false);
  const [navigation, setNavigation] = useState<HTMLDivElement | null>(null);
  const [authError, setAuthError] = useState("");
  const [dashboardTab, setDashboardTab] = useState("today");
  const [loggedOut, setLoggedOut] = useState(query.has("entry"));
  const back = () => setGame(undefined);
  if (query.has("loading")) return <AppLoading/>;
  if (query.has("verification") && !loggedOut) return <EmailVerification initialDelivery={query.has("sending") ? "sending" : query.has("delivery-failed") ? "failed" : "sent"} user={{ email: 'una.direccion.larga.de.prueba@example.com' } as User} onVerified={() => setLoggedOut(true)} onSignOut={() => setLoggedOut(true)} signingOut={false} externalError={query.has('error') ? 'No hemos podido enviar el correo. Vuelve a intentarlo.' : ''}/>;
  if (query.has("connection-error") && !loggedOut) return <ConnectionRecovery onRetry={() => setLoggedOut(true)} onSignOut={() => setLoggedOut(true)}/>;
  if (loggedOut)
    return (
      <LoginScreen
        busy={false}
        error={authError}
        onClearError={() => setAuthError("")}
        onEmail={async () => { if (query.has("auth-failure")) throw { code: "auth/invalid-credential" }; }}
        onSignIn={() => { if (query.has("auth-failure")) setAuthError("No se ha completado el acceso con Google. Si la ventana se cierra sola, abre esta página en tu navegador habitual, como Safari o Chrome, y vuelve a intentarlo."); }}
      />
    );
  return (
    <>
      {information && <InformationPage kind={information} onBack={() => setInformation(null)}/>}
      <div hidden={information !== null}>
      {game ? (
        <GameSession
          key={game}
          id={game}
          onBack={back}
          onSettings={() => setSettings(true)}
          paused={settings}
          initialLevel={Number(query.get("level") || 1)}
          mode={query.has("placement") ? "placement" : "normal"}
          autoStart={query.has("placement")}
        >
          <GameExercise
            id={game}
            profile={profile}
            onBack={back}
            onSaveResult={(result) => setResults((value) => [...value, result])}
          />
        </GameSession>
      ) : (
        <>
          <Header
            profile={profile}
            sessionMinutes={0}
            activeView="dashboard"
            onNavigate={() => { back(); setDashboardTab("today"); }}
            navigationRef={setNavigation}
            onOpenAccessibility={() => setSettings(true)}
            onOpenFatigueAlert={() => {}}
            onSignOut={() => setLoggedOut(true)}
            signingOut={false}
          />
          <Dashboard
            selectedTab={dashboardTab} onTabChange={setDashboardTab}
            uid="isolated-interface-fixture"
            profile={profile}
            history={results}
            navigationTarget={navigation}
            onSelectDomain={(domain) =>
              setGame(getExercisesForDomain(domain)[0].id)
            }
            onSelectExercise={setGame}
            onStartDailyPlan={(queue) => setGame(queue?.[0])}
            onOpenSettings={() => setSettings(true)}
            onSignOut={() => setLoggedOut(true)}
            signingOut={false}
          />
          <ProductInformation onOpen={setInformation}/>
        </>
      )}
      <AccessibilityModal onInformation={setInformation}
        isOpen={settings && information === null}
        settings={profile.settings}
        name={profile.name}
        showSubscription={false}
        onUpdateName={(name) => setProfile({ ...profile, name })}
        onClose={() => setSettings(false)}
        onUpdateSettings={(patch) => {
          const next = { ...profile.settings, ...patch };
          applyAppearance(next);
          setProfile({ ...profile, settings: next });
        }}
        onSignOut={() => setLoggedOut(true)}
        signingOut={false}
      />
      <output data-testid="results" hidden>
        {JSON.stringify(results)}
      </output>
      </div>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
