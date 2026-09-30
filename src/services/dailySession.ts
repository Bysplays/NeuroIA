import type { ExerciseId } from '../types/index.ts';

// All unordered triples have an explicit, stable editorial name.
export const DAILY_SESSIONS: ReadonlyArray<{ games: readonly ExerciseId[]; title: string }> = [
  { games: ["visual-scanning", "language-naming", "word-completion"], title: "Figuras entre palabras" },
  { games: ["visual-scanning", "language-naming", "memory-path"], title: "Mira, nombra y recuerda" },
  { games: ["visual-scanning", "language-naming", "memory-pairs"], title: "Nombres que hacen pareja" },
  { games: ["visual-scanning", "language-naming", "categorization"], title: "Cada figura con su nombre" },
  { games: ["visual-scanning", "language-naming", "motor-target"], title: "Palabras con puntería" },
  { games: ["visual-scanning", "language-naming", "motor-tracking"], title: "Miradas en movimiento" },
  { games: ["visual-scanning", "word-completion", "memory-path"], title: "Letras que dejan huella" },
  { games: ["visual-scanning", "word-completion", "memory-pairs"], title: "Figuras y letras en pareja" },
  { games: ["visual-scanning", "word-completion", "categorization"], title: "Letras en su lugar" },
  { games: ["visual-scanning", "word-completion", "motor-target"], title: "Letras en el punto de mira" },
  { games: ["visual-scanning", "word-completion", "motor-tracking"], title: "Sigue la pista de las letras" },
  { games: ["visual-scanning", "memory-path", "memory-pairs"], title: "Pistas para recordar" },
  { games: ["visual-scanning", "memory-path", "categorization"], title: "Un orden que recordar" },
  { games: ["visual-scanning", "memory-path", "motor-target"], title: "Recuerdos con puntería" },
  { games: ["visual-scanning", "memory-path", "motor-tracking"], title: "Tras la pista del recuerdo" },
  { games: ["visual-scanning", "memory-pairs", "categorization"], title: "Parejas en su lugar" },
  { games: ["visual-scanning", "memory-pairs", "motor-target"], title: "Encuentros con puntería" },
  { games: ["visual-scanning", "memory-pairs", "motor-tracking"], title: "Parejas sobre la marcha" },
  { games: ["visual-scanning", "categorization", "motor-target"], title: "Todo en el punto de mira" },
  { games: ["visual-scanning", "categorization", "motor-tracking"], title: "Cada pista en su lugar" },
  { games: ["visual-scanning", "motor-target", "motor-tracking"], title: "Mirar, tocar y seguir" },
  { games: ["language-naming", "word-completion", "memory-path"], title: "Palabras en la memoria" },
  { games: ["language-naming", "word-completion", "memory-pairs"], title: "Palabras que se encuentran" },
  { games: ["language-naming", "word-completion", "categorization"], title: "Un lugar para las palabras" },
  { games: ["language-naming", "word-completion", "motor-target"], title: "Palabras al blanco" },
  { games: ["language-naming", "word-completion", "motor-tracking"], title: "Palabras en movimiento" },
  { games: ["language-naming", "memory-path", "memory-pairs"], title: "Nombres para recordar" },
  { games: ["language-naming", "memory-path", "categorization"], title: "Recuerdos bien ordenados" },
  { games: ["language-naming", "memory-path", "motor-target"], title: "Nombra, recuerda y acierta" },
  { games: ["language-naming", "memory-path", "motor-tracking"], title: "Nombres que marcan el camino" },
  { games: ["language-naming", "memory-pairs", "categorization"], title: "Nombra y reúne" },
  { games: ["language-naming", "memory-pairs", "motor-target"], title: "Parejas con nombre y puntería" },
  { games: ["language-naming", "memory-pairs", "motor-tracking"], title: "Nombres que van de la mano" },
  { games: ["language-naming", "categorization", "motor-target"], title: "Nombra, ordena y acierta" },
  { games: ["language-naming", "categorization", "motor-tracking"], title: "Nombres sobre la marcha" },
  { games: ["language-naming", "motor-target", "motor-tracking"], title: "Nombra, toca y sigue" },
  { games: ["word-completion", "memory-path", "memory-pairs"], title: "Letras que hacen memoria" },
  { games: ["word-completion", "memory-path", "categorization"], title: "Recuerdos entre letras" },
  { games: ["word-completion", "memory-path", "motor-target"], title: "Letras, luces y puntería" },
  { games: ["word-completion", "memory-path", "motor-tracking"], title: "Letras que marcan el camino" },
  { games: ["word-completion", "memory-pairs", "categorization"], title: "Parejas entre letras" },
  { games: ["word-completion", "memory-pairs", "motor-target"], title: "Letras que dan en el blanco" },
  { games: ["word-completion", "memory-pairs", "motor-tracking"], title: "Letras que van de la mano" },
  { games: ["word-completion", "categorization", "motor-target"], title: "Orden y puntería entre letras" },
  { games: ["word-completion", "categorization", "motor-tracking"], title: "Letras en ruta" },
  { games: ["word-completion", "motor-target", "motor-tracking"], title: "Completa, toca y sigue" },
  { games: ["memory-path", "memory-pairs", "categorization"], title: "Recuerdos en su lugar" },
  { games: ["memory-path", "memory-pairs", "motor-target"], title: "Parejas, luces y puntería" },
  { games: ["memory-path", "memory-pairs", "motor-tracking"], title: "Recuerdos que se acompañan" },
  { games: ["memory-path", "categorization", "motor-target"], title: "Recuerda, ordena y acierta" },
  { games: ["memory-path", "categorization", "motor-tracking"], title: "El camino de los recuerdos" },
  { games: ["memory-path", "motor-target", "motor-tracking"], title: "Recuerda, toca y sigue" },
  { games: ["memory-pairs", "categorization", "motor-target"], title: "Cada pareja en el blanco" },
  { games: ["memory-pairs", "categorization", "motor-tracking"], title: "Parejas en ruta" },
  { games: ["memory-pairs", "motor-target", "motor-tracking"], title: "Encuentra, toca y sigue" },
  { games: ["categorization", "motor-target", "motor-tracking"], title: "Ordena, toca y sigue" },
];

/** Account and local calendar day only: completing games never reshuffles today's session. */
export function dailySession(uid: string, date = new Date()) {
  let offset = 0;
  for (const character of uid) offset = (Math.imul(offset, 31) + character.charCodeAt(0)) >>> 0;
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return DAILY_SESSIONS[((day + offset) % DAILY_SESSIONS.length + DAILY_SESSIONS.length) % DAILY_SESSIONS.length];
}
