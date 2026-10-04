import {validReportEvent,type ReportEvent} from './reportLifecycle.ts';
import { placementExercises, validPlacementPreferences, type PlacementPreferences } from './placementPreferences.ts';
import { readEvidenceChunk, type EvidenceChunk } from './sessionEvidence.ts';
import { readAdaptationDecision } from './adaptivePolicy.ts';
import { adaptDifficulty, applyPlacement, applyPlacementPreferences, applyPlacementStage, hasPlacement, EXERCISE_IDS, type PlacementTrial, type PlacementStage } from './difficulty.ts';
import type { ExerciseId } from '../types/index.ts';
import type { AccessibilitySettings, ExerciseResult, UserProfile } from '../types/index.ts';

export interface ProgressData { profile: UserProfile; history: ExerciseResult[] }
export type ProgressOperation =
  | {id:string;kind:'report';event:ReportEvent}
  | { id: string; kind: 'evidence'; chunk: EvidenceChunk }
  | { id: string; kind: 'placement'; trials: Partial<Record<ExerciseId, PlacementTrial>>; preferences?: PlacementPreferences }
  | { id: string; kind: 'placement'; preferences: PlacementPreferences }
  | { id: string; kind: 'placement'; retakePreferences: PlacementPreferences }
  | { id: string; kind: 'placement'; exerciseId: ExerciseId; stage: PlacementStage }
  | { id: string; kind: 'placement'; exerciseId: ExerciseId; trial: PlacementTrial }
  | { id: string; kind: 'result'; result: ExerciseResult }
  | { id: string; kind: 'settings'; settings: Partial<AccessibilitySettings>; name?: string };

/** Same exercise counters as local storage; safe to call repeatedly in a transaction. */
export function applyProgressOperation(data: ProgressData, operation: ProgressOperation): ProgressData {
  return reduceProgressOperation(data,operation).data;
}
export function reduceProgressOperation(data: ProgressData, operation: ProgressOperation): { data: ProgressData; result?: ExerciseResult } {
  const next = structuredClone(data);
  const profile = next.profile;
  if(operation.kind==='report'){
    if(!validReportEvent(operation.event) || operation.id!==`report:${operation.event.attemptId}:${operation.event.sequence}`)throw Error('invalid-report-operation');
    return {data:next};
  }
  if (operation.kind === 'evidence') {
    if (!readEvidenceChunk(operation.chunk).length || operation.id !== `evidence:${operation.chunk.sessionId}:${operation.chunk.firstSequence}`) throw Error('invalid-evidence-operation');
    // Detailed evidence is archived independently; never grow the recent profile.
    return {data:next};
  }
  if (operation.kind === 'placement') {
    if ('trials' in operation) {
      const selected = operation.preferences ? placementExercises(operation.preferences) : EXERCISE_IDS;
      if (Object.keys(operation.trials).length !== selected.length || selected.some(id => !operation.trials[id])) throw new Error('incomplete-reassessment');
      if (!hasPlacement(profile)) throw new Error('missing-initial-placement');
      const assessment = structuredClone(profile);
      delete assessment.placement;
      assessment.gameLevels = {};
      if (operation.preferences) applyPlacementPreferences(assessment, operation.preferences);
      for (const id of selected) applyPlacement(assessment, id, operation.trials[id]!);
      profile.gameLevels = { ...profile.gameLevels, ...assessment.gameLevels };
      // Keep the whole initial record unchanged in this write: the eight-level
      // recalibration already uses most of the Firestore expression budget.
    } else if ('retakePreferences' in operation) {
      if (!validPlacementPreferences(operation.retakePreferences) || !hasPlacement(profile)) throw new Error('invalid-retake-preferences');
      profile.placement = { ...profile.placement!, retakePreferences: structuredClone(operation.retakePreferences) };
    } else if ('preferences' in operation) applyPlacementPreferences(profile, operation.preferences);
    else if ('stage' in operation) applyPlacementStage(profile, operation.exerciseId, operation.stage);
    else applyPlacement(profile, operation.exerciseId, operation.trial);
    return {data:next};
  }
  if (operation.kind === 'settings') {
    if (operation.name !== undefined) {
      const name = operation.name.trim();
      if (!name || name.length > 200) throw new Error('invalid-profile-name');
      profile.name = name;
    }
    profile.settings = { ...profile.settings, ...operation.settings };
    return {data:next};
  }
  const result = structuredClone(operation.result);
  if (next.history.some(item => item.id === result.id)) return {data:next};
  result.accuracy = Math.min(100, Math.max(0, result.accuracy));
  result.correctAnswers = Math.min(result.totalQuestions, Math.max(0, result.correctAnswers));
  const application=adaptDifficulty(profile, result);
  const decision=readAdaptationDecision(result.adaptation);
  if(decision && application) result.adaptation=JSON.stringify({...decision,application});
  const date = result.date.slice(0, 10);
  if (date > profile.lastActiveDate) {
    const days = Math.round((Date.parse(date) - Date.parse(profile.lastActiveDate)) / 86400000);
    profile.streakDays = days === 1 ? profile.streakDays + 1 : 1;
    profile.lastActiveDate = date;
    profile.dailyPlanCompletedToday = false;
  }
  if (!profile.streakDays) profile.streakDays = 1;
  profile.totalSessions += 1;
  profile.totalMinutes += Math.round(result.durationSeconds / 60) || 1;
  profile.totalScore = (profile.totalScore || 0) + result.score;
  const domain = profile.domainProgress[result.domain];
  const total = domain.totalCompleted + 1;
  domain.avgAccuracy = Math.min(100, Math.round((domain.avgAccuracy * domain.totalCompleted + result.accuracy) / total));
  domain.totalCompleted = total;
  if (result.accuracy >= 85 && total % 3 === 0 && domain.level < 3) domain.level += 1;
  domain.history.push({ date: result.date, accuracy: result.accuracy, score: result.score });
  domain.history = domain.history.slice(-60);
  next.history = [result, ...next.history].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60);
  return {data:next,result};
}

/** Clinical access is a separate future feature, never imported from local demo data. */
export function patientProgress(data: ProgressData): ProgressData {
  const copy = structuredClone(data);
  // Placement is cloud-owned; a legacy/local import must complete the guided flow.
  delete copy.profile.placement;
  delete copy.profile.gameLevels;
  delete copy.profile.strokeDate;
  delete copy.profile.affectedSide;
  delete copy.profile.prescribedDomain;
  copy.profile.therapistNotes = [];
  copy.profile.prescribedDomains = [];
  copy.profile.therapistGuidanceNote = '';
  copy.history = copy.history.slice(0, 60);
  for (const domain of Object.values(copy.profile.domainProgress)) domain.history = domain.history.slice(-60);
  return copy;
}
