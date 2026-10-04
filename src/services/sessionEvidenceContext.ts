import { createContext, useLayoutEffect } from 'react';
import type { ProgressOperation } from './progressData';
import { useGameSession } from './gameSession';

/** Enabled only after the proposal's archive rules have been installed. */
export const SessionEvidenceContext = createContext<{ enqueue(operation: ProgressOperation): void } | null>(null);

/** Present the response opportunity in the committed layout before input can arrive.
 * IDs describe a game/round position, never a participant or free-text content.
 */
export function useResponseEvidence(stimulus: string, available = true) {
  const { evidence, config } = useGameSession();
  useLayoutEffect(() => {
    if (available) evidence?.present(stimulus, config.level);
    else evidence?.cancel();
    evidence?.flush();
  }, [evidence, stimulus, available, config.level]);
  return {
    respond(correct: boolean, final = true) { evidence?.respond(correct, final); evidence?.flush(); },
    hint() { evidence?.hint(); evidence?.flush(); },
    select() { evidence?.select(); evidence?.flush(); },
  };
}
