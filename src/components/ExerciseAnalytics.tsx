import { ArrowLeft } from 'lucide-react';
import type { ExerciseResult } from '../types';
import { activityExerciseTitle } from '../services/activityExercises';
import { formatActivityDate } from '../services/activityStats';
import {MuseHistory} from './MuseHistory';
import { EegChart } from './EegChart';
export function ExerciseAnalytics({ result, onBack, uid }: { result: ExerciseResult; onBack: () => void; uid?: string }) {
  const date = formatActivityDate(result.date);
  return <section className="exercise-analytics"><header className="stats-section-heading"><div><h2>{activityExerciseTitle(result.exerciseId)}</h2><p>{date.day}{date.time ? ` · ${date.time}` : ''}{result.level ? ` · Nivel ${result.level}` : ''}</p></div><button className="stats-quiet-button" onClick={onBack}><ArrowLeft size={18}/>Volver</button></header><div className="session-summary"><article className="stats-card"><span>Aciertos</span><strong>{result.correctAnswers} / {result.totalQuestions}</strong></article><article className="stats-card"><span>Precisión</span><strong>{result.totalQuestions ? `${Math.round(result.correctAnswers / result.totalQuestions * 100)} %` : '—'}</strong></article><article className="stats-card"><span>Tiempo de juego</span><strong>{Math.round(result.durationSeconds)} s</strong></article></div>{uid && result.evidenceSessionId && <MuseHistory uid={uid} result={result}/>}<section className="stats-card"><h2>EEG</h2><EegChart recording={result.eeg}/></section><section className="stats-card"><h2>PPG</h2><EegChart recording={result.ppg} signal="PPG"/></section></section>;
}
