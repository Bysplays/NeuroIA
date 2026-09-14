import type { UserProfile } from '../types';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  artwork: number;
  unlocked: boolean;
}

/** Cumulative milestones remain earned; no dependency on a streak that can expire. */
export function getAchievements(profile: UserProfile): Achievement[] {
  const areas = Object.values(profile.domainProgress).filter(area => area.totalCompleted > 0).length;
  return [
    { id: 'first-step', title: 'El primer paso', description: 'Completa tu primer ejercicio.', target: 1, current: profile.totalSessions, unit: 'ejercicio', artwork: 0 },
    { id: 'finding-rhythm', title: 'A tu ritmo', description: 'Completa 5 ejercicios, en los días que quieras.', target: 5, current: profile.totalSessions, unit: 'ejercicios', artwork: 1 },
    { id: 'ten-moments', title: 'Diez momentos', description: 'Completa 10 ejercicios. Cada ratito suma.', target: 10, current: profile.totalSessions, unit: 'ejercicios', artwork: 2 },
    { id: 'growing', title: 'Sigue creciendo', description: 'Completa 25 ejercicios a tu manera.', target: 25, current: profile.totalSessions, unit: 'ejercicios', artwork: 3 },
    { id: 'time-for-you', title: 'Tiempo para ti', description: 'Acumula 30 minutos de práctica entre tus sesiones.', target: 30, current: profile.totalMinutes, unit: 'minutos', artwork: 4 },
    { id: 'explorer', title: 'Mente curiosa', description: 'Completa al menos un ejercicio en cada una de las 5 áreas.', target: 5, current: areas, unit: 'áreas', artwork: 5 },
  ].map(item => ({ ...item, current: Math.max(0, Math.min(item.current, item.target)), unlocked: item.current >= item.target }));
}
