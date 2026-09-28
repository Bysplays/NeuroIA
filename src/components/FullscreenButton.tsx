import { useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { enterFullscreen } from '../services/fullscreen';

export function FullscreenButton() {
  const [active, setActive] = useState(() => Boolean(document.fullscreenElement));
  const [message, setMessage] = useState('');
  useEffect(() => {
    const update = () => { setActive(Boolean(document.fullscreenElement)); setMessage(''); };
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);
  return <span className="fullscreen-control"><button type="button" className="header-icon-btn" aria-label={active ? 'Salir de pantalla completa' : 'Usar pantalla completa'} title={active ? 'Salir de pantalla completa' : 'Usar pantalla completa'} onClick={async () => {
    if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch { setMessage('Puedes salir con el control de tu navegador.'); } }
    else if (!await enterFullscreen()) setMessage('Este navegador no permite pantalla completa. Puedes seguir usando la ventana.');
  }}>{active ? <Minimize2 size={20}/> : <Maximize2 size={20}/>}</button>{message && <span className="fullscreen-message" role="status">{message}<button type="button" onClick={() => setMessage('')} aria-label="Cerrar aviso de pantalla completa">×</button></span>}</span>;
}
