import { GameObject } from '../components/GameObject';
import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';
import { ExerciseWrapper } from '../components/ExerciseWrapper';
import type { ExerciseResult, UserProfile, MistakeDetail } from '../types';
import { soundService } from '../services/soundService';

interface PlanProgress {
  current: number;
  total: number;
  isLast: boolean;
}

interface VisualScanningGameProps {
  profile: UserProfile;
  onBack: () => void;
  onSaveResult: (result: ExerciseResult) => void;
  planProgress?: PlanProgress | null;
  onNextPlanExercise?: () => void;
}

interface GridItem {
  id: number;
  symbol: string;
  isTarget: boolean;
  found: boolean;
  col: number;
  row: number;
}

interface SymbolDef {
  symbol: string;
  name: string;
}

// Banco exclusivo de frutas variadas para rastreo visual y atención
const FRUITS_BANK: SymbolDef[] = [
  { symbol: '🍎', name: 'manzanas rojas' },
  { symbol: '🍐', name: 'peras verdes' },
  { symbol: '🍇', name: 'racimos de uvas' },
  { symbol: '🍊', name: 'naranjas' },
  { symbol: '🍌', name: 'plátanos' },
  { symbol: '🍓', name: 'fresas' },
  { symbol: '🍒', name: 'cerezas' },
  { symbol: '🍋', name: 'limones' },
  { symbol: '🍉', name: 'sandías' },
  { symbol: '🍑', name: 'melocotones' },
  { symbol: '🍍', name: 'piñas' },
  { symbol: '🥝', name: 'kiwis' },
  { symbol: '🥑', name: 'aguacates' },
  { symbol: '🥥', name: 'cocos' },
  { symbol: '🥕', name: 'zanahorias' },
  { symbol: '🌽', name: 'mazorcas de maíz' },
  { symbol: '🍅', name: 'tomates' },
  { symbol: '🥦', name: 'brócolis' },
  { symbol: '🥔', name: 'patatas' },
  { symbol: '🍆', name: 'berenjenas' },
  { symbol: '🍄', name: 'champiñones' },
  { symbol: '🥐', name: 'croissants' },
  { symbol: '🫒', name: 'aceitunas' },
  { symbol: '🍈', name: 'melones' },
];

export const VisualScanningGame: React.FC<VisualScanningGameProps> = ({
  onBack,
  onSaveResult,
  planProgress,
  onNextPlanExercise,
}) => {
  const [currentTarget, setCurrentTarget] = useState<SymbolDef>(FRUITS_BANK[0]);
  const [items, setItems] = useState<GridItem[]>([]);
  const [totalTargets, setTotalTargets] = useState(0);
  const [foundCount, setFoundCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [mistakesList, setMistakesList] = useState<MistakeDetail[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<ExerciseResult | null>(null);

  const initRound = () => {
    // 1. Elegir AL AZAR cualquier fruta del banco como objetivo diana
    const targetIdx = Math.floor(Math.random() * FRUITS_BANK.length);
    const targetItem = FRUITS_BANK[targetIdx];
    setCurrentTarget(targetItem);
    setMistakesList([]);

    // 2. Las demás frutas sirven como distractores en la cuadrícula
    const distractors = FRUITS_BANK.filter((_, idx) => idx !== targetIdx).map(i => i.symbol);

    // 3. Cuadrícula equilibrada para tablet (4 filas x 4 columnas)
    const rows = 4;
    const cols = 4;
    const targetProbability = 0.32;

    const newItems: GridItem[] = [];
    let targetCounter = 0;
    let idCounter = 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Asegurar que al menos 2 objetivos estén en el lateral izquierdo (col 0 o 1) para estimular la heminegligencia
        const isTarget = Math.random() < targetProbability || (c === 0 && r === 0 && targetCounter === 0);
        const symbol = isTarget
          ? targetItem.symbol
          : distractors[Math.floor(Math.random() * distractors.length)];

        if (isTarget) targetCounter++;

        newItems.push({
          id: idCounter++,
          symbol,
          isTarget,
          found: false,
          col: c,
          row: r,
        });
      }
    }

    // Garantizar que haya al menos 3 objetivos si la probabilidad generó pocos
    if (targetCounter < 3) {
      const candidates = newItems.filter(i => !i.isTarget);
      for (let k = targetCounter; k < 3 && candidates.length > 0; k++) {
        const item = candidates.pop()!;
        item.isTarget = true;
        item.symbol = targetItem.symbol;
        targetCounter++;
      }
    }

    setItems(newItems);
    setTotalTargets(targetCounter);
    setFoundCount(0);
    setMistakes(0);
    setStartTime(Date.now());
  };

  useEffect(() => {
    initRound();
  }, []);

  const handleItemClick = (item: GridItem) => {
    if (item.found || isCompleted) return;

    if (item.isTarget) {
      soundService.playSuccess();
      const updated = items.map(i => (i.id === item.id ? { ...i, found: true } : i));
      setItems(updated);

      const newFound = foundCount + 1;
      setFoundCount(newFound);

      if (newFound >= totalTargets) {
        finishGame(mistakes);
      }
    } else {
      soundService.playGentlePrompt();
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      soundService.speak(`Recuerda buscar las ${currentTarget.name}.`);

      setMistakesList(prev => [
        ...prev,
        {
          id: 'scan-' + Date.now(),
          item: `Casilla con ${item.symbol}`,
          userAction: `Tocaste una fruta incorrecta: ${item.symbol}`,
          correctSolution: `El objetivo de la partida era buscar: ${currentTarget.symbol} (${currentTarget.name})`,
          explanation: 'Tómate un instante antes de pulsar para confirmar que coincide con el objetivo.',
        },
      ]);
    }
  };

  const finishGame = (currentMistakes: number) => {
    const elapsedSeconds = Math.max(10, Math.round((Date.now() - startTime) / 1000));
    const accuracy = Math.max(60, Math.round((totalTargets / (totalTargets + currentMistakes)) * 100));
    const baseScore = totalTargets * 80;
    const score = Math.max(120, baseScore - currentMistakes * 10);

    const gameResult: ExerciseResult = {
      id: 'res-' + Date.now(),
      exerciseId: 'visual-scan',
      domain: 'attention',
      date: new Date().toISOString().split('T')[0],
      durationSeconds: elapsedSeconds,
      accuracy,
      score,
      correctAnswers: totalTargets,
      totalQuestions: totalTargets + currentMistakes,
      feedbackMessage:
        accuracy >= 85
          ? '¡Extraordinario rastreo visual! Has cubierto todo el campo visual con gran precisión.'
          : '¡Buen ejercicio! Has ejercitado el barrido ocular y la atención selectiva con gran perseverancia.',
      mistakesList,
    };

    setResult(gameResult);
    setIsCompleted(true);
    onSaveResult(gameResult);
  };

  const handleRestart = () => {
    setIsCompleted(false);
    setResult(null);
    initRound();
  };

  const isMasculine = ['plátanos', 'limones', 'melocotones', 'kiwis', 'racimos de uvas'].includes(currentTarget.name);
  const article = isMasculine ? 'todos los' : 'todas las';

  return (
    <ExerciseWrapper
      title={
        <span>
          Busca {article} {currentTarget.name} <span className="title-target-emoji"><GameObject symbol={currentTarget.symbol} /></span> ({foundCount}/{totalTargets})
        </span>
      }
      domain="attention"
      instructionText={`Encuentra todas las ${currentTarget.name}. Mira con calma de izquierda a derecha.`}
      hideBadges={true}
      hideInstructionBanner={true}
      onBack={onBack}
      isCompleted={isCompleted}
      result={result}
      onRestart={handleRestart}
      planProgress={planProgress}
      onNextPlanExercise={onNextPlanExercise}
    >
      <div className="scanning-game-container">
        {/* Cuadrícula de búsqueda táctil (4x4) ocupando el espacio completo sin scroll */}
        <div className="scanning-grid">
          {items.map(item => (
            <button
              key={item.id}
              className={`scanning-cell ${item.found ? 'cell-found' : ''} ${item.col === 0 ? 'cell-left-edge' : ''}`}
              onClick={() => handleItemClick(item)}
              aria-label={item.found ? 'Elemento ya encontrado' : 'Posible objetivo'}
            >
              <span className="cell-emoji"><GameObject symbol={item.symbol} /></span>
              {item.found && (
                <div className="cell-check-overlay">
                  <Check size={36} className="check-svg" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </ExerciseWrapper>
  );
};
