import { ModalFrame } from './ModalFrame';
import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, CheckCircle2, ArrowRight, Volume2 } from 'lucide-react';
import { soundService } from '../services/soundService';

interface RestBreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinishBreak: () => void;
}

export const RestBreakModal: React.FC<RestBreakModalProps> = ({
  isOpen,
  onClose,
  onFinishBreak,
}) => {
  const TOTAL_SECONDS = 300; // 5 minutos exactos
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [isRunning, setIsRunning] = useState(true);
  const [breathePhase, setBreathePhase] = useState<'inhale' | 'exhale'>('inhale');
  const [isCompleted, setIsCompleted] = useState(false);

  // Reiniciar estado cada vez que se abre la ventana
  useEffect(() => {
    if (isOpen) {
      setSecondsLeft(TOTAL_SECONDS);
      setIsRunning(true);
      setIsCompleted(false);
      setBreathePhase('inhale');
      soundService.playRelaxingChime?.();
    }
  }, [isOpen]);

  // Manejador de fin de descanso
  const handleTimeFinished = useCallback(() => {
    setIsCompleted(true);
    setIsRunning(false);
    soundService.playSuccess();
    soundService.speak('Pausa completada. Vuelve a entrenar cuando te sientas preparado.');
  }, []);

  // Temporizador regresivo segundo a segundo
  useEffect(() => {
    if (!isOpen || !isRunning || isCompleted) return;

    if (secondsLeft <= 0) {
      handleTimeFinished();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          handleTimeFinished();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isRunning, secondsLeft, isCompleted, handleTimeFinished]);

  // Ciclo de respiración relajante (4 segundos inhalar, 4 segundos exhalar)
  useEffect(() => {
    if (!isOpen || !isRunning || isCompleted) return;

    const breatheInterval = setInterval(() => {
      setBreathePhase(prev => (prev === 'inhale' ? 'exhale' : 'inhale'));
    }, 4000);

    return () => clearInterval(breatheInterval);
  }, [isOpen, isRunning, isCompleted]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const progressPercent = ((TOTAL_SECONDS - secondsLeft) / TOTAL_SECONDS) * 100;

  const handleTogglePlay = () => {
    soundService.playTap();
    setIsRunning(prev => !prev);
  };

  const handleReadTips = () => {
    soundService.playTap();
    soundService.speak(
      'Pausa de descanso. Uno: Bebe un poco de agua si te apetece. Dos: Desvía la mirada de la pantalla y mira a lo lejos. Tres: Respira profundamente al compás del círculo.'
    );
  };

  const handleFinishEarly = () => {
    soundService.playTap();
    onFinishBreak();
  };

  return (
    <ModalFrame onClose={onClose} labelledBy="rest-title" dismissOnBackdrop={false}>
      <div className="modal-container rest-modal-container card" onClick={e => e.stopPropagation()}>
        {/* Cabecera del descanso */}
        <div className="rest-modal-header">
          <div>
            <span className="modal-overline">Respira. No hay prisa.</span>
            <h2 id="rest-title" className="rest-modal-title">Un momento para ti</h2>
            <p className="rest-modal-subtitle">
              Cinco minutos para bajar el ritmo.
            </p>
          </div>
          <button
            className="touch-btn touch-btn-voice-mini"
            onClick={handleReadTips}
            title="Escuchar pautas de relajación en voz alta"
            aria-label="Escuchar pautas de relajación en voz alta"
          >
            <Volume2 size={22} />
          </button>
        </div>

        {/* Zona Central: Círculo de Respiración y Contador de Tiempo */}
        <div className="rest-central-zone">
          {!isCompleted ? (
            <div className="rest-timer-breathe-wrapper">
              <div className={`rest-breathe-ring ${breathePhase}`}>
                <div className="rest-inner-timer-circle">
                  <span className="rest-timer-digits">{formattedTime}</span>
                  <span className="rest-breathe-status">
                    {isRunning
                      ? breathePhase === 'inhale'
                        ? 'Inhala suavemente'
                        : 'Exhala despacio'
                      : 'En pausa'}
                  </span>
                </div>
              </div>

              <div className="rest-progress-bar-wrap" title={`Progreso del descanso: ${Math.round(progressPercent)}%`}>
                <div className="rest-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          ) : (
            <div className="rest-completed-notice card">
              <CheckCircle2 size={64} className="text-green" />
              <h3>Pausa completada</h3>
              <p>
                Vuelve a entrenar cuando te sientas preparado.
              </p>
            </div>
          )}
        </div>

        <ul className="rest-tips-grid" aria-label="Consejos para la pausa">
          <li className="rest-tip-card">
            <strong>Bebe agua</strong>
            <p>Toma un poco de agua si te apetece.</p>
          </li>
          <li className="rest-tip-card">
            <strong>Descansa la vista</strong>
            <p>Mira un momento lejos de la pantalla.</p>
          </li>
          <li className="rest-tip-card">
            <strong>Ponte cómodo</strong>
            <p>Busca una postura cómoda para descansar.</p>
          </li>
        </ul>

        {/* Botonera de control táctil */}
        <div className="rest-modal-actions">
          {!isCompleted ? (
            <>
              <button
                className="touch-btn touch-btn-secondary touch-btn-large"
                onClick={handleTogglePlay}
              >
                {isRunning ? <Pause size={22} /> : <Play size={22} />}
                <span>{isRunning ? 'Pausar' : 'Reanudar'}</span>
              </button>

              <button
                className="touch-btn touch-btn-primary touch-btn-large"
                onClick={handleFinishEarly}
              >
                <span>Volver al entrenamiento</span>
                <ArrowRight size={22} />
              </button>
            </>
          ) : (
            <button
              className="touch-btn touch-btn-success touch-btn-large"
              onClick={handleFinishEarly}
            >
              <CheckCircle2 size={24} />
              <span>Volver al entrenamiento</span>
            </button>
          )}

          <button
            className="touch-btn touch-btn-tertiary"
            onClick={() => {
              soundService.playTap();
              onClose();
            }}
          >
            Cerrar ventana
          </button>
        </div>
      </div>
    </ModalFrame>
  );
};
