import { useState } from 'react';
import type { UserProfile } from '../types';
import type { ProgressSync } from '../services/progressSync';
import { applyPlacement, hasPlacement } from '../services/difficulty';
import type { ExerciseId } from '../types';
import type { PlacementTrial } from '../services/difficulty';
import { PlacementOnboarding } from './PlacementOnboarding';

/** A retake only replaces levels when all trials are finished and accepted. */
export function Reassessment({ profile, sync, onDone, onSettings }: {
  profile: UserProfile; sync: ProgressSync; onDone: () => void; onSettings: () => void;
}) {
  const [draft, setDraft] = useState(() => {
    const copy = structuredClone(profile);
    delete copy.placement; delete copy.gameLevels;
    return copy;
  });
  const [operationId] = useState(() => `placement:retake:${crypto.randomUUID()}`);
  return <PlacementOnboarding profile={{ ...draft, settings: profile.settings }} sync={sync} onSettings={onSettings}
    doneLabel="Guardar niveles" onCancel={onDone}
    onTrial={(id, trial) => setDraft(previous => { const next = structuredClone(previous); applyPlacement(next, id, trial); return next; })}
    onDone={() => {
      if (!hasPlacement(draft)) return;
      sync.enqueue({ id: operationId, kind: 'placement', trials: draft.placement!.trials as Record<ExerciseId, PlacementTrial> });
      onDone();
    }}/>;
}
