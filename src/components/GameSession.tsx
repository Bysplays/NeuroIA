import { usePortrait } from '../services/orientation';
import { HeaderIllustration } from './HeaderIllustration';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, CircleHelp, Clock, Volume2 } from 'lucide-react';
import { createGameClock } from '../services/gameClock';
import { getExerciseById, getExercisesForDomain } from '../services/exerciseCatalog';
import type { CognitiveDomain, ExerciseId } from '../types';
import { soundService } from '../services/soundService';

const SessionContext = createContext<{
  clock: ReturnType<typeof createGameClock>;
  finish: (completed: boolean) => void;
  restart: () => void;
} | null>(null);
export function useGameSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('Games must be rendered inside GameSession');
  return session;
}
export function GameSession({ id, step, onBack, children }: { id: string; step?: string; onBack: () => void; children: ReactNode }) {
  const portrait = usePortrait();
  const [clock] = useState(createGameClock);
  const [started, setStarted] = useState(false);
  const [help, setHelp] = useState(true);
  const [completed, finish] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const helpButton = useRef<HTMLButtonElement>(null);
  const exercise = getExerciseById(id as ExerciseId) ?? getExercisesForDomain(id as CognitiveDomain)[0];
  const instructions: Record<string, string> = {
    'visual-scanning': 'Mira la figura del ejemplo. Busca y toca todas las iguales, recorriendo la pantalla de izquierda a derecha.',
    'language-naming': 'Mira la imagen y toca su nombre. Puedes escuchar las opciones o pedir una pista.',
    'word-completion': 'Mira la imagen y la palabra. Toca la letra que falta.',
    'memory-path': 'Pulsa el botón para ver la secuencia. Mira qué fichas se iluminan y después tócalas en el mismo orden.',
    'memory-pairs': 'Primero verás las cartas unos segundos. Recuerda su lugar. Después, descubre dos cartas cada vez para encontrar las parejas.',
    'daily-sequencing': 'Mira las tarjetas. Tócalas en el orden en que harías los pasos de la actividad.',
    categorization: 'Mira el objeto y toca el grupo al que pertenece.',
    'motor-target': 'Toca el centro de cada diana. Aparecerá una nueva en otro lugar. No hay prisa.',
    'motor-tracking': 'Mantén el dedo o el puntero sobre el personaje mientras se mueve. Llena la barra acompañándolo.',
  };
  const instruction = instructions[exercise?.id ?? id] ?? 'Lee las opciones y responde a tu ritmo.';
  useEffect(() => {
    if (help) { heading.current?.focus(); soundService.stopSpeaking(); }
    else helpButton.current?.focus();
  }, [help]);
  useEffect(() => {
    if (portrait || help || completed || !started) return;
    let previous = performance.now();
    let frame: number;
    const tick = (now: number) => {
      clock.advance(Math.min(now - previous, 100));
      previous = now;
      setSeconds(Math.floor(clock.performanceNow() / 1000));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [clock, help, completed, started, portrait]);
  return <SessionContext.Provider value={{ clock, finish, restart: () => { clock.reset(); setHelp(true); setSeconds(0); } }}>
    {help && <section className="game-instruction-screen" aria-labelledby="game-instruction-title">
      <button className="paper-nav-button" onClick={onBack}><ArrowLeft size={20} />Volver al inicio</button>
      <div className="game-instruction-paper">
        <HeaderIllustration scene={exercise?.id ?? "home"} className="game-instruction-art" />
        <span className="soft-label">{step ?? (started ? 'Recordamos cómo jugar' : 'Antes de empezar')}</span>
        <h1 ref={heading} tabIndex={-1} id="game-instruction-title">{exercise?.title}</h1>
        <p>{instruction}</p>
        <button className="paper-nav-button" onClick={() => soundService.speak(instruction)}><Volume2 size={22} />Escuchar instrucciones</button>
        <button className="touch-btn touch-btn-primary" onClick={() => { soundService.stopSpeaking(); setStarted(true); setHelp(false); }}>{started ? 'Continuar jugando' : 'Empezar el juego'}</button>
      </div>
    </section>}
    {started && <div hidden={help}>
      {!completed && <div className="game-session-bar"><button ref={helpButton} className="game-help-button" onClick={() => setHelp(true)} aria-label="Mostrar instrucciones"><CircleHelp size={30} /></button><span className="game-session-time" aria-label="Tiempo de juego"><Clock size={22} />{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span></div>}
      {children}
    </div>}
  </SessionContext.Provider>;
}
