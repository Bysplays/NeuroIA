import { useEffect, useState } from 'react';
import { Brand } from './Brand';
const loadingMessages = [
  'Eligiendo emociones positivas…',
  'Recordando que cada día es un regalo…',
  'Poniendo atención en los detalles…',
  'Preparando sonrisas y abrazos sinceros…',
  'Haciendo espacio para un ratito para ti…',
  'Despertando la curiosidad…',
  'Celebrando cada pequeño paso…',
  'Preparando juegos para ir a tu ritmo…',
];

/** One visual boundary for authentication, entitlement and progress loading. */
export function AppLoading() {
  const [messageIndex, setMessageIndex] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex(index => (index + 1) % loadingMessages.length);
    }, 2500);
    return () => window.clearInterval(timer);
  }, []);
  return <main className="app-loading" role="status" aria-live="polite" aria-label="Preparando tu espacio">
    <div aria-hidden="true"><Brand/></div>
    <p aria-hidden="true">{loadingMessages[messageIndex]}</p>
    <span className="app-loading-dots" aria-hidden="true"><i /><i /><i /></span>
  </main>;
}
