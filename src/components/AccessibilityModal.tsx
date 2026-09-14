import { ModalFrame } from './ModalFrame';
import React from 'react';
import { X, Check } from 'lucide-react';
import type { AccessibilitySettings } from '../types';
import { soundService } from '../services/soundService';

interface AccessibilityModalProps {
  isOpen: boolean;
  settings: AccessibilitySettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({
  isOpen,
  settings,
  onClose,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const handleSpeechToggle = (enabled: boolean) => {
    soundService.playTap();
    soundService.setVoiceEnabled(enabled);
    onUpdateSettings({ speechEnabled: enabled });
    if (enabled) {
      soundService.speak('Hola. Vamos a practicar a tu ritmo. Tómate el tiempo que necesites.');
    }
  };

  return (
    <ModalFrame onClose={onClose} labelledBy="accessibility-title">
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div>
              <span className="modal-overline">Tu espacio, tus preferencias</span>
              <h2 id="accessibility-title" className="modal-title">Hazlo a tu manera</h2>
              <p className="modal-subtitle">Elige cómo te resulta más cómodo entrenar.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar ventana">
            <X size={28} />
          </button>
        </div>

        <div className="modal-body">
          <section className="setting-section">
            <div className="setting-label-row">
              <div>
                <h3 className="setting-title">Tamaño del texto</h3>
              </div>
            </div>
            <div className="options-grid">
              {(['normal', 'large', 'xlarge'] as const).map(size => (
                <button
                  key={size}
                  aria-pressed={settings.fontSize === size}
                  className={`option-btn ${settings.fontSize === size ? 'option-btn-selected' : ''}`}
                  onClick={() => {
                    soundService.playTap();
                    onUpdateSettings({ fontSize: size });
                  }}
                >
                  {settings.fontSize === size && <Check size={20} className="check-icon" />}
                  <span>{size === 'normal' ? 'Normal' : size === 'large' ? 'Grande' : 'Muy grande'}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="setting-section">
            <div className="setting-label-row">
              <div>
                <h3 className="setting-title">Pantalla</h3>
              </div>
            </div>
            <div className="options-grid">
              {(['standard', 'high-contrast', 'soft-dark'] as const).map(mode => (
                <button
                  key={mode}
                  aria-pressed={settings.contrast === mode}
                  className={`option-btn ${settings.contrast === mode ? 'option-btn-selected' : ''}`}
                  onClick={() => {
                    soundService.playTap();
                    onUpdateSettings({ contrast: mode });
                  }}
                >
                  {settings.contrast === mode && <Check size={20} className="check-icon" />}
                  <span>{mode === 'standard' ? 'Claro' : mode === 'high-contrast' ? 'Alto contraste' : 'Oscuro'}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="setting-section">
            <div className="setting-label-row">
              <div>
                <h3 className="setting-title">Posición de los controles</h3>
                <p className="setting-desc">Acerca los botones a la mano que utilizas.</p>
              </div>
            </div>
            <div className="options-grid">
              {(['left', 'center', 'right'] as const).map(hand => (
                <button
                  key={hand}
                  aria-pressed={settings.handDominance === hand}
                  className={`option-btn ${settings.handDominance === hand ? 'option-btn-selected' : ''}`}
                  onClick={() => {
                    soundService.playTap();
                    onUpdateSettings({ handDominance: hand });
                  }}
                >
                  {settings.handDominance === hand && <Check size={20} className="check-icon" />}
                  <span>{hand === 'left' ? 'Izquierda' : hand === 'right' ? 'Derecha' : 'Centro'}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="setting-section">
            <div className="setting-label-row">
              <div>
                <h3 className="setting-title">Guía visual izquierda</h3>
                <p className="setting-desc">Una línea en el borde para ayudarte a explorar la pantalla.</p>
              </div>
            </div>
            <div className="options-grid">
              <button
                aria-pressed={settings.leftSideAnchor}
                className={`option-btn ${settings.leftSideAnchor ? 'option-btn-selected' : ''}`}
                onClick={() => {
                  soundService.playTap();
                  onUpdateSettings({ leftSideAnchor: !settings.leftSideAnchor });
                }}
              >
                {settings.leftSideAnchor && <Check size={20} className="check-icon" />}
                <span>{settings.leftSideAnchor ? 'Activada' : 'Desactivada'}</span>
              </button>
            </div>
          </section>

          <section className="setting-section">
            <div className="setting-label-row">
              <div>
                <h3 className="setting-title">Lectura por voz</h3>
                <p className="setting-desc">Escucha las instrucciones durante los ejercicios.</p>
              </div>
            </div>
            <div className="options-grid">
              <button
                aria-pressed={settings.speechEnabled}
                className={`option-btn ${settings.speechEnabled ? 'option-btn-selected' : ''}`}
                onClick={() => handleSpeechToggle(!settings.speechEnabled)}
              >
                {settings.speechEnabled && <Check size={20} className="check-icon" />}
                <span>{settings.speechEnabled ? 'Voz activada' : 'Voz desactivada'}</span>
              </button>

              <button
                aria-pressed={settings.speechRate < 0.95}
                className={`option-btn ${settings.speechRate < 0.95 ? 'option-btn-selected' : ''}`}
                onClick={() => {
                  soundService.playTap();
                  const newRate = settings.speechRate < 0.95 ? 1.0 : 0.82;
                  soundService.setSpeechRate(newRate);
                  onUpdateSettings({ speechRate: newRate });
                  soundService.speak(newRate < 0.95 ? 'Velocidad de voz pausada y tranquila.' : 'Velocidad de voz normal.');
                }}
              >
                <span>Velocidad: {settings.speechRate < 0.95 ? 'Pausada' : 'Normal'}</span>
              </button>
              <button
                className="option-btn"
                onClick={() => {
                  soundService.setVoiceEnabled(true);
                  onUpdateSettings({ speechEnabled: true });
                  soundService.speak('Hola. Estoy aquí para acompañarte. Vamos poco a poco, a tu ritmo.');
                }}
              >
                Escuchar la voz
              </button>
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <button
            className="touch-btn touch-btn-primary touch-btn-large"
            onClick={() => {
              soundService.playSuccess();
              onClose();
            }}
          >
            Listo
          </button>
        </div>
      </div>
    </ModalFrame>
  );
};
