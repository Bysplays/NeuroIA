import { useGameSession } from '../services/gameSession';
import type { ComponentType } from 'react';
import type { ExerciseId, ExerciseResult, UserProfile } from '../types';
import { VisualScanningGame } from '../games/VisualScanningGame';
import { LanguageNamingGame } from '../games/LanguageNamingGame';
import { WordCompletionGame } from '../games/WordCompletionGame';
import { MemoryPathGame } from '../games/MemoryPathGame';
import { MemoryPairsGame } from '../games/MemoryPairsGame';
import { CategorizationGame } from '../games/CategorizationGame';
import { MotorCoordinationGame } from '../games/MotorCoordinationGame';
import { MotorTrackingGame } from '../games/MotorTrackingGame';
interface Props {
  profile: UserProfile;
  onBack: () => void;
  onSaveResult: (result: ExerciseResult) => void;
  planProgress?: { current: number; total: number; isLast: boolean } | null;
  onNextPlanExercise?: () => void;
}
const games: Record<ExerciseId, ComponentType<Props>> = {
  'visual-scanning': VisualScanningGame, 'language-naming': LanguageNamingGame,
  'word-completion': WordCompletionGame, 'memory-path': MemoryPathGame,
  'memory-pairs': MemoryPairsGame, categorization: CategorizationGame,
  'motor-target': MotorCoordinationGame, 'motor-tracking': MotorTrackingGame,
};
export function GameExercise({ id, ...props }: Props & { id: ExerciseId }) {
  const session = useGameSession();
  const Game = games[id];
  return <Game {...props} onSaveResult={result => {
    session.evidence?.finish(result.id);
    const adaptation=session.adaptation?.();
    const eeg=session.eegResult?.(), ppg=session.ppgResult?.();
    props.onSaveResult({...result,...(session.evidence ? {evidenceSessionId:session.evidence.id} : {}),
      ...(adaptation ? {adaptation} : {}),...(eeg ? {eeg} : {}),...(ppg ? {ppg} : {})});
  }}/>;
}
