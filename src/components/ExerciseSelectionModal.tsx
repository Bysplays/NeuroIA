import { ModalFrame } from './ModalFrame';
import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import { WellnessGlyph } from './WellnessGlyph';
import type { CognitiveDomain, ExerciseDefinition, ExerciseId } from '../types';
import { getExercisesForDomain } from '../services/exerciseCatalog';
import { soundService } from '../services/soundService';

interface ExerciseSelectionModalProps {
  domain: CognitiveDomain;
  domainTitle: string;
  onSelectExercise: (exerciseId: ExerciseId) => void;
  onClose: () => void;
}

const EXERCISE_SUMMARIES: Record<ExerciseId, string> = {
  'visual-scanning': 'Busca la figura repetida entre las demás.',
  'language-naming': 'Mira el objeto y encuentra su nombre.',
  'word-completion': 'Completa una palabra con las letras que faltan.',
  'memory-path': 'Recuerda las luces y repite su orden.',
  'memory-pairs': 'Descubre las cartas y encuentra sus parejas.',
  'daily-sequencing': 'Ordena los pasos de una actividad cotidiana.',
  'categorization': 'Agrupa los objetos por su categoría.',
  'motor-target': 'Toca las dianas a tu ritmo.',
  'motor-tracking': 'Sigue una diana que se mueve despacio.',
};

export const ExerciseSelectionModal: React.FC<ExerciseSelectionModalProps> = ({
  domain,
  domainTitle,
  onSelectExercise,
  onClose,
}) => {
  const exercises = getExercisesForDomain(domain);

  return (
    <ModalFrame onClose={onClose} labelledBy="exercise-selection-title">
      <div
        className="modal-container exercise-selection-modal-card"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <div>
              <span className="modal-overline">Un rato para tu mente</span>
              <h2 id="exercise-selection-title" className="modal-title">{domainTitle}</h2>
              <p className="modal-subtitle">Elige un ejercicio para empezar.</p>
            </div>
          </div>
          <button
            className="modal-close-btn"
            onClick={() => {
              soundService.playTap();
              onClose();
            }}
            aria-label="Cerrar"
          >
            <X size={28} />
          </button>
        </div>

        <div className="exercise-choice-grid">
          {exercises.map((ex: ExerciseDefinition, index) => (
            <button
              key={ex.id}
              className="exercise-choice-card"
              onClick={() => {
                soundService.playTap();
                onSelectExercise(ex.id);
              }}
            >
              <span className="choice-art"><WellnessGlyph variant={index + ['attention', 'language', 'memory', 'executive', 'motor'].indexOf(domain)} /></span>
              <span className="choice-copy">
                <span className="choice-card-title">{ex.title}</span>
                <span className="choice-card-desc">{EXERCISE_SUMMARIES[ex.id]}</span>
              </span>
              <span className="choice-cta">Empezar <span className="choice-arrow"><ArrowRight size={20} /></span></span>
            </button>
          ))}
        </div>
      </div>
    </ModalFrame>
  );
};
