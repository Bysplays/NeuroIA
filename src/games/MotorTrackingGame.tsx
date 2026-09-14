import React, { useState, useEffect, useRef } from 'react';
import { PaperTarget } from '../components/PaperTarget';
import { ExerciseWrapper } from '../components/ExerciseWrapper';
import type { ExerciseResult, UserProfile, MistakeDetail } from '../types';
import { soundService } from '../services/soundService';

interface PlanProgress {
  current: number;
  total: number;
  isLast: boolean;
}

interface MotorTrackingGameProps {
  profile: UserProfile;
  onBack: () => void;
  onSaveResult: (result: ExerciseResult) => void;
  planProgress?: PlanProgress | null;
  onNextPlanExercise?: () => void;
}

const REQUIRED_CONTACT_SECONDS = 12; // 12 segundos acumulados de contacto continuo
const TARGET_SIZE = 140; // Diana significativamente más grande (140px)

export const MotorTrackingGame: React.FC<MotorTrackingGameProps> = ({
  onBack,
  onSaveResult,
  planProgress,
  onNextPlanExercise,
}) => {
  const arenaRef = useRef<HTMLDivElement | null>(null);

  // Posición del objetivo (porcentajes de 0 a 100)
  const [targetPos, setTargetPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [velocity, setVelocity] = useState<{ vx: number; vy: number }>({ vx: 0.16, vy: 0.13 });
  const [isHoveringOrTouching, setIsHoveringOrTouching] = useState(false);
  const [contactTime, setContactTime] = useState(0); // en segundos
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<ExerciseResult | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number | null>(null);
  const isTouchingRef = useRef(false);

  // Iniciar / reiniciar juego
  const initGame = () => {
    setTargetPos({ x: 50, y: 50 });
    setVelocity({ vx: 0.16, vy: 0.13 });
    setIsHoveringOrTouching(false);
    setContactTime(0);
    setIsCompleted(false);
    setResult(null);
    startTimeRef.current = Date.now();
    isTouchingRef.current = false;
  };

  useEffect(() => {
    initGame();
  }, []);

  // Bucle de animación física suave del objetivo móvil
  useEffect(() => {
    if (isCompleted) return;

    let lastTimestamp = performance.now();

    const updatePhysics = (timestamp: number) => {
      const deltaMs = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      setTargetPos(prev => {
        let newX = prev.x + velocity.vx * (deltaMs / 16);
        let newY = prev.y + velocity.vy * (deltaMs / 16);
        let newVx = velocity.vx;
        let newVy = velocity.vy;

        const arena = arenaRef.current?.getBoundingClientRect();
        const marginX = Math.min(50, Math.max(14, (TARGET_SIZE / 2 + 8) / (arena?.width || 600) * 100));
        const marginY = Math.min(50, Math.max(14, (TARGET_SIZE / 2 + 8) / (arena?.height || 400) * 100));

        // Keep the whole paper token visible, including on narrow screens.
        if (newX < marginX) {
          newX = marginX;
          newVx = Math.abs(newVx);
        } else if (newX > 100 - marginX) {
          newX = 100 - marginX;
          newVx = -Math.abs(newVx);
        }

        if (newY < marginY) {
          newY = marginY;
          newVy = Math.abs(newVy);
        } else if (newY > 100 - marginY) {
          newY = 100 - marginY;
          newVy = -Math.abs(newVy);
        }

        setVelocity({ vx: newVx, vy: newVy });
        return { x: newX, y: newY };
      });

      // Si está tocando, sumar tiempo de contacto
      if (isTouchingRef.current) {
        setContactTime(prev => {
          const next = prev + deltaMs / 1000;
          if (next >= REQUIRED_CONTACT_SECONDS) {
            handleCompleteGame();
          }
          return next;
        });
      }

      animationFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animationFrameRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCompleted, velocity]);

  const handlePointerDownTarget = (e: React.PointerEvent) => {
    e.preventDefault();
    isTouchingRef.current = true;
    setIsHoveringOrTouching(true);
    soundService.playTap();
  };

  const handlePointerUp = () => {
    isTouchingRef.current = false;
    setIsHoveringOrTouching(false);
  };

  const handlePointerMoveArena = (e: React.PointerEvent) => {
    if (!isTouchingRef.current || !arenaRef.current) return;

    const arenaRect = arenaRef.current.getBoundingClientRect();
    const touchX = ((e.clientX - arenaRect.left) / arenaRect.width) * 100;
    const touchY = ((e.clientY - arenaRect.top) / arenaRect.height) * 100;

    // Comprobar distancia al objetivo
    const dx = touchX - targetPos.x;
    const dy = touchY - targetPos.y;
    const distancePercent = Math.sqrt(dx * dx + dy * dy);

    // Margen amplio de tolerancia táctil acorde a la diana grande
    if (distancePercent < 18) {
      setIsHoveringOrTouching(true);
    } else {
      setIsHoveringOrTouching(false);
    }
  };

  const handleCompleteGame = () => {
    if (isCompleted) return;
    setIsCompleted(true);
    isTouchingRef.current = false;
    setIsHoveringOrTouching(false);

    const elapsedSeconds = Math.max(REQUIRED_CONTACT_SECONDS, Math.round((Date.now() - startTimeRef.current) / 1000));
    // Precisión calculada por ratio de contacto mantenido
    const accuracy = Math.min(100, Math.max(70, Math.round((REQUIRED_CONTACT_SECONDS / elapsedSeconds) * 100)));

    const mistakesList: MistakeDetail[] = [];
    if (elapsedSeconds > REQUIRED_CONTACT_SECONDS + 6) {
      mistakesList.push({
        id: 'track-' + Date.now(),
        item: 'Mantenimiento del contacto continuo',
        userAction: `Completado en ${elapsedSeconds}s`,
        correctSolution: `Meta ideal: ${REQUIRED_CONTACT_SECONDS}s de contacto continuo`,
        explanation: 'En ocasiones el dedo se desvió del círculo móvil. El reentrenamiento progresivo mejorará la estabilidad.',
      });
    }

    const gameResult: ExerciseResult = {
      id: 'res-' + Date.now(),
      exerciseId: 'motor-tracking',
      domain: 'motor',
      date: new Date().toISOString().split('T')[0],
      durationSeconds: elapsedSeconds,
      accuracy,
      score: Math.round(accuracy * 5),
      correctAnswers: REQUIRED_CONTACT_SECONDS,
      totalQuestions: REQUIRED_CONTACT_SECONDS,
      feedbackMessage:
        accuracy >= 85
          ? '¡Excelente precisión visomotora! Has mantenido el seguimiento continuo de forma impecable.'
          : '¡Buen entrenamiento de coordinación! Seguir objetivos móviles fortalece la propiocepción de tu mano.',
      mistakesList,
    };

    setResult(gameResult);
    onSaveResult(gameResult);
  };

  const progressPercent = Math.min(100, Math.round((contactTime / REQUIRED_CONTACT_SECONDS) * 100));

  return (
    <ExerciseWrapper
      title="Sigue a tu compañero"
      domain="motor"
      instructionText="Acompaña al personaje con el dedo o el puntero mientras se mueve."
      hideBadges={true}
      hideInstructionBanner={true}
      onBack={onBack}
      isCompleted={isCompleted}
      result={result}
      onRestart={initGame}
      planProgress={planProgress}
      onNextPlanExercise={onNextPlanExercise}
    >
      <div className="motor-tracking-game-container">
        {/* Barra superior de progreso de contacto */}
        <div className="tracking-progress-header card">
          <div className="tracking-progress-info">
            <span className="tracking-label">Un ratito juntos</span>
            <strong className="tracking-percent">{progressPercent}%</strong>
          </div>
          <div className="tracking-progress-bar-bg">
            <div
              className={`tracking-progress-fill ${isHoveringOrTouching ? 'tracking-active-glow' : ''}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Arena táctil interactiva */}
        <div
          ref={arenaRef}
          className="motor-tracking-arena card"
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerMove={handlePointerMoveArena}
        >
          {/* Diana móvil */}
          <div
            className={`tracking-target ${isHoveringOrTouching ? 'target-contacted' : ''}`}
            style={{
              left: `${targetPos.x}%`,
              top: `${targetPos.y}%`,
              width: `${TARGET_SIZE}px`,
              height: `${TARGET_SIZE}px`,
            }}
            onPointerDown={handlePointerDownTarget}
          >
            <PaperTarget variant="companion" />
            {isHoveringOrTouching && <div className="tracking-target-halo" />}
          </div>
        </div>
      </div>
    </ExerciseWrapper>
  );
};
