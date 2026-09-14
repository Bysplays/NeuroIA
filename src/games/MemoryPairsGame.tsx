import { GameObject } from '../components/GameObject';
import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Eye, Play } from 'lucide-react';
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

const ALL_MEMORY_OBJECTS = [
  { pairKey: 'reloj', emoji: '⏰', label: 'Reloj' },
  { pairKey: 'casa', emoji: '🏠', label: 'Casa' },
  { pairKey: 'llave', emoji: '🔑', label: 'Llave' },
  { pairKey: 'telefono', emoji: '📱', label: 'Teléfono' },
  { pairKey: 'taza', emoji: '☕', label: 'Taza' },
  { pairKey: 'gafas', emoji: '👓', label: 'Gafas' },
  { pairKey: 'zapato', emoji: '👟', label: 'Zapato' },
  { pairKey: 'manzana', emoji: '🍎', label: 'Manzana' },
  { pairKey: 'pan', emoji: '🥖', label: 'Pan' },
  { pairKey: 'cuchara', emoji: '🥄', label: 'Cuchara' },
  { pairKey: 'camisa', emoji: '👕', label: 'Camisa' },
  { pairKey: 'coche', emoji: '🚗', label: 'Coche' },
  { pairKey: 'silla', emoji: '🪑', label: 'Silla' },
  { pairKey: 'lampara', emoji: '💡', label: 'Lámpara' },
  { pairKey: 'libro', emoji: '📖', label: 'Libro' },
  { pairKey: 'tijeras', emoji: '✂️', label: 'Tijeras' },
  { pairKey: 'cepillo', emoji: '🪥', label: 'Cepillo' },
  { pairKey: 'paraguas', emoji: '☂️', label: 'Paraguas' },
  { pairKey: 'bicicleta', emoji: '🚲', label: 'Bicicleta' },
  { pairKey: 'flor', emoji: '🌻', label: 'Girasol' },
  { pairKey: 'gato', emoji: '🐱', label: 'Gato' },
  { pairKey: 'perro', emoji: '🐶', label: 'Perro' },
  { pairKey: 'platano', emoji: '🍌', label: 'Plátano' },
  { pairKey: 'cama', emoji: '🛏️', label: 'Cama' },
  { pairKey: 'guitarra', emoji: '🎸', label: 'Guitarra' },
  { pairKey: 'radio', emoji: '📻', label: 'Radio' },
  { pairKey: 'plato', emoji: '🍽️', label: 'Plato' },
  { pairKey: 'sombrero', emoji: '👒', label: 'Sombrero' },
  { pairKey: 'vaso', emoji: '🥛', label: 'Vaso' },
  { pairKey: 'toalla', emoji: '🧴', label: 'Jabón' },
];

export const MemoryPairsGame: React.FC<MemoryPairsGameProps> = ({
  onBack,
  onSaveResult,
  planProgress,
  onNextPlanExercise,
}) => {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]); // índices de las cartas volteadas
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [mistakesList, setMistakesList] = useState<MistakeDetail[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<ExerciseResult | null>(null);

  // Fase de memorización inicial (4 segundos)
  const [isPreviewPhase, setIsPreviewPhase] = useState(true);
  const [previewCountdown, setPreviewCountdown] = useState(4);
  const countdownTimerRef = useRef<number | null>(null);

  const startPreview = () => {
    setIsPreviewPhase(true);
    setPreviewCountdown(4);
    soundService.speak('Memoriza dónde está cada pareja');

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    let remaining = 4;
    countdownTimerRef.current = window.setInterval(() => {
      remaining -= 1;
      setPreviewCountdown(remaining);
      if (remaining <= 0) {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        endPreview();
      }
    }, 1000);
  };

  const endPreview = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setIsPreviewPhase(false);
    setCards(prev => prev.map(c => ({ ...c, isFlipped: false })));
    soundService.playGentlePrompt();
    soundService.speak('¡Encuentra las parejas!');
    setStartTime(Date.now());
  };

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  const initGame = () => {
    // Generar 3 pares (6 cartas) barajadas
    const deck: CardItem[] = [];
    let idCounter = 1;

    // Seleccionar 3 objetos al azar del banco de 30 objetos cotidianos
    const selectedObjects = [...ALL_MEMORY_OBJECTS]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

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

    const shuffled = deck.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setSelectedCards([]);
    setIsEvaluating(false);
    setAttempts(0);
    setMistakesList([]);
    setIsCompleted(false);
    setResult(null);
    startPreview();
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardClick = (index: number) => {
    if (isPreviewPhase || isEvaluating || cards[index].isFlipped || cards[index].isMatched) return;

    soundService.playTap();

    const newCards = [...cards];
    newCards[index].isFlipped = true;
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
        cardA.isMatched = true;
        cardB.isMatched = true;
        setCards([...newCards]);
        setSelectedCards([]);
        setIsEvaluating(false);

        // Comprobar si todas las cartas están resueltas
        const allMatched = newCards.every(c => c.isMatched);
        if (allMatched) {
          handleGameFinish(attempts + 1, mistakesList);
        }
      } else {
        // No coinciden
        soundService.playGentlePrompt();
        setMistakesList(prev => [
          ...prev,
          {
            id: 'pair-' + Date.now(),
            item: `Intento entre ${cardA.label} y ${cardB.label}`,
            userAction: 'Seleccionaste dos cartas distintas',
            correctSolution: 'Recordar su ubicación para emparejarlas',
            explanation: 'La memoria visual mejora al retener dónde viste cada objeto.',
          },
        ]);

        setTimeout(() => {
          newCards[firstIdx].isFlipped = false;
          newCards[secondIdx].isFlipped = false;
          setCards([...newCards]);
          setSelectedCards([]);
          setIsEvaluating(false);
        }, 1300);
      }
    }
  };

  const handleGameFinish = (finalAttempts: number, mistakes: MistakeDetail[]) => {
    const elapsedSeconds = Math.max(15, Math.round((Date.now() - startTime) / 1000));
    // Precisión basada en intentos óptimos (3 intentos perfectos)
    const accuracy = Math.min(100, Math.max(65, Math.round((3 / Math.max(3, finalAttempts)) * 100)));

    const gameResult: ExerciseResult = {
      id: 'res-' + Date.now(),
      exerciseId: 'memory-pairs',
      domain: 'memory',
      date: new Date().toISOString().split('T')[0],
      durationSeconds: elapsedSeconds,
      accuracy,
      score: 300 + Math.max(0, 200 - (finalAttempts - 3) * 30),
      correctAnswers: 3,
      totalQuestions: 3,
      feedbackMessage:
        accuracy >= 80
          ? '¡Extraordinaria memoria visual! Has retenido la posición de las cartas con gran precisión.'
          : '¡Gran ejercicio para tu memoria! Practicar la retención espacial favorece la orientación diaria.',
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
      title={isPreviewPhase ? "Parejas de Memoria (Memoriza el Tablero)" : `Parejas de Memoria (${matchedCount}/3 Parejas)`}
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
          {isPreviewPhase ? (
            <div className="pairs-preview-banner animate-fade-in">
              <div className="preview-banner-text">
                <div className="preview-indicator-badge">
                  <Eye size={20} />
                  <span>Fase de Memorización</span>
                </div>
                <p className="preview-countdown-msg">
                  Memoriza las cartas (se taparán en <strong>{previewCountdown}s</strong>)
                </p>
              </div>
              <button
                className="touch-btn touch-btn-primary preview-skip-btn"
                onClick={endPreview}
                title="Empezar ya a buscar parejas"
              >
                <Play size={18} />
                <span>¡Ya las tengo!</span>
              </button>
            </div>
          ) : (
            <div className="pairs-status-bar animate-fade-in">
              <span className="pairs-stat-pill">Parejas encontradas: <strong>{matchedCount} de 3</strong></span>
              <span className="pairs-stat-pill">Intentos: <strong>{attempts}</strong></span>
            </div>
          )}

          <div className="pairs-grid">
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
