import { ModalFrame } from './ModalFrame';
import { useAccessSuspended, useAccessRecovery } from '../services/accountAccessContext';
import { Brand } from './Brand';
import { EegButton } from './EegButton';
import { EegLive } from './EegLive';
import { eegService } from '../services/eegService';
import { createEegRecorder, type EegRecording } from '../services/eegData';
import { SoundToggle } from './SoundToggle';
import { FullscreenButton } from './FullscreenButton';
import { useViewportPanel } from '../services/viewport';
import { gameConfig, type GameMode } from '../services/difficulty';
import { SessionContext } from '../services/gameSession';
import { ExerciseIllustration } from './ExerciseIllustration';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Minus, Plus, CircleHelp, Clock, Settings2, Volume2, ArrowLeft, ArrowRight } from 'lucide-react';
import { createGameClock } from '../services/gameClock';
import { getExerciseById, getExercisesForDomain } from '../services/exerciseCatalog';
import type { CognitiveDomain, ExerciseId } from '../types';
import { soundService } from '../services/soundService';

export function GameSession({ id, step, progressScope, onBack, children, initialLevel = 1, mode = 'normal', paused = false, lockedLevel = false, nextReady = true, autoStart = false, onSettings, onSkip }: { progressScope?: { before: number; after: number }; onSettings?: () => void; onSkip?: () => void; autoStart?: boolean; id: string; initialLevel?: number; mode?: GameMode; paused?: boolean; lockedLevel?: boolean; nextReady?: boolean; step?: string; onBack: () => void; children: ReactNode }) {
  const accessSuspended = useAccessSuspended();
  const recovery = useAccessRecovery();
  const setGameRecovery = recovery?.setGameRecovery;
  const [resumeRequired, setResumeRequired] = useState(false);
  const panel = useViewportPanel<HTMLDivElement>();
  const [assistanceTarget, setAssistanceTarget] = useState<HTMLDivElement | null>(null);
  const [eegOpen, setEegOpen] = useState(false);
  const [recorder] = useState(createEegRecorder);
  const [savedRecorder] = useState(createEegRecorder);
  const [ppgRecorder] = useState(createEegRecorder);
  const [savedPpgRecorder] = useState(createEegRecorder);
  const [ppg, setPpg] = useState<EegRecording>();
  const [background, setBackground] = useState(document.hidden);

  const [eeg, setEeg] = useState<EegRecording>();
  const [level, setLevel] = useState(initialLevel);
  const config = gameConfig(level, mode);
  const [clock] = useState(createGameClock);
  const [started, setStarted] = useState(autoStart);
  const [help, setHelp] = useState(!autoStart);
  const [completed, finish] = useState(false);
  useEffect(() => {
    setGameRecovery?.(started && !completed && !help && !eegOpen && !paused);
    return () => setGameRecovery?.(false);
  }, [setGameRecovery, started, completed, help, eegOpen, paused]);
  const [lastAccessSuspended, setLastAccessSuspended] = useState(accessSuspended);
  if (lastAccessSuspended !== accessSuspended) {
    setLastAccessSuspended(accessSuspended);
    if (accessSuspended && started && !completed) setResumeRequired(true);
  }
  useEffect(() => {
    let blurTimer: ReturnType<typeof setTimeout>;
    const pause = () => {
      setBackground(true);
      if (started && !completed) { setResumeRequired(true); soundService.stopSpeaking(); }
    };
    const blur = (event: FocusEvent) => {
      if (event.target !== window) return;
      clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        // Removing a focused control or closing a dialog is not leaving the app.
        if (!event.isTrusted || !document.hasFocus()) pause();
      }, 0);
    };
    const focus = () => { clearTimeout(blurTimer); setBackground(document.hidden); };
    const visibility = () => document.hidden ? pause() : focus();
    window.addEventListener('blur', blur);
    window.addEventListener('focus', focus);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      clearTimeout(blurTimer);
      window.removeEventListener('blur', blur);
      window.removeEventListener('focus', focus);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [started, completed]);
  const [seconds, setSeconds] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const helpButton = useRef<HTMLButtonElement>(null);
  const exercise = getExerciseById(id as ExerciseId) ?? getExercisesForDomain(id as CognitiveDomain)[0];
  const instructions: Record<string, string> = {
    'visual-scanning': 'Mira la figura del ejemplo. Busca y toca todas las iguales, recorriendo la pantalla de izquierda a derecha.',
    'language-naming': 'Mira la imagen y toca su nombre.',
    'word-completion': 'Mira la imagen y elige la letra que falta.',
    'memory-path': 'Pulsa el botón para ver la secuencia. Mira qué fichas se iluminan y después tócalas en el mismo orden.',
    'memory-pairs': 'Toca una carta para descubrirla. Después, toca otra y busca los objetos que son iguales.',
    categorization: 'Mira el objeto y toca el grupo al que pertenece.',
    'motor-target': 'Toca el centro de cada diana. Aparecerá una nueva en otro lugar. No hay prisa.',
    'motor-tracking': 'Mantén pulsado sobre el personaje y acompáñalo mientras se mueve. Con teclado, enfócalo y mantén Espacio. Llena la barra a tu ritmo.',
  };
  const instruction = instructions[exercise?.id ?? id] ?? 'Lee las opciones y responde a tu ritmo.';
  useEffect(() => {
    if (paused) return;
    if (help) { if (!started) heading.current?.focus(); soundService.stopSpeaking(); }
    else helpButton.current?.focus();
  }, [help, paused, started]);
  useEffect(() => {
    if (paused || help || completed || !started || eegOpen || background || resumeRequired || accessSuspended) return;
    let previous = performance.now();
    let frame: number;
    const tick = (now: number) => {
      if (document.hidden) return;
      clock.advance(Math.min(now - previous, 100));
      previous = now;
      setSeconds(Math.floor(clock.performanceNow() / 1000));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [clock, help, completed, started, paused, eegOpen, background, resumeRequired, accessSuspended]);
  useEffect(() => {
    const timer = clock.setInterval(() => {
      const state = eegService.getSnapshot();
      if (state.metric && state.adapter) {
        const source = { metric: state.metric, adapter: state.adapter, value: state.status === 'connected' && Date.now() - state.receivedAt <= 3000 ? state.value : null };
        recorder.add(clock.performanceNow() / 1000, source);
        if (state.recording || savedRecorder.snapshot()) savedRecorder.add(clock.performanceNow() / 1000, { ...source, value: state.recording ? source.value : null });
        setEeg(recorder.snapshot());
      }
      if (state.ppgMetric && state.adapter) {
        const source = { metric: state.ppgMetric, adapter: state.adapter, value: state.status === 'connected' && Date.now() - state.ppgReceivedAt <= 3000 ? state.ppgValue : null };
        ppgRecorder.add(clock.performanceNow() / 1000, source);
        if (state.recording || savedPpgRecorder.snapshot()) savedPpgRecorder.add(clock.performanceNow() / 1000, { ...source, value: state.recording ? source.value : null });
        setPpg(ppgRecorder.snapshot());
      }
    }, 1000);
    return () => clock.clearInterval(timer);
  }, [clock, recorder, savedRecorder, ppgRecorder, savedPpgRecorder, started]);
  return <SessionContext.Provider value={{ config, progressScope, eegResult: () => mode === 'normal' ? savedRecorder.snapshot() : undefined, ppgResult: () => mode === 'normal' ? savedPpgRecorder.snapshot() : undefined, assistanceTarget, clock, finish, lockedLevel, nextReady, restart: () => { recorder.reset(); savedRecorder.reset(); ppgRecorder.reset(); savedPpgRecorder.reset(); setEeg(undefined); setPpg(undefined); clock.reset(); setLevel(initialLevel); setStarted(false); finish(false); setHelp(true); setSeconds(0); } }}>
    <div className={`game-session${started ? ' game-session-viewport' : ''}`} data-exercise={id} ref={panel}>
    {help && !started && <section className="placement-screen game-instruction-screen" aria-labelledby="game-instruction-title">
      <div className="placement-toolbar"><Brand/><div className="viewport-session-tools"><EegButton onOpenChange={setEegOpen}/><SoundToggle/>{onSettings && <button className="header-icon-btn" aria-label="Ajustes" onClick={onSettings}><Settings2 size={20}/></button>}<FullscreenButton/></div></div>
      <div className="placement-card">
        <div className="instruction-art"><ExerciseIllustration exercise={exercise?.id ?? 'visual-scanning'} /></div>
        <div className="placement-content">
        <div className="placement-copy">
        <h1 ref={heading} tabIndex={-1} id="game-instruction-title">{exercise?.title}</h1>
        <p>{instruction}</p>
        {mode === 'practice' && <p className="soft-label">Ejemplo sin puntuación</p>}
        </div>
        <div className="placement-actions">
        {!started && mode === 'normal' && !lockedLevel ? <div className="instruction-level-control" role="group" aria-label="Dificultad del juego">
          <button type="button" aria-label="Bajar nivel" disabled={level <= 1} onClick={() => setLevel(value => Math.max(1, value - 1))}><Minus size={16}/></button>
          <span aria-live="polite">Nivel {level}</span>
          <button type="button" aria-label="Subir nivel" disabled={level >= 10} onClick={() => setLevel(value => Math.min(10, value + 1))}><Plus size={16}/></button>
        </div> : mode !== 'placement' ? <span className="soft-label">Nivel {level}</span> : null}
        <button className="touch-btn touch-btn-primary" onClick={() => { soundService.stopSpeaking(); setStarted(true); setHelp(false); }}>{started ? 'Continuar jugando' : 'Empezar a jugar'}</button></div>
        </div>
      </div>
      <footer className="instruction-navigation">{!lockedLevel && <button className="entry-toolbar-action" onClick={onBack}><ArrowLeft size={18} aria-hidden="true"/>Volver</button>}<button className="paper-nav-button instruction-listen" onClick={() => soundService.speak(instruction)}><Volume2 size={20} aria-hidden="true"/>Escuchar</button>{step && <span className="instruction-step soft-label">{step}</span>}</footer>
    </section>}
    {started && <div className="game-session-play">
      {completed && <header className="viewport-session-header"><Brand/></header>}
      {!completed && <header className="viewport-session-header">
        <span className="game-session-time" aria-label="Tiempo de juego"><Clock size={22}/>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span>
        <div className="viewport-session-tools"><EegButton onOpenChange={setEegOpen}/><SoundToggle/><FullscreenButton/>{onSettings && <button className="header-icon-btn" aria-label="Ajustes" onClick={onSettings}><Settings2 size={20}/></button>}</div>
      </header>}

      {!completed && <EegLive recording={eeg} ppg={ppg} eegMean={recorder.mean()} ppgMean={ppgRecorder.mean()} recordable={mode === 'normal'}/>}
      {children}
      {!completed && <footer className="viewport-session-footer">
        <button className="entry-toolbar-action" onClick={onBack}><ArrowLeft size={18} aria-hidden="true"/>Volver</button>
        <div className="viewport-assistance-row">
          <div ref={setAssistanceTarget}/>
          {id !== 'categorization' && <button className="paper-nav-button" onClick={() => soundService.speak(instruction)}><Volume2 size={20}/>Escuchar</button>}
          <button ref={helpButton} className="game-help-button" onClick={() => setHelp(true)} aria-label="Mostrar instrucciones"><CircleHelp size={24}/></button>
        </div>
        <div className="viewport-navigation-row">
          {mode !== 'placement' && <span className="soft-label">Nivel {level}</span>}
          {onSkip && <button className="entry-toolbar-action" onClick={onSkip}>Omitir<ArrowRight size={18} aria-hidden="true"/></button>}
        </div>
      </footer>}
    </div>}
    {(resumeRequired || accessSuspended) && started && !help && !eegOpen && !paused && !completed && <ModalFrame labelledBy="activity-resume-title" onClose={() => {}} dismissOnBackdrop={false}>
      <section className="entry-error-notification game-resume-dialog">
        <h2 id="activity-resume-title">¿Seguimos?</h2>
        <p>Tu actividad está pausada.</p>
        {accessSuspended && recovery?.error && <p role="status">{recovery.error}</p>}
        <button className="touch-btn touch-btn-primary" disabled={accessSuspended && !recovery?.error} onClick={() => {
          if (accessSuspended) recovery?.retry();
          else setResumeRequired(false);
        }}>{accessSuspended ? recovery?.error ? 'Reintentar' : 'Comprobando acceso' : 'Continuar actividad'}</button>
        {accessSuspended && recovery?.error && <button className="text-link" onClick={recovery.signOut}>Cerrar sesión</button>}
      </section>
    </ModalFrame>}
    {help && started && <ModalFrame labelledBy="game-help-title" onClose={() => { soundService.stopSpeaking(); setHelp(false); }}>
      <section className="entry-error-notification game-help-dialog">
        <div className="entry-error-heading"><CircleHelp size={24} aria-hidden="true"/><h2 id="game-help-title">Cómo jugar</h2><button className="entry-toolbar-action" onClick={() => soundService.speak(instruction)}><Volume2 size={18} aria-hidden="true"/>Escuchar</button></div>
        <h3>{exercise?.title}</h3>
        <div className="entry-error-message"><p>{instruction}</p></div>
        <button className="touch-btn touch-btn-primary" onClick={() => { soundService.stopSpeaking(); setHelp(false); }}>Continuar jugando</button>
      </section>
    </ModalFrame>}
    </div>
  </SessionContext.Provider>;
}
