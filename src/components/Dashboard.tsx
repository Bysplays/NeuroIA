import { HeaderIllustration } from './HeaderIllustration';
import { ExerciseCatalog } from './ExerciseCatalog';
import { getAchievements } from '../services/achievements';
import React, { useState } from 'react';
import {
  Eye,
  MessageSquare,
  Brain,
  ListOrdered,
  Hand,
  Sun,
  Clock3,
  Medal,
  ArrowRight
} from 'lucide-react';
import type { UserProfile, CognitiveDomain, ExerciseId } from '../types';
import { soundService } from '../services/soundService';
import { ExerciseSelectionModal } from './ExerciseSelectionModal';
import { getExercisesForDomain } from '../services/exerciseCatalog';

interface DashboardProps {
  profile: UserProfile;
  onSelectDomain: (domain: CognitiveDomain) => void;
  onSelectExercise?: (exerciseId: ExerciseId) => void;
  onStartDailyPlan: () => void;
  onOpenAchievements: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  profile,
  onSelectDomain,
  onSelectExercise,
  onStartDailyPlan,
  onOpenAchievements,
}) => {
  const [showAreaSelection, setShowAreaSelection] = useState(false);
  const [selectedDomainForModal, setSelectedDomainForModal] = useState<CognitiveDomain | null>(null);

  const earnedAchievements = getAchievements(profile).filter(achievement => achievement.unlocked).length;

  const domainCards = [
    {
      id: 'attention' as CognitiveDomain,
      title: 'Atención y Rastreo Visual',
      subtitle: 'Atención y concentración',
      desc: 'Localiza objetivos e identifica elementos en la pantalla.',
      icon: <Eye size={36} />,
      color: 'var(--color-attention)',
      bgColor: 'var(--color-attention-bg)',
      stats: profile.domainProgress.attention,
    },
    {
      id: 'language' as CognitiveDomain,
      title: 'Lenguaje y Vocabulario',
      subtitle: 'Palabras y conceptos',
      desc: 'Nombra imágenes y relaciona conceptos a través del juego.',
      icon: <MessageSquare size={36} />,
      color: 'var(--color-language)',
      bgColor: 'var(--color-language-bg)',
      stats: profile.domainProgress.language,
    },
    {
      id: 'memory' as CognitiveDomain,
      title: 'Memoria de Trabajo',
      subtitle: 'Secuencias y Recuerdos',
      desc: 'Recuerda posiciones, secuencias, imágenes, palabras u objetos.',
      icon: <Brain size={36} />,
      color: 'var(--color-memory)',
      bgColor: 'var(--color-memory-bg)',
      stats: profile.domainProgress.memory,
    },
    {
      id: 'executive' as CognitiveDomain,
      title: 'Funciones Ejecutivas',
      subtitle: 'Vida Diaria y Lógica',
      desc: 'Organiza acciones y resuelve pequeños retos de lógica.',
      icon: <ListOrdered size={36} />,
      color: 'var(--color-executive)',
      bgColor: 'var(--color-executive-bg)',
      stats: profile.domainProgress.executive,
    },
    {
      id: 'motor' as CognitiveDomain,
      title: 'Coordinación Visomotora',
      subtitle: 'Precisión Táctil y Mano',
      desc: 'Toca, arrastra o sigue recorridos a tu ritmo.',
      icon: <Hand size={36} />,
      color: 'var(--color-motor)',
      bgColor: 'var(--color-motor-bg)',
      stats: profile.domainProgress.motor,
    },
  ];

  return (
    <div className={`dashboard-container ${showAreaSelection ? 'dashboard-area-selection-active' : ''}`}>
      {!showAreaSelection ? (
        <div className="wellness-home">
          <div className="home-greeting">
            <div>
              <h1>Hola, {profile.name}. <Sun size={30} strokeWidth={1.5} aria-hidden="true" /></h1>
              <p>Qué bien tenerte por aquí.</p>
            </div>
            <time className="home-date" dateTime={new Date().toLocaleDateString('sv-SE')}>
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </time>
          </div>

          <div className="home-feature-grid">
            <section className={`daily-session-card${profile.settings.showCompanions === false ? ' daily-session-without-art' : ''}`}>
              <div className="daily-session-copy">
                <span className="soft-label"><span className="status-dot" /> Tu sesión de hoy</span>
                <h2>Juega. Practica<br />Progresa a tu ritmo</h2>
              </div>
              {profile.settings.showCompanions !== false && <HeaderIllustration scene="home" className="wellness-characters" />}
              <div className="session-actions">
                <button className="session-start" onClick={() => {
                  soundService.playTap();
                  onStartDailyPlan();
                }}>
                  {profile.dailyPlanCompletedToday ? 'Haz otra sesión adicional' : 'Completa tu sesión de hoy'} <ArrowRight size={21} />
                </button>
              </div>
            </section>

            <section className="consistency-card" aria-labelledby="consistency-title">
              <div className="consistency-heading"><h2 id="consistency-title">Cada día suma</h2></div>
              <div className="streak-number">{profile.streakDays}<span>{profile.streakDays === 1 ? 'día seguido' : 'días seguidos'}</span></div>
              <div className="consistency-footer">
              <p>{profile.streakDays > 0 ? 'Sigue encontrando ese ratito para ti.' : 'Tu próximo pequeño logro empieza hoy.'}</p>
              <div className="consistency-stats">
                <div><Clock3 size={20} /><strong>{profile.totalMinutes}</strong><span>minutos</span></div>
                <button onClick={onOpenAchievements}><Medal size={20} /><strong>{earnedAchievements}</strong><span>Logros <span aria-hidden="true">↗</span></span></button>
              </div>
              </div>
            </section>
          </div>

          <section className="practice-section" aria-labelledby="practice-title">
            <div className="practice-heading">
              <h2 id="practice-title">¿Qué te apetece practicar?</h2>
              <button className="text-link" onClick={() => { setShowAreaSelection(true); window.scrollTo(0, 0); }}>Ver ejercicios <ArrowRight size={18} /></button>
            </div>
            <div className="practice-cards">
              {domainCards.map((domain, index) => (
                <button key={domain.id} className={`practice-card practice-${domain.id}`} onClick={() => {
                  soundService.playTap();
                  setSelectedDomainForModal(domain.id);
                }}>
                  <span className="practice-name">{['Atención', 'Lenguaje', 'Memoria', 'Organización', 'Coordinación'][index]}</span>
                  <span className="practice-detail">{getExercisesForDomain(domain.id).length} {getExercisesForDomain(domain.id).length === 1 ? 'ejercicio' : 'ejercicios'}</span>
                  <span className="practice-symbol" aria-hidden="true">{domain.icon}</span>
                  <span className="practice-arrow" aria-hidden="true"><ArrowRight size={18} /></span>
                </button>
              ))}
            </div>
          </section>


            <section className="progress-summary">
              <div><h2>Tu recorrido</h2><p>{profile.totalSessions === 0 ? 'Aquí irás viendo todo lo que vas consiguiendo.' : `${profile.totalSessions} ejercicios completados. Cada intento cuenta.`}</p></div>
              <div className="progress-domains">
                {domainCards.map((domain, index) => (
                  <div key={domain.id}>
                    <span className={`progress-marker marker-${domain.id}`} />
                    <strong>{domain.stats.totalCompleted}</strong>
                    <span>{['Atención', 'Lenguaje', 'Memoria', 'Organización', 'Coordinación'][index]}</span>
                  </div>
                ))}
              </div>
            </section>
        </div>
      ) : (
        <ExerciseCatalog
          profile={profile}
          onBack={() => setShowAreaSelection(false)}
          onSelectExercise={exercise => {
            if (onSelectExercise) onSelectExercise(exercise.id);
            else onSelectDomain(exercise.domain);
          }}
        />
      )}


      {/* Modal para elegir entre los ejercicios del área */}
      {selectedDomainForModal && (
        <ExerciseSelectionModal
          domain={selectedDomainForModal}
          domainTitle={domainCards.find(d => d.id === selectedDomainForModal)?.title || ''}
          onSelectExercise={exerciseId => {
            const dom = selectedDomainForModal;
            setSelectedDomainForModal(null);
            if (onSelectExercise) {
              onSelectExercise(exerciseId);
            } else {
              onSelectDomain(dom);
            }
          }}
          onClose={() => setSelectedDomainForModal(null)}
        />
      )}


    </div>
  );
};
