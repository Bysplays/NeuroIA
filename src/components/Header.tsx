import React, { useState } from 'react';
import { Settings, Volume2, VolumeX } from 'lucide-react';
import type { UserProfile } from '../types';
import { soundService } from '../services/soundService';

interface HeaderProps {
  profile: UserProfile;
  sessionMinutes: number;
  activeView: 'dashboard' | 'therapist' | 'game';
  onNavigate: (view: 'dashboard' | 'therapist') => void;
  onOpenAccessibility: () => void;
  onOpenFatigueAlert: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  activeView,
  onNavigate,
  onOpenAccessibility,
}) => {
  const [soundActive, setSoundActive] = useState(profile.settings.soundEffects);

  const toggleSound = () => {
    const nextState = !soundActive;
    setSoundActive(nextState);
    soundService.setSoundEnabled(nextState);
    if (nextState) {
      soundService.playTap();
    }
  };

  return (
    <header className="main-header">
      <button className="header-left" onClick={() => onNavigate('dashboard')} aria-label="NeuroIA, ir al inicio">
        <div className="header-logo-icon">
          <img src={`${import.meta.env.BASE_URL}brand/neuroia-mark.svg`} alt="" width="40" height="40" />
        </div>
        <div>
          <span className="header-title">Neuro<span className="brand-light">IA</span></span>
        </div>
      </button>

      <div className="header-right">
        <span className="header-context">{activeView === 'therapist' ? 'ESPACIO PROFESIONAL' : 'MI ESPACIO'}</span>
        {/* Professional navigation stays unavailable until verified roles and care links exist. */}

        {/* Botón de Sonido */}
        <button
          className="header-icon-btn"
          onClick={toggleSound}
          aria-label={soundActive ? 'Silenciar sonidos' : 'Activar sonidos'}
          title={soundActive ? 'Silenciar sonidos' : 'Activar sonidos'}
        >
          {soundActive ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>

        {/* Botón de Accesibilidad */}
        <button
          className="header-icon-btn header-icon-accessibility"
          onClick={() => {
            soundService.playTap();
            onOpenAccessibility();
          }}
          aria-label="Ajustes de accesibilidad"
          title="Ajustar tamaño del texto y estilo de la página"
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
};
