import { ModalFrame } from './ModalFrame';
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { soundService } from '../services/soundService';

interface FatigueAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTakeBreak: () => void;
}

export const FatigueAlertModal: React.FC<FatigueAlertModalProps> = ({
  isOpen,
  onClose,
  onTakeBreak,
}) => {
  if (!isOpen) return null;

  return (
    <ModalFrame onClose={onClose} labelledBy="fatigue-title">
      <div className="modal-container fatigue-modal" onClick={e => e.stopPropagation()}>
        <div className="rest-character-art"><img src="/images/wellness-companions.png" alt="" /></div>
        <span className="modal-overline">También está bien parar</span>

        <h2 id="fatigue-title" className="fatigue-title">¿Hacemos una pausa?</h2>
        
        <p className="fatigue-text">
          Puedes descansar unos minutos y retomar cuando te apetezca.
        </p>

        <div className="fatigue-tips">
          <div className="fatigue-tip-item">
            <span>Bebe un poco de agua.</span>
          </div>
          <div className="fatigue-tip-item">
            <span>Aparta la mirada de la pantalla.</span>
          </div>
        </div>

        <div className="fatigue-actions">
          <button
            className="touch-btn touch-btn-primary touch-btn-large"
            onClick={() => {
              soundService.playTap();
              onTakeBreak();
            }}
            title="Iniciar descanso guiado de 5 minutos con temporizador y respiración relajante"
          >
            <span>Descansar 5 minutos</span>
          </button>

          <button
            className="touch-btn touch-btn-secondary touch-btn-large"
            onClick={() => {
              soundService.playTap();
              onClose();
            }}
          >
            Seguir entrenando
            <ArrowRight size={22} />
          </button>
        </div>
      </div>
    </ModalFrame>
  );
};
