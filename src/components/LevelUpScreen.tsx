import { useState } from 'react';
import type { ExerciseId } from '../types';
import type { ProgressData } from '../services/progressData';
import { getExerciseById } from '../services/exerciseCatalog';
import { ModalFrame } from './ModalFrame';
import { HeaderIllustration } from './HeaderIllustration';

/** Reacts to new completed results, never to placement or the initial cloud load. */
export function LevelUpScreen({ data }: { data: ProgressData }) {
  const [state, setState] = useState(() => ({ data, seen: new Set(data.history.map(r => r.id)), queue: [] as { id: ExerciseId; level: number }[] }));
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
      return before && after && after > before ? [{ id, level: after }] : [];
    });
    setState({ data, seen, queue: [...state.queue, ...gains] });
  }
  const gain = state.queue[0];
  if (!gain) return null;
  const next = () => setState(current => ({ ...current, queue: current.queue.slice(1) }));
  return <ModalFrame labelledBy="level-up-title" onClose={next} dismissOnBackdrop={false}>
    <section className="level-up-screen" key={`${gain.id}-${gain.level}`}>
      <HeaderIllustration scene="achievements" className="level-up-friend"/>
      <p className="level-up-eyebrow">¡HAS SUBIDO DE NIVEL!</p>
      <h1 id="level-up-title">Nivel {gain.level}</h1>
      <p>{getExerciseById(gain.id)?.title}</p>
      <button className="touch-btn touch-btn-primary" onClick={next}>Continuar</button>
    </section>
  </ModalFrame>;
}
