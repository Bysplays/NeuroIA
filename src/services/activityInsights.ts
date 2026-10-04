import { ALL_EXERCISES } from './exerciseCatalog.ts';
import { ACTIVITY_EXERCISES } from './activityExercises.ts';
import type { ExerciseId, ExerciseResult, UserProfile } from '../types/index.ts';

// Shared by the browser and Worker. No identity, free text or physiological data
// may cross this projection into the language-model input.
export const INSIGHTS_VERSION = 'activity-v2';
export interface InsightFilters { from: string; to: string; domain: string; exercise: string; timeZone: string }
export interface InsightFact { id: string; text: string }
export interface InsightSuggestion { id: string; exerciseId: ExerciseId; title: string; action: string; evidence: string[] }
export interface InsightGame {
  id: string; title: string; count: number; accuracy: number | null; secondsPerQuestion: number | null;
  currentLevel: number | null; lastDay: string | null;
}
export interface ActivityInsights {
  version: string; filters: InsightFilters; count: number; activeDays: number; seconds: number;
  firstDay: string | null; lastDay: string | null; partial: boolean; excluded: number;
  currentLevels: { id: string; title: string; level: number | null }[]; games: InsightGame[]; facts: InsightFact[]; suggestions: InsightSuggestion[]; limitations: string[];
}
export interface AiNarrative {
  summary: string;
  observations: { text: string; evidence: string[] }[];
  recommendations: { suggestionId: string; explanation: string }[];
}
export interface AiAnalysis {
  narrative: AiNarrative; insights: ActivityInsights;
  provenance: { generatedAt: string; model: string; promptVersion: string; snapshotHash: string; mode: 'recommendations' | 'report' };
}
const round = (value: number) => Math.round(value * 10) / 10;
const number = (value: number) => value.toLocaleString('es-ES', { maximumFractionDigits: 1 });
const mean = (values: number[]) => values.length ? round(values.reduce((a, b) => a + b, 0) / values.length) : null;
const level = (value: unknown): value is number => Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 10;
const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
export function validInsightDate(value: string) {
  return dateOnly.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function insightDay(date: string, timeZone: string) {
  if (dateOnly.test(date)) return validInsightDate(date) ? date : null;
  if (!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(date) || !Number.isFinite(Date.parse(date))) return null;
  const parts = new Intl.DateTimeFormat('en', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(date));
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)!.value).join('-');
}
export function validInsightFilters(value: unknown): value is InsightFilters {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const f = value as InsightFilters;
  if (Object.keys(f).length !== 5 || !['from', 'to', 'domain', 'exercise', 'timeZone'].every(key => typeof f[key as keyof InsightFilters] === 'string')) return false;
  if ((f.from && !validInsightDate(f.from)) || (f.to && !validInsightDate(f.to)) || (f.from && f.to && f.from > f.to)) return false;
  if (f.domain && !ACTIVITY_EXERCISES.some(game => game.domain === f.domain)) return false;
  if (f.exercise && !ACTIVITY_EXERCISES.some(game => game.id === f.exercise && (!f.domain || game.domain === f.domain))) return false;
  try { new Intl.DateTimeFormat('en', { timeZone: f.timeZone }).format(); } catch { return false; }
  return f.timeZone.length > 0 && f.timeZone.length <= 80;
}
const aliases: Record<string, string> = { 'visual-scan': 'visual-scanning', 'daily-seq': 'daily-sequencing', 'motor-coord': 'motor-target' };

export function buildActivityInsights(history: ExerciseResult[], levels: UserProfile['gameLevels'], filters: InsightFilters,
  options: { partial: boolean; tapsOnly?: boolean; now?: number } = { partial: true }): ActivityInsights {
  if (!validInsightFilters(filters)) throw Error('invalid-insight-filters');
  const today = insightDay(new Date(options.now ?? Date.now()).toISOString(), filters.timeZone)!;
  let excluded = 0;
  const rows: { game: string; day: string; date: string; accuracy: number; speed: number | null; seconds: number; level: number | null; version: number | null; hints: number | null; assigned: boolean }[] = [];
  for (const r of new Map(history.filter(r => r && typeof r.id === 'string').map(r => [r.id, r])).values()) {
    if (r.practice === true) continue;
    const id = aliases[r.exerciseId] ?? r.exerciseId;
    const game = ALL_EXERCISES.find(g => g.id === id);
    const day = typeof r.date === 'string' ? insightDay(r.date, filters.timeZone) : null;
    if (!game || !day || day > today || !Number.isInteger(r.totalQuestions) || r.totalQuestions <= 0 || r.totalQuestions > 1000
      || !Number.isInteger(r.correctAnswers) || r.correctAnswers < 0 || r.correctAnswers > r.totalQuestions
      || !Number.isFinite(r.durationSeconds) || r.durationSeconds < 0 || r.durationSeconds > 86400) { excluded++; continue; }
    if ((filters.exercise && id !== filters.exercise) || (filters.domain && game.domain !== filters.domain)
      || (filters.from && day < filters.from) || (filters.to && day > filters.to)) continue;
    rows.push({ game: id, day, date: r.date, accuracy: 100 * r.correctAnswers / r.totalQuestions,
      speed: r.durationSeconds > 0 ? r.durationSeconds / r.totalQuestions : null, seconds: r.durationSeconds,
      level: level(r.level) ? r.level : null, version: Number.isInteger(r.configVersion) ? r.configVersion! : null,
      hints: Number.isInteger(r.hintsUsed) && r.hintsUsed! >= 0 ? r.hintsUsed! : null, assigned: Boolean(r.assignmentId) });
  }
  rows.sort((a, b) => a.day.localeCompare(b.day) || a.date.localeCompare(b.date));
  const games = ALL_EXERCISES.filter(g => (!filters.exercise || filters.exercise === g.id) && (!filters.domain || filters.domain === g.domain))
    .map(g => {
      const played = rows.filter(r => r.game === g.id);
      return { id: g.id, title: g.title, count: played.length, accuracy: mean(played.map(r => r.accuracy)),
        secondsPerQuestion: mean(played.flatMap(r => r.speed === null ? [] : [r.speed])),
        currentLevel: level(levels?.[g.id as ExerciseId]?.level) ? levels![g.id as ExerciseId]!.level : null,
        lastDay: played.at(-1)?.day ?? null };
    });
  const count = rows.length;
  const facts: InsightFact[] = [{ id: 'activity', text: `${count} partidas completadas en ${new Set(rows.map(r => r.day)).size} días de la selección.` }];
  for (const g of games) {
    facts.push({ id: `game:${g.id}`, text: `${g.title}: ${g.count} partidas en la selección${g.accuracy === null ? '' : `, precisión media ${number(g.accuracy)}%`}${g.secondsPerQuestion === null ? '' : ` y ${number(g.secondsPerQuestion)} s/pregunta`}.` });
  }
  const eligible = games.filter(g => ALL_EXERCISES.some(active => active.id === g.id) && !(options.tapsOnly && g.id === 'motor-tracking'));
  const suggestions: InsightSuggestion[] = [];
  if (count) {
    // Variety is relative to observed coverage, never a diagnosis of neglect.
    const least = [...eligible].sort((a, b) => a.count - b.count || (a.lastDay ?? '').localeCompare(b.lastDay ?? ''))[0];
    const most = Math.max(0, ...eligible.map(g => g.count));
    if (least && least.count < most) suggestions.push({ id: `variety:${least.id}`, exerciseId: least.id as ExerciseId,
      title: `Prueba también «${least.title}»`, action: least.count ? 'Puedes alternarlo con tus juegos más habituales, si te apetece.' : 'Puedes probarlo para dar variedad a tu práctica, si te apetece.', evidence: [`game:${least.id}`] });
    for (const g of eligible) {
      // Never compare speed across games, difficulty levels or configuration versions.
      const played = rows.filter(r => r.game === g.id);
      const last = played.at(-1);
      if (!last || last.level === null || last.version === null) continue;
      const comparable = played.filter(r => r.level === last.level && r.version === last.version);
      const recent = comparable.slice(-3);
      if (recent.length < 3) continue;
      const accuracy = mean(recent.map(r => r.accuracy))!;
      const factId = `recent:${g.id}`;
      facts.push({ id: factId, text: `${g.title}: las últimas ${recent.length} partidas comparables del nivel ${last.level} tienen ${number(accuracy)}% de precisión media.` });
      if (accuracy < 70) suggestions.push({ id: `steady:${g.id}`, exerciseId: g.id as ExerciseId, title: `A tu ritmo en «${g.title}»`,
        action: 'Puedes mantener el nivel o elegir uno más cómodo en una partida libre. No hace falta ir más deprisa.', evidence: [factId] });
      else if (accuracy >= 90 && recent.every(r => r.hints === 0 && !r.assigned) && g.currentLevel === last.level && last.level < 10) suggestions.push({ id: `challenge:${g.id}`, exerciseId: g.id as ExerciseId,
        title: `Otro reto en «${g.title}»`, action: `Si este nivel te resulta cómodo, puedes probar el nivel ${last.level + 1} en una partida libre. Tú decides; no se cambia ningún nivel.`, evidence: [factId] });
      if (comparable.length >= 6) {
        const previous = comparable.slice(-6, -3);
        const oldSpeed = previous.every(r => r.speed !== null) ? mean(previous.map(r => r.speed!)) : null;
        const newSpeed = recent.every(r => r.speed !== null) ? mean(recent.map(r => r.speed!)) : null;
        if (oldSpeed !== null && newSpeed !== null) facts.push({ id: `speed:${g.id}`, text: `${g.title}, nivel ${last.level}: media de las tres partidas anteriores ${number(oldSpeed)} s/pregunta; últimas tres ${number(newSpeed)} s/pregunta. Precisión: ${number(mean(previous.map(r => r.accuracy))!)}% y ${number(accuracy)}%. No mide tiempo de reacción.` });
      }
    }
    if (!suggestions.length && eligible.some(g => g.count)) {
      const game = eligible.find(g => g.count)!;
      suggestions.push({ id: `continue:${game.id}`, exerciseId: game.id as ExerciseId, title: 'Sigue a tu ritmo', action: 'Puedes repetir un juego que te resulte cómodo. Hace falta más actividad comparable para sugerir un cambio de nivel.', evidence: [`game:${game.id}`] });
    }
  }
  const limitations = [
    options.partial ? 'Cobertura parcial: solo se analiza el historial disponible. La ausencia de partidas no significa que nunca se haya jugado.' : 'Se analiza el historial disponible con estos filtros, no toda la actividad fuera de NeuroIA.',
    'La precisión es la media por partida, calculada a partir de aciertos y preguntas. La velocidad es duración por pregunta, no tiempo de reacción; no se compara entre juegos o niveles distintos.',
    'Las sugerencias son opcionales. No cambian niveles ni propuestas profesionales y no son una evaluación clínica.',
    'No se utilizan señales EEG/PPG, diagnósticos ni notas personales. Las partidas de prueba y los datos no válidos se excluyen.',
  ];
  if (count < 3) limitations.push('Hay pocas partidas para describir una tendencia.');
  if (excluded) limitations.push(`Se han excluido ${excluded} registros no válidos o no compatibles antes de aplicar los filtros.`);
  return { version: INSIGHTS_VERSION, filters, count, activeDays: new Set(rows.map(r => r.day)).size, seconds: round(rows.reduce((sum, r) => sum + r.seconds, 0)),
    currentLevels: ALL_EXERCISES.map(g => ({ id: g.id, title: g.title, level: level(levels?.[g.id]?.level) ? levels![g.id]!.level : null })),
    firstDay: rows[0]?.day ?? null, lastDay: rows.at(-1)?.day ?? null, partial: options.partial, excluded, games, facts, suggestions: suggestions.slice(0, 3), limitations };
}

export function basicNarrative(insights: ActivityInsights): AiNarrative {
  return { summary: insights.count ? 'Estas ideas se basan en la actividad disponible y en los juegos que has practicado. Elige lo que te resulte útil, a tu ritmo.' : 'Todavía no hay partidas válidas en esta selección para preparar recomendaciones.',
    observations: [], recommendations: insights.suggestions.map(s => ({ suggestionId: s.id, explanation: s.action })) };
}

// Schema conformance is checked again server-side. Structured output alone is
// not evidence of factuality. Metrics/actions remain authored by the pure reducer.
// This is a conservative scope guard, not semantic entailment: reject collective
// game claims and named games without their own cited facts. Human factuality
// review is still required for numbers, causality, trends and the free summary.
export function validObservationScope(text: string, evidence: string[]) {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ');
  const normalized = normalize(text);
  if (/\b(resto|demas|otros|otras|todos|todas|ningun|ninguno|ninguna)\b[^.!?;]{0,35}\bjuegos?\b/.test(normalized)) return false;
  if (new Set(evidence).size !== evidence.length) return false;
  return ALL_EXERCISES.every(game => !normalized.includes(normalize(game.title))
    || ['game', 'recent', 'speed'].some(kind => evidence.includes(`${kind}:${game.id}`)));
}
export function validAiNarrative(value: unknown, insights: ActivityInsights): value is AiNarrative {
  if (!value || typeof value !== 'object') return false;
  const v = value as AiNarrative;
  const safeText = (text: unknown, max: number): text is string => typeof text === 'string' && text.trim().length > 0 && text.length <= max
    && !/RELLENAR|COPIAR_UN_ID_DE_FACTS/.test(text)
    && !/[<>]|https?:\/\//i.test(text) && !Array.from(text).some(c => c.charCodeAt(0) < 32 && !['\n', '\r', '\t'].includes(c))
    && !/\b(diagn[oó]stic\w*|neuroplasticidad|rehabilita\w*|cura\w*|tratamiento|fatiga|ictus|demencia|deterioro cognitivo)\b/i.test(text);
  const keys = (o: object, expected: string[]) => Object.keys(o).length === expected.length && expected.every(k => Object.hasOwn(o, k));
  if (!keys(v, ['summary', 'observations', 'recommendations']) || !safeText(v.summary, 1600)) return false;
  if (!Array.isArray(v.observations) || v.observations.length > 5 || !v.observations.every(o => o && keys(o, ['text', 'evidence']) && safeText(o.text, 700)
    && Array.isArray(o.evidence) && o.evidence.length > 0 && o.evidence.length <= 3 && o.evidence.every(id => insights.facts.some(f => f.id === id))
    && validObservationScope(o.text, o.evidence))) return false;
  return Array.isArray(v.recommendations) && v.recommendations.length <= 3 && v.recommendations.length === insights.suggestions.length
    && new Set(v.recommendations.map(r => r?.suggestionId)).size === v.recommendations.length
    && v.recommendations.every(r => r && keys(r, ['suggestionId', 'explanation']) && safeText(r.explanation, 700) && insights.suggestions.some(s => s.id === r.suggestionId));
}

export function reportNarrative(narrative: AiNarrative, insights: ActivityInsights) {
  return [narrative.summary, ...narrative.observations.map(o => o.text),
    ...narrative.recommendations.map(r => `${insights.suggestions.find(s => s.id === r.suggestionId)!.title}\n${r.explanation}`)].join('\n\n');
}
