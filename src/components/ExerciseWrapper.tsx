import { exerciseStages, sessionProgress } from '../services/sessionProgress';
import { FittedGameArea } from './FittedGameArea';
import { useGameSession } from '../services/gameSession';
import { getExerciseById } from '../services/exerciseCatalog';
import React, { useEffect } from 'react';
import { RotateCcw, ArrowRight, Check } from 'lucide-react';
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
  completedStages?: number;
  nextAction?: React.ReactNode;
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
  completedStages = 0,
  nextAction,
}) => {
  const session = useGameSession();
  const { finish } = session;
  const stages = exerciseStages(exerciseId, session.config);
  const bar = sessionProgress(isCompleted ? stages : completedStages, stages, session.progressScope);
  useEffect(() => { finish(isCompleted); }, [isCompleted, finish]);
  useEffect(() => {
    if (isCompleted) {
      window.scrollTo(0, 0);
      soundService.playCompletionFanfare();
    }
  }, [isCompleted]);

  return (
    <div className={`exercise-container${isCompleted && result ? ' exercise-container-completed' : ''}`} data-domain={domain}>
      {!isCompleted && <h1 className="game-task-title">{title}</h1>}<div className="game-stage-progress" role="progressbar" aria-valuemin={0} aria-valuenow={bar.value} aria-valuemax={bar.max} aria-label={session.progressScope ? "Progreso de la sesión" : "Progreso del juego"}>
        {Array.from({ length: Math.ceil(bar.max) }, (_, index) => <span key={index} aria-hidden="true"><i style={{ width: `${Math.max(0, Math.min(1, bar.value - index)) * 100}%` }}/></span>)}
      </div>
      {/* Contenido interactivo del ejercicio o pantalla de finalización */}
      <FittedGameArea>
        {isCompleted && result ? (
          <section className="exercise-result" aria-labelledby="result-title">
            <div className="result-heading">
              <span className="result-complete-mark" aria-hidden="true"><Check size={30}/></span>
              <p className="result-eyebrow">{planProgress ? `Actividad ${planProgress.current} de ${planProgress.total}` : 'Tu práctica de hoy'}</p>
              <h1 id="result-title">{planProgress?.isLast ? 'Sesión completada' : 'Actividad completada'}</h1>
              <p className="result-message">{getExerciseById(exerciseId)?.title}{result.level ? ` · Nivel ${result.level}` : ''}</p>
            </div>

            <dl className="result-summary">
              <div><dt>Aciertos</dt><dd>{result.correctAnswers} <span>de {result.totalQuestions}</span></dd></div>
              <div><dt>Precisión</dt><dd>{result.accuracy}<span>%</span></dd></div>
              <div><dt>Tiempo</dt><dd>{Math.floor(result.durationSeconds / 60)}:{String(Math.floor(result.durationSeconds % 60)).padStart(2, '0')}</dd></div>
            </dl>

            <div className="result-actions">
              <button
                className="touch-btn touch-btn-primary result-primary"
                disabled={session.lockedLevel && !session.nextReady}
                onClick={() => {
                  soundService.playTap();
                  if (planProgress && onNextPlanExercise) onNextPlanExercise();
                  else onBack();
                }}
              >
                <span>{planProgress && onNextPlanExercise ? (planProgress.isLast ? 'Terminar mi sesión' : 'Siguiente ejercicio') : 'Volver al inicio'}</span>
                <ArrowRight size={20} aria-hidden="true" />
              </button>
              {!session.lockedLevel && <div className="result-secondary-actions">
                <button className="result-text-action" onClick={() => { soundService.playTap(); session.restart();
                  onRestart(); }}>
                  <RotateCcw size={18} aria-hidden="true" /> Repetir
                </button>
              </div>}


            </div>
          </section>
        ) : (
          children
        )}
      </FittedGameArea>
      {!isCompleted && nextAction && <div className="game-stage-action">{nextAction}</div>}


    </div>
  );
};
