import { GameObject } from '../components/GameObject';
import React, { useState, useEffect } from 'react';
import { Volume2, HelpCircle, CheckCircle2, ArrowRight } from 'lucide-react';
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
  phoneticHint: string;
  semanticHint: string;
  distractorsGentle: string[];
  distractorsModerate: string[];
  distractorsChallenge: string[];
}

const VOCABULARY_BANK: VocabularyItem[] = [
  {
    id: 1,
    emoji: '⏰',
    word: 'Reloj',
    phoneticHint: 'Empieza por Re...',
    semanticHint: 'Mide las horas y los minutos del día.',
    distractorsGentle: ['Manzana', 'Coche'],
    distractorsModerate: ['Calendario', 'Brújula'],
    distractorsChallenge: ['Reja', 'Remo'],
  },
  {
    id: 2,
    emoji: '🏠',
    word: 'Casa',
    phoneticHint: 'Empieza por Ca...',
    semanticHint: 'Lugar donde vivimos y nos resguardamos.',
    distractorsGentle: ['Zapato', 'Tenedor'],
    distractorsModerate: ['Edificio', 'Cabaña'],
    distractorsChallenge: ['Caja', 'Cama'],
  },
  {
    id: 3,
    emoji: '🥄',
    word: 'Cuchara',
    phoneticHint: 'Empieza por Cucha...',
    semanticHint: 'Cubierto para tomar caldos, sopas o yogur.',
    distractorsGentle: ['Libro', 'Teléfono'],
    distractorsModerate: ['Tenedor', 'Cuchillo'],
    distractorsChallenge: ['Cuchilla', 'Cazoleta'],
  },
  {
    id: 4,
    emoji: '🔑',
    word: 'Llave',
    phoneticHint: 'Empieza por Lla...',
    semanticHint: 'Sirve para abrir y cerrar cerraduras de puertas.',
    distractorsGentle: ['Botón', 'Árbol'],
    distractorsModerate: ['Candado', 'Cerrojo'],
    distractorsChallenge: ['Llama', 'Lluvia'],
  },
  {
    id: 5,
    emoji: '👟',
    word: 'Zapato',
    phoneticHint: 'Empieza por Zapa...',
    semanticHint: 'Calzado que cubre y protege el pie.',
    distractorsGentle: ['Plato', 'Cuchara'],
    distractorsModerate: ['Bota', 'Sandalia'],
    distractorsChallenge: ['Zapatilla', 'Zafiro'],
  },
  {
    id: 6,
    emoji: '🍎',
    word: 'Manzana',
    phoneticHint: 'Empieza por Manza...',
    semanticHint: 'Fruta dulce y crujiente, a menudo de piel roja.',
    distractorsGentle: ['Coche', 'Llave'],
    distractorsModerate: ['Pera', 'Naranja'],
    distractorsChallenge: ['Manga', 'Manzano'],
  },
  {
    id: 7,
    emoji: '🪑',
    word: 'Silla',
    phoneticHint: 'Empieza por Si...',
    semanticHint: 'Mueble con respaldo diseñado para sentarse.',
    distractorsGentle: ['Cuchillo', 'Reloj'],
    distractorsModerate: ['Sillón', 'Banco'],
    distractorsChallenge: ['Sello', 'Silla de ruedas'],
  },
  {
    id: 8,
    emoji: '🚗',
    word: 'Coche',
    phoneticHint: 'Empieza por Co...',
    semanticHint: 'Vehículo de cuatro ruedas para desplazarse por carretera.',
    distractorsGentle: ['Taza', 'Cama'],
    distractorsModerate: ['Camión', 'Moto'],
    distractorsChallenge: ['Cochecito', 'Corchete'],
  },
  {
    id: 9,
    emoji: '☕',
    word: 'Taza',
    phoneticHint: 'Empieza por Ta...',
    semanticHint: 'Recipiente con asa para tomar café o té caliente.',
    distractorsGentle: ['Zapato', 'Ventana'],
    distractorsModerate: ['Vaso', 'Jarra'],
    distractorsChallenge: ['Tapa', 'Tasa'],
  },
  {
    id: 10,
    emoji: '🥖',
    word: 'Pan',
    phoneticHint: 'Palabra corta: P... an',
    semanticHint: 'Alimento básico elaborado con harina, agua y levadura.',
    distractorsGentle: ['Cuchara', 'Coche'],
    distractorsModerate: ['Bizcocho', 'Galleta'],
    distractorsChallenge: ['Pez', 'Paz'],
  },
  {
    id: 11,
    emoji: '🛏️',
    word: 'Cama',
    phoneticHint: 'Empieza por Ca...',
    semanticHint: 'Mueble donde dormimos y descansamos por la noche.',
    distractorsGentle: ['Reloj', 'Puerta'],
    distractorsModerate: ['Sofá', 'Hamaca'],
    distractorsChallenge: ['Copa', 'Capa'],
  },
  {
    id: 12,
    emoji: '🥛',
    word: 'Vaso',
    phoneticHint: 'Empieza por Va...',
    semanticHint: 'Recipiente cilíndrico de cristal para beber agua.',
    distractorsGentle: ['Zapato', 'Camisa'],
    distractorsModerate: ['Copa', 'Taza'],
    distractorsChallenge: ['Vasto', 'Beso'],
  },
  {
    id: 13,
    emoji: '📱',
    word: 'Teléfono',
    phoneticHint: 'Empieza por Tele...',
    semanticHint: 'Dispositivo para llamar y comunicarse con los demás.',
    distractorsGentle: ['Silla', 'Plato'],
    distractorsModerate: ['Ordenador', 'Televisor'],
    distractorsChallenge: ['Telégrafo', 'Telescopio'],
  },
  {
    id: 14,
    emoji: '📖',
    word: 'Libro',
    phoneticHint: 'Empieza por Li...',
    semanticHint: 'Conjunto de páginas encuadernadas con historias para leer.',
    distractorsGentle: ['Cuchara', 'Zapato'],
    distractorsModerate: ['Revista', 'Cuaderno'],
    distractorsChallenge: ['Libre', 'Librero'],
  },
  {
    id: 15,
    emoji: '✂️',
    word: 'Tijeras',
    phoneticHint: 'Empieza por Tije...',
    semanticHint: 'Herramienta de dos hojas articuladas que sirve para cortar.',
    distractorsGentle: ['Manzana', 'Coche'],
    distractorsModerate: ['Cuchillo', 'Navaja'],
    distractorsChallenge: ['Tejedor', 'Tintero'],
  },
  {
    id: 16,
    emoji: '👓',
    word: 'Gafas',
    phoneticHint: 'Empieza por Ga...',
    semanticHint: 'Lentes que se apoyan en la nariz para ver y leer mejor.',
    distractorsGentle: ['Taza', 'Cama'],
    distractorsModerate: ['Lupa', 'Prismáticos'],
    distractorsChallenge: ['Gatos', 'Gazas'],
  },
  {
    id: 17,
    emoji: '🪥',
    word: 'Cepillo',
    phoneticHint: 'Empieza por Cepi...',
    semanticHint: 'Utensilio con cerdas para la limpieza diaria de los dientes.',
    distractorsGentle: ['Pan', 'Llave'],
    distractorsModerate: ['Peine', 'Esponja'],
    distractorsChallenge: ['Cerilla', 'Cestillo'],
  },
  {
    id: 18,
    emoji: '☂️',
    word: 'Paraguas',
    phoneticHint: 'Empieza por Para...',
    semanticHint: 'Artefacto impermeable que abrimos para no mojarnos con la lluvia.',
    distractorsGentle: ['Cuchara', 'Reloj'],
    distractorsModerate: ['Impermeable', 'Sombrilla'],
    distractorsChallenge: ['Parapeto', 'Parador'],
  },
  {
    id: 19,
    emoji: '🎸',
    word: 'Guitarra',
    phoneticHint: 'Empieza por Guita...',
    semanticHint: 'Instrumento musical de cuerda con caja de resonancia de madera.',
    distractorsGentle: ['Manzana', 'Bota'],
    distractorsModerate: ['Violín', 'Laúd'],
    distractorsChallenge: ['Guisante', 'Guirnalda'],
  },
  {
    id: 20,
    emoji: '💡',
    word: 'Lámpara',
    phoneticHint: 'Empieza por Lám...',
    semanticHint: 'Aparato que produce luz artificial para iluminar la estancia.',
    distractorsGentle: ['Zapato', 'Tenedor'],
    distractorsModerate: ['Linterna', 'Foco'],
    distractorsChallenge: ['Lámina', 'Lamento'],
  },
  {
    id: 21,
    emoji: '🚲',
    word: 'Bicicleta',
    phoneticHint: 'Empieza por Bici...',
    semanticHint: 'Vehículo de dos ruedas que avanza impulsado por pedales.',
    distractorsGentle: ['Cama', 'Vaso'],
    distractorsModerate: ['Moto', 'Patinete'],
    distractorsChallenge: ['Biberón', 'Bíceps'],
  },
  {
    id: 22,
    emoji: '🍽️',
    word: 'Plato',
    phoneticHint: 'Empieza por Pla...',
    semanticHint: 'Recipiente llano y redondo sobre el que se sirve la comida.',
    distractorsGentle: ['Reloj', 'Llave'],
    distractorsModerate: ['Fuente', 'Bandeja'],
    distractorsChallenge: ['Plata', 'Planto'],
  },
  {
    id: 23,
    emoji: '👒',
    word: 'Sombrero',
    phoneticHint: 'Empieza por Sombre...',
    semanticHint: 'Prenda con ala que se lleva en la cabeza para protegerse del sol.',
    distractorsGentle: ['Taza', 'Coche'],
    distractorsModerate: ['Gorra', 'Boina'],
    distractorsChallenge: ['Sombra', 'Sombrío'],
  },
  {
    id: 24,
    emoji: '📻',
    word: 'Radio',
    phoneticHint: 'Empieza por Ra...',
    semanticHint: 'Aparato transmisor para escuchar noticias, charlas y música.',
    distractorsGentle: ['Manzana', 'Pan'],
    distractorsModerate: ['Televisión', 'Altavoz'],
    distractorsChallenge: ['Rayo', 'Rana'],
  },
  {
    id: 25,
    emoji: '🐶',
    word: 'Perro',
    phoneticHint: 'Empieza por Pe...',
    semanticHint: 'Animal doméstico leal y cariñoso, conocido como el mejor amigo.',
    distractorsGentle: ['Vaso', 'Mesa'],
    distractorsModerate: ['Gato', 'Lobo'],
    distractorsChallenge: ['Pera', 'Perno'],
  },
  {
    id: 26,
    emoji: '🐱',
    word: 'Gato',
    phoneticHint: 'Empieza por Ga...',
    semanticHint: 'Felino doméstico que ronronea y es muy ágil.',
    distractorsGentle: ['Cuchara', 'Zapato'],
    distractorsModerate: ['Perro', 'Conejo'],
    distractorsChallenge: ['Gota', 'Gallo'],
  },
  {
    id: 27,
    emoji: '🌻',
    word: 'Girasol',
    phoneticHint: 'Empieza por Gira...',
    semanticHint: 'Flor amarilla grande que gira siguiendo la luz del sol.',
    distractorsGentle: ['Coche', 'Tijeras'],
    distractorsModerate: ['Margarita', 'Rosa'],
    distractorsChallenge: ['Giro', 'Giróscopo'],
  },
  {
    id: 28,
    emoji: '🍌',
    word: 'Plátano',
    phoneticHint: 'Empieza por Pláta...',
    semanticHint: 'Fruta dulce alargada y curvada de piel amarilla.',
    distractorsGentle: ['Llave', 'Cama'],
    distractorsModerate: ['Manzana', 'Naranja'],
    distractorsChallenge: ['Platillo', 'Platino'],
  },
  {
    id: 29,
    emoji: '👕',
    word: 'Camisa',
    phoneticHint: 'Empieza por Cami...',
    semanticHint: 'Prenda de vestir con cuello, botones y mangas para el torso.',
    distractorsGentle: ['Taza', 'Reloj'],
    distractorsModerate: ['Camiseta', 'Chaqueta'],
    distractorsChallenge: ['Camilla', 'Camina'],
  },
  {
    id: 30,
    emoji: '🪟',
    word: 'Ventana',
    phoneticHint: 'Empieza por Venta...',
    semanticHint: 'Abertura en la pared con cristal para mirar al exterior.',
    distractorsGentle: ['Pan', 'Cuchillo'],
    distractorsModerate: ['Puerta', 'Balcón'],
    distractorsChallenge: ['Ventaja', 'Ventoso'],
  },
];

export const LanguageNamingGame: React.FC<LanguageNamingGameProps> = ({
  onBack,
  onSaveResult,
  planProgress,
  onNextPlanExercise,
}) => {
  // Preguntas seleccionadas al azar para esta sesión
  const [sessionQuestions, setSessionQuestions] = useState<VocabularyItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hintType, setHintType] = useState<'none' | 'semantic' | 'phonetic'>('none');
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakesList, setMistakesList] = useState<MistakeDetail[]>([]);
  const [startTime] = useState<number>(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<ExerciseResult | null>(null);

  const initQuestions = () => {
    const shuffled = [...VOCABULARY_BANK].sort(() => Math.random() - 0.5);
    setSessionQuestions(shuffled.slice(0, 5));
    setCurrentIdx(0);
    setSelectedOption(null);
    setHintType('none');
    setScore(0);
    setCorrectCount(0);
    setMistakesList([]);
    setIsCompleted(false);
    setResult(null);
  };

  useEffect(() => {
    initQuestions();
  }, []);

  useEffect(() => {
    setSelectedOption(null);
    setHintType('none');
  }, [currentIdx]);

  if (sessionQuestions.length === 0) return null;

  const currentQ = sessionQuestions[currentIdx];

  const distractors = currentQ.distractorsGentle;
  const currentOptions = [currentQ.word, ...distractors].sort();

  const handleSelectOption = (option: string) => {
    if (selectedOption !== null) return;

    setSelectedOption(option);
    const correct = option === currentQ.word;

    if (correct) {
      soundService.playSuccess();
      soundService.speak('Correcto');
      setCorrectCount(prev => prev + 1);
      setScore(prev => prev + 100);
    } else {
      soundService.playGentlePrompt();
      soundService.speak(`Buen intento. El objeto correcto es ${currentQ.word}.`);
      setMistakesList(prev => [
        ...prev,
        {
          id: 'lang-' + Date.now(),
          item: `Objeto: ${currentQ.word}`,
          userAction: `Seleccionaste "${option}"`,
          correctSolution: `La respuesta correcta es "${currentQ.word}"`,
          explanation: currentQ.semanticHint,
        },
      ]);
    }
  };

  const handleHearWord = () => {
    soundService.speak(currentQ.word);
  };

  const handleGiveHint = () => {
    soundService.playGentlePrompt();
    if (hintType === 'none') {
      setHintType('semantic');
      soundService.speak(currentQ.semanticHint);
    } else if (hintType === 'semantic') {
      setHintType('phonetic');
      soundService.speak(`Empieza por ${currentQ.phoneticHint}`);
    }
  };

  const handleNext = () => {
    soundService.playTap();
    if (currentIdx + 1 < sessionQuestions.length) {
      setCurrentIdx(prev => prev + 1);
    } else {
      const elapsedSeconds = Math.max(15, Math.round((Date.now() - startTime) / 1000));
      const total = sessionQuestions.length;
      const finalCorrect = Math.min(total, correctCount);
      const accuracy = Math.min(100, Math.round((finalCorrect / total) * 100));

      const gameResult: ExerciseResult = {
        id: 'res-' + Date.now(),
        exerciseId: 'language-naming',
        domain: 'language',
        date: new Date().toISOString().split('T')[0],
        durationSeconds: elapsedSeconds,
        accuracy,
        score,
        correctAnswers: finalCorrect,
        totalQuestions: total,
        feedbackMessage:
          accuracy >= 80
            ? '¡Excelente fluidez verbal! Has recuperado las palabras con gran agilidad.'
            : '¡Muy buen entrenamiento de lenguaje! La asociación visual y fonológica reconecta tu léxico día a día.',
        mistakesList,
      };

      setResult(gameResult);
      setIsCompleted(true);
      onSaveResult(gameResult);
    }
  };

  return (
    <ExerciseWrapper
      exerciseId="language-naming"
      title={`¿Qué objeto es este? (${currentIdx + 1}/${sessionQuestions.length})`}
      domain="language"
      instructionText="Mira la imagen y elige su nombre. Puedes pedir una pista."
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
          {/* Bloque superior: Foto + Botones de audio inmediatamente debajo */}
          <div className="naming-target-block">
            <div className="naming-emoji-display">
              <span className="large-object-emoji"><GameObject symbol={currentQ.emoji} /></span>
            </div>

            <div className="naming-audio-helpers">
              <button
                className="touch-btn touch-btn-secondary"
                onClick={handleHearWord}
                title="Escuchar la pronunciación de la palabra"
              >
                <Volume2 size={24} />
                <span>Escuchar Nombre</span>
              </button>

              <button
                className="touch-btn touch-btn-secondary"
                onClick={handleGiveHint}
                title="Obtener una pista fonológica o descriptiva"
              >
                <HelpCircle size={24} />
                <span>
                  {hintType === 'none' ? 'Pista de Ayuda' : hintType === 'semantic' ? 'Pista de Sonido' : 'Pista Activa'}
                </span>
              </button>
            </div>

            {hintType !== 'none' && (
              <div className="hint-banner">
                <strong>Pista: </strong>
                <span>{hintType === 'semantic' ? currentQ.semanticHint : currentQ.phoneticHint}</span>
              </div>
            )}
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
                  onClick={() => handleSelectOption(option)}
                  disabled={selectedOption !== null}
                >
                  <span className="option-text">{option}</span>
                  {selectedOption !== null && option === currentQ.word && (
                    <CheckCircle2 size={28} className="option-check-icon" />
                  )}
                </button>
              );
            })}
          </div>

          <div
            className={`naming-next-bar actions-bar ${selectedOption === null ? 'naming-next-bar-hidden' : ''}`}
            aria-hidden={selectedOption === null}
          >
            <button
              className={`touch-btn touch-btn-primary touch-btn-large ${selectedOption !== null ? 'gentle-bounce' : ''}`}
              onClick={handleNext}
              disabled={selectedOption === null}
              tabIndex={selectedOption === null ? -1 : 0}
            >
              <span>{currentIdx + 1 < sessionQuestions.length ? 'Siguiente Palabra' : 'Ver Resultados'}</span>
              <ArrowRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </ExerciseWrapper>
  );
};
