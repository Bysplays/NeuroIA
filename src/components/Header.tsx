import { EegButton } from './EegButton';
import { Brand } from './Brand';
import React from 'react';
import { SoundToggle } from './SoundToggle';
import { Settings2, LogOut } from 'lucide-react';
import type { UserProfile } from '../types';
import { soundService } from '../services/soundService';

interface HeaderProps {
  onSignOut: () => void;
  signingOut: boolean;
  profile: UserProfile;
  sessionMinutes: number;
  activeView: 'dashboard' | 'therapist' | 'statistics' | 'game';
  onNavigate: (view: 'dashboard' | 'therapist') => void;
  navigationRef?: (node: HTMLDivElement | null) => void;
  onOpenAccessibility: () => void;
  onOpenFatigueAlert: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate, onSignOut, signingOut,
  navigationRef,
  onOpenAccessibility,
}) => {
  return (
    <header className="main-header">
      <button className="header-left" onClick={() => onNavigate('dashboard')} aria-label="NeuroIA, ir al inicio">
        <Brand/>
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
          <Settings2 size={20} />
        </button>
        <button className="header-signout" disabled={signingOut} onClick={onSignOut}><LogOut size={18}/>{signingOut ? 'Cerrando…' : 'Cerrar sesión'}</button>
      </div>
    </header>
  );
};
