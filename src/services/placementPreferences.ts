import type { CognitiveDomain, ExerciseId } from '../types/index.ts';
import { ALL_EXERCISES, EXERCISES_BY_DOMAIN } from './exerciseCatalog.ts';

export const INTEREST_AREAS = [
  { id: 'attention', title: 'Atención', description: 'Buscar y fijarte en los detalles.' },
  { id: 'memory', title: 'Memoria', description: 'Recordar parejas y secuencias.' },
  { id: 'language', title: 'Lenguaje', description: 'Reconocer y completar palabras.' },
  { id: 'executive', title: 'Organización', description: 'Agrupar objetos y elegir categorías.' },
  { id: 'motor', title: 'Coordinación', description: 'Tocar y seguir objetivos en pantalla.' },
] as const satisfies readonly { id: CognitiveDomain; title: string; description: string }[];
export interface ConditionContext {
  kind: 'stroke' | 'other' | 'none';
  side: 'unspecified' | 'left' | 'right' | 'both' | 'none';
  mobility: 'unspecified' | 'independent' | 'support' | 'limited';
  consentVersion: 1;
}
export function validConditionContext(value: unknown): value is ConditionContext {
  if (!value || typeof value !== 'object') return false;
  const c = value as ConditionContext;
  return Object.keys(c).length === 4 && c.consentVersion === 1
    && ['stroke', 'other', 'none'].includes(c.kind)
    && ['unspecified', 'left', 'right', 'both', 'none'].includes(c.side)
    && ['unspecified', 'independent', 'support', 'limited'].includes(c.mobility)
    && (c.kind !== 'none' || (c.side === 'unspecified' && c.mobility === 'unspecified'));
}
export interface PlacementPreferences {
  interests: CognitiveDomain[];
  movement: 'unspecified' | 'standard' | 'taps';
  condition?: ConditionContext;
}
export function validPlacementPreferences(value: unknown): value is PlacementPreferences {
  if (!value || typeof value !== 'object') return false;
  const p = value as PlacementPreferences;
  return Object.keys(p).every(key => ['interests', 'movement', 'condition'].includes(key))
    && (!('condition' in p) || validConditionContext(p.condition)) && Array.isArray(p.interests) && p.interests.length > 0
    && p.interests.length <= 5 && new Set(p.interests).size === p.interests.length
    && p.interests.every(id => INTEREST_AREAS.some(area => area.id === id))
    && ['unspecified', 'standard', 'taps'].includes(p.movement);
}
export function placementExercises(preferences?: PlacementPreferences): ExerciseId[] {
  if (!preferences) return ALL_EXERCISES.map(game => game.id);
  if (!validPlacementPreferences(preferences)) throw new Error('invalid-placement-preferences');
  return preferences.interests.flatMap(domain => EXERCISES_BY_DOMAIN[domain])
    .filter(game => preferences.movement !== 'taps' || game.id !== 'motor-tracking').map(game => game.id);
}
/** Finish one selected area before moving to the next, keeping the displayed plan stable. */
export function nextThematicGame(available: ExerciseId[], previous?: ExerciseId): ExerciseId | undefined {
  const domain = ALL_EXERCISES.find(game => game.id === available[0])?.domain;
  const area = available.filter(id => ALL_EXERCISES.find(game => game.id === id)?.domain === domain);
  return area.find(id => id !== previous) ?? area[0];
}
