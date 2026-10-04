import type { GameConfig } from './difficulty';
import { createContext, useContext } from 'react';
import type { createGameClock } from './gameClock';

export const SessionContext = createContext<{
  config: GameConfig;
  evidence?: ReturnType<typeof import('./sessionEvidence').createSessionEvidence>;
  adaptation?: () => string | undefined;
  progressScope?: { before: number; after: number };
  eegResult?: () => import('./eegData').EegRecording | undefined;
  ppgResult?: () => import('./eegData').EegRecording | undefined;
  assistanceTarget?: HTMLDivElement | null;
  lockedLevel?: boolean;
  nextReady?: boolean;
  clock: ReturnType<typeof createGameClock>;
  finish: (completed: boolean) => void;
  restart: () => void;
} | null>(null);
export function useGameSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('Games must be rendered inside GameSession');
  return session;
}
