import { useResponseEvidence } from '../services/sessionEvidenceContext';
import { selectPool, CLASSIFICATION_POOL, categoryChoices, CATEGORY_NAMES } from '../services/gameObjectPool';
import type { GameConfig } from '../services/difficulty';
import { useGameSession } from '../services/gameSession';
import { GameObject } from '../components/GameObject';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Volume2 } from 'lucide-react';
import { ExerciseWrapper } from '../components/ExerciseWrapper';
import type { ExerciseResult, UserProfile, MistakeDetail } from '../types';
import { soundService } from '../services/soundService';

interface PlanProgress {
  current: number;
  total: number;
  isLast: boolean;
}

interface CategorizationGameProps {
  profile: UserProfile;
  onBack: () => void;
  onSaveResult: (result: ExerciseResult) => void;
  planProgress?: PlanProgress | null;
  onNextPlanExercise?: () => void;
}

interface CategoryOption {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
}

interface ItemToClassify {
  id: number;
  name: string;
  emoji: string;
  correctCategoryId: string;
  categoryName: string;
  categories: CategoryOption[];
}

function createItems(config: GameConfig): ItemToClassify[] {
  return selectPool(config, CLASSIFICATION_POOL).map((item, id) => ({ id, name: item.name, emoji: item.symbol,
    correctCategoryId: item.category, categoryName: CATEGORY_NAMES[item.category],
    categories: categoryChoices(item, config).map(id => ({ id, name: CATEGORY_NAMES[id], emoji: '', color: '', bgColor: '' })),
  }));
}

export const CategorizationGame: React.FC<CategorizationGameProps> = ({
  onBack,
  onSaveResult,
  planProgress,
  onNextPlanExercise,
}) => {
  const { clock, config, assistanceTarget } = useGameSession();
  const [sessionItems, setSessionItems] = useState<ItemToClassify[]>(() => createItems(config));
  const [currentIdx, setCurrentIdx] = useState(0);
  const responseEvidence = useResponseEvidence(`question-${currentIdx}`);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakesList, setMistakesList] = useState<MistakeDetail[]>([]);
  const [startTime, setStartTime] = useState<number>(() => clock.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<ExerciseResult | null>(null);

  const initGame = () => {
    setStartTime(clock.now());
    const shuffled = createItems(config);
    setSessionItems(shuffled);
    setCurrentIdx(0);
    setSelectedCategory(null);
    setCorrectCount(0);
    setMistakesList([]);
    setIsCompleted(false);
    setResult(null);
  };

  if (sessionItems.length === 0) return null;

  const currentItem = sessionItems[currentIdx];

  const handleSelectCategory = (categoryId: string) => {
    if (selectedCategory !== null) return;

    setSelectedCategory(categoryId);
    const correct = categoryId === currentItem.correctCategoryId;
    responseEvidence.respond(correct);

    if (correct) {
      soundService.playSuccess();
      soundService.speak(`${currentItem.name} pertenece a ${currentItem.categoryName}.`);
      setCorrectCount(prev => prev + 1);
    } else {
      soundService.playGentlePrompt();
      soundService.speak(`El objeto ${currentItem.name} corresponde a ${currentItem.categoryName}.`);
      setMistakesList(prev => [
        ...prev,
        {
          id: 'cat-' + clock.now(),
          item: `Objeto: ${currentItem.name}`,
          userAction: `Clasificado erróneamente`,
          correctSolution: `Categoría correcta: ${currentItem.categoryName}`,
          explanation: 'La clasificación semántica ayuda a organizar los elementos y tareas de tu día a día.',
        },
      ]);
    }
  };

  const handleNext = () => {
    soundService.playTap();
    if (currentIdx + 1 < sessionItems.length) {
      setCurrentIdx(prev => prev + 1);
      setSelectedCategory(null);
    } else {
      const elapsedSeconds = Math.max(15, Math.round((clock.now() - startTime) / 1000));
      const total = sessionItems.length;
      const finalCorrect = Math.min(total, correctCount);
      const accuracy = Math.min(100, Math.round((finalCorrect / total) * 100));

      const gameResult: ExerciseResult = {
        id: crypto.randomUUID(),
      level: config.level,
      configVersion: config.version,
      practice: config.mode !== 'normal',
        exerciseId: 'categorization',
        domain: 'executive',
        date: new Date().toISOString(),
        durationSeconds: elapsedSeconds,
        accuracy,
        score: finalCorrect * 100,
        correctAnswers: finalCorrect,
        totalQuestions: total,
        feedbackMessage:
          accuracy >= 80
            ? '¡Buen trabajo! Has clasificado los elementos con precisión.'
            : 'Has practicado agrupando objetos por categorías. Puedes volver a jugar.',
        mistakesList,
      };

      setResult(gameResult);
      setIsCompleted(true);
      onSaveResult(gameResult);
    }
  };

  return (
    <ExerciseWrapper
      completedStages={currentIdx + (selectedCategory !== null ? 1 : 0)}
      exerciseId="categorization"
      title="Clasificación por categorías"
      domain="executive"
      instructionText="Cada cosa en su lugar. Elige el grupo al que pertenece."
      hideBadges={true}
      hideInstructionBanner={true}
      onBack={onBack}
      isCompleted={isCompleted}
      result={result}
      onRestart={initGame}
      planProgress={planProgress}
      onNextPlanExercise={onNextPlanExercise}
      nextAction={<button className="touch-btn touch-btn-primary game-next-action" onClick={handleNext}
        style={{ visibility: selectedCategory === null ? 'hidden' : 'visible' }} disabled={selectedCategory === null}>
        Continuar<ArrowRight size={20} aria-hidden="true"/>
      </button>}
    >
      {assistanceTarget && createPortal(<button
              className="paper-nav-button"
              onClick={() => { responseEvidence.hint(); soundService.speak(currentItem.name); }}
              title="Escuchar nombre del objeto"
            >
              <Volume2 size={20} />
              <span>Escuchar</span>
            </button>, assistanceTarget)}
      <div className="categorization-game-container">
        <div className="categorization-card">
          {/* Objeto central a clasificar */}
          <div className="category-object-card">
            <span className="large-object-emoji"><GameObject transparent symbol={currentItem.emoji} /></span>
            <div className="category-object-caption">
            <h2 className="object-name-title">{currentItem.name}</h2>

            </div>
          </div>

          <div className="category-bins-grid" style={{ gridTemplateColumns: `repeat(${currentItem.categories.length}, minmax(0, 1fr))` }}>
            {currentItem.categories.map(cat => {
              const isSelected = selectedCategory === cat.id;
              const isThisCorrect = cat.id === currentItem.correctCategoryId;
              let binClass = 'category-bin-card';

              if (selectedCategory !== null) {
                if (isThisCorrect) {
                  binClass += ' bin-correct';
                } else if (isSelected) {
                  binClass += ' bin-incorrect';
                }
              }

              return (
                <button
                  type="button"
                  key={cat.id}
                  className={`card card-interactive ${binClass}`}
                  onClick={() => handleSelectCategory(cat.id)}
                  aria-label={`${cat.name}${selectedCategory !== null ? isThisCorrect ? ' · Respuesta correcta' : isSelected ? ' · Respuesta incorrecta' : '' : ''}`}
                  disabled={selectedCategory !== null}
                >
                  <h3 className="bin-title">{cat.name}</h3>

                </button>
              );
            })}
          </div>


        </div>
      </div>
    </ExerciseWrapper>
  );
};
