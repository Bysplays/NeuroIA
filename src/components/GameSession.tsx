import { gameConfig, type GameMode } from '../services/difficulty';
import { SessionContext } from '../services/gameSession';
import { usePortrait } from '../services/orientation';
import { HeaderIllustration } from './HeaderIllustration';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, CircleHelp, Clock, Volume2 } from 'lucide-react';
import { createGameClock } from '../services/gameClock';
import { getExerciseById, getExercisesForDomain } from '../services/exerciseCatalog';
import type { CognitiveDomain, ExerciseId } from '../types';
import { soundService } from '../services/soundService';

export function GameSession({ id, step, onBack, children, initialLevel = 1, mode = 'normal', paused = false }: { id: string; initialLevel?: number; mode?: GameMode; paused?: boolean; step?: string; onBack: () => void; children: ReactNode }) {
  const portrait = usePortrait();
  const [level, setLevel] = useState(initialLevel);
  const config = gameConfig(level, mode);
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
    categorization: 'Mira el objeto y toca el grupo al que pertenece.',
    'motor-target': 'Toca el centro de cada diana. Aparecerá una nueva en otro lugar. No hay prisa.',
    'motor-tracking': 'Mantén pulsado sobre el personaje y acompáñalo mientras se mueve. Con teclado, enfócalo y mantén Espacio. Llena la barra a tu ritmo.',
  };
  const instruction = instructions[exercise?.id ?? id] ?? 'Lee las opciones y responde a tu ritmo.';
  useEffect(() => {
    if (paused) return;
    if (help) { heading.current?.focus(); soundService.stopSpeaking(); }
    else helpButton.current?.focus();
  }, [help, paused]);
  useEffect(() => {
    if (paused || portrait || help || completed || !started) return;
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
  }, [clock, help, completed, started, portrait, paused]);
  return <SessionContext.Provider value={{ config, clock, finish, restart: () => { clock.reset(); setHelp(true); setSeconds(0); } }}>
    {help && <section className="game-instruction-screen" aria-labelledby="game-instruction-title">
      <button className="paper-nav-button" onClick={onBack}><ArrowLeft size={20} />{mode === 'normal' ? 'Volver al inicio' : 'Volver'} </button>
      <div className="game-instruction-paper">
        <HeaderIllustration scene={exercise?.id ?? "home"} className="game-instruction-art" />
        <span className="soft-label">{step ?? (started ? 'Recordamos cómo jugar' : 'Antes de empezar')}</span>
        <h1 ref={heading} tabIndex={-1} id="game-instruction-title">{exercise?.title}</h1>
        <p>{instruction}</p>
        <p className="soft-label">Nivel {level} de 10{mode === 'practice' ? ' · Ejemplo sin puntuación' : ''}</p>
        {!started && mode === 'normal' && <label className="game-level-choice">Dificultad de esta partida
          <select value={level} onChange={event => setLevel(Number(event.target.value))}>
            {Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>Nivel {i + 1}{i + 1 === initialLevel ? ' · recomendado' : ''}</option>)}
          </select>
        </label>}
        <button className="paper-nav-button" onClick={() => soundService.speak(instruction)}><Volume2 size={22} />Escuchar instrucciones</button>
        <button className="touch-btn touch-btn-primary" onClick={() => { soundService.stopSpeaking(); setStarted(true); setHelp(false); }}>{started ? 'Continuar jugando' : 'Empezar el juego'}</button>
      </div>
    </section>}
    {started && <div hidden={help}>
      {!completed && <div className="game-session-bar"><button ref={helpButton} className="game-help-button" onClick={() => setHelp(true)} aria-label="Mostrar instrucciones"><CircleHelp size={30} /></button><span className="soft-label">Nivel {level}</span><span className="game-session-time" aria-label="Tiempo de juego"><Clock size={22} />{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span></div>}
      {children}
    </div>}
  </SessionContext.Provider>;
}
