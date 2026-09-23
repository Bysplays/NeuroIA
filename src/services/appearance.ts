import type { AccessibilitySettings } from '../types';

/** Shared by restored account cache and live workspace updates. */
export function applyAppearance(settings: Pick<AccessibilitySettings, 'contrast' | 'fontSize' | 'handDominance' | 'pageStyle' | 'showCompanions'>) {
  document.body.setAttribute('data-companions', settings.showCompanions === false ? 'hidden' : 'visible');
  document.body.setAttribute('data-style', settings.pageStyle === 'cozy' ? 'cozy' : 'default');
  document.body.setAttribute('data-contrast', settings.contrast);
  document.body.setAttribute('data-font', settings.fontSize);
  document.body.setAttribute('data-hand', settings.handDominance);
}
