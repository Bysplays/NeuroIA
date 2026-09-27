import type { GameConfig } from './difficulty';
import { createContext, useContext } from 'react';
import type { createGameClock } from './gameClock';

export const SessionContext = createContext<{
  config: GameConfig;
  clock: ReturnType<typeof createGameClock>;
  finish: (completed: boolean) => void;
  restart: () => void;
} | null>(null);
export function useGameSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('Games must be rendered inside GameSession');
  return session;
}
