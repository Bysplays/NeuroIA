import { ActivityStatistics } from './components/ActivityStatistics';
import { AppLoading } from './components/AppLoading';
import React, { useState, useEffect, useLayoutEffect, lazy, Suspense } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth } from './services/firebase';
import type { ProgressSync } from './services/progressSync';
import type { ProgressData } from './services/progressData';
import { authErrorMessage } from './services/authErrors';
import type { CognitiveDomain, ExerciseResult, AccessibilitySettings, DailyPlanSession, ExerciseId } from './types';
import { applyAppearance } from './services/appearance';
import { StorageService } from './services/storageService';
import { soundService } from './services/soundService';
import { getExercisesForDomain } from './services/exerciseCatalog';
import { GameSession } from './components/GameSession';
import { Header } from './components/Header';
import { AchievementShowcase } from './components/AchievementShowcase';
import { Dashboard } from './components/Dashboard';
import { TherapistReport } from './components/TherapistReport';
import { AccessibilityModal } from './components/AccessibilityModal';
import { FatigueAlertModal } from './components/FatigueAlertModal';
import { LandscapeGate } from './components/LandscapeGate';
import { usePortrait } from './services/orientation';
import { LoginScreen } from './components/LoginScreen';
import { RestBreakModal } from './components/RestBreakModal';

// Juegos disponibles de serious play
import { VisualScanningGame } from './games/VisualScanningGame';
import { LanguageNamingGame } from './games/LanguageNamingGame';
import { WordCompletionGame } from './games/WordCompletionGame';
import { MemoryPathGame } from './games/MemoryPathGame';
import { MemoryPairsGame } from './games/MemoryPairsGame';
import { DailySequencingGame } from './games/DailySequencingGame';
import { CategorizationGame } from './games/CategorizationGame';
import { MotorCoordinationGame } from './games/MotorCoordinationGame';
import { MotorTrackingGame } from './games/MotorTrackingGame';

const AccessGate = lazy(() => import('./components/AccessGate'));
const CloudProgress = lazy(() => import('./components/CloudProgress'));

const AccountEntry = lazy(() => import('./components/AccountEntry'));

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [professionalEntry, setProfessionalEntry] = useState(false);

  useEffect(() => onAuthStateChanged(auth, nextUser => {
    soundService.stopSpeaking();
    StorageService.setAccount(nextUser ? { uid: nextUser.uid, displayName: nextUser.displayName } : null);
    if (nextUser) {
      const cached = StorageService.readCachedProgress();
      if (cached) applyAppearance(cached.profile.settings);
    }
    setUser(nextUser);
    setLoading(false);
  }, error => {
    StorageService.setAccount(null);
    setUser(null);
    setLoading(false);
    setError(authErrorMessage(error));
  }), []);

  const handleSignIn = async (professional = false) => {
    setProfessionalEntry(professional);
    setBusy(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error) {
      setError(authErrorMessage(error));
    } finally { setBusy(false); }
  };
  const handleSignOut = async () => {
    setBusy(true);
    setError('');
    soundService.stopSpeaking();
    try { await signOut(auth); setProfessionalEntry(false); }
    catch { setError('No hemos podido cerrar la sesión. Vuelve a intentarlo.'); }
    finally { setBusy(false); }
  };

  return <LandscapeGate>{loading
    ? <AppLoading />
    : user
      ? <>
        {error && <p className="account-notice" role="alert">{error}</p>}
        <Suspense fallback={<AppLoading />}><AccountEntry key={user.uid} user={user} professionalEntry={professionalEntry} onSignOut={handleSignOut}><AccessGate key={user.uid} onSignOut={handleSignOut}><CloudProgress key={user.uid} user={user} onSignOut={handleSignOut}>{(sync, data) => <Workspace uid={user.uid} onSignOut={handleSignOut} signingOut={busy} sync={sync} data={data} />}</CloudProgress></AccessGate></AccountEntry></Suspense></>
      : <LoginScreen onSignIn={handleSignIn} busy={busy} error={error} />
  }</LandscapeGate>;
};

const Workspace: React.FC<{ uid: string; onSignOut: () => void; signingOut: boolean; sync: ProgressSync; data: ProgressData }> = ({ uid, onSignOut, signingOut, sync, data }) => {
  const portrait = usePortrait();
  const { profile, history } = data;
  const [activeView, setActiveView] = useState<'dashboard' | 'therapist' | 'achievements' | 'statistics' | CognitiveDomain | ExerciseId>('dashboard');

  useEffect(() => {
    if (window.location.hash === '#achievements') window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, []);

  // Estado del Plan del Día (Secuencia guiada de 3 ejercicios)
  const [dailyPlanSession, setDailyPlanSession] = useState<DailyPlanSession | null>(null);

  // Modales y control de descanso/fatiga
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [isFatigueOpen, setIsFatigueOpen] = useState(false);
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState(0);

  // Contador de minutos de sesión para ofrecer pausas
  useEffect(() => {
    if (portrait) return;
    const timer = setInterval(() => {
      setSessionMinutes(prev => {
        const next = prev + 1;
        if (next === 15 || next === 30) {
          setIsFatigueOpen(true);
        }
        return next;
      });
    }, 60000);

    return () => clearInterval(timer);
  }, [portrait]);

  // Commit visual preferences before paint, together with the selected controls.
  useLayoutEffect(() => {
    applyAppearance({ showCompanions: profile.settings.showCompanions, pageStyle: profile.settings.pageStyle, contrast: profile.settings.contrast, fontSize: profile.settings.fontSize, handDominance: profile.settings.handDominance });
  }, [profile.settings.showCompanions, profile.settings.pageStyle, profile.settings.contrast, profile.settings.fontSize, profile.settings.handDominance]);

  useEffect(() => {
    soundService.setSoundEnabled(profile.settings.soundEffects);
    soundService.setSpeechRate(profile.settings.speechRate);
  }, [profile.settings.soundEffects, profile.settings.speechRate]);

  const handleUpdateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    sync.enqueue({ id: crypto.randomUUID(), kind: 'settings', settings: newSettings });
  };

  const handleSaveExerciseResult = (result: ExerciseResult) => {
    sync.enqueue({ id: `result:${result.id}`, kind: 'result', result });
  };

  // Iniciar un dominio individual libremente
  const handleSelectDomain = (domain: CognitiveDomain) => {
    soundService.playTap();
    setDailyPlanSession(null); // Sesión libre sin cola
    setActiveView(domain);
  };

  // Iniciar un ejercicio específico elegido por el usuario
  const handleSelectExercise = (exerciseId: ExerciseId) => {
    soundService.playTap();
    setDailyPlanSession(null);
    setActiveView(exerciseId);
  };

  // Iniciar el Plan del Día (secuencia guiada alternando ejercicios)
  const handleStartDailyPlan = () => {
    soundService.playSuccess();
    const domainQueue = StorageService.generateDailyPlanQueue(profile);
    const exerciseQueue = domainQueue.map(domain => {
      const exList = getExercisesForDomain(domain);
      const chosen = exList[Math.floor(Math.random() * exList.length)];
      return chosen ? chosen.id : (domain as unknown as ExerciseId);
    });
    setDailyPlanSession({
      inProgress: true,
      queue: exerciseQueue as unknown as CognitiveDomain[],
      currentIndex: 0,
      completedResults: [],
    });
    setActiveView(exerciseQueue[0]);
  };

  // Avanzar al siguiente ejercicio dentro del Plan del Día
  const handleNextPlanExercise = () => {
    if (!dailyPlanSession) return;

    const nextIndex = dailyPlanSession.currentIndex + 1;
    if (nextIndex < dailyPlanSession.queue.length) {
      soundService.playSuccess();
      setDailyPlanSession({
        ...dailyPlanSession,
        currentIndex: nextIndex,
      });
      setActiveView(dailyPlanSession.queue[nextIndex] as unknown as (CognitiveDomain | ExerciseId));
    } else {
      // Fin del plan del día completo
      soundService.playCompletionFanfare();
      setDailyPlanSession(null);
      setActiveView('dashboard');
    }
  };

  const handleBackToDashboard = () => {
    soundService.stopSpeaking();
    soundService.playTap();
    setDailyPlanSession(null);
    setActiveView('dashboard');
  };

  const planProgress = dailyPlanSession && dailyPlanSession.inProgress ? {
    current: dailyPlanSession.currentIndex + 1,
    total: dailyPlanSession.queue.length,
    isLast: dailyPlanSession.currentIndex + 1 >= dailyPlanSession.queue.length,
  } : null;

  const isPlayingGame = activeView !== 'dashboard' && activeView !== 'therapist' && activeView !== 'achievements' && activeView !== 'statistics';

  return (
    <div className={`app-root ${isPlayingGame ? 'app-root-focus-mode' : ''}`}>
      {!isPlayingGame && (
        <Header
          profile={profile}
          sessionMinutes={sessionMinutes}
          activeView={activeView === 'statistics' ? 'statistics' : activeView === 'therapist' ? 'therapist' : 'dashboard'}
          onNavigate={view => {
            soundService.stopSpeaking();
            setDailyPlanSession(null);
            setActiveView(view);
            window.scrollTo(0, 0);
          }}
          onOpenStatistics={() => { setActiveView('statistics'); window.scrollTo(0, 0); }}
          onOpenAccessibility={() => setIsAccessibilityOpen(true)}
          onOpenFatigueAlert={() => setIsFatigueOpen(true)}
        />
      )}

      <main className={`main-content ${isPlayingGame ? 'main-content-focus' : ''}`}>
        {activeView === 'dashboard' && (
          <Dashboard
            profile={profile}
            onSelectDomain={handleSelectDomain}
            onSelectExercise={handleSelectExercise}
            onStartDailyPlan={handleStartDailyPlan}
            onOpenAchievements={() => { setActiveView('achievements'); window.scrollTo(0, 0); }}
          />
        )}

        {activeView === 'statistics' && <ActivityStatistics uid={uid} history={history} onBack={handleBackToDashboard} />}

        {activeView === 'achievements' && <AchievementShowcase profile={profile} onBack={handleBackToDashboard} />}

        {activeView === 'therapist' && (
          <TherapistReport
            profile={profile}
            history={history}
            onBack={handleBackToDashboard}
            onProfileUpdated={() => {}}
          />
        )}

        {isPlayingGame && <GameSession key={`${activeView}-${dailyPlanSession?.currentIndex ?? "free"}`} step={planProgress ? `Ejercicio ${planProgress.current} de ${planProgress.total}` : undefined} id={activeView} onBack={handleBackToDashboard}>
        {/* 1. ATENCIÓN */}
        {(activeView === 'attention' || activeView === 'visual-scanning') && (
          <VisualScanningGame
            profile={profile}
            onBack={handleBackToDashboard}
            onSaveResult={handleSaveExerciseResult}
            planProgress={planProgress}
            onNextPlanExercise={handleNextPlanExercise}
          />
        )}

        {/* 2. LENGUAJE */}
        {(activeView === 'language' || activeView === 'language-naming') && (
          <LanguageNamingGame
            profile={profile}
            onBack={handleBackToDashboard}
            onSaveResult={handleSaveExerciseResult}
            planProgress={planProgress}
            onNextPlanExercise={handleNextPlanExercise}
          />
        )}

        {activeView === 'word-completion' && (
          <WordCompletionGame
            profile={profile}
            onBack={handleBackToDashboard}
            onSaveResult={handleSaveExerciseResult}
            planProgress={planProgress}
            onNextPlanExercise={handleNextPlanExercise}
          />
        )}

        {/* 3. MEMORIA */}
        {(activeView === 'memory' || activeView === 'memory-path') && (
          <MemoryPathGame
            profile={profile}
            onBack={handleBackToDashboard}
            onSaveResult={handleSaveExerciseResult}
            planProgress={planProgress}
            onNextPlanExercise={handleNextPlanExercise}
          />
        )}

        {activeView === 'memory-pairs' && (
          <MemoryPairsGame
            profile={profile}
            onBack={handleBackToDashboard}
            onSaveResult={handleSaveExerciseResult}
            planProgress={planProgress}
            onNextPlanExercise={handleNextPlanExercise}
          />
        )}

        {/* 4. FUNCIONES EJECUTIVAS */}
        {(activeView === 'executive' || activeView === 'daily-sequencing') && (
          <DailySequencingGame
            profile={profile}
            onBack={handleBackToDashboard}
            onSaveResult={handleSaveExerciseResult}
            planProgress={planProgress}
            onNextPlanExercise={handleNextPlanExercise}
          />
        )}

        {activeView === 'categorization' && (
          <CategorizationGame
            profile={profile}
            onBack={handleBackToDashboard}
            onSaveResult={handleSaveExerciseResult}
            planProgress={planProgress}
            onNextPlanExercise={handleNextPlanExercise}
          />
        )}

        {/* 5. COORDINACIÓN VISOMOTORA */}
        {(activeView === 'motor' || activeView === 'motor-target') && (
          <MotorCoordinationGame
            profile={profile}
            onBack={handleBackToDashboard}
            onSaveResult={handleSaveExerciseResult}
            planProgress={planProgress}
            onNextPlanExercise={handleNextPlanExercise}
          />
        )}

        {activeView === 'motor-tracking' && (
          <MotorTrackingGame
            profile={profile}
            onBack={handleBackToDashboard}
            onSaveResult={handleSaveExerciseResult}
            planProgress={planProgress}
            onNextPlanExercise={handleNextPlanExercise}
          />
        )}
        </GameSession>}
      </main>

      <AccessibilityModal
        onSignOut={onSignOut}
        signingOut={signingOut}
        isOpen={isAccessibilityOpen}
        name={profile.name}
        onUpdateName={name => sync.enqueue({ id: crypto.randomUUID(), kind: 'settings', settings: {}, name })}
        settings={profile.settings}
        onClose={() => setIsAccessibilityOpen(false)}
        onUpdateSettings={handleUpdateSettings}
      />

      <FatigueAlertModal
        isOpen={isFatigueOpen}
        onClose={() => setIsFatigueOpen(false)}
        onTakeBreak={() => {
          setIsFatigueOpen(false);
          setIsRestModalOpen(true);
        }}
      />

      <RestBreakModal
        isOpen={isRestModalOpen}
        onClose={() => setIsRestModalOpen(false)}
        onFinishBreak={() => {
          setIsRestModalOpen(false);
          setSessionMinutes(0); // Reiniciar el contador de fatiga tras descansar
          handleBackToDashboard();
        }}
      />
    </div>
  );
};

export default App;
