import { useSyncExternalStore } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundService } from '../services/soundService';

export function SoundToggle() {
  const enabled = useSyncExternalStore(soundService.subscribeSound, soundService.getSoundEnabled);
  const label = enabled ? 'Silenciar sonidos' : 'Activar sonidos';
  return <button type="button" className="header-icon-btn" aria-label={label} title={label} aria-pressed={enabled}
    onClick={() => {
      soundService.setSoundEnabled(!enabled);
      if (!enabled) { soundService.setVoiceEnabled(true); soundService.playTap(); }
    }}>
    {enabled ? <Volume2 size={20}/> : <VolumeX size={20}/>}
  </button>;
}
