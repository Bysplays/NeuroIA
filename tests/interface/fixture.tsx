import { ProfessionalDashboard } from '../../src/components/ProfessionalDashboard';
import { RecommendationFixture } from './recommendation-fixture';
import { LevelUpScreen } from '../../src/components/LevelUpScreen';
import type { ProgressData } from '../../src/services/progressData';
import { InformationPage, type InformationKind } from "../../src/components/InformationPage";
// Browser-only fixture. No production entry imports this file, no authenticated writes.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Header } from "../../src/components/Header";
import { Dashboard } from "../../src/components/Dashboard";
import { LoginScreen } from "../../src/components/LoginScreen";
import { ConnectionRecovery } from "../../src/components/ConnectionRecovery";
import { EmailVerification } from "../../src/components/EmailVerification";
import { Brand } from "../../src/components/Brand";
import AccessGate from "../../src/components/AccessGate";
import { OnboardingModal } from "../../src/components/OnboardingModal";
import { ProgressSaveNotice } from '../../src/components/ProgressSaveNotice';
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
    if (query.has('activity-demo')) p.gameLevels = { 'visual-scanning': { level: 4, evidence: [] }, 'memory-path': { level: 6, evidence: [] } };
    p.settings.fontSize = query.has("large") ? "xlarge" : "normal";
    p.settings.contrast = query.has("contrast") ? "high-contrast" : "standard";
    p.settings.showCompanions = !query.has("hidden");
    applyAppearance(p.settings);
    return p;
  });
  const [game, setGame] = useState<ExerciseId | undefined>(
    (query.get("game") as ExerciseId) || undefined,
  );
  const [results, setResults] = useState<ExerciseResult[]>(() => query.has('activity-demo') ? Array.from({length: 6}, (_, day) => (['visual-scanning', 'memory-path'] as const).map((id, index) => ({ id: `chart-${day}-${id}`, exerciseId: id, domain: index ? 'memory' as const : 'attention' as const, date: `2026-09-${20 + day}T12:00:00Z`, durationSeconds: 60 - day * 4 + index * 30, accuracy: 40 + day * 7 + index * 18, score: 0, correctAnswers: 3, totalQuestions: 5, feedbackMessage: '', level: 2 + day + index * 3 }))).flat() : query.has('completed-home') ? (['attention','language','memory','executive','motor'] as const).flatMap(domain => getExercisesForDomain(domain).map(game => ({ id: `fixture-${game.id}`, exerciseId: game.id, domain, date: new Date(Date.now() - (query.has('yesterday') ? 86400000 : 0)).toISOString(), durationSeconds: 30, accuracy: 100, score: 0, correctAnswers: 1, totalQuestions: 1, feedbackMessage: '', practice: query.has('practice') }))) : []);
  const [information, setInformation] = useState<InformationKind | null>(null);
  const [settings, setSettings] = useState(false);
  const [navigation, setNavigation] = useState<HTMLDivElement | null>(null);
  const [authError, setAuthError] = useState("");
  const [dashboardTab, setDashboardTab] = useState("today");
  const [loggedOut, setLoggedOut] = useState(query.has("entry"));
  const [accessAction, setAccessAction] = useState('');
  const [accessBusy, setAccessBusy] = useState(false);
  const back = () => setGame(undefined);
  if (query.has('professional')) return <ProfessionalDashboard uid="fixture-owner" profile={profile} onSignOut={()=>setLoggedOut(true)} onUpdateSettings={()=>{}} onUpdateName={()=>{}}/>;
  if (query.has('recommendations')) return <RecommendationFixture profile={profile}/>;
  if (query.has('level-up')) return <LevelUpFixture/>;
  if (query.has('resume-game')) return <AccessGate onSignOut={()=>setLoggedOut(true)}><GameSession id="visual-scanning" onBack={()=>setLoggedOut(true)}><GameExercise id="visual-scanning" profile={profile} onBack={()=>setLoggedOut(true)} onSaveResult={()=>{}}/></GameSession></AccessGate>;
  if (query.has('access-gate')) return <AccessGate onSignOut={()=>setLoggedOut(true)}><p>Acceso confirmado</p></AccessGate>;
  if (query.has('subscription') && !loggedOut) return <main className="entry-page access-entry"><header className="entry-header"><Brand/></header><OnboardingModal access={{active:false, serverNow:1790683200000, checkoutAvailable:!query.has('unavailable'), trialOffer:query.has('resume-trial') ? 'resume' : query.has('used-trial') ? 'expired' : 'new', kind:query.has('expired') ? 'trial' : undefined}} busy={query.has('busy') || accessBusy} loadFailed={false} invitationIssue={accessAction ? {code:accessAction,message:'Este código no es válido. Revísalo e inténtalo de nuevo.'} : null} onTrial={()=>setLoggedOut(true)} onInvite={setAccessAction} onCheckout={()=>query.has('pending') ? setAccessBusy(true) : setLoggedOut(true)} onSignOut={()=>setLoggedOut(true)} onPortal={()=>setLoggedOut(true)} checkoutReturn={query.get('checkout')}/></main>;

  if (query.has('save-error')) return <ProgressSaveNotice status={accessBusy ? 'saved' : 'pending'} onRetry={async () => { if (!query.has('failure')) setAccessBusy(true); }}/>;
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
          progressScope={query.has("plan") ? { before: 2, after: 3 } : undefined}
          lockedLevel={query.has("assigned")}
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
            activeView="dashboard"
            onNavigate={() => { back(); setDashboardTab("today"); }}
            navigationRef={setNavigation}
            onOpenAccessibility={() => setSettings(true)}
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
      <AccessibilityModal onReassess={() => setSettings(false)} onInformation={setInformation}
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

function LevelUpFixture() {
  const [data, setData] = useState<ProgressData>(() => ({ profile: { ...getInitialProfile(), gameLevels: { 'visual-scanning': { level: 2, evidence: [] } } }, history: [] }));
  return <><button onClick={() => setData(value => ({ profile: {...value.profile, gameLevels: { 'visual-scanning': {level: 3, evidence: []}}}, history: [{id: 'new-gain', exerciseId: 'visual-scanning', domain: 'attention', date: new Date().toISOString(), durationSeconds: 30, accuracy: 100, score: 0, correctAnswers: 3, totalQuestions: 3, feedbackMessage: ''}] }))}>Simular resultado</button><LevelUpScreen data={data}/></>;
}
