import { GameObject } from '../components/GameObject';
import React, { useState, useEffect, useRef } from 'react';
import { Volume2, HelpCircle, CheckCircle2, ArrowRight } from 'lucide-react';
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

const COMPLETION_BANK: CompletionItem[] = [
  {
    id: 1,
    emoji: '🏠',
    word: 'CASA',
    missingIndex: 2, // CA_A -> S
    hint: 'Lugar donde vivimos. Suena /ss/...',
    distractorLetters: ['L', 'M', 'R'],
  },
  {
    id: 2,
    emoji: '⏰',
    word: 'RELOJ',
    missingIndex: 3, // REL_J -> O
    hint: 'Mide las horas. Es la vocal O...',
    distractorLetters: ['A', 'E', 'U'],
  },
  {
    id: 3,
    emoji: '🍎',
    word: 'MANZANA',
    missingIndex: 5, // MANZA_A -> N
    hint: 'Fruta dulce y crujiente. Falta la letra N...',
    distractorLetters: ['M', 'P', 'T'],
  },
  {
    id: 4,
    emoji: '🔑',
    word: 'LLAVE',
    missingIndex: 3, // LLA_E -> V
    hint: 'Sirve para abrir cerraduras. Falta la letra V...',
    distractorLetters: ['B', 'D', 'N'],
  },
  {
    id: 5,
    emoji: '👟',
    word: 'ZAPATO',
    missingIndex: 4, // ZAPA_O -> T
    hint: 'Protege el pie al caminar. Suena /t/...',
    distractorLetters: ['D', 'C', 'P'],
  },
  {
    id: 6,
    emoji: '☕',
    word: 'TAZA',
    missingIndex: 2, // TA_A -> Z
    hint: 'Recipiente con asa para café o té. Falta la Z...',
    distractorLetters: ['S', 'C', 'R'],
  },
  {
    id: 7,
    emoji: '🥖',
    word: 'PAN',
    missingIndex: 1, // P_N -> A
    hint: 'Alimento básico de harina. Es la vocal A...',
    distractorLetters: ['E', 'O', 'I'],
  },
  {
    id: 8,
    emoji: '🛏️',
    word: 'CAMA',
    missingIndex: 2, // CA_A -> M
    hint: 'Mueble para dormir. Falta la letra M...',
    distractorLetters: ['P', 'T', 'B'],
  },
  {
    id: 9,
    emoji: '🚗',
    word: 'COCHE',
    missingIndex: 1, // C_CHE -> O
    hint: 'Vehículo de cuatro ruedas. Es la vocal O...',
    distractorLetters: ['A', 'U', 'I'],
  },
  {
    id: 10,
    emoji: '🥛',
    word: 'VASO',
    missingIndex: 0, // _ASO -> V
    hint: 'Recipiente de cristal para beber agua. Falta la V...',
    distractorLetters: ['B', 'P', 'C'],
  },
  {
    id: 11,
    emoji: '👓',
    word: 'GAFAS',
    missingIndex: 4, // GAFA_ -> S
    hint: 'Lentes para ver y leer. Falta la letra S...',
    distractorLetters: ['R', 'N', 'Z'],
  },
  {
    id: 12,
    emoji: '📖',
    word: 'LIBRO',
    missingIndex: 4, // LIBR_ -> O
    hint: 'Contiene páginas para leer. Falta la vocal O...',
    distractorLetters: ['A', 'E', 'U'],
  },
  {
    id: 13,
    emoji: '🪑',
    word: 'SILLA',
    missingIndex: 2, // SI_LA -> L
    hint: 'Mueble para sentarse. Falta la letra L...',
    distractorLetters: ['T', 'M', 'R'],
  },
  {
    id: 14,
    emoji: '🐶',
    word: 'PERRO',
    missingIndex: 3, // PE_RO -> R
    hint: 'El mejor amigo fiel. Falta la letra R...',
    distractorLetters: ['S', 'N', 'L'],
  },
  {
    id: 15,
    emoji: '🐱',
    word: 'GATO',
    missingIndex: 2, // GA_O -> T
    hint: 'Mascota ágil que ronronea. Falta la letra T...',
    distractorLetters: ['P', 'M', 'B'],
  },
  {
    id: 16,
    emoji: '🌻',
    word: 'FLOR',
    missingIndex: 2, // FL_R -> O
    hint: 'Planta aromática y bonita. Es la vocal O...',
    distractorLetters: ['A', 'E', 'I'],
  },
  {
    id: 17,
    emoji: '🪵',
    word: 'MESA',
    missingIndex: 2, // ME_A -> S
    hint: 'Mueble donde comemos. Suena /ss/...',
    distractorLetters: ['R', 'L', 'N'],
  },
  {
    id: 18,
    emoji: '💧',
    word: 'AGUA',
    missingIndex: 2, // AG_A -> U
    hint: 'Líquido para beber y saciar la sed. Es la vocal U...',
    distractorLetters: ['O', 'E', 'I'],
  },
  {
    id: 19,
    emoji: '🥾',
    word: 'BOTA',
    missingIndex: 2, // BO_A -> T
    hint: 'Calzado que cubre el tobillo. Falta la letra T...',
    distractorLetters: ['C', 'P', 'R'],
  },
  {
    id: 20,
    emoji: '🍲',
    word: 'SOPA',
    missingIndex: 2, // SO_A -> P
    hint: 'Plato caliente que tomamos con cuchara. Falta la P...',
    distractorLetters: ['T', 'B', 'M'],
  },
  {
    id: 21,
    emoji: '👕',
    word: 'ROPA',
    missingIndex: 2, // RO_A -> P
    hint: 'Prendas con las que nos vestimos. Falta la P...',
    distractorLetters: ['T', 'S', 'B'],
  },
  {
    id: 22,
    emoji: '🌙',
    word: 'LUNA',
    missingIndex: 2, // LU_A -> N
    hint: 'Brilla en el cielo por la noche. Falta la N...',
    distractorLetters: ['M', 'R', 'P'],
  },
  {
    id: 23,
    emoji: '✋',
    word: 'MANO',
    missingIndex: 2, // MA_O -> N
    hint: 'Tiene cinco dedos. Falta la letra N...',
    distractorLetters: ['R', 'L', 'T'],
  },
  {
    id: 24,
    emoji: '👄',
    word: 'BOCA',
    missingIndex: 2, // BO_A -> C
    hint: 'La usamos para hablar y comer. Falta la C...',
    distractorLetters: ['T', 'S', 'P'],
  },
  {
    id: 25,
    emoji: '💇',
    word: 'PELO',
    missingIndex: 2, // PE_O -> L
    hint: 'Crece en la cabeza y lo peinamos. Falta la L...',
    distractorLetters: ['R', 'S', 'N'],
  },
  {
    id: 26,
    emoji: '☀️',
    word: 'SOL',
    missingIndex: 1, // S_L -> O
    hint: 'Nos da calor y luz de día. Es la vocal O...',
    distractorLetters: ['A', 'E', 'U'],
  },
  {
    id: 27,
    emoji: '👁️',
    word: 'OJO',
    missingIndex: 1, // O_O -> J
    hint: 'Órgano con el que vemos. Falta la letra J...',
    distractorLetters: ['G', 'C', 'S'],
  },
  {
    id: 28,
    emoji: '🚆',
    word: 'TREN',
    missingIndex: 2, // TR_N -> E
    hint: 'Medio de transporte que va por vías. Es la vocal E...',
    distractorLetters: ['A', 'O', 'I'],
  },
];

export const WordCompletionGame: React.FC<WordCompletionGameProps> = ({
  onBack,
  onSaveResult,
  planProgress,
  onNextPlanExercise,
}) => {
  const [sessionItems, setSessionItems] = useState<CompletionItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakesList, setMistakesList] = useState<MistakeDetail[]>([]);
  const [startTime] = useState<number>(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<ExerciseResult | null>(null);

  const draggedLetterRef = useRef<string | null>(null);

  const initGame = () => {
    const shuffled = [...COMPLETION_BANK].sort(() => Math.random() - 0.5).slice(0, 5);
    setSessionItems(shuffled);
    setCurrentIdx(0);
    setSelectedLetter(null);
    setIsCorrect(null);
    setShowHint(false);
    setIsDragOver(false);
    draggedLetterRef.current = null;
    setCorrectCount(0);
    setMistakesList([]);
    setIsCompleted(false);
    setResult(null);
  };

  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    setSelectedLetter(null);
    setIsCorrect(null);
    setShowHint(false);
    setIsDragOver(false);
    draggedLetterRef.current = null;
  }, [currentIdx]);

  if (sessionItems.length === 0) return null;

  const currentItem = sessionItems[currentIdx];
  const targetLetter = currentItem.word[currentItem.missingIndex];

  // Opciones barajadas con la letra correcta
  const letterOptions = [targetLetter, ...currentItem.distractorLetters].sort();

  const handleSelectLetter = (letter: string) => {
    if (selectedLetter !== null) return;

    setSelectedLetter(letter);
    const correct = letter === targetLetter;
    setIsCorrect(correct);

    if (correct) {
      soundService.playSuccess();
      soundService.speak(`¡Correcto! ${currentItem.word}`);
      setCorrectCount(prev => prev + 1);
    } else {
      soundService.playGentlePrompt();
      soundService.speak(`La letra correcta es la ${targetLetter}. Formamos ${currentItem.word}.`);
      setMistakesList(prev => [
        ...prev,
        {
          id: 'comp-' + Date.now(),
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
    } else {
      const elapsedSeconds = Math.max(15, Math.round((Date.now() - startTime) / 1000));
      const total = sessionItems.length;
      const finalCorrect = Math.min(total, correctCount);
      const accuracy = Math.min(100, Math.round((finalCorrect / total) * 100));

      const gameResult: ExerciseResult = {
        id: 'res-' + Date.now(),
        exerciseId: 'word-completion',
        domain: 'language',
        date: new Date().toISOString().split('T')[0],
        durationSeconds: elapsedSeconds,
        accuracy,
        score: finalCorrect * 100,
        correctAnswers: finalCorrect,
        totalQuestions: total,
        feedbackMessage:
          accuracy >= 80
            ? '¡Excelente recuperación léxica! Completaste las palabras con gran precisión ortográfica.'
            : '¡Gran esfuerzo! Reconectar sonidos y letras refuerza la red lingüística día a día.',
        mistakesList,
      };

      setResult(gameResult);
      setIsCompleted(true);
      onSaveResult(gameResult);
    }
  };

  return (
    <ExerciseWrapper
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

          {/* 3. Controles de audio y pista */}
          <div className="completion-audio-helpers">
            <button
              className="touch-btn touch-btn-secondary"
              onClick={() => soundService.speak(currentItem.word)}
              title="Escuchar la palabra completa"
            >
              <Volume2 size={22} />
              <span>Escuchar Palabra</span>
            </button>

            <button
              className="touch-btn touch-btn-secondary"
              onClick={() => {
                soundService.playGentlePrompt();
                setShowHint(true);
                soundService.speak(currentItem.hint);
              }}
              title="Pedir una pista"
            >
              <HelpCircle size={22} />
              <span>Pista de Ayuda</span>
            </button>
          </div>

          {showHint && (
            <div className="hint-banner animate-fade-in">
              <strong>Pista: </strong>
              <span>{currentItem.hint}</span>
            </div>
          )}

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
                  onClick={() => handleSelectLetter(letter)}
                  disabled={selectedLetter !== null}
                  title="Toca o arrastra esta letra a la casilla"
                >
                  {selectedLetter !== null && letter === targetLetter && (
                    <div className="letter-check-badge animate-fade-in" aria-hidden="true">
                      <CheckCircle2 size={24} className="letter-check-icon" strokeWidth={2.8} />
                    </div>
                  )}
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
              className={`touch-btn touch-btn-primary touch-btn-large ${selectedLetter !== null ? 'gentle-bounce' : ''}`}
              onClick={handleNext}
              disabled={selectedLetter === null}
              tabIndex={selectedLetter === null ? -1 : 0}
            >
              <span>{currentIdx + 1 < sessionItems.length ? 'Siguiente Palabra' : 'Ver Resultados'}</span>
              <ArrowRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </ExerciseWrapper>
  );
};
