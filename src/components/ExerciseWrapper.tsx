import { HeaderIllustration } from './HeaderIllustration';
import { ModalFrame } from './ModalFrame';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Volume2, VolumeX, CheckCircle2, RotateCcw, ArrowRight, ClipboardCheck, X } from 'lucide-react';
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
  instructionText,
  onBack,
  isCompleted,
  result,
  onRestart,
  planProgress,
  onNextPlanExercise,
  children,
}) => {
  const domainData: Record<CognitiveDomain, { name: string; color: string; bg: string }> = {
    attention: { name: 'Atención', color: 'var(--color-attention)', bg: 'var(--color-attention-bg)' },
    language: { name: 'Lenguaje', color: 'var(--color-language)', bg: 'var(--color-language-bg)' },
    memory: { name: 'Memoria', color: 'var(--color-memory)', bg: 'var(--color-memory-bg)' },
    executive: { name: 'Organización', color: 'var(--color-executive)', bg: 'var(--color-executive-bg)' },
    motor: { name: 'Coordinación', color: 'var(--color-motor)', bg: 'var(--color-motor-bg)' },
  };

  const currentDomain = domainData[domain];
  const [showMistakesModal, setShowMistakesModal] = useState(false);

  useEffect(() => {
    if (isCompleted) {
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
    } else {
      setShowMistakesModal(false);
    }
  }, [isCompleted]);

  const [isNarratorMuted, setIsNarratorMuted] = useState(!soundService.isVoiceEnabled());

  useEffect(() => {
    setIsNarratorMuted(!soundService.isVoiceEnabled());
    const unsubscribe = soundService.onVoiceChange(enabled => {
      setIsNarratorMuted(!enabled);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleNarrator = () => {
    soundService.playTap();
    const newEnabled = soundService.toggleVoice();
    setIsNarratorMuted(!newEnabled);
  };

  return (
    <div className="exercise-container" data-domain={domain}>
      <header className="paper-game-nav">
        <button className="paper-game-brand" onClick={onBack} aria-label="NeuroIA, ir al inicio">
          <img src={`${import.meta.env.BASE_URL}brand/neuroia-mark.svg`} alt="" width="36" height="36" />
          <span>NeuroIA</span>
        </button>
        <div className="paper-game-tools">
          {(!isCompleted || planProgress) && <button className="paper-nav-button" onClick={() => { soundService.stopSpeaking(); soundService.playTap(); onBack(); }} aria-label="Volver al menú principal">
            <ArrowLeft size={19} /><span>Volver al inicio</span>
          </button>}
          <button className="paper-nav-button paper-voice-button" onClick={handleToggleNarrator} aria-label={isNarratorMuted ? 'Activar voz del locutor' : 'Silenciar la voz del locutor'} title={isNarratorMuted ? 'Activar voz' : 'Silenciar voz'}>
            {isNarratorMuted ? <VolumeX size={21} /> : <Volume2 size={21} />}
          </button>
        </div>
      </header>
      {!isCompleted && (
        <section className="paper-game-welcome" aria-labelledby="paper-game-title">
          <div className="paper-game-intro">
            <span className="paper-game-label"><span aria-hidden="true" />{currentDomain.name}{planProgress ? ` · Ejercicio ${planProgress.current} de ${planProgress.total}` : ' · A tu ritmo'}</span>
            <h1 id="paper-game-title" className="exercise-screen-title">{title}</h1>
            <p className="paper-game-instruction">{instructionText}</p>
          </div>
          <HeaderIllustration scene={exerciseId} className="paper-game-companions" />
        </section>
      )}

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
              <div className="result-secondary-actions">
                <button className="result-text-action" onClick={() => { soundService.playTap(); setShowMistakesModal(true); }}>
                  <ClipboardCheck size={18} aria-hidden="true" /> Ver respuestas
                </button>
                <button className="result-text-action" onClick={() => { soundService.playTap(); onRestart(); }}>
                  <RotateCcw size={18} aria-hidden="true" /> Repetir
                </button>
              </div>
            </div>
          </section>
        ) : (
          children
        )}
      </div>

      {/* Modal accesible de Repasamos juntos */}
      {showMistakesModal && result && (
        <ModalFrame onClose={() => setShowMistakesModal(false)} labelledBy="review-title">
          <div
            className="modal-card mistakes-modal-card"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <ClipboardCheck size={28} className="text-primary" />
                <div>
                  <h3 id="review-title" className="modal-title">Repasamos juntos</h3>
                  <p className="modal-subtitle">
                    Mira las respuestas y prueba de nuevo cuando quieras.
                  </p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowMistakesModal(false)}
                aria-label="Cerrar ventana de fallos"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mistakes-modal-body">
              {(!result.mistakesList || result.mistakesList.length === 0) &&
              result.correctAnswers === result.totalQuestions ? (
                <div className="no-mistakes-box card">
                  <CheckCircle2 size={54} className="text-green" />
                  <h4>Todo correcto</h4>
                  <p>
                    Has completado todos los pasos y objetivos de este ejercicio con un 100% de aciertos.
                  </p>
                </div>
              ) : (
                <div className="mistakes-list">
                  {(result.mistakesList && result.mistakesList.length > 0
                    ? result.mistakesList
                    : [
                        {
                          item: `Ejercicio de ${currentDomain.name}`,
                          userAction: `Se registraron ${result.totalQuestions - result.correctAnswers} error(es) en este ejercicio.`,
                          correctSolution: 'Puedes pulsar en Reintentar para practicar y afianzar la precisión.',
                          explanation: result.feedbackMessage,
                        },
                      ]
                  ).map((m, idx) => (
                    <div key={idx} className="card mistake-item-card">
                      <div className="mistake-item-header">
                        <span className="mistake-badge-num">Paso {idx + 1}</span>
                        <strong className="mistake-item-title">{m.item}</strong>
                      </div>

                      <div className="mistake-comparison-row">
                        <div className="comparison-col comparison-wrong">
                          <span className="col-label">Tu respuesta</span>
                          <p className="col-val">{m.userAction}</p>
                        </div>
                        <div className="comparison-col comparison-correct">
                          <span className="col-label">Respuesta correcta</span>
                          <p className="col-val">{m.correctSolution}</p>
                        </div>
                      </div>

                      {m.explanation && (
                        <div className="mistake-hint-box">
                          <strong>Una pista: </strong>
                          <span>{m.explanation}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="touch-btn touch-btn-secondary touch-btn-large"
                onClick={() => {
                  soundService.playTap();
                  setShowMistakesModal(false);
                  onRestart();
                }}
              >
                <RotateCcw size={22} />
                <span>Volver a practicar</span>
              </button>

              <button
                className="touch-btn touch-btn-primary touch-btn-large"
                onClick={() => {
                  soundService.playTap();
                  setShowMistakesModal(false);
                }}
              >
                <span>Listo</span>
              </button>
            </div>
          </div>
        </ModalFrame>
      )}
    </div>
  );
};
