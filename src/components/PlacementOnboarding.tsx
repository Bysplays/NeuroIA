import { FullscreenButton } from './FullscreenButton';
import { useEffect, useRef, useState } from 'react';
import { Pause, Volume2 } from 'lucide-react';
import type { ExerciseId, ExerciseResult, UserProfile } from '../types';
import type { ProgressSync } from '../services/progressSync';
import { DIFFICULTY_VERSION, EXERCISE_IDS, hasPlacement, placementLevel, placementTrials } from '../services/difficulty';
import { getExerciseById } from '../services/exerciseCatalog';
import { soundService } from '../services/soundService';
import { GameSession } from './GameSession';
import { GameExercise } from './GameExercise';
import { HeaderIllustration } from './HeaderIllustration';

export function PlacementOnboarding({ profile, sync, onDone, onSettings, onSignOut }: {
  profile: UserProfile; sync: ProgressSync; onDone: () => void; onSettings: () => void; onSignOut: () => void;
}) {
  const trials = placementTrials(profile);
  const [id, setId] = useState<ExerciseId>(() => EXERCISE_IDS.find(key => !trials[key]) ?? EXERCISE_IDS[0]);
  const [phase, setPhase] = useState<'welcome' | 'intro' | 'practice' | 'ready' | 'trial' | 'feedback'>('welcome');
  const [paused, setPaused] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const complete = hasPlacement(profile);
  const exercise = getExerciseById(id)!;
  const count = EXERCISE_IDS.filter(key => trials[key]).length;
  const feedbackTrial = trials[id];
  // The parent progress snapshot can arrive after the local phase change.
  const awaitingTrial = phase === 'feedback' && !feedbackTrial;
  const playing = phase === 'practice' || phase === 'trial';
  useEffect(() => { soundService.stopSpeaking(); heading.current?.focus(); window.scrollTo(0, 0); }, [phase, id]);
  useEffect(() => () => soundService.stopSpeaking(), []);

  const save = (result?: ExerciseResult) => {
    if (phase === 'practice' && result) { setPhase('ready'); return; }
    sync.enqueue({ id: `placement:${DIFFICULTY_VERSION}:${id}:${crypto.randomUUID()}`, kind: 'placement', exerciseId: id,
      trial: result ? { accuracy: result.accuracy, questions: result.totalQuestions, hints: result.hintsUsed ?? 0, skipped: false }
        : { accuracy: 0, questions: 0, hints: 0, skipped: true } });
    setPhase('feedback');
  };
  const next = () => {
    const remaining = EXERCISE_IDS.find(key => !trials[key]);
    if (remaining) { setId(remaining); setPhase('intro'); }
    else setPhase('welcome');
  };
  if (playing) return <div className="placement-play">
    <div className="placement-toolbar"><span>Tu punto de partida · {EXERCISE_IDS.indexOf(id) + 1} de 8</span>
      <button className="paper-nav-button" onClick={() => { soundService.stopSpeaking(); setPaused(true); }}><Pause size={18} />Pausar</button></div>
    {paused && <section className="placement-card"><HeaderIllustration scene="rest" className="placement-art" /><div><h1>Hacemos una pausa</h1><p>Descansa lo que necesites. Seguiremos por donde lo dejaste.</p><button autoFocus className="touch-btn touch-btn-primary" onClick={() => setPaused(false)}>Retomar</button></div></section>}
    <div hidden={paused}><GameSession paused={paused} key={`${id}-${phase}`} id={id} initialLevel={phase === 'practice' ? 1 : 3} mode={phase === 'practice' ? 'practice' : 'placement'} onBack={() => setPhase('intro')}>
      <GameExercise id={id} profile={profile} onBack={() => setPhase('intro')} onSaveResult={save} />
    </GameSession></div>
  </div>;
  const message = complete ? 'Ya tenemos un punto de partida para cada juego. Los niveles describen esta práctica, no tu capacidad general. Puedes elegir otro nivel antes de jugar.'
    : awaitingTrial ? 'Preparando el siguiente paso…'
    : phase === 'feedback' ? feedbackTrial?.skipped ? 'Este juego empezará en nivel 1, sin una prueba medida. Podrás cambiarlo antes de jugar.' : id === 'motor-tracking' ? 'Este juego empieza en nivel 1. Puedes elegir otro antes de jugar; su nivel se ajusta manualmente.' : `Empezaremos este juego en nivel ${placementLevel(feedbackTrial!, id)}. Se irá ajustando con tus partidas.`
    : phase === 'ready' ? 'Ya conoces el juego. Ahora haremos una prueba corta para elegir por dónde empezar. Puedes pedir ayuda siempre que lo necesites.'
    : phase === 'intro' ? 'Primero probaremos un ejemplo sin puntuación. Después haremos una prueba corta, a tu ritmo.'
    : 'Vamos a descubrir por dónde empezar. Te acompañaremos en ocho juegos cortos. No hay nota. Puedes descansar cuando quieras.';
  return <main className="placement-screen">
    <header className="placement-toolbar"><span>Tu punto de partida</span><FullscreenButton/><button className="paper-nav-button" onClick={onSettings}>Ajustes</button></header>
    <section className="placement-card" aria-labelledby="placement-title">
      <HeaderIllustration scene={complete ? 'home' : id} className="placement-art" />
      <div className="placement-content">
        <p className="soft-label">{count} de 8 juegos preparados</p>
        <progress max={8} value={count} aria-label="Juegos preparados" />
        <h1 ref={heading} tabIndex={-1} id="placement-title">{complete ? 'A tu ritmo, desde aquí' : phase === 'welcome' ? 'Busquemos tu punto de partida' : phase === 'feedback' ? 'Un paso más' : exercise.title}</h1>
        <p aria-live="polite">{message}</p>
        <button className="paper-nav-button" onClick={() => soundService.speak(message)}><Volume2 size={20} />Escuchar</button>
        {complete ? <>
          <ul className="placement-levels">{EXERCISE_IDS.map(key => <li key={key}><span>{getExerciseById(key)!.title}{trials[key]?.skipped ? ' · sin prueba' : ''}</span><strong>Nivel {profile.gameLevels![key]!.level}</strong></li>)}</ul>
          <button className="touch-btn touch-btn-primary" onClick={onDone}>Ir a mis juegos</button>
        </> : <div className="placement-actions">
          <button className="touch-btn touch-btn-primary" disabled={awaitingTrial} onClick={() => {
            if (phase === 'welcome' || phase === 'feedback') next();
            else setPhase(phase === 'ready' ? 'trial' : 'practice');
          }}>{awaitingTrial ? 'Un momento…' : phase === 'intro' ? 'Probar un ejemplo' : phase === 'ready' ? 'Empezar la prueba' : 'Continuar'}</button>
          {(phase === 'intro' || phase === 'ready') && <button className="paper-nav-button" onClick={() => save()}>Esta prueba no me resulta accesible: empezar en nivel 1</button>}
          {phase !== 'welcome' && phase !== 'feedback' && <button className="paper-nav-button" onClick={() => setPhase('welcome')}>Volver</button>}
        </div>}
      </div>
    </section>
    <footer><button className="paper-nav-button" onClick={onSignOut}>Cerrar sesión</button></footer>
  </main>;
}
