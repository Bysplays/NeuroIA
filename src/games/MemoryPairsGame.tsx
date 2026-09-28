import { GAME_OBJECT_POOL, shuffle } from '../services/gameObjectPool';
import { useGameSession } from '../services/gameSession';
import { GameObject } from '../components/GameObject';
import React, { useState, useEffect, useRef, useCallback, type CSSProperties } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ExerciseWrapper } from '../components/ExerciseWrapper';
import type { ExerciseResult, UserProfile, MistakeDetail } from '../types';
import { soundService } from '../services/soundService';

interface PlanProgress {
  current: number;
  total: number;
  isLast: boolean;
}

interface MemoryPairsGameProps {
  profile: UserProfile;
  onBack: () => void;
  onSaveResult: (result: ExerciseResult) => void;
  planProgress?: PlanProgress | null;
  onNextPlanExercise?: () => void;
}

interface CardItem {
  id: number;
  pairKey: string;
  emoji: string;
  label: string;
  isFlipped: boolean;
  isMatched: boolean;
}

function createDeck(pairs: number, level: number): CardItem[] {
  // Generate the configured number of pairs.
  const deck: CardItem[] = [];
  let idCounter = 1;

  // Higher levels favor visually related objects from the shared pool.
  const groups = ['food', 'clothes', 'kitchen', 'tools'];
  const category = shuffle(groups)[0];
  const similar = shuffle(GAME_OBJECT_POOL.filter(item => item.category === category));
  const pool = level >= 5 ? [...similar, ...shuffle(GAME_OBJECT_POOL.filter(item => item.category !== category))] : shuffle(GAME_OBJECT_POOL);
  const selectedObjects = pool.slice(0, pairs).map(item => ({ pairKey: item.symbol, emoji: item.symbol, label: item.name }));

  selectedObjects.forEach(obj => {
    deck.push({
      id: idCounter++,
      pairKey: obj.pairKey,
      emoji: obj.emoji,
      label: obj.label,
      isFlipped: true, // Mantener volteadas durante el preview
      isMatched: false,
    });
    deck.push({
      id: idCounter++,
      pairKey: obj.pairKey,
      emoji: obj.emoji,
      label: obj.label,
      isFlipped: true, // Mantener volteadas durante el preview
      isMatched: false,
    });
  });

  return shuffle(deck);
}

export const MemoryPairsGame: React.FC<MemoryPairsGameProps> = ({
  onBack,
  onSaveResult,
  planProgress,
  onNextPlanExercise,
}) => {
  const { clock, config } = useGameSession();
  const [cards, setCards] = useState<CardItem[]>(() => createDeck(config.pairs, config.level));
  const [selectedCards, setSelectedCards] = useState<number[]>([]); // índices de las cartas volteadas
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [mistakesList, setMistakesList] = useState<MistakeDetail[]>([]);
  const [startTime, setStartTime] = useState<number>(clock.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<ExerciseResult | null>(null);

  // Fase de memorización inicial (4 segundos)
  const [isPreviewPhase, setIsPreviewPhase] = useState(true);
  const [previewCountdown, setPreviewCountdown] = useState(config.previewSeconds);
  const countdownTimerRef = useRef<number | null>(null);

  const endPreview = useCallback(() => {
    if (countdownTimerRef.current) {
      clock.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setIsPreviewPhase(false);
    setCards(prev => prev.map(c => ({ ...c, isFlipped: false })));
    soundService.playGentlePrompt();
    soundService.speak('¡Encuentra las parejas!');
  }, [clock]);

  const [previewVersion, setPreviewVersion] = useState(0);
  const mismatchTimerRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    soundService.speak('Memoriza dónde está cada pareja');
    let remaining = config.previewSeconds;
    const timer = clock.setInterval(() => {
      remaining -= 1;
      setPreviewCountdown(remaining);
      if (remaining <= 0) endPreview();
    }, 1000);
    countdownTimerRef.current = timer;
    return () => {
      clock.clearInterval(timer);
      clock.clearTimeout(mismatchTimerRef.current);
    };
  }, [clock, endPreview, previewVersion, config.previewSeconds]);

  const initGame = () => {
    setStartTime(clock.now());
    setHintsUsed(0);
    const shuffled = createDeck(config.pairs, config.level);
    setCards(shuffled);
    setSelectedCards([]);
    setIsEvaluating(false);
    setAttempts(0);
    setMistakesList([]);
    setIsCompleted(false);
    setResult(null);
    setIsPreviewPhase(true);
    setPreviewCountdown(config.previewSeconds);
    setPreviewVersion(version => version + 1);
  };

  const handleCardClick = (index: number) => {
    if (isPreviewPhase || isEvaluating || cards[index].isFlipped || cards[index].isMatched) return;

    soundService.playTap();

    const newCards = cards.map((card, i) => i === index ? { ...card, isFlipped: true } : card);
    setCards(newCards);

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setIsEvaluating(true);
      setAttempts(prev => prev + 1);

      const [firstIdx, secondIdx] = newSelected;
      const cardA = newCards[firstIdx];
      const cardB = newCards[secondIdx];

      if (cardA.pairKey === cardB.pairKey) {
        // ¡Coincidencia!
        soundService.playSuccess();
        soundService.speak(`¡Pareja de ${cardA.label}!`);
        const matchedCards = newCards.map((card, i) =>
          i === firstIdx || i === secondIdx ? { ...card, isMatched: true } : card);
        setCards(matchedCards);
        setSelectedCards([]);
        setIsEvaluating(false);

        // Comprobar si todas las cartas están resueltas
        const allMatched = matchedCards.every(c => c.isMatched);
        if (allMatched) {
          handleGameFinish(attempts + 1, mistakesList);
        }
      } else {
        // No coinciden
        soundService.playGentlePrompt();
        setMistakesList(prev => [
          ...prev,
          {
            id: 'pair-' + clock.now(),
            item: `Intento entre ${cardA.label} y ${cardB.label}`,
            userAction: 'Seleccionaste dos cartas distintas',
            correctSolution: 'Recordar su ubicación para emparejarlas',
            explanation: 'La memoria visual mejora al retener dónde viste cada objeto.',
          },
        ]);

        mismatchTimerRef.current = clock.setTimeout(() => {
          setCards(current => current.map((card, i) =>
            i === firstIdx || i === secondIdx ? { ...card, isFlipped: false } : card));
          setSelectedCards([]);
          setIsEvaluating(false);
        }, 1300);
      }
    }
  };

  const handleGameFinish = (finalAttempts: number, mistakes: MistakeDetail[]) => {
    const elapsedSeconds = Math.max(15, Math.round((clock.now() - startTime) / 1000));
    // Precisión basada en intentos óptimos (3 intentos perfectos)
    const accuracy = Math.min(100, Math.max(0, Math.round((config.pairs / Math.max(config.pairs, finalAttempts)) * 100)));

    const gameResult: ExerciseResult = {
      id: crypto.randomUUID(),
      level: config.level,
      configVersion: config.version,
      hintsUsed,
      practice: config.mode !== 'normal',
      exerciseId: 'memory-pairs',
      domain: 'memory',
      date: new Date().toISOString(),
      durationSeconds: elapsedSeconds,
      accuracy,
      score: 300 + Math.max(0, 200 - (finalAttempts - config.pairs) * 30),
      correctAnswers: config.pairs,
      totalQuestions: finalAttempts,
      feedbackMessage:
        accuracy >= 80
          ? '¡Buen trabajo! Has encontrado las parejas con precisión.'
          : 'Has practicado recordando la posición de las cartas. Cada intento cuenta.',
      mistakesList: mistakes,
    };

    setResult(gameResult);
    setIsCompleted(true);
    onSaveResult(gameResult);
  };

  const matchedCount = cards.filter(c => c.isMatched).length / 2;

  return (
    <ExerciseWrapper
      exerciseId="memory-pairs"
      title={`Parejas de Memoria (${matchedCount}/${config.pairs} Parejas)`}
      domain="memory"
      instructionText={
        isPreviewPhase
          ? "Memoriza la ubicación de cada objeto antes de que se tapen las cartas."
          : "Toca dos cartas para voltearlas y encontrar las parejas de objetos iguales."
      }
      hideBadges={true}
      hideInstructionBanner={true}
      onBack={onBack}
      isCompleted={isCompleted}
      result={result}
      onRestart={initGame}
      planProgress={planProgress}
      onNextPlanExercise={onNextPlanExercise}
    >
      <div className="memory-pairs-game-container">
        <div className="pairs-board-card">
          <div className="pairs-status-bar">
              <span className="pairs-stat-pill">Parejas encontradas: <strong>{matchedCount} de {config.pairs}</strong></span>
              <span className="pairs-stat-pill">Intentos: <strong>{attempts}</strong></span>
              <button className={`paper-nav-button pairs-preview-control${isPreviewPhase ? ' touch-btn-primary' : ''}`}
                aria-label={isPreviewPhase ? `Se ocultan en ${previewCountdown} segundos. Empezar ahora` : 'Volver a ver las cartas'}
                onClick={() => {
                if (isPreviewPhase) { endPreview(); return; }
                clock.clearTimeout(mismatchTimerRef.current);
                setSelectedCards([]); setIsEvaluating(false);
                setHintsUsed(value => value + 1);
                setCards(previous => previous.map(card => ({ ...card, isFlipped: true })));
                setIsPreviewPhase(true); setPreviewCountdown(config.previewSeconds);
                setPreviewVersion(value => value + 1);
              }}><span className={isPreviewPhase ? 'pairs-preview-label-hidden' : undefined}>Volver a ver las cartas</span>
                {isPreviewPhase && <span className="pairs-preview-countdown">{previewCountdown} s</span>}
              </button>
            </div>

          <div className="pairs-grid" style={{
            '--pair-columns': config.pairs,
            '--pair-mobile-columns': config.pairs <= 3 ? config.pairs : config.pairs === 6 ? 3 : 2,
          } as CSSProperties}>
            {cards.map((card, idx) => (
              <button
                key={card.id}
                className={`card memory-card-tile ${!isPreviewPhase ? 'card-interactive' : 'tile-preview'} ${card.isFlipped ? 'tile-flipped' : ''} ${card.isMatched ? 'tile-matched' : ''}`}
                onClick={() => handleCardClick(idx)}
                disabled={isPreviewPhase || card.isMatched}
                aria-label={card.isFlipped || card.isMatched ? card.label : `Carta ${idx + 1}. Descubrir`}
              >
                {card.isFlipped || card.isMatched ? (
                  <div className="tile-front animate-fade-in">
                    <span className="tile-emoji"><GameObject symbol={card.emoji} /></span>
                    <strong className="tile-label">{card.label}</strong>
                    {card.isMatched && <CheckCircle2 size={24} className="tile-matched-badge" />}
                  </div>
                ) : (
                  <div className="tile-back animate-fade-in">
                    <img src={`${import.meta.env.BASE_URL}brand/neuroia-mark.svg`} className="tile-back-mark" alt="" />
                    <span className="tile-back-hint">Toca</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ExerciseWrapper>
  );
};
