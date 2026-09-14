import { useGameSession } from '../components/GameSession';
import { GameObject } from '../components/GameObject';
import React, { useState, useEffect } from 'react';
import { CheckCircle2, ArrowRight, Volume2 } from 'lucide-react';
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
  categories: [CategoryOption, CategoryOption];
}

const CLASSIFICATION_ITEMS: ItemToClassify[] = [
  // Categoría 1: Alimentos vs Prendas de Ropa
  {
    id: 1,
    name: 'Zanahoria',
    emoji: '🥕',
    correctCategoryId: 'food',
    categoryName: 'Alimentos',
    categories: [
      { id: 'food', name: 'Alimentos', emoji: '🍎', color: '#16a34a', bgColor: '#dcfce7' },
      { id: 'clothes', name: 'Prendas de Ropa', emoji: '👕', color: '#0284c7', bgColor: '#e0f2fe' },
    ],
  },
  {
    id: 2,
    name: 'Pantalón',
    emoji: '👖',
    correctCategoryId: 'clothes',
    categoryName: 'Prendas de Ropa',
    categories: [
      { id: 'food', name: 'Alimentos', emoji: '🍎', color: '#16a34a', bgColor: '#dcfce7' },
      { id: 'clothes', name: 'Prendas de Ropa', emoji: '👕', color: '#0284c7', bgColor: '#e0f2fe' },
    ],
  },
  {
    id: 3,
    name: 'Manzana',
    emoji: '🍎',
    correctCategoryId: 'food',
    categoryName: 'Alimentos',
    categories: [
      { id: 'food', name: 'Alimentos', emoji: '🍎', color: '#16a34a', bgColor: '#dcfce7' },
      { id: 'clothes', name: 'Prendas de Ropa', emoji: '👕', color: '#0284c7', bgColor: '#e0f2fe' },
    ],
  },
  {
    id: 4,
    name: 'Camisa',
    emoji: '👕',
    correctCategoryId: 'clothes',
    categoryName: 'Prendas de Ropa',
    categories: [
      { id: 'food', name: 'Alimentos', emoji: '🍎', color: '#16a34a', bgColor: '#dcfce7' },
      { id: 'clothes', name: 'Prendas de Ropa', emoji: '👕', color: '#0284c7', bgColor: '#e0f2fe' },
    ],
  },
  {
    id: 5,
    name: 'Plátano',
    emoji: '🍌',
    correctCategoryId: 'food',
    categoryName: 'Alimentos',
    categories: [
      { id: 'food', name: 'Alimentos', emoji: '🍎', color: '#16a34a', bgColor: '#dcfce7' },
      { id: 'clothes', name: 'Prendas de Ropa', emoji: '👕', color: '#0284c7', bgColor: '#e0f2fe' },
    ],
  },
  {
    id: 6,
    name: 'Calcetines',
    emoji: '🧦',
    correctCategoryId: 'clothes',
    categoryName: 'Prendas de Ropa',
    categories: [
      { id: 'food', name: 'Alimentos', emoji: '🍎', color: '#16a34a', bgColor: '#dcfce7' },
      { id: 'clothes', name: 'Prendas de Ropa', emoji: '👕', color: '#0284c7', bgColor: '#e0f2fe' },
    ],
  },
  {
    id: 7,
    name: 'Pan',
    emoji: '🥖',
    correctCategoryId: 'food',
    categoryName: 'Alimentos',
    categories: [
      { id: 'food', name: 'Alimentos', emoji: '🍎', color: '#16a34a', bgColor: '#dcfce7' },
      { id: 'clothes', name: 'Prendas de Ropa', emoji: '👕', color: '#0284c7', bgColor: '#e0f2fe' },
    ],
  },
  {
    id: 8,
    name: 'Gorra',
    emoji: '🧢',
    correctCategoryId: 'clothes',
    categoryName: 'Prendas de Ropa',
    categories: [
      { id: 'food', name: 'Alimentos', emoji: '🍎', color: '#16a34a', bgColor: '#dcfce7' },
      { id: 'clothes', name: 'Prendas de Ropa', emoji: '👕', color: '#0284c7', bgColor: '#e0f2fe' },
    ],
  },

  // Categoría 2: Cocina vs Higiene y Baño
  {
    id: 9,
    name: 'Jabón',
    emoji: '🧼',
    correctCategoryId: 'hygiene',
    categoryName: 'Higiene y Baño',
    categories: [
      { id: 'kitchen', name: 'Cocina', emoji: '🍳', color: '#ea580c', bgColor: '#ffedd5' },
      { id: 'hygiene', name: 'Higiene y Baño', emoji: '🪥', color: '#7c3aed', bgColor: '#ede9fe' },
    ],
  },
  {
    id: 10,
    name: 'Sartén',
    emoji: '🍳',
    correctCategoryId: 'kitchen',
    categoryName: 'Cocina',
    categories: [
      { id: 'kitchen', name: 'Cocina', emoji: '🍳', color: '#ea580c', bgColor: '#ffedd5' },
      { id: 'hygiene', name: 'Higiene y Baño', emoji: '🪥', color: '#7c3aed', bgColor: '#ede9fe' },
    ],
  },
  {
    id: 11,
    name: 'Cuchara',
    emoji: '🥄',
    correctCategoryId: 'kitchen',
    categoryName: 'Cocina',
    categories: [
      { id: 'kitchen', name: 'Cocina', emoji: '🍳', color: '#ea580c', bgColor: '#ffedd5' },
      { id: 'hygiene', name: 'Higiene y Baño', emoji: '🪥', color: '#7c3aed', bgColor: '#ede9fe' },
    ],
  },
  {
    id: 12,
    name: 'Cepillo de Dientes',
    emoji: '🪥',
    correctCategoryId: 'hygiene',
    categoryName: 'Higiene y Baño',
    categories: [
      { id: 'kitchen', name: 'Cocina', emoji: '🍳', color: '#ea580c', bgColor: '#ffedd5' },
      { id: 'hygiene', name: 'Higiene y Baño', emoji: '🪥', color: '#7c3aed', bgColor: '#ede9fe' },
    ],
  },
  {
    id: 13,
    name: 'Taza',
    emoji: '☕',
    correctCategoryId: 'kitchen',
    categoryName: 'Cocina',
    categories: [
      { id: 'kitchen', name: 'Cocina', emoji: '🍳', color: '#ea580c', bgColor: '#ffedd5' },
      { id: 'hygiene', name: 'Higiene y Baño', emoji: '🪥', color: '#7c3aed', bgColor: '#ede9fe' },
    ],
  },
  {
    id: 14,
    name: 'Toalla',
    emoji: '🧴',
    correctCategoryId: 'hygiene',
    categoryName: 'Higiene y Baño',
    categories: [
      { id: 'kitchen', name: 'Cocina', emoji: '🍳', color: '#ea580c', bgColor: '#ffedd5' },
      { id: 'hygiene', name: 'Higiene y Baño', emoji: '🪥', color: '#7c3aed', bgColor: '#ede9fe' },
    ],
  },
  {
    id: 15,
    name: 'Olla',
    emoji: '🍲',
    correctCategoryId: 'kitchen',
    categoryName: 'Cocina',
    categories: [
      { id: 'kitchen', name: 'Cocina', emoji: '🍳', color: '#ea580c', bgColor: '#ffedd5' },
      { id: 'hygiene', name: 'Higiene y Baño', emoji: '🪥', color: '#7c3aed', bgColor: '#ede9fe' },
    ],
  },
  {
    id: 16,
    name: 'Esponja de Baño',
    emoji: '🧽',
    correctCategoryId: 'hygiene',
    categoryName: 'Higiene y Baño',
    categories: [
      { id: 'kitchen', name: 'Cocina', emoji: '🍳', color: '#ea580c', bgColor: '#ffedd5' },
      { id: 'hygiene', name: 'Higiene y Baño', emoji: '🪥', color: '#7c3aed', bgColor: '#ede9fe' },
    ],
  },

  // Categoría 3: Herramientas vs Muebles del Hogar
  {
    id: 17,
    name: 'Martillo',
    emoji: '🔨',
    correctCategoryId: 'tools',
    categoryName: 'Herramientas',
    categories: [
      { id: 'furniture', name: 'Muebles del Hogar', emoji: '🛋️', color: '#0891b2', bgColor: '#cffafe' },
      { id: 'tools', name: 'Herramientas', emoji: '🔧', color: '#b45309', bgColor: '#fef3c7' },
    ],
  },
  {
    id: 18,
    name: 'Sofá',
    emoji: '🛋️',
    correctCategoryId: 'furniture',
    categoryName: 'Muebles del Hogar',
    categories: [
      { id: 'furniture', name: 'Muebles del Hogar', emoji: '🛋️', color: '#0891b2', bgColor: '#cffafe' },
      { id: 'tools', name: 'Herramientas', emoji: '🔧', color: '#b45309', bgColor: '#fef3c7' },
    ],
  },
  {
    id: 19,
    name: 'Destornillador',
    emoji: '🪛',
    correctCategoryId: 'tools',
    categoryName: 'Herramientas',
    categories: [
      { id: 'furniture', name: 'Muebles del Hogar', emoji: '🛋️', color: '#0891b2', bgColor: '#cffafe' },
      { id: 'tools', name: 'Herramientas', emoji: '🔧', color: '#b45309', bgColor: '#fef3c7' },
    ],
  },
  {
    id: 20,
    name: 'Cama',
    emoji: '🛏️',
    correctCategoryId: 'furniture',
    categoryName: 'Muebles del Hogar',
    categories: [
      { id: 'furniture', name: 'Muebles del Hogar', emoji: '🛋️', color: '#0891b2', bgColor: '#cffafe' },
      { id: 'tools', name: 'Herramientas', emoji: '🔧', color: '#b45309', bgColor: '#fef3c7' },
    ],
  },
  {
    id: 21,
    name: 'Alicates',
    emoji: '🪚',
    correctCategoryId: 'tools',
    categoryName: 'Herramientas',
    categories: [
      { id: 'furniture', name: 'Muebles del Hogar', emoji: '🛋️', color: '#0891b2', bgColor: '#cffafe' },
      { id: 'tools', name: 'Herramientas', emoji: '🔧', color: '#b45309', bgColor: '#fef3c7' },
    ],
  },
  {
    id: 22,
    name: 'Silla',
    emoji: '🪑',
    correctCategoryId: 'furniture',
    categoryName: 'Muebles del Hogar',
    categories: [
      { id: 'furniture', name: 'Muebles del Hogar', emoji: '🛋️', color: '#0891b2', bgColor: '#cffafe' },
      { id: 'tools', name: 'Herramientas', emoji: '🔧', color: '#b45309', bgColor: '#fef3c7' },
    ],
  },

  // Categoría 4: Animales vs Medios de Transporte
  {
    id: 23,
    name: 'Perro',
    emoji: '🐶',
    correctCategoryId: 'animals',
    categoryName: 'Animales',
    categories: [
      { id: 'animals', name: 'Animales', emoji: '🐾', color: '#059669', bgColor: '#d1fae5' },
      { id: 'vehicles', name: 'Medios de Transporte', emoji: '🚗', color: '#2563eb', bgColor: '#dbeafe' },
    ],
  },
  {
    id: 24,
    name: 'Autobús',
    emoji: '🚌',
    correctCategoryId: 'vehicles',
    categoryName: 'Medios de Transporte',
    categories: [
      { id: 'animals', name: 'Animales', emoji: '🐾', color: '#059669', bgColor: '#d1fae5' },
      { id: 'vehicles', name: 'Medios de Transporte', emoji: '🚗', color: '#2563eb', bgColor: '#dbeafe' },
    ],
  },
  {
    id: 25,
    name: 'Gato',
    emoji: '🐱',
    correctCategoryId: 'animals',
    categoryName: 'Animales',
    categories: [
      { id: 'animals', name: 'Animales', emoji: '🐾', color: '#059669', bgColor: '#d1fae5' },
      { id: 'vehicles', name: 'Medios de Transporte', emoji: '🚗', color: '#2563eb', bgColor: '#dbeafe' },
    ],
  },
  {
    id: 26,
    name: 'Bicicleta',
    emoji: '🚲',
    correctCategoryId: 'vehicles',
    categoryName: 'Medios de Transporte',
    categories: [
      { id: 'animals', name: 'Animales', emoji: '🐾', color: '#059669', bgColor: '#d1fae5' },
      { id: 'vehicles', name: 'Medios de Transporte', emoji: '🚗', color: '#2563eb', bgColor: '#dbeafe' },
    ],
  },
  {
    id: 27,
    name: 'Caballo',
    emoji: '🐴',
    correctCategoryId: 'animals',
    categoryName: 'Animales',
    categories: [
      { id: 'animals', name: 'Animales', emoji: '🐾', color: '#059669', bgColor: '#d1fae5' },
      { id: 'vehicles', name: 'Medios de Transporte', emoji: '🚗', color: '#2563eb', bgColor: '#dbeafe' },
    ],
  },
  {
    id: 28,
    name: 'Avión',
    emoji: '✈️',
    correctCategoryId: 'vehicles',
    categoryName: 'Medios de Transporte',
    categories: [
      { id: 'animals', name: 'Animales', emoji: '🐾', color: '#059669', bgColor: '#d1fae5' },
      { id: 'vehicles', name: 'Medios de Transporte', emoji: '🚗', color: '#2563eb', bgColor: '#dbeafe' },
    ],
  },
];

export const CategorizationGame: React.FC<CategorizationGameProps> = ({
  onBack,
  onSaveResult,
  planProgress,
  onNextPlanExercise,
}) => {
  const { clock } = useGameSession();
  const [sessionItems, setSessionItems] = useState<ItemToClassify[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakesList, setMistakesList] = useState<MistakeDetail[]>([]);
  const [startTime] = useState<number>(clock.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<ExerciseResult | null>(null);

  const initGame = () => {
    const shuffled = [...CLASSIFICATION_ITEMS].sort(() => Math.random() - 0.5).slice(0, 5);
    setSessionItems(shuffled);
    setCurrentIdx(0);
    setSelectedCategory(null);
    setCorrectCount(0);
    setMistakesList([]);
    setIsCompleted(false);
    setResult(null);
  };

  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    setSelectedCategory(null);
  }, [currentIdx]);

  if (sessionItems.length === 0) return null;

  const currentItem = sessionItems[currentIdx];

  const handleSelectCategory = (categoryId: string) => {
    if (selectedCategory !== null) return;

    setSelectedCategory(categoryId);
    const correct = categoryId === currentItem.correctCategoryId;

    if (correct) {
      soundService.playSuccess();
      soundService.speak(`¡Correcto! ${currentItem.name} pertenece a ${currentItem.categoryName}.`);
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
    } else {
      const elapsedSeconds = Math.max(15, Math.round((clock.now() - startTime) / 1000));
      const total = sessionItems.length;
      const finalCorrect = Math.min(total, correctCount);
      const accuracy = Math.min(100, Math.round((finalCorrect / total) * 100));

      const gameResult: ExerciseResult = {
        id: 'res-' + clock.now(),
        exerciseId: 'categorization',
        domain: 'executive',
        date: new Date().toISOString().split('T')[0],
        durationSeconds: elapsedSeconds,
        accuracy,
        score: finalCorrect * 100,
        correctAnswers: finalCorrect,
        totalQuestions: total,
        feedbackMessage:
          accuracy >= 80
            ? '¡Excelente razonamiento y clasificación! Has organizado los elementos con gran autonomía mental.'
            : '¡Buen ejercicio de flexibilidad cognitiva! Agrupar y clasificar refuerza las funciones de tu lóbulo frontal.',
        mistakesList,
      };

      setResult(gameResult);
      setIsCompleted(true);
      onSaveResult(gameResult);
    }
  };

  return (
    <ExerciseWrapper
      exerciseId="categorization"
      title={`Clasificación por Categorías (${currentIdx + 1}/${sessionItems.length})`}
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
    >
      <div className="categorization-game-container">
        <div className="categorization-card">
          {/* Objeto central a clasificar */}
          <div className="category-object-card">
            <span className="large-object-emoji"><GameObject transparent symbol={currentItem.emoji} /></span>
            <h2 className="object-name-title">{currentItem.name}</h2>
            <button
              className="touch-btn touch-btn-secondary object-voice-btn"
              onClick={() => soundService.speak(currentItem.name)}
              title="Escuchar nombre del objeto"
            >
              <Volume2 size={22} />
              <span>Escuchar Objeto</span>
            </button>
          </div>

          <div className="categorization-prompt">
            <p>¿A qué categoría pertenece este elemento?</p>
          </div>

          {/* Dos contenedores / cajas temáticas */}
          <div className="category-bins-grid">
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
                <div
                  key={cat.id}
                  className={`card card-interactive ${binClass}`}
                  onClick={() => handleSelectCategory(cat.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div
                    className="bin-icon-circle"
                    style={{ backgroundColor: cat.bgColor, color: cat.color }}
                  >
                    <span className="bin-emoji"><GameObject transparent symbol={cat.emoji} /></span>
                  </div>
                  <h3 className="bin-title">{cat.name}</h3>

                  {selectedCategory !== null && isThisCorrect && (
                    <div className="bin-check-badge animate-fade-in">
                      <CheckCircle2 size={26} />
                      <span>¡Aquí va!</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Botón de Siguiente persistente en layout */}
          <div
            className={`category-next-bar actions-bar ${selectedCategory === null ? 'category-next-bar-hidden' : ''}`}
            aria-hidden={selectedCategory === null}
          >
            <button
              className={`touch-btn touch-btn-primary touch-btn-large ${selectedCategory !== null ? 'gentle-bounce' : ''}`}
              onClick={handleNext}
              disabled={selectedCategory === null}
              tabIndex={selectedCategory === null ? -1 : 0}
            >
              <span>{currentIdx + 1 < sessionItems.length ? 'Siguiente Objeto' : 'Ver Resultados'}</span>
              <ArrowRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </ExerciseWrapper>
  );
};
