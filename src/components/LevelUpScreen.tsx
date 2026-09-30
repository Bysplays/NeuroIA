import { useState } from 'react';
import type { ExerciseId } from '../types';
import type { ProgressData } from '../services/progressData';
import { getExerciseById } from '../services/exerciseCatalog';
import { ModalFrame } from './ModalFrame';
import { TrendingUp, ArrowRight } from 'lucide-react';

/** Reacts to new completed results, never to placement or the initial cloud load. */
export function LevelUpScreen({ data }: { data: ProgressData }) {
  const [state, setState] = useState(() => ({ data, seen: new Set(data.history.map(r => r.id)), queue: [] as { id: ExerciseId; level: number; previous: number }[] }));
  if (state.data !== data) {
    const seen = new Set(state.seen);
    const ids = new Set<ExerciseId>();
    for (const result of data.history) {
      if (!seen.has(result.id) && !result.practice) ids.add(result.exerciseId as ExerciseId);
      seen.add(result.id);
    }
    const gains = [...ids].flatMap(id => {
      const before = state.data.profile.gameLevels?.[id]?.level;
      const after = data.profile.gameLevels?.[id]?.level;
      return before && after && after > before ? [{ id, level: after, previous: before }] : [];
    });
    setState({ data, seen, queue: [...state.queue, ...gains] });
  }
  const gain = state.queue[0];
  if (!gain) return null;
  const next = () => setState(current => ({ ...current, queue: current.queue.slice(1) }));
  return <ModalFrame labelledBy="level-up-title" onClose={next} dismissOnBackdrop={false}>
    <section className="entry-error-notification level-up-screen" key={`${gain.id}-${gain.level}`}>
      <div className="entry-error-heading"><TrendingUp size={24} aria-hidden="true"/><h2 id="level-up-title">Un nuevo nivel</h2></div>
      <p className="level-up-game">{getExerciseById(gain.id)?.title}</p>
      <div className="level-up-transition" aria-label={`Has pasado del nivel ${gain.previous} al nivel ${gain.level}`}>
        <span>Nivel {gain.previous}</span><ArrowRight size={22} aria-hidden="true"/><strong>Nivel {gain.level}</strong>
      </div>
      <p>Tu próximo reto empieza aquí.</p>
      <button className="touch-btn touch-btn-primary" onClick={next}>Continuar<ArrowRight size={20} aria-hidden="true"/></button>
    </section>
  </ModalFrame>;
}
