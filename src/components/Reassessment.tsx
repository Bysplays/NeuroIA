import { useState } from 'react';
import type { UserProfile } from '../types';
import type { ProgressSync } from '../services/progressSync';
import { applyPlacement, applyPlacementPreferences, applyPlacementStage, hasPlacement } from '../services/difficulty';
import { placementExercises } from '../services/placementPreferences';
import { PlacementOnboarding } from './PlacementOnboarding';

/** A retake only replaces levels when all selected trials are finished and accepted. */
export function Reassessment({ profile, sync, onDone, onSettings }: {
  profile: UserProfile; sync: ProgressSync; onDone: () => void; onSettings: () => void;
}) {
  const [draft, setDraft] = useState(() => {
    const copy = structuredClone(profile);
    delete copy.placement; delete copy.gameLevels;
    const preferences = profile.placement?.retakePreferences ?? profile.placement?.preferences;
    if (preferences) applyPlacementPreferences(copy, preferences);
    return copy;
  });
  const [operationId] = useState(() => `placement:retake:${crypto.randomUUID()}`);
  return <PlacementOnboarding profile={{ ...draft, settings: profile.settings }} sync={sync} onSettings={onSettings}
    choosePreferences doneLabel="Guardar niveles" onCancel={onDone}
    onPreferences={preferences => setDraft(previous => { const next = structuredClone(previous); applyPlacementPreferences(next, preferences); return next; })}
    onStage={(id, stage) => setDraft(previous => { const next = structuredClone(previous); applyPlacementStage(next, id, stage); return next; })}
    onTrial={(id, trial) => setDraft(previous => { const next = structuredClone(previous); applyPlacement(next, id, trial); return next; })}
    onDone={() => {
      if (!hasPlacement(draft)) return;
      sync.enqueue({ id: operationId, kind: 'placement', trials: Object.fromEntries(placementExercises(draft.placement!.preferences).map(id => [id, draft.placement!.trials[id]!])), ...(draft.placement!.preferences ? { preferences: draft.placement!.preferences } : {}) });
      if (draft.placement!.preferences) sync.enqueue({ id: `${operationId}:preferences`, kind: 'placement', retakePreferences: draft.placement!.preferences });
      onDone();
    }}/>;
}
