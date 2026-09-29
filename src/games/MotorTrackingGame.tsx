import { useGameSession } from '../services/gameSession';
import React, { useState, useEffect, useRef, useEffectEvent } from 'react';
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


export const MotorTrackingGame: React.FC<MotorTrackingGameProps> = ({
  onBack,
  onSaveResult,
  planProgress,
  onNextPlanExercise,
}) => {
  const { clock, config } = useGameSession();
  const REQUIRED_CONTACT_SECONDS = config.contactSeconds;
  const TARGET_SIZE = config.targetSize;
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const keyboard = useRef(false);
  const arenaRef = useRef<HTMLDivElement | null>(null);

  // Posición del objetivo (porcentajes de 0 a 100)
  const [targetPos, setTargetPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [velocity, setVelocity] = useState<{ vx: number; vy: number }>({ vx: config.trackingSpeed, vy: config.trackingSpeed * 0.8 });
  const [isHoveringOrTouching, setIsHoveringOrTouching] = useState(false);
  const [contactTime, setContactTime] = useState(0); // en segundos
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<ExerciseResult | null>(null);

  const startTimeRef = useRef<number>(clock.now());
  const isTouchingRef = useRef(false);

  // Iniciar / reiniciar juego
  const initGame = () => {
    setTargetPos({ x: 50, y: 50 });
    setVelocity({ vx: config.trackingSpeed, vy: config.trackingSpeed * 0.8 });
    setIsHoveringOrTouching(false);
    setContactTime(0);
    setIsCompleted(false);
    setResult(null);
    startTimeRef.current = clock.now();
    isTouchingRef.current = false;
    keyboard.current = false;
    pointer.current = null;
  };

  const handlePointerDownTarget = (e: React.PointerEvent) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointer.current = { x: e.clientX, y: e.clientY };
    isTouchingRef.current = true;
    setIsHoveringOrTouching(true);
    soundService.playTap();
  };

  const handlePointerUp = () => {
    pointer.current = null;
    keyboard.current = false;
    isTouchingRef.current = false;
    setIsHoveringOrTouching(false);
  };

  const handlePointerMoveArena = (e: React.PointerEvent) => {
    if (!isTouchingRef.current || !arenaRef.current) return;

    pointer.current = { x: e.clientX, y: e.clientY };
  };

  const handleCompleteGame = () => {
    if (isCompleted) return;
    setIsCompleted(true);
    isTouchingRef.current = false;
    setIsHoveringOrTouching(false);

    const elapsedSeconds = Math.max(REQUIRED_CONTACT_SECONDS, Math.round((clock.now() - startTimeRef.current) / 1000));
    // Precisión calculada por ratio de contacto mantenido
    const accuracy = Math.min(100, Math.max(0, Math.round((REQUIRED_CONTACT_SECONDS / elapsedSeconds) * 100)));

    const mistakesList: MistakeDetail[] = [];
    if (elapsedSeconds > REQUIRED_CONTACT_SECONDS + 6) {
      mistakesList.push({
        id: 'track-' + clock.now(),
        item: 'Mantenimiento del contacto continuo',
        userAction: `Completado en ${elapsedSeconds}s`,
        correctSolution: `Meta ideal: ${REQUIRED_CONTACT_SECONDS}s de contacto continuo`,
        explanation: 'Se acumuló tiempo sin contacto. Puedes volver a practicar a tu ritmo.',
      });
    }

    const gameResult: ExerciseResult = {
      id: crypto.randomUUID(),
      level: config.level,
      configVersion: config.version,
      practice: config.mode !== 'normal',
      exerciseId: 'motor-tracking',
      domain: 'motor',
      date: new Date().toISOString(),
      durationSeconds: elapsedSeconds,
      accuracy,
      score: Math.round(accuracy * 5),
      correctAnswers: REQUIRED_CONTACT_SECONDS,
      totalQuestions: elapsedSeconds,
      feedbackMessage:
        accuracy >= 85
          ? '¡Buen trabajo! Has seguido la diana con precisión.'
          : 'Has practicado siguiendo una diana en movimiento. Cada intento cuenta.',
      mistakesList,
    };

    setResult(gameResult);
    onSaveResult(gameResult);
  };

  // Timer callbacks use committed state; state updaters never save results or
  // schedule other state updates (React may replay an updater in StrictMode).
  const advanceFrame = useEffectEvent((deltaMs: number) => {
    let newX = targetPos.x + velocity.vx * (deltaMs / 16);
    let newY = targetPos.y + velocity.vy * (deltaMs / 16);
    let newVx = velocity.vx;
    let newVy = velocity.vy;
    const arena = arenaRef.current?.getBoundingClientRect();
    const scale = arena && arenaRef.current?.offsetWidth ? arena.width / arenaRef.current.offsetWidth : 1;
    const renderedTargetSize = TARGET_SIZE * scale;
    const marginX = Math.min(50, Math.max(14, (renderedTargetSize / 2 + 8 * scale) / (arena?.width || 600) * 100));
    const marginY = Math.min(50, Math.max(14, (renderedTargetSize / 2 + 8 * scale) / (arena?.height || 400) * 100));
    if (newX < marginX) { newX = marginX; newVx = Math.abs(newVx); }
    else if (newX > 100 - marginX) { newX = 100 - marginX; newVx = -Math.abs(newVx); }
    if (newY < marginY) { newY = marginY; newVy = Math.abs(newVy); }
    else if (newY > 100 - marginY) { newY = 100 - marginY; newVy = -Math.abs(newVy); }
    setTargetPos({ x: newX, y: newY });
    setVelocity({ vx: newVx, vy: newVy });
    const point = pointer.current;
    const contact = keyboard.current || (!!arena && !!point && isTouchingRef.current
      && Math.hypot(point.x - (arena.left + newX / 100 * arena.width), point.y - (arena.top + newY / 100 * arena.height)) <= renderedTargetSize / 2);
    setIsHoveringOrTouching(contact);
    if (contact) {
      const next = contactTime + deltaMs / 1000;
      setContactTime(next);
      if (next >= REQUIRED_CONTACT_SECONDS) {
        handleCompleteGame();
        return false;
      }
    }
    return true;
  });

  useEffect(() => {
    if (isCompleted) return;
    let previous = clock.performanceNow();
    let frame: number;
    const tick = (timestamp: number) => {
      const delta = timestamp - previous;
      previous = timestamp;
      if (advanceFrame(delta)) frame = clock.requestAnimationFrame(tick);
    };
    frame = clock.requestAnimationFrame(tick);
    return () => clock.cancelAnimationFrame(frame);
  }, [clock, isCompleted]);

  const progressPercent = Math.min(100, Math.round((contactTime / REQUIRED_CONTACT_SECONDS) * 100));

  return (
    <ExerciseWrapper
      exerciseId="motor-tracking"
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
          <button
            type="button"
            aria-label="Mantén pulsado para acompañar al personaje; con teclado, mantén Espacio"
            onKeyDown={event => { if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); keyboard.current = true; } }}
            onKeyUp={handlePointerUp}
            onBlur={handlePointerUp}
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
          </button>
        </div>
      </div>
    </ExerciseWrapper>
  );
};
