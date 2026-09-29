import { EegButton } from './EegButton';
import { FullscreenButton } from './FullscreenButton';
import React from 'react';
import { SoundToggle } from './SoundToggle';
import { Settings } from 'lucide-react';
import type { UserProfile } from '../types';
import { soundService } from '../services/soundService';

interface HeaderProps {
  profile: UserProfile;
  sessionMinutes: number;
  activeView: 'dashboard' | 'therapist' | 'statistics' | 'game';
  onNavigate: (view: 'dashboard' | 'therapist') => void;
  navigationRef?: (node: HTMLDivElement | null) => void;
  onOpenAccessibility: () => void;
  onOpenFatigueAlert: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  navigationRef,
  onOpenAccessibility,
}) => {
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

      <div className="header-navigation" ref={navigationRef}/>
      <div className="header-right">

        {/* Professional navigation stays unavailable until verified roles and care links exist. */}

        <EegButton/>
        <SoundToggle/>

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
        <FullscreenButton/>
      </div>
    </header>
  );
};
