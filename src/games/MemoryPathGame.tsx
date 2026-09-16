import { useGameSession } from '../components/GameSession';
import { GameObject } from '../components/GameObject';
import React, { useState, useEffect, useRef } from 'react';
import { Eye, RotateCcw, Play } from 'lucide-react';
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
  const { clock } = useGameSession();
  const activeTiles = ALL_TILES;
  const maxRounds = 3;

  const [round, setRound] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState('Pulsa "Comenzar Secuencia" para observar');
  const [score, setScore] = useState(0);
  const [mistakesList, setMistakesList] = useState<MistakeDetail[]>([]);
  const [errorsCount, setErrorsCount] = useState(0);
  const [startTime, setStartTime] = useState<number>(clock.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<ExerciseResult | null>(null);

  const timeoutRefs = useRef<number[]>([]);

  const clearTimeouts = () => {
    timeoutRefs.current.forEach(t => clock.clearTimeout(t));
    timeoutRefs.current = [];
  };

  useEffect(() => {
    return () => clearTimeouts();
  }, []);

  const startCurrentRound = (roundNum: number) => {
    clearTimeouts();
    const seqLength = roundNum + 1; // Ronda 1: 2 pasos, Ronda 2: 3 pasos, Ronda 3: 4 pasos

    const availableIds = activeTiles.map(t => t.id);
    const newSeq: number[] = [];
    for (let i = 0; i < seqLength; i++) {
      const randomTile = availableIds[Math.floor(Math.random() * availableIds.length)];
      newSeq.push(randomTile);
    }

    setSequence(newSeq);
    setPlayerInput([]);
    playSequenceDemo(newSeq);
  };

  const playSequenceDemo = (seq: number[]) => {
    setIsPlayingDemo(true);
    setStatusMessage('Observa atentamente el orden de las fichas...');
    soundService.speak('Observa y memoriza.');

    const delayBetweenSteps = 950;
    const highlightDuration = 550;

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
      setStatusMessage('¡Tu turno! Toca las fichas en el mismo orden que viste.');
      soundService.speak('Tu turno. Toca las fichas en el mismo orden.');
    }, totalTime);
    timeoutRefs.current.push(finishTimeout);
  };

  const handleTileClick = (tileId: number) => {
    if (isPlayingDemo || isCompleted || sequence.length === 0) return;

    soundService.playTap();
    setActiveTile(tileId);
    clock.setTimeout(() => setActiveTile(null), 300);

    const nextInput = [...playerInput, tileId];
    setPlayerInput(nextInput);

    const currentStep = nextInput.length - 1;

    if (tileId !== sequence[currentStep]) {
      soundService.playGentlePrompt();
      setStatusMessage('Casi lo tienes. Puedes pulsar "Ver de nuevo" para recordar la secuencia.');
      soundService.speak('No te preocupes. Pulsa ver de nuevo para recordar.');
      setPlayerInput([]);
      setErrorsCount(prev => prev + 1);

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

      if (round < maxRounds) {
        setStatusMessage(`¡Fantástico! Ronda ${round} superada. Avanzamos a una ficha más.`);
        soundService.speak('¡Muy bien! Añadimos una ficha más.');
        clock.setTimeout(() => {
          setRound(prev => prev + 1);
          startCurrentRound(round + 1);
        }, 1500);
      } else {
        finishGame(newScore);
      }
    }
  };

  const handleRepeatDemo = () => {
    if (isPlayingDemo || sequence.length === 0) return;
    soundService.playGentlePrompt();
    playSequenceDemo(sequence);
  };

  const finishGame = (finalScore: number) => {
    const elapsedSeconds = Math.max(20, Math.round((clock.now() - startTime) / 1000));
    const accuracy = Math.max(50, Math.round((maxRounds / (maxRounds + errorsCount)) * 100));

    const gameResult: ExerciseResult = {
      id: 'res-' + clock.now(),
      exerciseId: 'memory-path',
      domain: 'memory',
      date: new Date().toISOString().split('T')[0],
      durationSeconds: elapsedSeconds,
      accuracy,
      score: finalScore,
      correctAnswers: maxRounds,
      totalQuestions: maxRounds + errorsCount,
      feedbackMessage:
        '¡Gran capacidad de retención inmediata! Has ejercitado la memoria de trabajo y el span visual con éxito.',
      mistakesList,
    };

    setResult(gameResult);
    setIsCompleted(true);
    onSaveResult(gameResult);
  };

  const handleRestart = () => {
    setRound(1);
    setScore(0);
    setSequence([]);
    setPlayerInput([]);
    setErrorsCount(0);
    setMistakesList([]);
    setIsCompleted(false);
    setResult(null);
    setStartTime(clock.now());
  };

  return (
    <ExerciseWrapper
      exerciseId="memory-path"
      title={`Secuencia de Memoria (Ronda ${round}/${maxRounds})`}
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
    >
      <div className="memory-game-container">
        <div className="memory-compact-control-bar">
          <div className="memory-status-badge">
            <Eye size={24} />
            <span>{statusMessage}</span>
          </div>

          <div className="memory-actions">
            {sequence.length === 0 ? (
              <button
                className="touch-btn touch-btn-primary touch-btn-large gentle-bounce"
                onClick={() => startCurrentRound(round)}
              >
                <Play size={24} />
                <span>Comenzar Secuencia</span>
              </button>
            ) : (
              <button
                className="touch-btn touch-btn-secondary touch-btn-large"
                onClick={handleRepeatDemo}
                disabled={isPlayingDemo}
              >
                <RotateCcw size={22} />
                <span>Ver de Nuevo</span>
              </button>
            )}
          </div>
        </div>

        <div
          className="memory-tiles-grid"
          style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}
        >
          {activeTiles.map(tile => {
            const isActive = activeTile === tile.id;
            return (
              <button
                key={tile.id}
                className={`memory-tile ${isActive ? 'tile-active' : ''}`}
                style={{
                  borderColor: tile.color,
                  backgroundColor: isActive ? tile.color : 'var(--color-surface)',
                  color: isActive ? '#ffffff' : 'var(--color-text-main)',
                }}
                onClick={() => handleTileClick(tile.id)}
                disabled={isPlayingDemo || sequence.length === 0}
              >
                <span className="tile-emoji"><GameObject symbol={tile.emoji} /></span>
                <span className="tile-name">{tile.label}</span>
                {isActive && <div className="tile-glow-ring" />}
              </button>
            );
          })}
        </div>
      </div>
    </ExerciseWrapper>
  );
};
