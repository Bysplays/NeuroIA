import { advanceAssessment } from '../services/placementAssessment';
import { FullscreenButton } from './FullscreenButton';
import { useEffect, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';
import type { ExerciseId, ExerciseResult, UserProfile } from '../types';
import type { PlacementStage, PlacementTrial } from '../services/difficulty';
import type { ProgressSync } from '../services/progressSync';
import { DIFFICULTY_VERSION, EXERCISE_IDS, hasPlacement, placementTrials } from '../services/difficulty';
import { INTEREST_AREAS, nextThematicGame, placementExercises, type PlacementPreferences as Preferences } from '../services/placementPreferences';
import { getExerciseById } from '../services/exerciseCatalog';
import { enterFullscreen } from '../services/fullscreen';
import { soundService } from '../services/soundService';
import { GameSession } from './GameSession';
import { GameExercise } from './GameExercise';
import { HeaderIllustration } from './HeaderIllustration';
import { PlacementPreferences } from './PlacementPreferences';

export function PlacementOnboarding({ profile, sync, onDone, onSettings, onTrial, onStage, onPreferences, onCancel, choosePreferences = false, doneLabel = 'Ir a mis juegos' }: {
  profile: UserProfile; sync: ProgressSync; doneLabel?: string; choosePreferences?: boolean;
  onTrial?: (id: ExerciseId, trial: PlacementTrial) => void;
  onStage?: (id: ExerciseId, stage: PlacementStage) => void;
  onPreferences?: (preferences: Preferences) => void;
  onCancel?: () => void; onDone: () => void; onSettings: () => void;
}) {
  const trials = placementTrials(profile);
  const preferences = profile.placement?.preferences;
  const selected = placementExercises(preferences);
  const available = selected.filter(key => !trials[key]);
  const complete = hasPlacement(profile);
  const [editing, setEditing] = useState(() => choosePreferences || (!preferences && !complete));
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [id, setId] = useState<ExerciseId>(() => nextThematicGame(available) ?? selected[0]);
  const level = profile.placement?.stages?.[id]?.level ?? 1;
  const best = profile.placement?.stages?.[id]?.best;
  const submitted = useRef<string | null>(null);
  const [waiting, setWaiting] = useState<{ id: ExerciseId; nextLevel?: number } | null>(null);
  const [phase, setPhase] = useState<'welcome' | 'trial' | 'feedback'>('welcome');
  const [paused, setPaused] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const count = selected.filter(key => trials[key]).length;
  useEffect(() => { soundService.stopSpeaking(); heading.current?.focus(); window.scrollTo(0, 0); }, [phase, id, editing]);
  useEffect(() => () => soundService.stopSpeaking(), []);

  // Wait for the parent's durable operation projection before changing games.
  // Also reconcile another device's completed trial or changed plan.
  if ((phase === 'feedback' && waiting && (trials[waiting.id]
    || (waiting.nextLevel && (profile.placement?.stages?.[waiting.id]?.level ?? 1) >= waiting.nextLevel)))
    || (phase !== 'welcome' && (!selected.includes(id) || (phase === 'trial' && trials[id])))) {
    const remaining = nextThematicGame(available, id);
    setPaused(false); setWaiting(null);
    if (remaining) { setId(remaining); setPhase('trial'); }
    else setPhase('welcome');
  }

  const savePreferences = (value: Preferences) => {
    if (savingPreferences && !preferences) return;
    if (onPreferences) onPreferences(value);
    else sync.enqueue({ id: `placement:preferences:${crypto.randomUUID()}`, kind: 'placement', preferences: value });
    setSavingPreferences(true); setEditing(false); setPhase('welcome');
  };
  const save = (result?: ExerciseResult) => {
    const key = `${id}:${level}`;
    if (phase !== 'trial' || submitted.current === key) return;
    submitted.current = key;
    const outcome = advanceAssessment(level, best, result);
    if (outcome.next) {
      const stage: PlacementStage = { level: outcome.next as PlacementStage['level'], best: outcome.best! };
      if (onStage) onStage(id, stage);
      else sync.enqueue({ id: `placement:stage:${DIFFICULTY_VERSION}:${id}:${level}:${crypto.randomUUID()}`, kind: 'placement', exerciseId: id, stage });
      setWaiting({ id, nextLevel: outcome.next });
    } else {
      if (onTrial) onTrial(id, outcome.finished!);
      else sync.enqueue({ id: `placement:${DIFFICULTY_VERSION}:${id}:${crypto.randomUUID()}`, kind: 'placement', exerciseId: id, trial: outcome.finished! });
      setWaiting({ id });
    }
    setPhase('feedback');
  };
  const next = () => {
    const remaining = nextThematicGame(available);
    if (remaining) { submitted.current = null; setPaused(false); setId(remaining); setPhase('trial'); }
  };
  if (savingPreferences && !preferences && !complete) return <main className="placement-screen"><p role="status">Preparando tus juegos…</p></main>;
  if (editing && !complete) return <PlacementPreferences initial={preferences} onSave={savePreferences}
    onSettings={onSettings} onBack={preferences ? () => setEditing(false) : onCancel} />;
  if (phase === 'trial') return <div className="placement-play">
    {paused && <section className="placement-card"><HeaderIllustration scene="rest" className="placement-art" /><div><h1>Hacemos una pausa</h1><p>Descansa lo que necesites. Seguiremos por donde lo dejaste.</p><button autoFocus className="touch-btn touch-btn-primary" onClick={() => setPaused(false)}>Retomar</button></div></section>}
    <div hidden={paused}><GameSession paused={paused} key={`${id}-${level}-${phase}`} id={id} onSkip={() => save()} onSettings={() => { setPaused(true); onSettings(); }} autoStart initialLevel={level} mode="placement" onBack={() => setPhase('welcome')}>
      <GameExercise id={id} profile={profile} onBack={() => setPhase('welcome')} onSaveResult={save} />
    </GameSession></div>
  </div>;
  if (phase === 'feedback') return <main className="placement-screen"><p role="status">Preparando el siguiente juego…</p></main>;
  const message = complete ? (onCancel ? 'Guardaremos los niveles de estas áreas. Los demás niveles y tus partidas se mantendrán.' : 'Ya puedes empezar con las áreas que has elegido. Los juegos que no has probado siguen disponibles; puedes explorarlos cuando quieras.')
    : 'Iremos área por área, con juegos breves a tu ritmo. Puedes omitir cualquiera que no te resulte cómodo.';
  return <main className="placement-screen">
    <header className="placement-toolbar"><span>Tu punto de partida</span>{onCancel && <button className="placement-text-action" onClick={onCancel}>Cancelar prueba</button>}<button className="paper-nav-button" onClick={onSettings}>Ajustes</button><FullscreenButton/></header>
    <section className="placement-card" aria-labelledby="placement-title">
      <HeaderIllustration scene={complete ? 'home' : (available[0] ?? 'home')} className="placement-art" />
      <div className="placement-content">
        <div className="placement-progress"><div className="placement-progress-heading">
          <p className="soft-label">{count} de {selected.length} juegos preparados</p>
          <button className="paper-nav-button" onClick={() => soundService.speak(message)}><Volume2 size={20} />Escuchar</button>
        </div><progress max={selected.length} value={count} aria-label="Juegos preparados" /></div>
        <div className="placement-copy"><h1 ref={heading} tabIndex={-1} id="placement-title">{complete ? 'A tu ritmo, desde aquí' : 'Este es tu comienzo'}</h1><p aria-live="polite">{message}</p></div>
        {preferences && <p className="placement-plan-note">{preferences.interests.map(area => INTEREST_AREAS.find(item => item.id === area)!.title).join(' · ')}{preferences.movement === 'taps' ? ' · Sin seguir objetivos en movimiento' : ''}</p>}
        {complete ? <>
          <ul className="placement-levels">{EXERCISE_IDS.map(key => <li key={key}><span>{getExerciseById(key)!.title}</span><strong>{!trials[key] ? (onCancel ? 'Sin cambios' : 'Sin probar') : trials[key]!.skipped ? 'Prueba omitida' : `Nivel ${profile.gameLevels?.[key]?.level}`}</strong></li>)}</ul>
          <p className="placement-plan-note">Puedes cambiar tus áreas desde Ajustes → Tu cuenta → Rehacer prueba.</p>
          <button className="touch-btn touch-btn-primary" onClick={onDone}>{doneLabel}</button>
        </> : <div className="placement-actions">
          <button className="touch-btn touch-btn-primary" onClick={() => { void enterFullscreen(true); next(); }}>{count ? 'Continuar' : 'Empezar'}</button>
          <button className="placement-text-action" onClick={() => { setSavingPreferences(false); setEditing(true); }}>Cambiar mis elecciones</button>
        </div>}
      </div>
    </section>
  </main>;
}
