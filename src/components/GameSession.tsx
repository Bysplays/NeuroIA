import { SoundToggle } from './SoundToggle';
import { FullscreenButton } from './FullscreenButton';
import { enterFullscreen } from '../services/fullscreen';
import { useViewportPanel } from '../services/viewport';
import { gameConfig, type GameMode } from '../services/difficulty';
import { SessionContext } from '../services/gameSession';
import { usePortrait } from '../services/orientation';
import { HeaderIllustration } from './HeaderIllustration';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Minus, Plus, CircleHelp, Clock, Settings, Volume2 } from 'lucide-react';
import { createGameClock } from '../services/gameClock';
import { getExerciseById, getExercisesForDomain } from '../services/exerciseCatalog';
import type { CognitiveDomain, ExerciseId } from '../types';
import { soundService } from '../services/soundService';

export function GameSession({ id, step, onBack, children, initialLevel = 1, mode = 'normal', paused = false, lockedLevel = false, nextReady = true, autoStart = false, onSettings, onSkip }: { onSettings?: () => void; onSkip?: () => void; autoStart?: boolean; id: string; initialLevel?: number; mode?: GameMode; paused?: boolean; lockedLevel?: boolean; nextReady?: boolean; step?: string; onBack: () => void; children: ReactNode }) {
  const panel = useViewportPanel<HTMLDivElement>();
  const [assistanceTarget, setAssistanceTarget] = useState<HTMLDivElement | null>(null);
  const portrait = usePortrait();
  const [level, setLevel] = useState(initialLevel);
  const config = gameConfig(level, mode);
  const [clock] = useState(createGameClock);
  const [started, setStarted] = useState(autoStart);
  const [help, setHelp] = useState(!autoStart);
  const [completed, finish] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const helpButton = useRef<HTMLButtonElement>(null);
  const exercise = getExerciseById(id as ExerciseId) ?? getExercisesForDomain(id as CognitiveDomain)[0];
  const instructions: Record<string, string> = {
    'visual-scanning': 'Mira la figura del ejemplo. Busca y toca todas las iguales, recorriendo la pantalla de izquierda a derecha.',
    'language-naming': 'Mira la imagen y toca su nombre.',
    'word-completion': 'Mira la imagen y elige la letra que falta.',
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
  return <SessionContext.Provider value={{ config, assistanceTarget, clock, finish, lockedLevel, nextReady, restart: () => { clock.reset(); setLevel(initialLevel); setStarted(false); finish(false); setHelp(true); setSeconds(0); } }}>
    <div className={`game-session${started && !help && !completed ? ' game-session-viewport' : ''}`} data-exercise={id} ref={panel}>
    {help && <section className="placement-screen game-instruction-screen" aria-labelledby="game-instruction-title">
      <div className="placement-toolbar"><img className="instruction-brand" src={`${import.meta.env.BASE_URL}brand/neuroia-logo.svg`} alt="NeuroIA" /><div className="viewport-session-tools"><SoundToggle/>{onSettings && <button className="header-icon-btn" aria-label="Ajustes" onClick={onSettings}><Settings size={20}/></button>}<FullscreenButton/></div></div>
      <div className="placement-card">
        <HeaderIllustration scene={exercise?.id ?? "home"} className="placement-art" />
        <div className="placement-content">
        <div className="placement-progress-heading">
        {!started && mode === 'normal' && !lockedLevel ? <div className="instruction-level-control" role="group" aria-label="Dificultad del juego">
          <button type="button" aria-label="Bajar nivel" disabled={level <= 1} onClick={() => setLevel(value => Math.max(1, value - 1))}><Minus size={16}/></button>
          <span aria-live="polite">Nivel {level}</span>
          <button type="button" aria-label="Subir nivel" disabled={level >= 10} onClick={() => setLevel(value => Math.min(10, value + 1))}><Plus size={16}/></button>
        </div> : <span className="soft-label">Nivel {level}</span>}
        <button className="paper-nav-button" onClick={() => soundService.speak(instruction)}><Volume2 size={20} />Escuchar</button>
        </div>
        <div className="placement-copy">
        <h1 ref={heading} tabIndex={-1} id="game-instruction-title">{exercise?.title}</h1>
        <p>{instruction}</p>
        {mode === 'practice' && <p className="soft-label">Ejemplo sin puntuación</p>}
        </div>
        <div className="placement-actions"><button className="touch-btn touch-btn-primary" onClick={() => { if (!started) void enterFullscreen(true); soundService.stopSpeaking(); setStarted(true); setHelp(false); }}>{started ? 'Continuar jugando' : 'Empezar'}</button></div>
        </div>
      </div>
      {(!lockedLevel || step) && <footer className="instruction-navigation">{!lockedLevel && <button className="placement-text-action" onClick={onBack}>← Volver</button>}{step && <span className="instruction-step soft-label">{step}</span>}</footer>}
    </section>}
    {started && <div className="game-session-play" hidden={help}>
      {!completed && <header className="viewport-session-header">
        <span className="game-session-time" aria-label="Tiempo de juego"><Clock size={22}/>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span>
        <div className="viewport-session-tools"><SoundToggle/><FullscreenButton/>{onSettings && <button className="header-icon-btn" aria-label="Ajustes" onClick={onSettings}><Settings size={20}/></button>}</div>
      </header>}

      {children}
      {!completed && <footer className="viewport-session-footer">
        <button className="placement-text-action" onClick={onBack}>← Volver</button>
        <div className="viewport-assistance-row">
          <div ref={setAssistanceTarget}/>
          {id !== 'categorization' && <button className="paper-nav-button" onClick={() => soundService.speak(instruction)}><Volume2 size={20}/>Escuchar</button>}
          <button ref={helpButton} className="game-help-button" onClick={() => setHelp(true)} aria-label="Mostrar instrucciones"><CircleHelp size={24}/></button>
        </div>
        <div className="viewport-navigation-row">
          <span className="soft-label">Nivel {level}</span>
          {onSkip && <button className="placement-text-action" onClick={onSkip}>Omitir →</button>}
        </div>
      </footer>}
    </div>}
    </div>
  </SessionContext.Provider>;
}
