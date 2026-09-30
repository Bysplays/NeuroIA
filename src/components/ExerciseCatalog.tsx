import { TabletPager } from './TabletTabs';
import { useCompactViewport } from '../services/viewport';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Search, MessageCircle, LetterText, Route, Copy, Shapes, CircleDot, Hand } from 'lucide-react';
import type { CognitiveDomain, ExerciseDefinition, ExerciseId, UserProfile } from '../types';
import { ALL_EXERCISES, EXERCISE_SUMMARIES } from '../services/exerciseCatalog';
import { soundService } from '../services/soundService';
const gameIcons = {
  'visual-scanning': Search, 'language-naming': MessageCircle,
  'word-completion': LetterText, 'memory-path': Route, 'memory-pairs': Copy,
  categorization: Shapes, 'motor-target': CircleDot, 'motor-tracking': Hand,
};
function CatalogIcon({ exercise }: { exercise: ExerciseId }) {
  const Icon = gameIcons[exercise];
  return <Icon size={36} strokeWidth={1.6} aria-hidden="true"/>;
}

const areas: { id: CognitiveDomain; label: string }[] = [
  { id: 'attention', label: 'Atención' },
  { id: 'language', label: 'Lenguaje' },
  { id: 'memory', label: 'Memoria' },
  { id: 'executive', label: 'Organización' },
  { id: 'motor', label: 'Coordinación' },
];

export function ExerciseCatalog({ profile, onBack, onSelectExercise, embedded = false }: {
  embedded?: boolean;
  profile: UserProfile;
  onBack: () => void;
  onSelectExercise: (exercise: ExerciseDefinition) => void;
}) {
  const [filter, setFilter] = useState<CognitiveDomain | 'all'>('all');
  const [page, setPage] = useState(0);
  const pageSize = useCompactViewport() ? 2 : 4;
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (!embedded) heading.current?.focus({ preventScroll: true }); }, [embedded]);
  const exercises = ALL_EXERCISES.filter(exercise => filter === 'all' || exercise.domain === filter);
  const currentPage = Math.min(page, Math.max(0, Math.ceil(exercises.length / pageSize) - 1));
  const chooseFilter = (value: CognitiveDomain | 'all') => { setFilter(value); setPage(0); };
  return (
    <section className="exercise-library" aria-labelledby="library-title">
      {!embedded && <button className="text-link" onClick={onBack}><ArrowLeft size={18} /> Volver al inicio</button>}
      {<div className="library-heading">
        <div>
          <span className="library-eyebrow">Un rato para tu mente</span>
          <h1 id="library-title" tabIndex={-1} ref={heading}>Ocho formas de jugar.</h1>
          <p>Elige lo que te apetezca. Practica a tu ritmo.</p>
        </div>
      </div>
      }<div className="library-filters" role="group" aria-label="Filtrar juegos por área">
        <button aria-pressed={filter === 'all'} onClick={() => chooseFilter('all')}>Todos <span>{ALL_EXERCISES.length}</span></button>
        {areas.map(area => <button key={area.id} aria-pressed={filter === area.id} onClick={() => chooseFilter(area.id)}><span className={`library-dot marker-${area.id}`} />{area.label}</button>)}
      </div>
      <div className="library-grid">
        {exercises.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(exercise => (
          <button key={exercise.id} className={`library-game practice-${exercise.domain}`} onClick={() => { soundService.playTap(); onSelectExercise(exercise); }}>
            <span className="library-game-top"><span>{areas.find(area => area.id === exercise.domain)?.label}</span>{profile.prescribedDomains?.includes(exercise.domain) && <span className="library-priority">Pautado para ti</span>}</span>
            <span className="library-game-art catalog-game-icon"><CatalogIcon exercise={exercise.id} /></span>
            <strong>{exercise.title}</strong>
            <span className="library-game-description">{EXERCISE_SUMMARIES[exercise.id]}</span>
            <span className="library-game-action">Ver cómo se juega <span><ArrowRight size={20} /></span></span>
          </button>
        ))}
      </div>
      <TabletPager page={currentPage} pages={Math.ceil(exercises.length / pageSize)} onChange={setPage} label="Páginas de juegos"/>
    </section>
  );
}
