import { HeaderIllustration } from './HeaderIllustration';
import { ExerciseCatalog } from './ExerciseCatalog';
import { getAchievements } from '../services/achievements';
import React, { useState } from 'react';
import { Sun, Clock3, Medal, ArrowRight } from 'lucide-react';
import type { UserProfile, CognitiveDomain, ExerciseId } from '../types';
import { soundService } from '../services/soundService';
import { TabletTabs } from './TabletTabs';
import { useViewportPanel } from '../services/viewport';

interface DashboardProps {
  proposedSessions?: React.ReactNode;
  profile: UserProfile;
  onSelectDomain: (domain: CognitiveDomain) => void;
  onSelectExercise?: (exerciseId: ExerciseId) => void;
  onStartDailyPlan: () => void;
  onOpenAchievements: () => void;
}
export function Dashboard({ profile, proposedSessions, onSelectDomain, onSelectExercise, onStartDailyPlan, onOpenAchievements }: DashboardProps) {
  const [tab, setTab] = useState('today');
  const panel = useViewportPanel<HTMLDivElement>();
  const earned = getAchievements(profile).filter(achievement => achievement.unlocked).length;
  const areas: [CognitiveDomain, string][] = [['attention','Atención'],['language','Lenguaje'],['memory','Memoria'],['executive','Organización'],['motor','Coordinación']];
  return <div ref={panel} className="dashboard-container tablet-dashboard">
    <div className="home-greeting"><div><h1>Hola, {profile.name}. <Sun size={26} aria-hidden="true"/></h1><p>Qué bien tenerte por aquí.</p></div><time className="home-date" dateTime={new Date().toLocaleDateString('sv-SE')}>{new Date().toLocaleDateString('es-ES', { weekday:'long',day:'numeric',month:'long' })}</time></div>
    <TabletTabs label="Tu espacio" value={tab} onChange={setTab} tabs={[
      { id:'today', label:'Hoy', content:<div className="home-feature-grid"><section className={`daily-session-card${profile.settings.showCompanions === false ? ' daily-session-without-art' : ''}`}><div className="daily-session-copy"><span className="soft-label"><span className="status-dot"/>Tu sesión de hoy</span><h2>Juega. Practica<br/>Progresa a tu ritmo</h2></div>{profile.settings.showCompanions !== false && <HeaderIllustration scene="home" className="wellness-characters"/>}<div className="session-actions"><button className="session-start" onClick={() => { soundService.playTap(); onStartDailyPlan(); }}>{profile.dailyPlanCompletedToday ? 'Haz otra sesión adicional' : 'Completa tu sesión de hoy'}<ArrowRight size={21}/></button></div></section><section className="consistency-card" aria-labelledby="consistency-title"><div className="consistency-heading"><h2 id="consistency-title">Cada día suma</h2></div><div className="streak-number">{profile.streakDays}<span>{profile.streakDays === 1 ? 'día seguido' : 'días seguidos'}</span></div><div className="consistency-footer"><p>{profile.streakDays ? 'Sigue encontrando ese ratito para ti.' : 'Tu próximo pequeño logro empieza hoy.'}</p><div className="consistency-stats"><div><Clock3 size={20}/><strong>{profile.totalMinutes}</strong><span>minutos</span></div><button onClick={onOpenAchievements}><Medal size={20}/><strong>{earned}</strong><span>Logros ↗</span></button></div></div></section></div> },
      { id:'games', label:'Juegos', content:<ExerciseCatalog embedded profile={profile} onBack={() => setTab('today')} onSelectExercise={exercise => { if (onSelectExercise) onSelectExercise(exercise.id); else onSelectDomain(exercise.domain); }}/> },
      ...(proposedSessions ? [{ id:'proposals', label:'Para ti', content:proposedSessions }] : []),
      { id:'progress', label:'Tu recorrido', content:<section className="progress-summary"><div><h2>Tu recorrido</h2><p>{profile.totalSessions ? `${profile.totalSessions} ejercicios completados. Cada intento cuenta.` : 'Aquí irás viendo todo lo que vas consiguiendo.'}</p></div><div className="progress-domains">{areas.map(([id,name]) => <div key={id}><span className={`progress-marker marker-${id}`}/><strong>{profile.domainProgress[id].totalCompleted}</strong><span>{name}</span></div>)}</div><button className="stats-quiet-button" onClick={onOpenAchievements}><Medal size={20}/>Ver mis logros</button></section> },
    ]}/>
  </div>;
}
