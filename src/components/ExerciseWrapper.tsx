import { useGameSession } from './GameSession';
import { HeaderIllustration } from './HeaderIllustration';
import React, { useEffect } from 'react';
import { RotateCcw, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CognitiveDomain, ExerciseId, ExerciseResult } from '../types';
import { soundService } from '../services/soundService';

interface PlanProgress {
  current: number; // 1, 2, 3
  total: number;   // 3
  isLast: boolean;
}

interface ExerciseWrapperProps {
  exerciseId: ExerciseId;
  title: React.ReactNode;
  domain: CognitiveDomain;
  instructionText: string;
  onBack: () => void;
  isCompleted: boolean;
  result: ExerciseResult | null;
  onRestart: () => void;
  planProgress?: PlanProgress | null;
  onNextPlanExercise?: () => void;
  children: React.ReactNode;
  hideBadges?: boolean;
  hideInstructionBanner?: boolean;
}

export const ExerciseWrapper: React.FC<ExerciseWrapperProps> = ({
  title,
  exerciseId,
  domain,
  onBack,
  isCompleted,
  result,
  onRestart,
  planProgress,
  onNextPlanExercise,
  children,
}) => {
  const session = useGameSession();
  useEffect(() => { session.finish(isCompleted); }, [isCompleted, session.finish]);
  useEffect(() => {
    if (isCompleted) {
      window.scrollTo(0, 0);
      soundService.playCompletionFanfare();
      try {
        confetti({
          disableForReducedMotion: true,
          particleCount: 60,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#b9dce3', '#c6dfb9', '#cfc6e8', '#edd9bb', '#e9c5df'],
        });
      } catch {
        // Silencioso
      }
    }
  }, [isCompleted]);

  return (
    <div className={`exercise-container${isCompleted && result ? ' exercise-container-completed' : ''}`} data-domain={domain}>
      {!isCompleted && <h1 className="game-task-title">{title}</h1>}
      {/* Contenido interactivo del ejercicio o pantalla de finalización */}
      <div className="exercise-viewport">
        {isCompleted && result ? (
          <section className="exercise-result" aria-labelledby="result-title">
            <div className="result-heading">
              <div>
                <p className="result-eyebrow">{planProgress ? `Ejercicio ${planProgress.current} de ${planProgress.total} completado` : 'Ejercicio completado'}</p>
                <h1 id="result-title">Un paso más. Bien hecho.</h1>
                <p className="result-message">Gracias por dedicarte este rato.</p>
              </div>
              <HeaderIllustration scene={exerciseId} className="game-completion-art" />
            </div>

            <dl className="result-summary">
              <div><dt>Aciertos</dt><dd>{result.correctAnswers} <span>de {result.totalQuestions}</span></dd></div>
              <div><dt>Precisión</dt><dd>{result.accuracy}<span>%</span></dd></div>
              <div><dt>Tiempo</dt><dd>{Math.floor(result.durationSeconds / 60)}:{String(Math.floor(result.durationSeconds % 60)).padStart(2, '0')}</dd></div>
            </dl>

            <div className="result-actions">
              <div className="result-secondary-actions">
                <button className="result-text-action" onClick={() => { soundService.playTap(); session.restart();
                  onRestart(); }}>
                  <RotateCcw size={18} aria-hidden="true" /> Repetir
                </button>
              </div>
              <button
                className="touch-btn touch-btn-primary result-primary"
                onClick={() => {
                  soundService.playTap();
                  if (planProgress && onNextPlanExercise) onNextPlanExercise();
                  else onBack();
                }}
              >
                <span>{planProgress && onNextPlanExercise ? (planProgress.isLast ? 'Terminar mi sesión' : 'Siguiente ejercicio') : 'Volver al inicio'}</span>
                <ArrowRight size={20} aria-hidden="true" />
              </button>

            </div>
          </section>
        ) : (
          children
        )}
      </div>


    </div>
  );
};
