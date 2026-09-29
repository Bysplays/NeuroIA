import { selectPool, namingChoices } from '../services/gameObjectPool';
import type { GameConfig } from '../services/difficulty';
import { useGameSession } from '../services/gameSession';
import { GameObject } from '../components/GameObject';
import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ExerciseWrapper } from '../components/ExerciseWrapper';
import type { ExerciseResult, UserProfile, MistakeDetail } from '../types';
import { soundService } from '../services/soundService';

interface PlanProgress {
  current: number;
  total: number;
  isLast: boolean;
}

interface LanguageNamingGameProps {
  profile: UserProfile;
  onBack: () => void;
  onSaveResult: (result: ExerciseResult) => void;
  planProgress?: PlanProgress | null;
  onNextPlanExercise?: () => void;
}

interface VocabularyItem {
  id: number;
  emoji: string;
  word: string;
  semanticHint: string;
  options: string[];
}
function createQuestions(config: GameConfig): VocabularyItem[] {
  return selectPool(config).map((item, id) => ({ id, emoji: item.symbol, word: item.name,
    semanticHint: `La imagen muestra: ${item.name}.`, options: namingChoices(item, config) }));
}

export const LanguageNamingGame: React.FC<LanguageNamingGameProps> = ({
  onBack,
  onSaveResult,
  planProgress,
  onNextPlanExercise,
}) => {
  const { clock, config } = useGameSession();
  // Preguntas seleccionadas al azar para esta sesión
  const [sessionQuestions, setSessionQuestions] = useState<VocabularyItem[]>(() => createQuestions(config));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakesList, setMistakesList] = useState<MistakeDetail[]>([]);
  const [startTime, setStartTime] = useState<number>(() => clock.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<ExerciseResult | null>(null);

  const initQuestions = () => {
    setStartTime(clock.now());
    const shuffled = createQuestions(config);
    setSessionQuestions(shuffled.slice(0, config.rounds));
    setCurrentIdx(0);
    setSelectedOption(null);
    setScore(0);
    setCorrectCount(0);
    setMistakesList([]);
    setIsCompleted(false);
    setResult(null);
  };

  if (sessionQuestions.length === 0) return null;

  const currentQ = sessionQuestions[currentIdx];

  const currentOptions = currentQ.options;

  const handleSelectOption = (option: string) => {
    if (selectedOption !== null) return;

    setSelectedOption(option);
    const correct = option === currentQ.word;

    if (correct) {
      soundService.playSuccess();
      setCorrectCount(prev => prev + 1);
      setScore(prev => prev + 100);
    } else {
      soundService.playGentlePrompt();
      soundService.speak(`El objeto correcto es ${currentQ.word}.`);
      setMistakesList(prev => [
        ...prev,
        {
          id: 'lang-' + clock.now(),
          item: `Objeto: ${currentQ.word}`,
          userAction: `Seleccionaste "${option}"`,
          correctSolution: `La respuesta correcta es "${currentQ.word}"`,
          explanation: currentQ.semanticHint,
        },
      ]);
    }
  };

  const handleNext = () => {
    soundService.playTap();
    if (currentIdx + 1 < sessionQuestions.length) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
    } else {
      const elapsedSeconds = Math.max(15, Math.round((clock.now() - startTime) / 1000));
      const total = sessionQuestions.length;
      const finalCorrect = Math.min(total, correctCount);
      const accuracy = Math.min(100, Math.round((finalCorrect / total) * 100));

      const gameResult: ExerciseResult = {
        id: crypto.randomUUID(),
      level: config.level,
      configVersion: config.version,
      hintsUsed: 0,
      practice: config.mode !== 'normal',
        exerciseId: 'language-naming',
        domain: 'language',
        date: new Date().toISOString(),
        durationSeconds: elapsedSeconds,
        accuracy,
        score,
        correctAnswers: finalCorrect,
        totalQuestions: total,
        feedbackMessage:
          accuracy >= 80
            ? '¡Buen trabajo! Has identificado los nombres de los objetos con precisión.'
            : 'Has practicado con imágenes y palabras. Cada intento cuenta.',
        mistakesList,
      };

      setResult(gameResult);
      setIsCompleted(true);
      onSaveResult(gameResult);
    }
  };

  return (
    <ExerciseWrapper
      completedStages={currentIdx + (selectedOption !== null ? 1 : 0)}
      exerciseId="language-naming"
      title="¿Qué objeto es este?"
      domain="language"
      instructionText="Mira la imagen y elige su nombre."
      hideBadges={true}
      hideInstructionBanner={true}
      onBack={onBack}
      isCompleted={isCompleted}
      result={result}
      onRestart={initQuestions}
      planProgress={planProgress}
      onNextPlanExercise={onNextPlanExercise}
    >
      <div className="language-game-container">
        <div className="naming-card">
          {/* Imagen centrada sobre las opciones. */}
          <div className="naming-target-block">
            <div className="naming-emoji-display">
              <span className="large-object-emoji"><GameObject symbol={currentQ.emoji} /></span>
            </div>


          </div>

          {/* Opciones de respuesta centradas verticalmente en la pantalla */}
          <div className="naming-options-grid">
            {currentOptions.map((option, idx) => {
              const isOptionSelected = selectedOption === option;
              let optionClass = 'naming-option-btn';

              if (selectedOption !== null) {
                if (option === currentQ.word) {
                  optionClass += ' option-correct';
                } else if (isOptionSelected) {
                  optionClass += ' option-incorrect';
                }
              }

              return (
                <button
                  key={idx}
                  className={`touch-btn touch-btn-large ${optionClass}`}
                  aria-label={selectedOption === null ? option : `${option}${option === currentQ.word ? ' · Respuesta correcta' : isOptionSelected ? ' · Respuesta incorrecta' : ''}`}
                  onClick={() => handleSelectOption(option)}
                  disabled={selectedOption !== null}
                >
                  <span className="option-text">{option}</span>

                </button>
              );
            })}
          </div>

          <div
            className={`naming-next-bar actions-bar ${selectedOption === null ? 'naming-next-bar-hidden' : ''}`}
            aria-hidden={selectedOption === null}
          >
            <button
              className="touch-btn touch-btn-primary game-next-action"
              onClick={handleNext}
              disabled={selectedOption === null}
              tabIndex={selectedOption === null ? -1 : 0}
            >
              <span>{currentIdx + 1 < sessionQuestions.length ? 'Siguiente Palabra' : config.mode === 'placement' ? 'Continuar' : 'Ver resultados'}</span>
              <ArrowRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </ExerciseWrapper>
  );
};
