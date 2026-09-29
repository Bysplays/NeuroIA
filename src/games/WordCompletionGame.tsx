import { selectPool, completionRound, GAME_OBJECT_POOL } from '../services/gameObjectPool';
import type { GameConfig } from '../services/difficulty';
import { useGameSession } from '../services/gameSession';
import { GameObject } from '../components/GameObject';
import React, { useState, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { ExerciseWrapper } from '../components/ExerciseWrapper';
import type { ExerciseResult, UserProfile, MistakeDetail } from '../types';
import { soundService } from '../services/soundService';

interface PlanProgress {
  current: number;
  total: number;
  isLast: boolean;
}

interface WordCompletionGameProps {
  profile: UserProfile;
  onBack: () => void;
  onSaveResult: (result: ExerciseResult) => void;
  planProgress?: PlanProgress | null;
  onNextPlanExercise?: () => void;
}

interface CompletionItem {
  id: number;
  emoji: string;
  word: string;
  missingIndex: number;
  hint: string;
  distractorLetters: string[];
}

function createWords(config: GameConfig): CompletionItem[] {
  return selectPool(config, GAME_OBJECT_POOL.filter(item => !item.name.includes(' ') && item.name.length <= 13)).map((item, id) => ({
    id, emoji: item.symbol, ...completionRound(item, config), hint: `La palabra es ${item.name}.`,
  }));
}

export const WordCompletionGame: React.FC<WordCompletionGameProps> = ({
  onBack,
  onSaveResult,
  planProgress,
  onNextPlanExercise,
}) => {
  const { clock, config } = useGameSession();
  const [sessionItems, setSessionItems] = useState<CompletionItem[]>(() => createWords(config));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakesList, setMistakesList] = useState<MistakeDetail[]>([]);
  const [startTime, setStartTime] = useState<number>(() => clock.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<ExerciseResult | null>(null);

  const draggedLetterRef = useRef<string | null>(null);

  const initGame = () => {
    setStartTime(clock.now());
    const shuffled = createWords(config);
    setSessionItems(shuffled);
    setCurrentIdx(0);
    setSelectedLetter(null);
    setIsCorrect(null);
    setIsDragOver(false);
    draggedLetterRef.current = null;
    setCorrectCount(0);
    setMistakesList([]);
    setIsCompleted(false);
    setResult(null);
  };

  if (sessionItems.length === 0) return null;

  const currentItem = sessionItems[currentIdx];
  const targetLetter = currentItem.word[currentItem.missingIndex];

  // Opciones barajadas con la letra correcta
  const letterOptions = [targetLetter, ...currentItem.distractorLetters.slice(0, config.choices - 1)].sort();

  const handleSelectLetter = (letter: string) => {
    if (selectedLetter !== null) return;

    setSelectedLetter(letter);
    const correct = letter === targetLetter;
    setIsCorrect(correct);

    if (correct) {
      soundService.playSuccess();
      soundService.speak(currentItem.word);
      setCorrectCount(prev => prev + 1);
    } else {
      soundService.playGentlePrompt();
      soundService.speak(`La letra correcta es la ${targetLetter}. Formamos ${currentItem.word}.`);
      setMistakesList(prev => [
        ...prev,
        {
          id: 'comp-' + clock.now(),
          item: `Palabra: ${currentItem.word}`,
          userAction: `Seleccionaste "${letter}"`,
          correctSolution: `La letra correcta era "${targetLetter}"`,
          explanation: currentItem.hint,
        },
      ]);
    }
  };

  const handleDragStartLetter = (e: React.DragEvent, letter: string) => {
    if (selectedLetter !== null) return;
    e.dataTransfer.setData('text/plain', letter);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handlePointerDownLetter = (letter: string) => {
    if (selectedLetter !== null) return;
    draggedLetterRef.current = letter;
  };

  const handlePointerUpContainer = (e: React.PointerEvent) => {
    if (!draggedLetterRef.current) return;
    const letter = draggedLetterRef.current;
    draggedLetterRef.current = null;
    setIsDragOver(false);

    // Detectar si se soltó sobre la casilla que falta
    const elem = document.elementFromPoint(e.clientX, e.clientY);
    if (elem && elem.closest('.slot-missing')) {
      handleSelectLetter(letter);
    }
  };

  const handleNext = () => {
    soundService.playTap();
    if (currentIdx + 1 < sessionItems.length) {
      setCurrentIdx(prev => prev + 1);
      setSelectedLetter(null);
      setIsCorrect(null);
      setIsDragOver(false);
      draggedLetterRef.current = null;
    } else {
      const elapsedSeconds = Math.max(15, Math.round((clock.now() - startTime) / 1000));
      const total = sessionItems.length;
      const finalCorrect = Math.min(total, correctCount);
      const accuracy = Math.min(100, Math.round((finalCorrect / total) * 100));

      const gameResult: ExerciseResult = {
        id: crypto.randomUUID(),
      level: config.level,
      configVersion: config.version,
      hintsUsed: 0,
      practice: config.mode !== 'normal',
        exerciseId: 'word-completion',
        domain: 'language',
        date: new Date().toISOString(),
        durationSeconds: elapsedSeconds,
        accuracy,
        score: finalCorrect * 100,
        correctAnswers: finalCorrect,
        totalQuestions: total,
        feedbackMessage:
          accuracy >= 80
            ? '¡Buen trabajo! Completaste las palabras con precisión.'
            : 'Has practicado con sonidos y letras. Puedes volver a intentarlo a tu ritmo.',
        mistakesList,
      };

      setResult(gameResult);
      setIsCompleted(true);
      onSaveResult(gameResult);
    }
  };

  return (
    <ExerciseWrapper
      exerciseId="word-completion"
      title={`Completar Palabras (${currentIdx + 1}/${sessionItems.length})`}
      domain="language"
      instructionText="Mira la imagen y toca la letra que falta."
      hideBadges={true}
      hideInstructionBanner={true}
      onBack={onBack}
      isCompleted={isCompleted}
      result={result}
      onRestart={initGame}
      planProgress={planProgress}
      onNextPlanExercise={onNextPlanExercise}
    >
      <div
        className="word-completion-game-container"
        onPointerUp={handlePointerUpContainer}
        onPointerCancel={handlePointerUpContainer}
      >
        <div className="word-completion-card">
          {/* 1. Imagen / Emoji central */}
          <div className="completion-emoji-display">
            <span className="large-object-emoji"><GameObject symbol={currentItem.emoji} /></span>
          </div>

          {/* 2. Palabra a completar (justo debajo de la imagen, más compacta y diferenciada) */}
          <div className="word-letter-slots">
            {currentItem.word.split('').map((letter, idx) => {
              const isMissing = idx === currentItem.missingIndex;
              let slotClass = 'letter-slot';

              if (isMissing) {
                slotClass += ' slot-missing';
                if (isDragOver) slotClass += ' slot-drag-over';
                if (selectedLetter !== null) {
                  slotClass += isCorrect ? ' slot-correct' : ' slot-incorrect';
                }
              }

              const displayedLetter = isMissing
                ? selectedLetter !== null
                  ? isCorrect
                    ? targetLetter
                    : selectedLetter
                  : isDragOver
                  ? '⬇'
                  : '?'
                : letter;

              return (
                <div
                  key={idx}
                  className={slotClass}
                  onDragOver={isMissing ? e => {
                    e.preventDefault();
                    if (selectedLetter === null) setIsDragOver(true);
                  } : undefined}
                  onDragLeave={isMissing ? () => setIsDragOver(false) : undefined}
                  onDrop={isMissing ? e => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (selectedLetter !== null) return;
                    const dropped = e.dataTransfer.getData('text/plain');
                    if (dropped) handleSelectLetter(dropped);
                  } : undefined}
                >
                  <span className="letter-char">{displayedLetter}</span>
                </div>
              );
            })}
          </div>

          <div className="letter-options-grid">
            {letterOptions.map((letter, idx) => {
              const isSelected = selectedLetter === letter;
              let btnClass = 'letter-option-btn';

              if (selectedLetter !== null) {
                if (letter === targetLetter) {
                  btnClass += ' btn-letter-correct';
                } else if (isSelected) {
                  btnClass += ' btn-letter-incorrect';
                }
              }

              return (
                <button
                  key={idx}
                  className={`touch-btn ${btnClass}`}
                  draggable={selectedLetter === null}
                  onDragStart={e => handleDragStartLetter(e, letter)}
                  onPointerDown={() => handlePointerDownLetter(letter)}
                  aria-label={selectedLetter === null ? letter : `${letter}${letter === targetLetter ? ' · Respuesta correcta' : isSelected ? ' · Respuesta incorrecta' : ''}`}
                  onClick={() => handleSelectLetter(letter)}
                  disabled={selectedLetter !== null}
                  title="Toca o arrastra esta letra a la casilla"
                >
                  <span className="btn-letter-char">{letter}</span>
                </button>
              );
            })}
          </div>

          {/* 5. Barra de siguiente persistente */}
          <div
            className={`completion-next-bar actions-bar ${selectedLetter === null ? 'completion-next-bar-hidden' : ''}`}
            aria-hidden={selectedLetter === null}
          >
            <button
              className="touch-btn touch-btn-primary game-next-action"
              onClick={handleNext}
              disabled={selectedLetter === null}
              tabIndex={selectedLetter === null ? -1 : 0}
            >
              <span>{currentIdx + 1 < sessionItems.length ? 'Siguiente Palabra' : config.mode === 'placement' ? 'Continuar' : 'Ver resultados'}</span>
              <ArrowRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </ExerciseWrapper>
  );
};
