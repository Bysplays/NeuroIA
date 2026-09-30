import { createMemorySequence } from '../services/memorySequence';
import { useGameSession } from '../services/gameSession';
import { GameObject } from '../components/GameObject';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, RotateCcw, Play, Check, X } from 'lucide-react';
import { ExerciseWrapper } from '../components/ExerciseWrapper';
import type { ExerciseResult, UserProfile, MistakeDetail } from '../types';
import { soundService } from '../services/soundService';

interface PlanProgress {
  current: number;
  total: number;
  isLast: boolean;
}

interface MemoryPathGameProps {
  profile: UserProfile;
  onBack: () => void;
  onSaveResult: (result: ExerciseResult) => void;
  planProgress?: PlanProgress | null;
  onNextPlanExercise?: () => void;
}

interface Tile {
  id: number;
  label: string;
  color: string;
  emoji: string;
}

const ALL_TILES: Tile[] = [
  { id: 0, label: 'Azul', color: '#0284c7', emoji: '🌊' },
  { id: 1, label: 'Verde', color: '#059669', emoji: '🌿' },
  { id: 2, label: 'Ámbar', color: '#d97706', emoji: '☀️' },
  { id: 3, label: 'Púrpura', color: '#7c3aed', emoji: '🌸' },
];

export const MemoryPathGame: React.FC<MemoryPathGameProps> = ({
  onBack,
  onSaveResult,
  planProgress,
  onNextPlanExercise,
}) => {
  const { clock, config } = useGameSession();
  const activeTiles = ALL_TILES;
  const maxRounds = config.mode === 'normal' ? 3 : 1;

  const [round, setRound] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [roundDone, setRoundDone] = useState(false);
  const [failure, setFailure] = useState<{ pressed: number; expected: number } | null>(null);
  const [score, setScore] = useState(0);
  const [mistakesList, setMistakesList] = useState<MistakeDetail[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [startTime, setStartTime] = useState<number>(clock.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<ExerciseResult | null>(null);

  const completedRef = useRef(false);
  const timeoutRefs = useRef<number[]>([]);

  const clearTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(t => clock.clearTimeout(t));
    timeoutRefs.current = [];
  }, [clock]);

  useEffect(() => {
    return () => clearTimeouts();
  }, [clearTimeouts]);

  const startCurrentRound = () => {
    clearTimeouts();
    const seqLength = config.sequenceLength; // Fixed for this level throughout the session.

    const newSeq = createMemorySequence(activeTiles.map(tile => tile.id), seqLength);

    setSequence(newSeq);
    setPlayerInput([]);
    setRoundDone(false);
    setFailure(null);
    playSequenceDemo(newSeq);
  };

  const playSequenceDemo = (seq: number[]) => {
    setIsPlayingDemo(true);

    const delayBetweenSteps = config.sequenceStepMs;
    const highlightDuration = config.sequenceStepMs * 0.6;

    seq.forEach((tileId, idx) => {
      const t1 = clock.setTimeout(() => {
        setActiveTile(tileId);
        soundService.playTap();
      }, (idx + 1) * delayBetweenSteps);

      const t2 = clock.setTimeout(() => {
        setActiveTile(null);
      }, (idx + 1) * delayBetweenSteps + highlightDuration);

      timeoutRefs.current.push(t1, t2);
    });

    const totalTime = (seq.length + 1) * delayBetweenSteps + 200;
    const finishTimeout = clock.setTimeout(() => {
      setIsPlayingDemo(false);
      soundService.speak('Tu turno. Toca las fichas en el mismo orden.');
    }, totalTime);
    timeoutRefs.current.push(finishTimeout);
  };

  const handleTileClick = (tileId: number) => {
    if (isPlayingDemo || roundDone || isCompleted || completedRef.current || sequence.length === 0) return;

    soundService.playTap();
    setActiveTile(tileId);
    timeoutRefs.current.push(clock.setTimeout(() => setActiveTile(null), 300));

    const nextInput = [...playerInput, tileId];
    setPlayerInput(nextInput);

    const currentStep = nextInput.length - 1;

    if (tileId !== sequence[currentStep]) {
      clearTimeouts();
      setActiveTile(null);
      setFailure({ pressed: tileId, expected: sequence[currentStep] });
      setRoundDone(true);
      soundService.playGentlePrompt();
      const pressed = ALL_TILES.find(t => t.id === tileId);
      const expected = ALL_TILES.find(t => t.id === sequence[currentStep]);
      setMistakesList(prev => [
        ...prev,
        {
          id: 'mem-' + clock.now(),
          item: `Ronda ${round}: Secuencia de ${sequence.length} fichas`,
          userAction: `Tocaste la ficha ${pressed?.label || tileId} en el paso ${currentStep + 1}`,
          correctSolution: `La ficha correcta en ese paso era ${expected?.label || sequence[currentStep]}`,
          explanation: 'Para secuencias largas, puedes verbalizar mentalmente los nombres de los colores.',
        },
      ]);
      return;
    }

    if (nextInput.length === sequence.length) {
      soundService.playSuccess();
      const newScore = score + Math.round(round * 120);
      setScore(newScore);

      setRoundDone(true);
    }
  };

  const handleRepeatDemo = () => {
    if (isPlayingDemo || roundDone || sequence.length === 0) return;
    clearTimeouts();
    setHintsUsed(value => value + 1);
    setPlayerInput([]);
    setActiveTile(null);
    playSequenceDemo(sequence);
  };

  const continueRound = () => {
    if (!roundDone) return;
    if (failure || round === maxRounds) finishGame(score, !!failure);
    else {
      clearTimeouts();
      setRound(value => value + 1);
      setSequence([]);
      setPlayerInput([]);
      setActiveTile(null);
      setRoundDone(false);
    }
  };

  const finishGame = (finalScore: number, failed = false, mistakes = mistakesList) => {
    if (completedRef.current) return;
    completedRef.current = true;
    const elapsedSeconds = Math.max(20, Math.round((clock.now() - startTime) / 1000));
    const correctRounds = failed ? round - 1 : maxRounds;

    const gameResult: ExerciseResult = {
      id: crypto.randomUUID(),
      level: config.level,
      configVersion: config.version,
      hintsUsed,
      practice: config.mode !== 'normal',
      exerciseId: 'memory-path',
      domain: 'memory',
      date: new Date().toISOString(),
      durationSeconds: elapsedSeconds,
      accuracy: failed ? 0 : 100,
      score: finalScore,
      correctAnswers: correctRounds,
      totalQuestions: failed ? round : maxRounds,
      feedbackMessage:
        'Has completado el juego de luces y secuencias. Puedes volver a jugar a tu ritmo.',
      mistakesList: mistakes,
    };

    setResult(gameResult);
    setIsCompleted(true);
    onSaveResult(gameResult);
  };

  const handleRestart = () => {
    clearTimeouts();
    setIsPlayingDemo(false);
    setActiveTile(null);
    setRoundDone(false);
    setFailure(null);
    completedRef.current = false;
    setHintsUsed(0);
    setRound(1);
    setScore(0);
    setSequence([]);
    setPlayerInput([]);
    setMistakesList([]);
    setIsCompleted(false);
    setResult(null);
    setStartTime(clock.now());
  };

  return (
    <ExerciseWrapper
      completedStages={round - 1 + (roundDone ? 1 : 0)}
      exerciseId="memory-path"
      title="Secuencia de memoria"
      domain="memory"
      instructionText="Mira qué fichas se iluminan. Después, repite el orden."
      hideBadges={true}
      hideInstructionBanner={true}
      onBack={onBack}
      isCompleted={isCompleted}
      result={result}
      onRestart={handleRestart}
      planProgress={planProgress}
      onNextPlanExercise={onNextPlanExercise}
      nextAction={<button
        className={`touch-btn game-next-action ${roundDone || sequence.length === 0 ? 'touch-btn-primary' : 'touch-btn-secondary'}${isPlayingDemo ? ' sequence-playing' : ''}`}
        onClick={roundDone ? continueRound : sequence.length === 0 ? startCurrentRound : handleRepeatDemo}
        disabled={isPlayingDemo}>
        {roundDone ? <>Continuar<ArrowRight size={20} aria-hidden="true"/></> : isPlayingDemo ? 'Reproduciendo' : sequence.length === 0 ? <><Play size={20} aria-hidden="true"/>Comenzar</> : <><RotateCcw size={20} aria-hidden="true"/>Repetir</>}
      </button>}
    >
      <div className="memory-game-container">

        <div
          className="memory-tiles-grid"
          style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}
        >
          {activeTiles.map(tile => {
            const isActive = activeTile === tile.id;
            return (
              <button
                key={tile.id}
                className={`memory-tile ${isActive ? 'tile-active' : ''}${failure?.pressed === tile.id ? ' sequence-incorrect' : ''}${failure?.expected === tile.id ? ' sequence-correct' : ''}`}
                style={{
                  borderColor: failure?.pressed === tile.id ? '#aa6156' : failure?.expected === tile.id ? '#51876a' : undefined,
                  backgroundColor: failure?.pressed === tile.id ? '#f4d9d3' : failure?.expected === tile.id ? '#dceee2' : isActive ? tile.color : undefined,
                  color: isActive ? '#ffffff' : 'var(--color-text-main)',
                }}
                aria-label={`${tile.label}${failure?.pressed === tile.id ? " · Respuesta incorrecta" : failure?.expected === tile.id ? " · Respuesta correcta" : ""}`}
                onClick={() => handleTileClick(tile.id)}
                disabled={isPlayingDemo || roundDone || sequence.length === 0}
              >
                <span className="tile-emoji"><GameObject symbol={tile.emoji} /></span>
                <span className="tile-name">{tile.label}</span>
                {failure?.pressed === tile.id && <X className="sequence-answer-mark" aria-hidden="true"/>}
                {failure?.expected === tile.id && <Check className="sequence-answer-mark" aria-hidden="true"/>}
                {isActive && <div className="tile-glow-ring" />}
              </button>
            );
          })}
        </div>

      </div>
    </ExerciseWrapper>
  );
};
