import { ActivityStatistics } from './ActivityStatistics';
import { AchievementShowcase } from './AchievementShowcase';
import { HeaderIllustration } from './HeaderIllustration';
import { ExerciseCatalog } from './ExerciseCatalog';
import { getAchievements } from '../services/achievements';
import React, { useState } from 'react';
import { Sun, Clock3, Medal, ArrowRight } from 'lucide-react';
import type { UserProfile, CognitiveDomain, ExerciseId, ExerciseResult } from '../types';
import { soundService } from '../services/soundService';
import { TabletTabs } from './TabletTabs';
import { useViewportPanel } from '../services/viewport';

const WELCOME_MESSAGES = [
  'Hoy puede ser un día genial.',
  '¡Vamos a llenar el día de sonrisas!',
  'Las ganas de jugar no tienen edad.',
  'La alegría también se practica.',
  'Un buen día empieza con una sonrisa.',
  'Hoy toca sumar momentos bonitos.',
  '¡Que no falten juegos ni sonrisas!',
  'La curiosidad hace la vida más divertida.',
  'Las pequeñas alegrías hacen grandes días.',
  'Ponle una pizca de diversión al día.',
  '¡Hoy tienes una cita con la diversión!',
  'Cada día trae algo bonito por descubrir.',
  'Tu sonrisa es un gran punto de partida.',
  'Lo mejor de jugar es disfrutarlo.',
  '¡A por un día lleno de buenos momentos!',
];

interface DashboardProps {
  uid: string;
  history: ExerciseResult[];
  navigationTarget?: HTMLElement | null;
  proposedSessions?: React.ReactNode;
  profile: UserProfile;
  onSelectDomain: (domain: CognitiveDomain) => void;
  onSelectExercise?: (exerciseId: ExerciseId) => void;
  onStartDailyPlan: () => void;
}
export function Dashboard({ uid, history, navigationTarget, profile, proposedSessions, onSelectDomain, onSelectExercise, onStartDailyPlan }: DashboardProps) {
  const [tab, setTab] = useState('today');
  const [welcomeMessage] = useState(() => WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)]);
  const [progressTab, setProgressTab] = useState('overview');
  const onOpenAchievements = () => { setProgressTab('achievements'); setTab('progress'); };
  const panel = useViewportPanel<HTMLDivElement>();
  const earned = getAchievements(profile).filter(achievement => achievement.unlocked).length;

  return <div ref={panel} className="dashboard-container tablet-dashboard">

    <TabletTabs navigationTarget={navigationTarget} label="Tu espacio" value={tab} onChange={setTab} tabs={[
      { id:'today', label:'Hoy', content:<div className="home-today"><div className="home-greeting"><h1>Hola, {profile.name}. <Sun size={26} aria-hidden="true"/></h1><p>{welcomeMessage}</p></div><div className="home-feature-grid"><section className={`daily-session-card${profile.settings.showCompanions === false ? ' daily-session-without-art' : ''}`}><div className="daily-session-copy"><span className="soft-label"><span className="status-dot"/>Tu sesión de hoy</span></div><div className="daily-session-message-slot"><h2 className="daily-session-message">Juega. Practica<br/>Progresa a tu ritmo</h2></div>{profile.settings.showCompanions !== false && <HeaderIllustration scene="home" className="wellness-characters"/>}<div className="session-actions"><button className="session-start" onClick={() => { soundService.playTap(); onStartDailyPlan(); }}>{profile.dailyPlanCompletedToday ? 'Haz otra sesión adicional' : 'Completa tu sesión de hoy'}<ArrowRight size={21}/></button></div></section><section className="consistency-card" aria-labelledby="consistency-title"><div className="consistency-heading"><h2 id="consistency-title">Cada día suma</h2></div><div className="streak-number">{profile.streakDays}<span>{profile.streakDays === 1 ? 'día seguido' : 'días seguidos'}</span></div><div className="consistency-footer"><p>{profile.streakDays ? 'Sigue encontrando ese ratito para ti.' : 'Tu próximo pequeño logro empieza hoy.'}</p><div className="consistency-stats"><div><Clock3 size={20}/><strong>{profile.totalMinutes}</strong><span>minutos</span></div><button onClick={onOpenAchievements}><Medal size={20}/><strong>{earned}</strong><span>Logros ↗</span></button></div></div></section></div></div> },
      { id:'games', label:'Juegos', content:<ExerciseCatalog embedded profile={profile} onBack={() => setTab('today')} onSelectExercise={exercise => { if (onSelectExercise) onSelectExercise(exercise.id); else onSelectDomain(exercise.domain); }}/> },
      ...(proposedSessions ? [{ id:'proposals', label:'Para ti', content:proposedSessions }] : []),
      { id:'progress', label:'Estadísticas', content:<ActivityStatistics levels={profile.gameLevels} selectedTab={progressTab} onTabChange={setProgressTab} uid={uid} history={history} embedded onBack={() => setTab('today')} achievements={<AchievementShowcase profile={profile} embedded onBack={() => setTab('today')}/>}/> },
    ]}/>
  </div>;
}
