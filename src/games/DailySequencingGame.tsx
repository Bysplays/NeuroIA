import { useGameSession } from '../components/GameSession';
import { GameObject } from '../components/GameObject';
import React, { useState, useEffect } from 'react';
import { ArrowRight, RotateCcw, Check } from 'lucide-react';
import { ExerciseWrapper } from '../components/ExerciseWrapper';
import type { ExerciseResult, UserProfile, MistakeDetail } from '../types';
import { soundService } from '../services/soundService';

interface PlanProgress {
  current: number;
  total: number;
  isLast: boolean;
}

interface DailySequencingGameProps {
  profile: UserProfile;
  onBack: () => void;
  onSaveResult: (result: ExerciseResult) => void;
  planProgress?: PlanProgress | null;
  onNextPlanExercise?: () => void;
}

interface Step {
  id: number;
  text: string;
  emoji: string;
  correctOrder: number;
}

interface Scenario {
  id: number;
  title: string;
  description: string;
  stepsGentle: Step[];
  stepsModerate: Step[];
  stepsChallenge: Step[];
}

const ALL_SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: 'Preparar una taza de infusión o café',
    description: '¿En qué orden realizamos estos pasos de la vida diaria?',
    stepsGentle: [
      { id: 1, text: 'Poner el café o bolsita en la taza', emoji: '☕', correctOrder: 1 },
      { id: 2, text: 'Calentar el agua en la tetera o microondas', emoji: '🔥', correctOrder: 2 },
      { id: 3, text: 'Verter el agua caliente y remover con cuchara', emoji: '🥄', correctOrder: 3 },
    ],
    stepsModerate: [
      { id: 1, text: 'Sacar la taza y la bolsita de la despensa', emoji: '🗄️', correctOrder: 1 },
      { id: 2, text: 'Poner el agua a calentar en el hervidor', emoji: '🔥', correctOrder: 2 },
      { id: 3, text: 'Colocar la bolsita dentro de la taza', emoji: '☕', correctOrder: 3 },
      { id: 4, text: 'Servir el agua caliente y dejar reposar', emoji: '🥄', correctOrder: 4 },
    ],
    stepsChallenge: [
      { id: 1, text: 'Comprobar que el hervidor tiene agua limpia', emoji: '🚰', correctOrder: 1 },
      { id: 2, text: 'Encender el fuego o conectar el hervidor', emoji: '⚡', correctOrder: 2 },
      { id: 3, text: 'Poner la infusión dentro de la taza', emoji: '☕', correctOrder: 3 },
      { id: 4, text: 'Verter el agua y endulzar al gusto', emoji: '🍯', correctOrder: 4 },
    ],
  },
  {
    id: 2,
    title: 'Lavarse las manos adecuadamente',
    description: 'Ordena la secuencia higiénica paso a paso:',
    stepsGentle: [
      { id: 5, text: 'Abrir el grifo y mojarse las manos con agua', emoji: '🚰', correctOrder: 1 },
      { id: 6, text: 'Aplicar jabón y frotar palmas y dedos', emoji: '🧼', correctOrder: 2 },
      { id: 7, text: 'Aclarar con agua y secarse con la toalla limpia', emoji: '🧴', correctOrder: 3 },
    ],
    stepsModerate: [
      { id: 5, text: 'Abrir el grifo y mojar ambas manos', emoji: '🚰', correctOrder: 1 },
      { id: 6, text: 'Dosificar jabón en la palma de la mano', emoji: '🧴', correctOrder: 2 },
      { id: 7, text: 'Frotar bien entre los dedos durante 20 segundos', emoji: '🧼', correctOrder: 3 },
      { id: 8, text: 'Enjuagar con agua abundante y secar con toalla', emoji: '🤲', correctOrder: 4 },
    ],
    stepsChallenge: [
      { id: 5, text: 'Subirse las mangas para no mojarse', emoji: '👕', correctOrder: 1 },
      { id: 6, text: 'Mojar las manos y aplicar jabón antiséptico', emoji: '🧼', correctOrder: 2 },
      { id: 7, text: 'Frotar palmas, dorso y uñas meticulosamente', emoji: '🤲', correctOrder: 3 },
      { id: 8, text: 'Aclarar bajo el chorro y cerrar el grifo', emoji: '🚰', correctOrder: 4 },
    ],
  },
  {
    id: 3,
    title: 'Cruzar una calle con seguridad',
    description: 'Secuencia de prevención vial en el paso de peatones:',
    stepsGentle: [
      { id: 9, text: 'Detenerse en la acera antes de bajar al bordillo', emoji: '🛑', correctOrder: 1 },
      { id: 10, text: 'Mirar a la izquierda y derecha para ver el semáforo', emoji: '👀', correctOrder: 2 },
      { id: 11, text: 'Cruzar con paso firme cuando los vehículos se detengan', emoji: '🚶', correctOrder: 3 },
    ],
    stepsModerate: [
      { id: 9, text: 'Aproximarse al paso de peatones y detenerse', emoji: '🛑', correctOrder: 1 },
      { id: 10, text: 'Pulsar el botón del semáforo si está disponible', emoji: '🔘', correctOrder: 2 },
      { id: 11, text: 'Comprobar que la luz peatonal esté en verde', emoji: '🟢', correctOrder: 3 },
      { id: 12, text: 'Cruzar mirando hacia ambos lados de la vía', emoji: '🚶', correctOrder: 4 },
    ],
    stepsChallenge: [
      { id: 9, text: 'Buscar el paso señalizado más cercano', emoji: '🦓', correctOrder: 1 },
      { id: 10, text: 'Esperar a que el semáforo peatonal cambie a verde', emoji: '🚦', correctOrder: 2 },
      { id: 11, text: 'Asegurar contacto visual con los conductores parados', emoji: '👀', correctOrder: 3 },
      { id: 12, text: 'Cruzar en línea recta sin detenerse', emoji: '🚶', correctOrder: 4 },
    ],
  },
  {
    id: 4,
    title: 'Cepillarse los dientes',
    description: 'Secuencia lógica para una buena higiene bucal:',
    stepsGentle: [
      { id: 13, text: 'Poner una pequeña cantidad de pasta en el cepillo', emoji: '🪥', correctOrder: 1 },
      { id: 14, text: 'Cepillar los dientes con movimientos circulares suaves', emoji: '😁', correctOrder: 2 },
      { id: 15, text: 'Enjuagar la boca con agua fresca y escupir', emoji: '💧', correctOrder: 3 },
    ],
    stepsModerate: [
      { id: 13, text: 'Humedecer las cerdas del cepillo dental', emoji: '🚰', correctOrder: 1 },
      { id: 14, text: 'Aplicar la pasta dentífrica en el cepillo', emoji: '🪥', correctOrder: 2 },
      { id: 15, text: 'Cepillar todas las caras de los dientes durante dos minutos', emoji: '😁', correctOrder: 3 },
      { id: 16, text: 'Enjuagar con agua el cepillo y guardarlo seco', emoji: '🧴', correctOrder: 4 },
    ],
    stepsChallenge: [
      { id: 13, text: 'Revisar que el cepillo esté limpio antes de empezar', emoji: '🔍', correctOrder: 1 },
      { id: 14, text: 'Poner pasta del tamaño de un guisante en el cabezal', emoji: '🪥', correctOrder: 2 },
      { id: 15, text: 'Cepillar desde la encía hacia el diente suavemente', emoji: '🦷', correctOrder: 3 },
      { id: 16, text: 'Limpiar la lengua y enjuagar con agua templada', emoji: '✨', correctOrder: 4 },
    ],
  },
  {
    id: 5,
    title: 'Regar las plantas de casa',
    description: 'Cuidado cotidiano de las macetas del hogar:',
    stepsGentle: [
      { id: 17, text: 'Llenar la regadera con agua templada', emoji: '🚰', correctOrder: 1 },
      { id: 18, text: 'Tocar la tierra para ver si está seca', emoji: '🪴', correctOrder: 2 },
      { id: 19, text: 'Verter agua despacio en la maceta', emoji: '🌿', correctOrder: 3 },
    ],
    stepsModerate: [
      { id: 17, text: 'Llenar la regadera en el grifo', emoji: '🚰', correctOrder: 1 },
      { id: 18, text: 'Comprobar la humedad de la tierra', emoji: '🪴', correctOrder: 2 },
      { id: 19, text: 'Echar agua suavemente en la base', emoji: '🌿', correctOrder: 3 },
      { id: 20, text: 'Retirar el agua sobrante del plato', emoji: '🧽', correctOrder: 4 },
    ],
    stepsChallenge: [
      { id: 17, text: 'Revisar qué plantas están al sol directo', emoji: '☀️', correctOrder: 1 },
      { id: 18, text: 'Llenar la regadera evitando que rebose', emoji: '🚰', correctOrder: 2 },
      { id: 19, text: 'Retirar hojas secas antes de regar', emoji: '🍂', correctOrder: 3 },
      { id: 20, text: 'Regar de manera uniforme alrededor del tallo', emoji: '🌿', correctOrder: 4 },
    ],
  },
  {
    id: 6,
    title: 'Preparar una tostada de pan',
    description: 'Secuencia cotidiana para un desayuno rico y saludable:',
    stepsGentle: [
      { id: 21, text: 'Cortar una rebanada de pan del día', emoji: '🥖', correctOrder: 1 },
      { id: 22, text: 'Colocar la rebanada dentro de la tostadora', emoji: '♨️', correctOrder: 2 },
      { id: 23, text: 'Untar un poco de aceite o mermelada', emoji: '🍯', correctOrder: 3 },
    ],
    stepsModerate: [
      { id: 21, text: 'Cortar una rebanada de pan fresco', emoji: '🥖', correctOrder: 1 },
      { id: 22, text: 'Poner el pan en la tostadora y bajar la palanca', emoji: '♨️', correctOrder: 2 },
      { id: 23, text: 'Sacar la tostada caliente con cuidado al saltar', emoji: '🍞', correctOrder: 3 },
      { id: 24, text: 'Añadir aceite de oliva y servir en el plato', emoji: '🍽️', correctOrder: 4 },
    ],
    stepsChallenge: [
      { id: 21, text: 'Revisar que la tostadora esté enchufada', emoji: '🔌', correctOrder: 1 },
      { id: 22, text: 'Cortar la rebanada con grosor uniforme', emoji: '🔪', correctOrder: 2 },
      { id: 23, text: 'Tostar a potencia media hasta dorar', emoji: '♨️', correctOrder: 3 },
      { id: 24, text: 'Untar tomate y aceite virgen con una cuchara', emoji: '🍅', correctOrder: 4 },
    ],
  },
  {
    id: 7,
    title: 'Vestirse con ropa limpia por la mañana',
    description: 'Secuencia lógica para vestirse de forma ordenada:',
    stepsGentle: [
      { id: 25, text: 'Ponerse la ropa interior limpia', emoji: '🩲', correctOrder: 1 },
      { id: 26, text: 'Ponerse los pantalones y la camisa', emoji: '👖', correctOrder: 2 },
      { id: 27, text: 'Ponerse los calcetines y calzarse los zapatos', emoji: '👟', correctOrder: 3 },
    ],
    stepsModerate: [
      { id: 25, text: 'Escoger la ropa del armario según el clima', emoji: '👕', correctOrder: 1 },
      { id: 26, text: 'Ponerse la camiseta interior y los pantalones', emoji: '👖', correctOrder: 2 },
      { id: 27, text: 'Abrocharse los botones de la camisa con calma', emoji: '👔', correctOrder: 3 },
      { id: 28, text: 'Ponerse los calcetines y ajustar los zapatos', emoji: '👟', correctOrder: 4 },
    ],
    stepsChallenge: [
      { id: 25, text: 'Revisar la temperatura exterior por la ventana', emoji: '☀️', correctOrder: 1 },
      { id: 26, text: 'Sacar la ropa y extenderla sobre la cama', emoji: '🛏️', correctOrder: 2 },
      { id: 27, text: 'Vestirse de dentro hacia afuera con orden', emoji: '👖', correctOrder: 3 },
      { id: 28, text: 'Mirarse al espejo y atar bien los cordones', emoji: '🪞', correctOrder: 4 },
    ],
  },
  {
    id: 8,
    title: 'Hacer una llamada telefónica',
    description: 'Pasos para comunicarse por teléfono con un ser querido:',
    stepsGentle: [
      { id: 29, text: 'Desbloquear el teléfono móvil', emoji: '📱', correctOrder: 1 },
      { id: 30, text: 'Buscar el contacto familiar en la agenda', emoji: '📖', correctOrder: 2 },
      { id: 31, text: 'Pulsar el botón verde de llamada y saludar', emoji: '📞', correctOrder: 3 },
    ],
    stepsModerate: [
      { id: 29, text: 'Coger el teléfono de la mesa', emoji: '📱', correctOrder: 1 },
      { id: 30, text: 'Abrir la aplicación de contactos o teléfono', emoji: '🔍', correctOrder: 2 },
      { id: 31, text: 'Presionar el botón verde para iniciar la llamada', emoji: '📞', correctOrder: 3 },
      { id: 32, text: 'Hablar con calma y colgar al despedirse', emoji: '👋', correctOrder: 4 },
    ],
    stepsChallenge: [
      { id: 29, text: 'Comprobar que el teléfono tiene batería suficiente', emoji: '🔋', correctOrder: 1 },
      { id: 30, text: 'Buscar el número en favoritos o agenda', emoji: '⭐', correctOrder: 2 },
      { id: 31, text: 'Esperar el tono de llamada con el auricular al oído', emoji: '👂', correctOrder: 3 },
      { id: 32, text: 'Conversar con claridad y presionar colgar', emoji: '🔴', correctOrder: 4 },
    ],
  },
  {
    id: 9,
    title: 'Ir a comprar el pan a la panadería',
    description: 'Secuencia para una salida cotidiana al barrio:',
    stepsGentle: [
      { id: 33, text: 'Coger el monedero y la bolsa de tela', emoji: '👛', correctOrder: 1 },
      { id: 34, text: 'Caminar hasta la panadería y pedir la barra', emoji: '🥖', correctOrder: 2 },
      { id: 35, text: 'Pagar con el dinero justo y volver a casa', emoji: '🏠', correctOrder: 3 },
    ],
    stepsModerate: [
      { id: 33, text: 'Revisar que llevamos las llaves y el monedero', emoji: '🔑', correctOrder: 1 },
      { id: 34, text: 'Bajar a la calle y caminar por la acera', emoji: '🚶', correctOrder: 2 },
      { id: 35, text: 'Pedir la barra de pan caliente en el mostrador', emoji: '🥖', correctOrder: 3 },
      { id: 36, text: 'Guardar el cambio y regresar tranquilos a casa', emoji: '👛', correctOrder: 4 },
    ],
    stepsChallenge: [
      { id: 33, text: 'Pensar qué tipo de pan necesitamos para comer', emoji: '💭', correctOrder: 1 },
      { id: 34, text: 'Coger monedero, bolsa reutilizable y llaves', emoji: '🔑', correctOrder: 2 },
      { id: 35, text: 'Esperar el turno en la tienda pacientemente', emoji: '🧍', correctOrder: 3 },
      { id: 36, text: 'Guardar el tique, el cambio y guardar el pan', emoji: '🥖', correctOrder: 4 },
    ],
  },
];

export const DailySequencingGame: React.FC<DailySequencingGameProps> = ({
  onBack,
  onSaveResult,
  planProgress,
  onNextPlanExercise,
}) => {
  const { clock } = useGameSession();
  const [sessionScenarios, setSessionScenarios] = useState<Scenario[]>([]);
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [selectedStepIds, setSelectedStepIds] = useState<number[]>([]);
  const [availableSteps, setAvailableSteps] = useState<Step[]>([]);
  const [feedback, setFeedback] = useState<string>('Toca los pasos en el orden en que se realizan (1º, 2º y 3º).');
  const [isRoundEvaluated, setIsRoundEvaluated] = useState(false);
  const [isRoundCorrect, setIsRoundCorrect] = useState(false);
  const [mistakesList, setMistakesList] = useState<MistakeDetail[]>([]);
  const [correctScenariosCount, setCorrectScenariosCount] = useState<number>(0);
  const [hasErrorInCurrentRound, setHasErrorInCurrentRound] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number>(clock.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<ExerciseResult | null>(null);

  const initGame = () => {
    const shuffledScenarios = [...ALL_SCENARIOS].sort(() => Math.random() - 0.5).slice(0, 3);
    setSessionScenarios(shuffledScenarios);
    setScenarioIdx(0);
    const first = shuffledScenarios[0];
    const steps = first.stepsGentle;
    setSelectedStepIds([]);
    setIsRoundEvaluated(false);
    setIsRoundCorrect(false);
    setMistakesList([]);
    setCorrectScenariosCount(0);
    setHasErrorInCurrentRound(false);
    setIsCompleted(false);
    setResult(null);
    setStartTime(clock.now());
    setAvailableSteps([...steps].sort(() => Math.random() - 0.5));
    setFeedback('Toca los pasos en el orden en que se realizan (1º, 2º y 3º).');
  };

  useEffect(() => {
    initGame();
  }, []);

  if (sessionScenarios.length === 0) return null;

  const currentScenario = sessionScenarios[scenarioIdx];
  const targetSteps = currentScenario.stepsGentle;

  const handleStepClick = (step: Step) => {
    if (isRoundEvaluated && isRoundCorrect) return;

    const existingIdx = selectedStepIds.indexOf(step.id);
    if (existingIdx !== -1) {
      // Ya estaba seleccionada: deselecciona esta y las posteriores para cambiar el orden
      soundService.playTap();
      setSelectedStepIds(prev => prev.slice(0, existingIdx));
      if (isRoundEvaluated) {
        setIsRoundEvaluated(false);
        setIsRoundCorrect(false);
      }
      setFeedback('Selección modificada. Elige el siguiente paso.');
    } else {
      // No estaba seleccionada: añadir en el siguiente puesto (1, 2 o 3)
      if (selectedStepIds.length < targetSteps.length) {
        soundService.playTap();
        const newSelected = [...selectedStepIds, step.id];
        setSelectedStepIds(newSelected);
        if (isRoundEvaluated) {
          setIsRoundEvaluated(false);
          setIsRoundCorrect(false);
        }

        if (newSelected.length === targetSteps.length) {
          setFeedback('¡Has ordenado los 3 pasos! Revisa tu orden o pulsa "Comprobar Orden".');
        } else {
          setFeedback(`Paso ${newSelected.length} seleccionado. Ahora toca el Paso ${newSelected.length + 1}.`);
        }
      }
    }
  };

  const handleCheckOrder = () => {
    if (selectedStepIds.length !== targetSteps.length) return;

    const orderedSteps = selectedStepIds.map(id => targetSteps.find(s => s.id === id)!);
    const isCorrect = orderedSteps.every((s, idx) => s.correctOrder === idx + 1);

    setIsRoundEvaluated(true);
    setIsRoundCorrect(isCorrect);

    if (isCorrect) {
      soundService.playSuccess();
      soundService.speak('Bien hecho. Has colocado los pasos en orden.');
      setFeedback('¡Correcto! Has ordenado los pasos de forma lógica.');
      if (!hasErrorInCurrentRound) {
        setCorrectScenariosCount(prev => prev + 1);
      }
    } else {
      soundService.playGentlePrompt();
      soundService.speak('Vamos a repasarlo con calma. Pulsa Corregir y prueba otro orden.');
      setFeedback('El orden no es el adecuado. Toca en una tarjeta para cambiar el orden o pulsa "Corregir".');
      setHasErrorInCurrentRound(true);

      const proposedOrder = orderedSteps.map(s => s.text).join(' ➔ ');
      const correctOrder = [...targetSteps].sort((a, b) => a.correctOrder - b.correctOrder).map(s => s.text).join(' ➔ ');

      setMistakesList(prev => [
        ...prev,
        {
          id: 'seq-' + clock.now(),
          item: `Situación: ${currentScenario.title}`,
          userAction: `Orden propuesto: ${proposedOrder}`,
          correctSolution: `Orden secuencial lógico: ${correctOrder}`,
          explanation: 'Piensa en qué acción es imprescindible que ocurra antes que las demás en la vida cotidiana.',
        },
      ]);
    }
  };

  const handleResetRound = () => {
    soundService.playTap();
    setSelectedStepIds([]);
    setIsRoundEvaluated(false);
    setIsRoundCorrect(false);
    setFeedback('Toca los pasos en el orden en que se realizan (Paso 1, Paso 2 y Paso 3).');
  };

  const handleNextScenario = () => {
    soundService.playTap();
    if (scenarioIdx + 1 < sessionScenarios.length) {
      const nextIdx = scenarioIdx + 1;
      setScenarioIdx(nextIdx);
      const nextScenario = sessionScenarios[nextIdx];
      const steps = nextScenario.stepsGentle;
      setSelectedStepIds([]);
      setIsRoundEvaluated(false);
      setIsRoundCorrect(false);
      setHasErrorInCurrentRound(false);
      setFeedback('Toca los pasos en el orden en que se realizan (Paso 1, Paso 2 y Paso 3).');
      setAvailableSteps([...steps].sort(() => Math.random() - 0.5));
    } else {
      const elapsedSeconds = Math.max(20, Math.round((clock.now() - startTime) / 1000));
      const finalScore = 450;
      const total = sessionScenarios.length;
      const finalCorrect = correctScenariosCount;
      const finalAccuracy = Math.max(50, Math.round((finalCorrect / total) * 100));

      const gameResult: ExerciseResult = {
        id: 'res-' + clock.now(),
        exerciseId: 'daily-sequencing',
        domain: 'executive',
        date: new Date().toISOString(),
        durationSeconds: elapsedSeconds,
        accuracy: finalAccuracy,
        score: finalScore,
        correctAnswers: finalCorrect,
        totalQuestions: total,
        feedbackMessage:
          'Has completado el juego de secuencias. Gracias por practicar.',
        mistakesList,
      };

      setResult(gameResult);
      setIsCompleted(true);
      onSaveResult(gameResult);
    }
  };

  return (
    <ExerciseWrapper
      exerciseId="daily-sequencing"
      title={sessionScenarios.length > 1 ? `${currentScenario.title} (${scenarioIdx + 1}/${sessionScenarios.length})` : currentScenario.title}
      domain="executive"
      instructionText="Toca las tarjetas en el orden en que harías cada paso."
      hideBadges={true}
      hideInstructionBanner={true}
      onBack={onBack}
      isCompleted={isCompleted}
      result={result}
      onRestart={initGame}
      planProgress={planProgress}
      onNextPlanExercise={onNextPlanExercise}
    >
      <div className="sequencing-game-container">
        {/* Solo las 3 opciones a ordenar directamente en pantalla */}
        <div className="sequencing-cards-grid">
          {availableSteps.map(step => {
            const selectedIndex = selectedStepIds.indexOf(step.id);
            const isSelected = selectedIndex !== -1;
            const orderNumber = isSelected ? selectedIndex + 1 : null;

            let cardStatusClass = '';
            if (isRoundEvaluated) {
              if (isRoundCorrect) {
                cardStatusClass = 'card-success';
              } else {
                const isThisStepCorrect = step.correctOrder === orderNumber;
                cardStatusClass = isThisStepCorrect ? 'card-success' : 'card-warning';
              }
            }

            return (
              <button
                key={step.id}
                className={`card sequencing-option-card ${isSelected ? 'card-selected' : ''} ${cardStatusClass}`}
                onClick={() => handleStepClick(step)}
                type="button"
                aria-label={`${step.text}${orderNumber ? ` - Seleccionado como paso ${orderNumber}` : ''}`}
                title={isSelected ? `Paso ${orderNumber} seleccionado (toca para cambiar el orden)` : 'Toca para seleccionar este paso'}
              >
                {/* Selection order stays separate from the illustrated action. */}
                {isSelected && (
                  <span className="seq-order-badge" aria-hidden="true">Paso {orderNumber}</span>
                )}

                {/* Emoji del paso */}
                <div className="seq-card-emoji-wrap">
                  <span className="seq-card-emoji"><GameObject transparent symbol={step.emoji} /></span>
                </div>

                {/* Texto descriptivo del paso claramente visible */}
                <div className="seq-card-text-wrap">
                  <p className="seq-card-text">{step.text}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mensaje de feedback al comprobar la ronda */}
        {isRoundEvaluated && (
          <div
            className={`sequencing-round-feedback ${
              isRoundCorrect ? 'feedback-success' : 'feedback-warning'
            }`}
          >
            {feedback}
          </div>
        )}

        {/* Barra inferior de estado y acciones */}
        <div className="sequencing-bottom-bar">
          {!isRoundEvaluated ? (
            <>
              {selectedStepIds.length > 0 && (
                <button
                  className="touch-btn touch-btn-secondary touch-btn-large"
                  onClick={handleResetRound}
                  title="Reiniciar la selección de pasos"
                >
                  <RotateCcw size={22} />
                  <span>Reiniciar Orden</span>
                </button>
              )}

              {selectedStepIds.length === targetSteps.length && (
                <button
                  className="touch-btn touch-btn-primary touch-btn-large gentle-bounce"
                  onClick={handleCheckOrder}
                  title="Comprobar si el orden es correcto"
                >
                  <Check size={26} />
                  <span>Comprobar Orden</span>
                </button>
              )}
            </>
          ) : (
            <div className="sequencing-actions-bar actions-bar">
              {!isRoundCorrect ? (
                <button
                  className="touch-btn touch-btn-secondary touch-btn-large"
                  onClick={handleResetRound}
                >
                  <RotateCcw size={22} />
                  <span>Corregir / Cambiar Orden</span>
                </button>
              ) : (
                <button
                  className="touch-btn touch-btn-primary touch-btn-large gentle-bounce"
                  onClick={handleNextScenario}
                >
                  <span>
                    {scenarioIdx + 1 < sessionScenarios.length ? 'Siguiente Situación' : 'Ver Evaluación'}
                  </span>
                  <ArrowRight size={24} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </ExerciseWrapper>
  );
};
