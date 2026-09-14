import { getAchievements } from '../services/achievements';
import React, { useState } from 'react';
import {
  Eye,
  MessageSquare,
  Brain,
  ListOrdered,
  Hand,
  Stethoscope,
  Play,
  Sun,
  Clock3,
  Medal,
  Shuffle,
  ArrowLeft,
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
      subtitle: 'Heminegligencia y Exploración',
      desc: 'Localiza estímulos en toda la pantalla para estimular el barrido de izquierda a derecha.',
      icon: <Eye size={36} />,
      color: 'var(--color-attention)',
      bgColor: 'var(--color-attention-bg)',
      stats: profile.domainProgress.attention,
    },
    {
      id: 'language' as CognitiveDomain,
      title: 'Lenguaje y Vocabulario',
      subtitle: 'Afasia y Anomia',
      desc: 'Recupera palabras y nombres de objetos cotidianos con apoyo fonológico y de voz.',
      icon: <MessageSquare size={36} />,
      color: 'var(--color-language)',
      bgColor: 'var(--color-language-bg)',
      stats: profile.domainProgress.language,
    },
    {
      id: 'memory' as CognitiveDomain,
      title: 'Memoria de Trabajo',
      subtitle: 'Secuencias y Recuerdos',
      desc: 'Retén secuencias visuales paso a paso para reforzar la memoria inmediata.',
      icon: <Brain size={36} />,
      color: 'var(--color-memory)',
      bgColor: 'var(--color-memory-bg)',
      stats: profile.domainProgress.memory,
    },
    {
      id: 'executive' as CognitiveDomain,
      title: 'Funciones Ejecutivas',
      subtitle: 'Vida Diaria y Lógica',
      desc: 'Ordena temporalmente acciones cotidianas (higiene, cocina, seguridad) para tu autonomía.',
      icon: <ListOrdered size={36} />,
      color: 'var(--color-executive)',
      bgColor: 'var(--color-executive-bg)',
      stats: profile.domainProgress.executive,
    },
    {
      id: 'motor' as CognitiveDomain,
      title: 'Coordinación Visomotora',
      subtitle: 'Precisión Táctil y Mano',
      desc: 'Toca dianas en pantalla a tu propio ritmo para reentrenar la motricidad fina.',
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
            <section className="daily-session-card">
              <div className="daily-session-copy">
                <span className="soft-label"><span className="status-dot" /> Tu sesión de hoy</span>
                <h2>Un rato para ti.<br />Un paso más.</h2>
                <p>Tres ejercicios para activar tu mente.<br />Sin prisas. A tu manera.</p>
              </div>
              <img className="wellness-characters" src="/images/wellness-companions.png" alt="" />
              <div className="session-actions">
                <button className="session-start" onClick={() => {
                  soundService.playTap();
                  onStartDailyPlan();
                }}>
                  Empezar mi sesión <ArrowRight size={21} />
                </button>
                <span className="session-footnote">{profile.dailyPlanCompletedToday ? 'Ya has completado tu plan de hoy. Puedes volver a practicar.' : 'Atención, memoria y mucho más'}</span>
              </div>
            </section>

            <section className="consistency-card" aria-labelledby="consistency-title">
              <div className="consistency-heading"><h2 id="consistency-title">Cada día suma</h2></div>
              <div className="streak-number">{profile.streakDays}<span>{profile.streakDays === 1 ? 'día seguido' : 'días seguidos'}</span></div>
              <p>{profile.streakDays > 0 ? 'Sigue encontrando ese ratito para ti.' : 'Tu próximo pequeño logro empieza hoy.'}</p>
              <div className="consistency-stats">
                <div><Clock3 size={20} /><strong>{profile.totalMinutes}</strong><span>minutos</span></div>
                <button onClick={onOpenAchievements}><Medal size={20} /><strong>{earnedAchievements}</strong><span>Logros <span aria-hidden="true">↗</span></span></button>
              </div>
            </section>
          </div>

          <section className="practice-section" aria-labelledby="practice-title">
            <div className="practice-heading">
              <h2 id="practice-title">¿Qué te apetece practicar?</h2>
              <button className="text-link" onClick={() => setShowAreaSelection(true)}>Ver ejercicios <ArrowRight size={18} /></button>
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
        <section className="area-selection-section card animate-fade-in">
          <div className="section-header-row">
            <div>
              <h1 className="section-title">Encuentra tu entrenamiento</h1>
              <p className="section-subtitle">Elige la capacidad que quieres practicar hoy.</p>
            </div>

            <div className="area-header-buttons">
              <button
                className="touch-btn touch-btn-primary"
                onClick={() => {
                  soundService.playSuccess();
                  onStartDailyPlan();
                }}
                title="Sesión guiada que combina 3 ejercicios distintos"
              >
                <Shuffle size={20} />
                <span>Sesión Guiada (3 Ejercicios)</span>
              </button>

              <button
                className="touch-btn touch-btn-secondary"
                onClick={() => {
                  soundService.playTap();
                  setShowAreaSelection(false);
                }}
              >
                <ArrowLeft size={20} />
                <span>Volver</span>
              </button>
            </div>
          </div>

          <div className="domains-grid">
            {domainCards.map(domain => {
              const isPrescribed = profile.prescribedDomains && profile.prescribedDomains.includes(domain.id);
              return (
                <div
                  key={domain.id}
                  className={`card card-interactive domain-card ${isPrescribed ? 'card-prescribed' : ''}`}
                  onClick={() => {
                    soundService.playTap();
                    setSelectedDomainForModal(domain.id);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      setSelectedDomainForModal(domain.id);
                    }
                  }}
                >
                  {isPrescribed && (
                    <div className="prescribed-badge">
                      <Stethoscope size={16} />
                      <span>Prioridad Pautada</span>
                    </div>
                  )}

                  <div className="domain-card-header">
                    <div
                      className="domain-icon-circle"
                      style={{ backgroundColor: domain.bgColor, color: domain.color }}
                    >
                      {domain.icon}
                    </div>
                    <div className="domain-title-group">
                      <h4 className="domain-card-title">{domain.title}</h4>
                      <span className="domain-card-subtitle">{domain.subtitle}</span>
                    </div>
                  </div>

                  <p className="domain-card-desc">{domain.desc}</p>

                  <div className="domain-card-footer">
                    <div className="domain-card-stat">
                      <span className="stat-label">Precisión media</span>
                      <strong className="stat-val">{domain.stats.avgAccuracy || 0}%</strong>
                    </div>

                    <button
                      className="touch-btn touch-btn-primary domain-play-btn"
                      onClick={e => {
                        e.stopPropagation();
                        soundService.playTap();
                        setSelectedDomainForModal(domain.id);
                      }}
                    >
                      <Play size={20} />
                      <span>Practicar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
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
