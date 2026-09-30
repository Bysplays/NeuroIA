import { useState } from 'react';
import { Dashboard } from '../../src/components/Dashboard';
import { AssignedSessionPlayer } from '../../src/components/AssignedSessions';
import { useAssignedRecommendation } from '../../src/services/useAssignedRecommendation';
import type { AssignedSession } from '../../src/services/assignedSessions';
import type { ExerciseResult, UserProfile } from '../../src/types';
import type { ProgressSync } from '../../src/services/progressSync';
export function RecommendationFixture({ profile }: { profile: UserProfile }) {
  const [history, setHistory] = useState<ExerciseResult[]>([]);
  const [playing, setPlaying] = useState<{ session: AssignedSession; step?: number }>();
  const recommendation = useAssignedRecommendation({ professionalId: 'fixture-owner', patientId: 'fixture-player', seatId: 'fixture-seat' }, history);
  const sync = { enqueue(operation: { result: ExerciseResult }) {
    setHistory(values => [...values, operation.result]);
    window.dispatchEvent(new CustomEvent('fixture-assigned-result', { detail: operation.result }));
  }, retry() {} } as unknown as ProgressSync;
  return playing ? <AssignedSessionPlayer selected={playing.session} singleStep={playing.step} profile={profile} sync={sync} onBack={()=>setPlaying(undefined)}/>
    : <Dashboard uid="fixture-player" profile={profile} history={history} recommendation={recommendation} onStartRecommendation={(session,step)=>setPlaying({session,step})} onOpenSettings={()=>{}} onSelectDomain={()=>{}} onStartDailyPlan={()=>{}}/>;
}
