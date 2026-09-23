import { useGameSession } from '../components/GameSession';
import { PaperTarget } from '../components/PaperTarget';
import React, { useState, useEffect } from 'react';
import { ExerciseWrapper } from '../components/ExerciseWrapper';
import type { ExerciseResult, UserProfile, MistakeDetail } from '../types';
import { soundService } from '../services/soundService';

interface PlanProgress {
  current: number;
  total: number;
  isLast: boolean;
}

interface MotorCoordinationGameProps {
  profile: UserProfile;
  onBack: () => void;
  onSaveResult: (result: ExerciseResult) => void;
  planProgress?: PlanProgress | null;
  onNextPlanExercise?: () => void;
}

interface TargetPosition {
  x: number; // Porcentaje de 15% a 85%
  y: number; // Porcentaje de 20% a 80%
  size: number;
}

export const MotorCoordinationGame: React.FC<MotorCoordinationGameProps> = ({
  onBack,
  onSaveResult,
  planProgress,
  onNextPlanExercise,
}) => {
  const { clock } = useGameSession();
  const totalTargets = 8;
  const targetSize = 140; // Diana ampliada para máxima accesibilidad y visibilidad

  // Generar secuencia de posiciones aleatorias seguras
  const generateRandomTargets = (count: number, size: number): TargetPosition[] => {
    const list: TargetPosition[] = [];
    for (let i = 0; i < count; i++) {
      // Alternar lado izquierdo (20% a 40%) y lado derecho (60% a 80%) para equidad visual
      const isLeft = i % 2 === 0;
      const minX = isLeft ? 20 : 60;
      const maxX = isLeft ? 40 : 80;

      const x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
      const y = Math.floor(Math.random() * (72 - 24 + 1)) + 24; // 24% a 72%
      list.push({ x, y, size });
    }
    return list;
  };

  const [targets, setTargets] = useState<TargetPosition[]>(() => generateRandomTargets(totalTargets, targetSize));
  const [targetIdx, setTargetIdx] = useState(0);
  const [touches, setTouches] = useState<{ x: number; y: number; id: number }[]>([]);
  const [accuracySum, setAccuracySum] = useState(0);
  const [misses, setMisses] = useState(0);
  const [mistakesList, setMistakesList] = useState<MistakeDetail[]>([]);
  const [startTime, setStartTime] = useState<number>(clock.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<ExerciseResult | null>(null);

  const initGame = () => {
    setTargets(generateRandomTargets(totalTargets, targetSize));
    setTargetIdx(0);
    setTouches([]);
    setAccuracySum(0);
    setMisses(0);
    setMistakesList([]);
    setIsCompleted(false);
    setResult(null);
    setStartTime(clock.now());
  };

  useEffect(() => {
    initGame();
  }, []);

  if (targets.length === 0) return null;

  const currentTarget = targets[targetIdx] || targets[0];

  const handleTargetTouch = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (isCompleted) return;

    soundService.playSuccess();

    const newTouch = { x: currentTarget.x, y: currentTarget.y, id: clock.now() };
    setTouches(prev => [...prev, newTouch]);

    const newSum = accuracySum + 95;
    setAccuracySum(newSum);

    if (targetIdx + 1 < targets.length) {
      setTargetIdx(prev => prev + 1);
    } else {
      const elapsedSeconds = Math.max(15, Math.round((clock.now() - startTime) / 1000));
      const avgAccuracy = Math.max(50, Math.round((targets.length / (targets.length + misses)) * 100));
      const finalScore = Math.round(avgAccuracy * 5);

      const gameResult: ExerciseResult = {
        id: 'res-' + clock.now(),
        exerciseId: 'motor-target',
        domain: 'motor',
        date: new Date().toISOString(),
        durationSeconds: elapsedSeconds,
        accuracy: avgAccuracy,
        score: finalScore,
        correctAnswers: targets.length,
        totalQuestions: targets.length + misses,
        feedbackMessage:
          'Has completado el juego de dianas. Gracias por practicar a tu ritmo.',
        mistakesList,
      };

      setResult(gameResult);
      setIsCompleted(true);
      onSaveResult(gameResult);
    }
  };

  const handleArenaClick = () => {
    if (isCompleted) return;
    soundService.playGentlePrompt();
    setMisses(prev => prev + 1);
    setMistakesList(prev => [
      ...prev,
      {
        id: 'motor-' + clock.now(),
        item: `Diana ${targetIdx + 1} de ${targets.length}`,
        userAction: 'Pulsación fuera del perímetro de la diana circular',
        correctSolution: 'Apuntar al círculo central iluminado con la yema del dedo',
        explanation: 'Intenta apoyar el antebrazo en la mesa para ganar estabilidad postural.',
      },
    ]);
  };

  return (
    <ExerciseWrapper
      exerciseId="motor-target"
      title={`Toca la Diana (${targetIdx + 1}/${targets.length})`}
      domain="motor"
      instructionText="Toca el centro de la diana de papel. Sin prisa, una a una."
      hideBadges={true}
      hideInstructionBanner={true}
      onBack={onBack}
      isCompleted={isCompleted}
      result={result}
      onRestart={initGame}
      planProgress={planProgress}
      onNextPlanExercise={onNextPlanExercise}
    >
      <div className="motor-game-container">
        <div className="motor-touch-arena" onClick={handleArenaClick}>
          {/* Círculos verdes de toques previos (siempre por debajo de la diana activa) */}
          {touches.map(t => (
            <div
              key={t.id}
              className="touch-ripple-effect"
              style={{ left: `${t.x}%`, top: `${t.y}%` }}
              aria-hidden="true"
            />
          ))}

          {/* Diana activa - siempre por encima y con prioridad de clic */}
          <button
            className="motor-target-circle pulse-target"
            style={{
              left: `clamp(${currentTarget.size / 2 + 8}px, ${currentTarget.x}%, calc(100% - ${currentTarget.size / 2 + 8}px))`,
              top: `${currentTarget.y}%`,
              width: `${currentTarget.size}px`,
              height: `${currentTarget.size}px`,
            }}
            onClick={handleTargetTouch}
            onTouchStart={handleTargetTouch}
            aria-label="Tocar diana de coordinación"
          >
            <PaperTarget variant="target" />
          </button>
        </div>
      </div>
    </ExerciseWrapper>
  );
};
