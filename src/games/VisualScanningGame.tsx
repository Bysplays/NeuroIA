import { shuffle } from '../services/gameObjectPool';
import { useGameSession } from '../services/gameSession';
import { GameObject } from '../components/GameObject';
import React, { useState } from 'react';
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
  incorrect?: boolean;
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

function createRound(config: import('../services/difficulty').GameConfig) {
  // 1. Elegir AL AZAR cualquier fruta del banco como objetivo diana
  const targetIdx = Math.floor(Math.random() * FRUITS_BANK.length);
  const targetItem = FRUITS_BANK[targetIdx];

  // 2. Las demás frutas sirven como distractores en la cuadrícula
  const colorGroups = ['🍎🍓🍒🍅', '🍐🥑🥦🫒🍈🍉', '🍌🍋🌽🍍', '🍊🍑🥕', '🥝🥥🥔🍄🥐', '🍆🍇'];
  const similar = colorGroups.find(group => group.includes(targetItem.symbol)) ?? '';
  const available = FRUITS_BANK.filter((_, idx) => idx !== targetIdx).map(i => i.symbol);
  const distractors = config.level >= 5
    ? [...available.filter(symbol => similar.includes(symbol)), ...shuffle(available.filter(symbol => !similar.includes(symbol))).slice(0, config.level >= 8 ? 1 : 3)]
    : available;

  // 3. Cuadrícula equilibrada para tablet (4 filas x 4 columnas)
  const rows = config.scanRows;
  const cols = config.scanCols;
  const targetProbability = config.level >= 7 ? 0.18 : 0.32;

  const newItems: GridItem[] = [];
  let targetCounter = 0;
  let idCounter = 1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Asegurar que al menos 2 objetivos estén en el lateral izquierdo (col 0 o 1) para distribuir los objetivos por toda la pantalla
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

  return { target: targetItem, items: newItems, total: targetCounter };
}

export const VisualScanningGame: React.FC<VisualScanningGameProps> = ({
  onBack,
  onSaveResult,
  planProgress,
  onNextPlanExercise,
}) => {
  const { clock, config } = useGameSession();
  const [initialRound] = useState(() => createRound(config));
  const [currentTarget, setCurrentTarget] = useState<SymbolDef>(initialRound.target);
  const [items, setItems] = useState<GridItem[]>(initialRound.items);
  const [totalTargets, setTotalTargets] = useState(initialRound.total);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [completedTargets, setCompletedTargets] = useState(0);
  const [foundCount, setFoundCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [mistakesList, setMistakesList] = useState<MistakeDetail[]>([]);
  const [startTime, setStartTime] = useState<number>(clock.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<ExerciseResult | null>(null);

  const initRound = () => {
    const next = createRound(config);
    setCurrentTarget(next.target);
    setItems(next.items);
    setTotalTargets(next.total);
    setFoundCount(0);
  };

  const handleItemClick = (item: GridItem) => {
    if (item.found || isCompleted || foundCount >= totalTargets) return;

    if (item.isTarget) {
      soundService.playSuccess();
      const updated = items.map(i => (i.id === item.id ? { ...i, found: true } : i));
      setItems(updated);

      const newFound = foundCount + 1;
      setFoundCount(newFound);

      if (newFound >= totalTargets) {
        if (completedRounds + 1 < config.rounds) {
          setCompletedRounds(value => value + 1);
        } else {
          finishGame(mistakes);
        }
      }
    } else {
      setItems(previous => previous.map(cell => cell.id === item.id ? { ...cell, incorrect: true } : cell));
      soundService.playGentlePrompt();
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      soundService.speak(`Recuerda buscar ${article} ${currentTarget.name}.`);

      setMistakesList(prev => [
        ...prev,
        {
          id: 'scan-' + clock.now(),
          item: `Casilla con ${item.symbol}`,
          userAction: `Tocaste una fruta incorrecta: ${item.symbol}`,
          correctSolution: `El objetivo de la partida era buscar: ${currentTarget.symbol} (${currentTarget.name})`,
          explanation: 'Tómate un instante antes de pulsar para confirmar que coincide con el objetivo.',
        },
      ]);
    }
  };

  const finishGame = (currentMistakes: number) => {
    const elapsedSeconds = Math.max(10, Math.round((clock.now() - startTime) / 1000));
    const allTargets = completedTargets + totalTargets;
    const accuracy = Math.max(0, Math.round((allTargets / (allTargets + currentMistakes)) * 100));
    const baseScore = allTargets * 80;
    const score = Math.max(120, baseScore - currentMistakes * 10);

    const gameResult: ExerciseResult = {
      id: crypto.randomUUID(),
      level: config.level,
      configVersion: config.version,
      practice: config.mode !== 'normal',
      exerciseId: 'visual-scanning',
      domain: 'attention',
      date: new Date().toISOString(),
      durationSeconds: elapsedSeconds,
      accuracy,
      score,
      correctAnswers: allTargets,
      totalQuestions: allTargets + currentMistakes,
      feedbackMessage:
        accuracy >= 85
          ? '¡Buen trabajo! Has encontrado las figuras con precisión.'
          : 'Has practicado buscando figuras entre otros elementos. Cada intento cuenta.',
      mistakesList,
    };

    setResult(gameResult);
    setIsCompleted(true);
    onSaveResult(gameResult);
  };

  const handleRestart = () => {
    setIsCompleted(false);
    setResult(null);
    setCompletedRounds(0);
    setCompletedTargets(0);
    setMistakes(0);
    setMistakesList([]);
    setStartTime(clock.now());
    initRound();
  };

  const isMasculine = ['plátanos', 'limones', 'melocotones', 'kiwis', 'racimos de uvas', 'aguacates', 'cocos', 'tomates', 'brócolis', 'champiñones', 'croissants', 'melones'].includes(currentTarget.name);
  const article = isMasculine ? 'todos los' : 'todas las';

  return (
    <ExerciseWrapper
      nextAction={<button className="touch-btn touch-btn-primary game-next-action" style={{ visibility: foundCount >= totalTargets ? 'visible' : 'hidden' }} disabled={foundCount < totalTargets} onClick={() => { setCompletedTargets(value => value + totalTargets); initRound(); }}>Continuar</button>}
      completedStages={completedRounds}
      exerciseId="visual-scanning"
      title={
        <span>
          Busca {article} <strong>{currentTarget.name}</strong>
        </span>
      }
      domain="attention"
      instructionText={`Encuentra ${article} ${currentTarget.name}. Mira con calma de izquierda a derecha.`}
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
        <div className="scanning-grid" style={{ gridTemplateColumns: `repeat(${config.scanCols}, minmax(0, 1fr))`, '--scan-rows': config.scanRows } as React.CSSProperties}>
          {items.map(item => (
            <button
              key={item.id}
              className={`scanning-cell ${item.found ? 'cell-found' : ''} ${item.incorrect ? 'cell-incorrect' : ''} ${item.col === 0 ? 'cell-left-edge' : ''}`}
              onClick={() => handleItemClick(item)}
              aria-label={item.found ? 'Elemento ya encontrado' : item.incorrect ? 'Este objeto no es el que buscas' : 'Posible objetivo'}
            >
              <span className="cell-emoji"><GameObject symbol={item.symbol} /></span>

            </button>
          ))}
        </div>
      </div>
    </ExerciseWrapper>
  );
};
