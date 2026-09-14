import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { CognitiveDomain, ExerciseDefinition, UserProfile } from '../types';
import { ALL_EXERCISES, EXERCISE_SUMMARIES } from '../services/exerciseCatalog';
import { soundService } from '../services/soundService';
import { WellnessGlyph } from './WellnessGlyph';

const areas: { id: CognitiveDomain; label: string }[] = [
  { id: 'attention', label: 'Atención' },
  { id: 'language', label: 'Lenguaje' },
  { id: 'memory', label: 'Memoria' },
  { id: 'executive', label: 'Organización' },
  { id: 'motor', label: 'Coordinación' },
];

export function ExerciseCatalog({ profile, onBack, onSelectExercise }: {
  profile: UserProfile;
  onBack: () => void;
  onSelectExercise: (exercise: ExerciseDefinition) => void;
}) {
  const [filter, setFilter] = useState<CognitiveDomain | 'all'>('all');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  const exercises = ALL_EXERCISES.filter(exercise => filter === 'all' || exercise.domain === filter);
  return (
    <section className="exercise-library" aria-labelledby="library-title">
      <button className="text-link" onClick={onBack}><ArrowLeft size={18} /> Volver al inicio</button>
      <div className="library-heading">
        <div>
          <span className="library-eyebrow">Un rato para tu mente</span>
          <h1 id="library-title" tabIndex={-1} ref={heading}>Encuentra tu próximo juego</h1>
          <p>Elige lo que te apetezca. Practica a tu ritmo.</p>
        </div>
      </div>
      <div className="library-filters" role="group" aria-label="Filtrar juegos por área">
        <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>Todos <span>{ALL_EXERCISES.length}</span></button>
        {areas.map(area => <button key={area.id} aria-pressed={filter === area.id} onClick={() => setFilter(area.id)}><span className={`library-dot marker-${area.id}`} />{area.label}</button>)}
      </div>
      <p className="library-result-count" role="status">{exercises.length} {exercises.length === 1 ? 'juego para explorar' : 'juegos para explorar'}</p>
      <div className="library-grid">
        {exercises.map(exercise => (
          <button key={exercise.id} className={`library-game practice-${exercise.domain}`} onClick={() => { soundService.playTap(); onSelectExercise(exercise); }}>
            <span className="library-game-top"><span>{areas.find(area => area.id === exercise.domain)?.label}</span>{profile.prescribedDomains?.includes(exercise.domain) && <span className="library-priority">Pautado para ti</span>}</span>
            <span className="library-game-art"><WellnessGlyph exercise={exercise.id} /></span>
            <strong>{exercise.title}</strong>
            <span className="library-game-description">{EXERCISE_SUMMARIES[exercise.id]}</span>
            <span className="library-game-action">Empezar <span><ArrowRight size={20} /></span></span>
          </button>
        ))}
      </div>
    </section>
  );
}
