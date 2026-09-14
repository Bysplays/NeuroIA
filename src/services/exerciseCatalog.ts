import type { CognitiveDomain, ExerciseDefinition, ExerciseId } from '../types';

export const EXERCISES_BY_DOMAIN: Record<CognitiveDomain, ExerciseDefinition[]> = {
  attention: [
    {
      id: 'visual-scanning',
      domain: 'attention',
      title: 'Rastreo y Búsqueda Visual',
      subtitle: 'Cancelación y Foco',
      description: 'Encuentra el elemento repetido en una cuadrícula con distractores. Esencial para la heminegligencia.',
      iconName: 'Search',
    },
  ],
  language: [
    {
      id: 'language-naming',
      domain: 'language',
      title: 'Denominación de Objetos',
      subtitle: 'Fluidez y Vocabulario',
      description: 'Observa la imagen y elige la palabra correcta con pistas fonológicas y de sonido.',
      iconName: 'BookOpen',
    },
    {
      id: 'word-completion',
      domain: 'language',
      title: 'Completar Palabras Faltantes',
      subtitle: 'Léxico y Ortografía Táctil',
      description: 'Completa la palabra del objeto colocando las letras que faltan mediante teclas táctiles grandes.',
      iconName: 'Type',
    },
  ],
  memory: [
    {
      id: 'memory-path',
      domain: 'memory',
      title: 'Secuencia de Balizas',
      subtitle: 'Memoria de Trabajo Espacial',
      description: 'Observa el orden en que se iluminan las balizas luminosas y repite la misma secuencia.',
      iconName: 'Sparkles',
    },
    {
      id: 'memory-pairs',
      domain: 'memory',
      title: 'Parejas de Memoria',
      subtitle: 'Retención y Parejas Cotidianas',
      description: 'Encuentra las parejas de objetos cotidianos volteando cartas boca abajo en una cuadrícula clara.',
      iconName: 'Grid',
    },
  ],
  executive: [
    {
      id: 'daily-sequencing',
      domain: 'executive',
      title: 'Secuencias de la Vida Diaria',
      subtitle: 'Lógica y Planificación Temporal',
      description: 'Ordena temporalmente 3 acciones cotidianas (higiene, cocina, seguridad) para tu autonomía.',
      iconName: 'ListOrdered',
    },
    {
      id: 'categorization',
      domain: 'executive',
      title: 'Clasificación por Categorías',
      subtitle: 'Razonamiento y Toma de Decisiones',
      description: 'Clasifica objetos de la vida diaria en sus contenedores temáticos (alimentos, ropa, higiene).',
      iconName: 'Layers',
    },
  ],
  motor: [
    {
      id: 'motor-target',
      domain: 'motor',
      title: 'Toque de Dianas Estáticas',
      subtitle: 'Precisión Táctil y Puntería',
      description: 'Toca dianas grandes en pantalla a tu ritmo para reentrenar la motricidad fina de los dedos.',
      iconName: 'Hand',
    },
    {
      id: 'motor-tracking',
      domain: 'motor',
      title: 'Persecución de Diana Móvil',
      subtitle: 'Rastreo Motor Continuo',
      description: 'Sigue con el dedo una diana que se mueve lentamente en la pantalla para recargar la meta.',
      iconName: 'Compass',
    },
  ],
};

export const ALL_EXERCISES: ExerciseDefinition[] = Object.values(EXERCISES_BY_DOMAIN).flat();

export function getExerciseById(id: ExerciseId): ExerciseDefinition | undefined {
  return ALL_EXERCISES.find(ex => ex.id === id);
}

export function getExercisesForDomain(domain: CognitiveDomain): ExerciseDefinition[] {
  return EXERCISES_BY_DOMAIN[domain] || [];
}
