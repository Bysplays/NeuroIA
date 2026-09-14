import React from 'react';
import { X, Play, Sparkles, BookOpen, Type, Search, Grid, ListOrdered, Layers, Hand, Compass } from 'lucide-react';
import type { CognitiveDomain, ExerciseDefinition, ExerciseId } from '../types';
import { getExercisesForDomain } from '../services/exerciseCatalog';
import { soundService } from '../services/soundService';

interface ExerciseSelectionModalProps {
  domain: CognitiveDomain;
  domainTitle: string;
  domainColor: string;
  domainBg: string;
  onSelectExercise: (exerciseId: ExerciseId) => void;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Search: <Search size={32} />,
  BookOpen: <BookOpen size={32} />,
  Type: <Type size={32} />,
  Sparkles: <Sparkles size={32} />,
  Grid: <Grid size={32} />,
  ListOrdered: <ListOrdered size={32} />,
  Layers: <Layers size={32} />,
  Hand: <Hand size={32} />,
  Compass: <Compass size={32} />,
};

export const ExerciseSelectionModal: React.FC<ExerciseSelectionModalProps> = ({
  domain,
  domainTitle,
  domainColor,
  domainBg,
  onSelectExercise,
  onClose,
}) => {
  const exercises = getExercisesForDomain(domain);

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container exercise-selection-modal-card"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <div
              className="exercise-modal-domain-badge"
              style={{ backgroundColor: domainBg, color: domainColor }}
            >
              {ICON_MAP[exercises[0]?.iconName] || <Sparkles size={28} />}
            </div>
            <div>
              <h2 className="modal-title">{domainTitle}</h2>
              <p className="modal-subtitle">Selecciona el ejercicio que deseas practicar hoy:</p>
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
          {exercises.map((ex: ExerciseDefinition) => (
            <div
              key={ex.id}
              className="card card-interactive exercise-choice-card"
              onClick={() => {
                soundService.playTap();
                onSelectExercise(ex.id);
              }}
              role="button"
              tabIndex={0}
            >
              <div className="choice-card-header">
                <div
                  className="choice-icon-bubble"
                  style={{ backgroundColor: domainBg, color: domainColor }}
                >
                  {ICON_MAP[ex.iconName] || <Sparkles size={28} />}
                </div>
                <div>
                  <h3 className="choice-card-title">{ex.title}</h3>
                  <span className="choice-card-subtitle">{ex.subtitle}</span>
                </div>
              </div>

              <p className="choice-card-desc">{ex.description}</p>

              <button
                className="touch-btn touch-btn-primary choice-play-btn"
                onClick={e => {
                  e.stopPropagation();
                  soundService.playTap();
                  onSelectExercise(ex.id);
                }}
              >
                <Play size={20} />
                <span>Comenzar este ejercicio</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
