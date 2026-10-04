import { ArrowLeft } from 'lucide-react';
import type { ExerciseResult } from '../types';
import { activityExerciseTitle } from '../services/activityExercises';
import { formatActivityDate } from '../services/activityStats';
import {MuseHistory} from './MuseHistory';
import { playedLevels, playedLevelLabel } from '../services/levelStatistics';
import { EegChart } from './EegChart';
export function ExerciseAnalytics({ result, onBack, uid }: { result: ExerciseResult; onBack: () => void; uid?: string }) {
  const levels=playedLevels(result);
  const changes=levels?.filter((level,index)=>index===0||level!==levels[index-1]);
  const date = formatActivityDate(result.date);
  return <section className="exercise-analytics"><header className="stats-section-heading"><div><h2>{activityExerciseTitle(result.exerciseId)}</h2><p>{date.day}{date.time ? ` · ${date.time}` : ''}{` · ${playedLevelLabel(result)}`}</p></div><button className="stats-quiet-button" onClick={onBack}><ArrowLeft size={18}/>Volver</button></header>{changes && changes.length>1 && <section className="stats-card stats-played-levels"><h3>Niveles durante la partida</h3><p>{changes.join(' → ')}</p><p>Orden de los cambios registrados. No indica el tiempo en cada nivel ni el nivel recomendado para la próxima partida.</p></section>}<div className="session-summary"><article className="stats-card"><span>Aciertos</span><strong>{result.correctAnswers} / {result.totalQuestions}</strong></article><article className="stats-card"><span>Precisión</span><strong>{result.totalQuestions ? `${Math.round(result.correctAnswers / result.totalQuestions * 100)} %` : '—'}</strong></article><article className="stats-card"><span>Tiempo de juego</span><strong>{Math.round(result.durationSeconds)} s</strong></article></div>{uid && result.evidenceSessionId && <MuseHistory uid={uid} result={result}/>}<section className="stats-card"><h2>EEG</h2><EegChart recording={result.eeg}/></section><section className="stats-card"><h2>PPG</h2><EegChart recording={result.ppg} signal="PPG"/></section></section>;
}
