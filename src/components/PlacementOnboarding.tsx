import { advanceAssessment, nextAssessmentGame, type AssessmentLevel } from '../services/placementAssessment';
import { FullscreenButton } from './FullscreenButton';
import { useEffect, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';
import type { ExerciseId, ExerciseResult, UserProfile } from '../types';
import type { PlacementTrial } from '../services/difficulty';
import type { ProgressSync } from '../services/progressSync';
import { DIFFICULTY_VERSION, EXERCISE_IDS, hasPlacement, placementTrials } from '../services/difficulty';
import { getExerciseById } from '../services/exerciseCatalog';
import { enterFullscreen } from '../services/fullscreen';
import { soundService } from '../services/soundService';
import { GameSession } from './GameSession';
import { GameExercise } from './GameExercise';
import { HeaderIllustration } from './HeaderIllustration';

export function PlacementOnboarding({ profile, sync, onDone, onSettings, onTrial, onCancel, doneLabel = 'Ir a mis juegos' }: {
  profile: UserProfile; sync: ProgressSync; doneLabel?: string; onTrial?: (id: ExerciseId, trial: PlacementTrial) => void; onCancel?: () => void; onDone: () => void; onSettings: () => void;
}) {
  const trials = placementTrials(profile);
  const [id, setId] = useState<ExerciseId>(() => nextAssessmentGame(EXERCISE_IDS.filter(key => !trials[key])) ?? EXERCISE_IDS[0]);
  const [stages, setStages] = useState<Partial<Record<ExerciseId, { level: AssessmentLevel; best?: PlacementTrial }>>>({});
  const level = stages[id]?.level ?? 1;
  const best = stages[id]?.best;
  const submitted = useRef<string | null>(null);
  const [phase, setPhase] = useState<'welcome' | 'trial' | 'feedback'>('welcome');
  const [paused, setPaused] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const complete = hasPlacement(profile);
  const count = EXERCISE_IDS.filter(key => trials[key]).length;
  const feedbackTrial = trials[id];
  // The parent progress snapshot can arrive after the local phase change.
  const playing = phase === 'trial';
  const available = EXERCISE_IDS.filter(key => !trials[key]);
  useEffect(() => { soundService.stopSpeaking(); heading.current?.focus(); window.scrollTo(0, 0); }, [phase, id]);
  useEffect(() => () => soundService.stopSpeaking(), []);

  // Reconcile the local cursor when the parent delivers the saved trial.
  if (phase === 'feedback' && feedbackTrial) {
    setPaused(false);
    const remaining = nextAssessmentGame(available, id);
    if (remaining) { setId(remaining); setPhase('trial'); }
    else setPhase('welcome');
  }

  const save = (result?: ExerciseResult) => {
    const key = `${id}:${level}`;
    if (phase !== 'trial' || submitted.current === key) return;
    submitted.current = key;
    const outcome = advanceAssessment(level, best, result);
    if (outcome.next) {
      setStages(previous => ({ ...previous, [id]: { level: outcome.next!, best: outcome.best } }));
      setId(nextAssessmentGame(available, id) ?? id);
      return;
    }
    const trial = outcome.finished!;
    if (onTrial) onTrial(id, trial);
    else sync.enqueue({ id: `placement:${DIFFICULTY_VERSION}:${id}:${crypto.randomUUID()}`, kind: 'placement', exerciseId: id, trial });
    setPhase('feedback');
  };
  const next = () => {
    const remaining = available.includes(id) ? id : nextAssessmentGame(available);
    if (remaining) { submitted.current = null; setPaused(false); setId(remaining); setPhase('trial'); }
    else setPhase('welcome');
  };
  if (playing) return <div className="placement-play">
    {paused && <section className="placement-card"><HeaderIllustration scene="rest" className="placement-art" /><div><h1>Hacemos una pausa</h1><p>Descansa lo que necesites. Seguiremos por donde lo dejaste.</p><button autoFocus className="touch-btn touch-btn-primary" onClick={() => setPaused(false)}>Retomar</button></div></section>}
    <div hidden={paused}><GameSession paused={paused} key={`${id}-${level}-${phase}`} id={id} onSkip={() => save()} onSettings={() => { setPaused(true); onSettings(); }} autoStart initialLevel={level} mode="placement" onBack={() => setPhase('welcome')}>
      <GameExercise id={id} profile={profile} onBack={() => setPhase('welcome')} onSaveResult={save} />
    </GameSession></div>
  </div>;
  if (phase === 'feedback') return <main className="placement-screen"><p role="status">Preparando el siguiente juego…</p></main>;
  const message = complete ? 'Ya tenemos un punto de partida para cada juego. Los niveles describen esta práctica, no tu capacidad general. Puedes elegir otro nivel antes de jugar.'
    : 'Pruebas breves, mezclando juegos. Probamos los niveles 1, 4, 7 y 10 y conservamos el último que superes.';
  return <main className="placement-screen">
    <header className="placement-toolbar"><span>Tu punto de partida</span>{onCancel && <button className="placement-text-action" onClick={onCancel}>Cancelar prueba</button>}<button className="paper-nav-button" onClick={onSettings}>Ajustes</button><FullscreenButton/></header>
    <section className="placement-card" aria-labelledby="placement-title">
      <HeaderIllustration scene={complete ? 'home' : id} className="placement-art" />
      <div className="placement-content">
        <div className="placement-progress">
        <div className="placement-progress-heading">
          <p className="soft-label">{count} de 8 juegos preparados</p>
          <button className="paper-nav-button" onClick={() => soundService.speak(message)}><Volume2 size={20} />Escuchar</button>
        </div>
        <progress max={8} value={count} aria-label="Juegos preparados" />
        </div>
        <div className="placement-copy">
        <h1 ref={heading} tabIndex={-1} id="placement-title">{complete ? 'A tu ritmo, desde aquí' : 'Busquemos tu punto de partida'}</h1>
        <p aria-live="polite">{message}</p>
        </div>
        {complete ? <>
          <ul className="placement-levels">{EXERCISE_IDS.map(key => <li key={key}><span>{getExerciseById(key)!.title}{trials[key]?.skipped ? ' · sin prueba' : ''}</span><strong>Nivel {profile.gameLevels![key]!.level}</strong></li>)}</ul>
          <button className="touch-btn touch-btn-primary" onClick={onDone}>{doneLabel}</button>
        </> : <div className="placement-actions">
          <button className="touch-btn touch-btn-primary" onClick={() => { void enterFullscreen(true); next(); }}>Empezar</button>
        </div>}
      </div>
    </section>
  </main>;
}
