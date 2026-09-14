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
    { id: 'half-century', title: 'Un buen camino', description: 'Completa 50 ejercicios.', target: 50, current: profile.totalSessions, unit: 'ejercicios', artwork: 6 },
    { id: 'century', title: 'Cien pequeños pasos', description: 'Completa 100 ejercicios.', target: 100, current: profile.totalSessions, unit: 'ejercicios', artwork: 7 },
    { id: 'one-hour', title: 'Una hora para ti', description: 'Acumula 60 minutos de práctica.', target: 60, current: profile.totalMinutes, unit: 'minutos', artwork: 8 },
    { id: 'two-hours', title: 'Tiempo bien cuidado', description: 'Acumula 120 minutos de práctica.', target: 120, current: profile.totalMinutes, unit: 'minutos', artwork: 9 },
    { id: 'attention-1', title: 'Mirada curiosa', description: 'Completa 1 ejercicio de atención.', target: 1, current: profile.domainProgress.attention.totalCompleted, unit: 'ejercicio', artwork: 10 },
    { id: 'attention-10', title: 'Ojos de explorador', description: 'Completa 10 ejercicios de atención.', target: 10, current: profile.domainProgress.attention.totalCompleted, unit: 'ejercicios', artwork: 11 },
    { id: 'language-1', title: 'Palabras que brotan', description: 'Completa 1 ejercicio de lenguaje.', target: 1, current: profile.domainProgress.language.totalCompleted, unit: 'ejercicio', artwork: 12 },
    { id: 'language-10', title: 'Conversaciones en flor', description: 'Completa 10 ejercicios de lenguaje.', target: 10, current: profile.domainProgress.language.totalCompleted, unit: 'ejercicios', artwork: 13 },
    { id: 'memory-1', title: 'Un hilo de recuerdos', description: 'Completa 1 ejercicio de memoria.', target: 1, current: profile.domainProgress.memory.totalCompleted, unit: 'ejercicio', artwork: 14 },
    { id: 'memory-10', title: 'Álbum de momentos', description: 'Completa 10 ejercicios de memoria.', target: 10, current: profile.domainProgress.memory.totalCompleted, unit: 'ejercicios', artwork: 15 },
    { id: 'executive-1', title: 'Todo encuentra su lugar', description: 'Completa 1 ejercicio de organización.', target: 1, current: profile.domainProgress.executive.totalCompleted, unit: 'ejercicio', artwork: 16 },
    { id: 'executive-10', title: 'Ideas en orden', description: 'Completa 10 ejercicios de organización.', target: 10, current: profile.domainProgress.executive.totalCompleted, unit: 'ejercicios', artwork: 17 },
    { id: 'motor-1', title: 'Manos en marcha', description: 'Completa 1 ejercicio de coordinación.', target: 1, current: profile.domainProgress.motor.totalCompleted, unit: 'ejercicio', artwork: 18 },
    { id: 'motor-10', title: 'Trazo a trazo', description: 'Completa 10 ejercicios de coordinación.', target: 10, current: profile.domainProgress.motor.totalCompleted, unit: 'ejercicios', artwork: 19 },
  ].map(item => ({ ...item, current: Math.max(0, Math.min(item.current, item.target)), unlocked: item.current >= item.target }));
}
