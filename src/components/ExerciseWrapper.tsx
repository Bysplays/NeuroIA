import { ModalFrame } from './ModalFrame';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Volume2, VolumeX, Sparkles, CheckCircle2, RotateCcw, Home, ArrowRight, Clock, ClipboardCheck, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CognitiveDomain, ExerciseResult } from '../types';
import { soundService } from '../services/soundService';

interface PlanProgress {
  current: number; // 1, 2, 3
  total: number;   // 3
  isLast: boolean;
}

interface ExerciseWrapperProps {
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
  domain,
  instructionText,
  onBack,
  isCompleted,
  result,
  onRestart,
  planProgress,
  onNextPlanExercise,
  children,
  hideBadges = true,
  hideInstructionBanner = true,
}) => {
  const domainData: Record<CognitiveDomain, { name: string; color: string; bg: string }> = {
    attention: { name: 'Atención y Rastreo Visual', color: 'var(--color-attention)', bg: 'var(--color-attention-bg)' },
    language: { name: 'Lenguaje y Vocabulario', color: 'var(--color-language)', bg: 'var(--color-language-bg)' },
    memory: { name: 'Memoria de Trabajo', color: 'var(--color-memory)', bg: 'var(--color-memory-bg)' },
    executive: { name: 'Funciones Ejecutivas', color: 'var(--color-executive)', bg: 'var(--color-executive-bg)' },
    motor: { name: 'Coordinación Visomotora', color: 'var(--color-motor)', bg: 'var(--color-motor-bg)' },
  };

  const currentDomain = domainData[domain];
  const [showMistakesModal, setShowMistakesModal] = useState(false);

  useEffect(() => {
    if (isCompleted) {
      soundService.playCompletionFanfare();
      try {
        confetti({
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
      {/* Barra superior del ejercicio */}
      <div className="exercise-top-bar">
        <button
          className="touch-btn touch-btn-secondary"
          onClick={() => {
            soundService.stopSpeaking();
            soundService.playTap();
            onBack();
          }}
          aria-label="Volver al menú principal"
        >
          <ArrowLeft size={24} />
          <span>Volver al inicio</span>
        </button>

        <div className="exercise-info-center">
          {!hideBadges && (
            <div className="exercise-badges-row">
              <span
                className="exercise-domain-pill"
                style={{ backgroundColor: currentDomain.bg, color: currentDomain.color }}
              >
                {currentDomain.name}
              </span>
              {planProgress && (
                <span className="plan-step-pill">
                  ⭐ Plan del Día: Ejercicio {planProgress.current} de {planProgress.total}
                </span>
              )}
            </div>
          )}
          <span className="game-overline">{currentDomain.name}{planProgress ? ` · Ejercicio ${planProgress.current} de ${planProgress.total}` : ' · A tu ritmo'}</span>
          <h2 className="exercise-screen-title">{title}</h2>
        </div>

        <button
          className={`touch-btn instruction-speak-btn ${isNarratorMuted ? 'touch-btn-secondary narrator-muted-btn' : 'touch-btn-secondary'}`}
          onClick={handleToggleNarrator}
          title={isNarratorMuted ? 'Activar voz del locutor' : 'Silenciar la voz del locutor'}
          aria-label={isNarratorMuted ? 'Activar voz del locutor' : 'Silenciar la voz del locutor'}
        >
          {isNarratorMuted ? <VolumeX size={24} className="narrator-muted-icon" /> : <Volume2 size={24} />}
          <span>{isNarratorMuted ? 'Activar voz' : 'Silenciar voz'}</span>
        </button>
      </div>

      {/* Franja de instrucción visual clara */}
      {!isCompleted && !hideInstructionBanner && (
        <div className="exercise-instruction-banner">
          <p className="instruction-text">{instructionText}</p>
        </div>
      )}

      {/* Contenido interactivo del ejercicio o pantalla de finalización */}
      <div className="exercise-viewport">
        {isCompleted && result ? (
          <div className="exercise-completed-card card animate-fade-in">
            <div className="completed-icon-wrapper">
              <img className="game-completion-art" src="/images/wellness-companions.png" alt="" />
            </div>

            <h2 className="completed-title">Un paso más. Bien hecho.</h2>

            <div className="completed-stats-row">
              <div className="stat-box">
                <span className="stat-label">Aciertos</span>
                <strong className="stat-number text-green">{result.correctAnswers} de {result.totalQuestions}</strong>
              </div>
              <div className="stat-box">
                <span className="stat-label">Precisión</span>
                <strong className="stat-number">{result.accuracy}%</strong>
              </div>
              <div className="stat-box">
                <span className="stat-label">Tiempo de práctica</span>
                <strong className="stat-number text-primary">
                  <Clock size={22} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  {Math.floor(result.durationSeconds / 60)}:{String(Math.round(result.durationSeconds % 60)).padStart(2, '0')}
                </strong>
              </div>
            </div>

            <div className="completed-feedback-box">
              <Sparkles size={24} className="sparkle-icon" />
              <p>{result.feedbackMessage}</p>
            </div>

            {/* Botón para Ver y Corregir Fallos */}
            <div className="completed-review-bar">
              <button
                className="touch-btn touch-btn-correction touch-btn-large"
                onClick={() => {
                  soundService.playTap();
                  setShowMistakesModal(true);
                }}
                title="Pulsar para revisar los fallos y ver las soluciones correctas"
              >
                <ClipboardCheck size={26} />
                <span>
                  {result.mistakesList && result.mistakesList.length > 0
                    ? `Ver y Corregir Fallos (${result.mistakesList.length})`
                    : result.correctAnswers < result.totalQuestions
                    ? `Ver y Corregir Fallos (${result.totalQuestions - result.correctAnswers})`
                    : 'Revisar Ejercicio y Aciertos (100%)'}
                </span>
              </button>
            </div>

            {/* Acciones tras completar el ejercicio */}
            <div className="completed-actions-row">
              {planProgress && onNextPlanExercise && (
                <button
                  className="touch-btn touch-btn-primary touch-btn-large gentle-bounce"
                  onClick={() => {
                    soundService.playTap();
                    onNextPlanExercise();
                  }}
                >
                  <span>
                    {planProgress.isLast
                      ? 'Finalizar Plan del Día (¡Sesión Completada!)'
                      : `Continuar al Ejercicio ${planProgress.current + 1} de ${planProgress.total}`}
                  </span>
                  <ArrowRight size={24} />
                </button>
              )}

              <button
                className="touch-btn touch-btn-secondary touch-btn-large"
                onClick={() => {
                  soundService.playTap();
                  onRestart();
                }}
              >
                <RotateCcw size={24} />
                <span>Repetir Este Ejercicio</span>
              </button>

              <button
                className="touch-btn touch-btn-secondary touch-btn-large"
                onClick={() => {
                  soundService.playTap();
                  onBack();
                }}
              >
                <Home size={24} />
                <span>Volver al Menú Principal</span>
              </button>
            </div>
          </div>
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
