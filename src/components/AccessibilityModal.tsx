import { ProductInformation } from './ProductInformation';
import { SubscriptionSettings } from './SubscriptionSettings';
import { ModalFrame } from './ModalFrame';
import React from 'react';
import { X, Check, Type, Contrast, LogOut } from 'lucide-react';
import type { AccessibilitySettings } from '../types';
import { soundService } from '../services/soundService';

interface AccessibilityModalProps {
  isOpen: boolean;
  onSignOut: () => void;
  signingOut: boolean;
  settings: AccessibilitySettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({
  isOpen, settings, onClose, onUpdateSettings, onSignOut, signingOut,
}) => {
  if (!isOpen) return null;

  const update = (patch: Partial<AccessibilitySettings>) => {
    soundService.playTap();
    onUpdateSettings(patch);
  };

  return (
    <ModalFrame onClose={onClose} labelledBy="accessibility-title">
      <div className="preferences">
        <header className="preferences-header">
          <div>
            <h2 id="accessibility-title">Ajustes</h2>
            <p>Un espacio cómodo para ti.</p>
          </div>
          <button className="preferences-close" onClick={onClose} aria-label="Cerrar ajustes"><X size={22} /></button>
        </header>

        <div className="preferences-body">
          <section className="preferences-section" aria-labelledby="pref-text">
            <h3 id="pref-text"><Type size={20} aria-hidden="true" />Tamaño del texto</h3>
            <div className="preferences-segment" role="group" aria-labelledby="pref-text">
              {(['normal', 'large', 'xlarge'] as const).map((size, index) => (
                <button key={size} aria-pressed={settings.fontSize === size} onClick={() => update({ fontSize: size })}>
                  <span className={`preferences-letter preferences-letter-${index}`} aria-hidden="true">Aa</span>
                  <span>{size === 'normal' ? 'Normal' : size === 'large' ? 'Grande' : 'Muy grande'}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="preferences-section" aria-labelledby="pref-screen">
            <h3 id="pref-screen"><Contrast size={20} aria-hidden="true" />Estilo de la página</h3>
            <div className="preferences-themes" role="group" aria-labelledby="pref-screen">
              <button aria-pressed={settings.contrast === 'standard'} onClick={() => update({ contrast: 'standard' })}>
                <span className="preferences-cozy-preview" aria-hidden="true">
                  <span className="cozy-preview-nav"><i /><i /></span>
                  <span className="cozy-preview-main">
                    <span className="cozy-preview-hero"><span><i /><i /><b /></span></span>
                    <span className="cozy-preview-side"><i /><i /><i /></span>
                  </span>
                  <span className="cozy-preview-cards"><i /><i /><i /><i /><i /></span>
                </span>
                <span className="preferences-theme-label">Cozy<Check size={16} aria-hidden="true" /></span>
              </button>
            </div>
          </section>

          <SubscriptionSettings />
          <div className="preferences-account">
            <button className="preferences-signout" disabled={signingOut} onClick={onSignOut}>
              <LogOut size={18} aria-hidden="true" />{signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </button>
            <ProductInformation />
          </div>
        </div>
      </div>
    </ModalFrame>
  );
};
