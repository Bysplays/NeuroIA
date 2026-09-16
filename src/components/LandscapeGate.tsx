import { useEffect, useState, type ReactNode } from 'react';
import { RotateCw } from 'lucide-react';
import { ModalFrame } from './ModalFrame';
import { soundService } from '../services/soundService';

import { PortraitContext } from '../services/orientation';

export function LandscapeGate({ children }: { children: ReactNode }) {
  const [portrait, setPortrait] = useState(() => window.matchMedia('(orientation: portrait)').matches);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(orientation: portrait)');
    const update = () => { setPortrait(query.matches); setMessage(''); };
    query.addEventListener('change', update);
    update();
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (portrait) soundService.stopSpeaking();
  }, [portrait]);

  const lockLandscape = async () => {
    setBusy(true);
    let enteredFullscreen = false;
    try {
      const orientation = screen.orientation as ScreenOrientation & { lock?: (value: string) => Promise<void> };
      if (!orientation?.lock || !document.documentElement.requestFullscreen) throw new Error('unsupported');
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        enteredFullscreen = true;
      }
      await orientation.lock('landscape');
    } catch {
      setMessage('Este navegador no permite el giro automático. Gira el dispositivo y comprueba que la rotación automática esté activada.');
      if (enteredFullscreen && document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  return <PortraitContext.Provider value={portrait}>
    {children}
    {portrait && <ModalFrame labelledBy="orientation-title" onClose={() => {}} dismissOnBackdrop={false}>
      <section className="orientation-gate">
        <RotateCw size={44} aria-hidden="true" />
        <h1 id="orientation-title">Gira la pantalla</h1>
        <p>Para usar NeuroIA, coloca el dispositivo en horizontal.</p>
        <p className="entry-note">Si estás en un ordenador, amplía la ventana. Tu ejercicio queda en pausa mientras giras la pantalla.</p>
        <button className="touch-btn touch-btn-primary" disabled={busy} onClick={lockLandscape}>{busy ? 'Intentando girar…' : 'Usar pantalla completa'}</button>
        <p className="entry-note" role="status">{message || 'Puedes girar el dispositivo sin pulsar el botón.'}</p>
      </section>
    </ModalFrame>}
  </PortraitContext.Provider>;
}
