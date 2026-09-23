import { ProfileSwitch } from './ProfileSwitch';
import { ProductInformation } from './ProductInformation';
import { SubscriptionSettings } from './SubscriptionSettings';
import { ModalFrame } from './ModalFrame';
import React, { useState } from 'react';
import { X, Check, Type, Contrast, LogOut } from 'lucide-react';
import type { AccessibilitySettings } from '../types';
import { soundService } from '../services/soundService';

interface AccessibilityModalProps {
  isOpen: boolean;
  showSubscription?: boolean;
  onSignOut: () => void;
  signingOut: boolean;
  settings: AccessibilitySettings;
  name: string;
  onUpdateName: (name: string) => void;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({
  isOpen, settings, name, onUpdateName, onClose, onUpdateSettings, onSignOut, signingOut, showSubscription = true,
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
          <ProfileName name={name} onSave={onUpdateName} />
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

          <section className="preferences-section preferences-style-section" aria-labelledby="pref-screen">
            <h3 id="pref-screen"><Contrast size={20} aria-hidden="true" />Estilo de la página</h3>
            <div className="preferences-themes" role="group" aria-labelledby="pref-screen">
              {(['default', 'cozy'] as const).map(style => (
                <button key={style} aria-pressed={(settings.pageStyle ?? 'default') === style}
                  onClick={() => update({ pageStyle: style, contrast: 'standard' })}>
                  <span className={`preferences-cozy-preview ${style === 'default' ? 'preferences-default-preview' : ''}`} aria-hidden="true">
                    <span className="cozy-preview-nav"><i /><i /></span>
                    <span className="cozy-preview-main">
                      <span className="cozy-preview-hero"><span><i /><i /><b /></span></span>
                      <span className="cozy-preview-side"><i /><i /><i /></span>
                    </span>
                    <span className="cozy-preview-cards"><i /><i /><i /><i /><i /></span>
                  </span>
                  <span className="preferences-theme-label">{style === 'default' ? 'Default' : 'Cozy'}
                    <Check size={16} aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
            <button className="preferences-companions" role="switch" aria-checked={settings.showCompanions !== false}
              onClick={() => update({ showCompanions: settings.showCompanions === false })}>
              <span>Amigos del bienestar</span>
              <span className="preferences-switch-track" aria-hidden="true"><span /></span>
            </button>
          </section>

          {showSubscription && <SubscriptionSettings />}
          <div className="preferences-account">
            <ProfileSwitch disabled={signingOut} />
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

function ProfileName({ name, onSave }: { name: string; onSave: (name: string) => void }) {
  const [draft, setDraft] = useState(name);
  const value = draft.trim();
  return <section className="preferences-section" aria-labelledby="pref-name-title">
    <h3 id="pref-name-title"><label htmlFor="pref-name">Tu nombre</label></h3>
    <form className="preferences-name" onSubmit={event => { event.preventDefault(); if (value && value.length <= 200 && value !== name) { onSave(value); setDraft(value); } }}>
      <input id="pref-name" name="displayName" autoComplete="given-name" value={draft} maxLength={200} required onChange={event => setDraft(event.target.value)} />
      <button className="paper-nav-button" type="submit" disabled={!value || value === name}>Guardar</button>
    </form>
  </section>;
}
