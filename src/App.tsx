import React, { useState, useEffect } from 'react';
import type { UserProfile, CognitiveDomain, ExerciseResult, AccessibilitySettings, DailyPlanSession, ExerciseId } from './types';
import { StorageService } from './services/storageService';
import { soundService } from './services/soundService';
import { getExercisesForDomain } from './services/exerciseCatalog';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TherapistReport } from './components/TherapistReport';
import { AccessibilityModal } from './components/AccessibilityModal';
import { FatigueAlertModal } from './components/FatigueAlertModal';
import { RestBreakModal } from './components/RestBreakModal';

// Juegos disponibles de neurorrehabilitación
import { VisualScanningGame } from './games/VisualScanningGame';
import { LanguageNamingGame } from './games/LanguageNamingGame';
import { WordCompletionGame } from './games/WordCompletionGame';
import { MemoryPathGame } from './games/MemoryPathGame';
import { MemoryPairsGame } from './games/MemoryPairsGame';
import { DailySequencingGame } from './games/DailySequencingGame';
import { CategorizationGame } from './games/CategorizationGame';
import { MotorCoordinationGame } from './games/MotorCoordinationGame';
import { MotorTrackingGame } from './games/MotorTrackingGame';

export const App: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>(() => StorageService.getProfile());
  const [history, setHistory] = useState<ExerciseResult[]>(() => StorageService.getHistory());
  const [activeView, setActiveView] = useState<'dashboard' | 'therapist' | CognitiveDomain | ExerciseId>('dashboard');

  // Estado del Plan del Día (Secuencia guiada de 3 ejercicios)
  const [dailyPlanSession, setDailyPlanSession] = useState<DailyPlanSession | null>(null);

  // Modales y control de descanso/fatiga
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [isFatigueOpen, setIsFatigueOpen] = useState(false);
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState(0);

  // Contador de minutos de sesión para prevención de fatiga post-ictus
  useEffect(() => {
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
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-contrast', profile.settings.contrast);
    document.body.setAttribute('data-font', profile.settings.fontSize);
    document.body.setAttribute('data-hand', profile.settings.handDominance);
    document.body.classList.toggle('with-left-anchor', profile.settings.leftSideAnchor);

    soundService.setSoundEnabled(profile.settings.soundEffects);
    soundService.setSpeechRate(profile.settings.speechRate);
  }, [profile.settings]);

  const handleUpdateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    const updated = StorageService.updateSettings(newSettings);
    setProfile(updated);
  };

  const handleSaveExerciseResult = (result: ExerciseResult) => {
    const updated = StorageService.addExerciseResult(result);
    setProfile(updated);
    setHistory(StorageService.getHistory());
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

  const isPlayingGame = activeView !== 'dashboard' && activeView !== 'therapist';

  return (
    <div className={`app-root ${isPlayingGame ? 'app-root-focus-mode' : ''}`}>
      {!isPlayingGame && (
        <Header
          profile={profile}
          sessionMinutes={sessionMinutes}
          activeView={activeView === 'therapist' ? 'therapist' : 'dashboard'}
          onNavigate={view => {
            soundService.stopSpeaking();
            setDailyPlanSession(null);
            setActiveView(view);
          }}
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
            onOpenTherapistReport={() => setActiveView('therapist')}
          />
        )}

        {activeView === 'therapist' && (
          <TherapistReport
            profile={profile}
            history={history}
            onBack={handleBackToDashboard}
            onProfileUpdated={updated => {
              setProfile(updated);
              setHistory(StorageService.getHistory());
            }}
          />
        )}

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
      </main>

      <AccessibilityModal
        isOpen={isAccessibilityOpen}
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
