import type { AccessibilitySettings } from '../types';

/** Shared by restored account cache and live workspace updates. */
export function applyAppearance(settings: Pick<AccessibilitySettings, 'contrast' | 'fontSize' | 'handDominance'>) {
  document.body.setAttribute('data-contrast', settings.contrast);
  document.body.setAttribute('data-font', settings.fontSize);
  document.body.setAttribute('data-hand', settings.handDominance);
}
