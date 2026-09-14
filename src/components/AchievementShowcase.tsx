import { HeaderIllustration } from './HeaderIllustration';
import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { ArrowLeft, Check, LockKeyhole, X } from 'lucide-react';
import type { UserProfile } from '../types';
import { getAchievements, type Achievement } from '../services/achievements';
import { ModalFrame } from './ModalFrame';

function BadgeArt({ index }: { index: number }) {
  if (index >= 6) return <span aria-hidden="true" className="achievement-art achievement-art-extended" style={{
    '--badge-x': `${([152, 441, 731, 1023, 1316, 1611, 1903][(index - 6) % 7] - 130) / 1796 * 100}%`,
    '--badge-y': `${((index < 13 ? 231 : 532) - 130) / 505 * 100}%`,
  } as CSSProperties} />;
  return <span aria-hidden="true" className="achievement-art" style={{
    '--badge-x': `${[7.18, 50, 92.73][index % 3]}%`,
    '--badge-y': `${index < 3 ? 10.71 : 85.87}%`,
  } as CSSProperties} />;
}

export function AchievementShowcase({ profile, onBack }: { profile: UserProfile; onBack: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, []);
  const achievements = getAchievements(profile);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = achievements.find(achievement => achievement.id === selectedId);
  const earned = achievements.filter(achievement => achievement.unlocked).length;
  const progressText = (achievement: Achievement) => `${achievement.current} de ${achievement.target} ${achievement.unit}`;

  return (
    <section className="achievement-showcase achievement-page" id="achievements" aria-labelledby="achievements-title" tabIndex={-1}>
      <button className="text-link achievement-back" onClick={onBack}><ArrowLeft size={18} /> Volver al inicio</button>
      <div className="achievement-heading">
        <div><span className="achievement-overline">Pequeños pasos, grandes recuerdos</span><h1 id="achievements-title" tabIndex={-1} ref={headingRef}>Tu colección de logros</h1><p>{earned ? 'Cada chapa guarda un poquito de tu recorrido.' : 'Tu primera chapa te espera al completar un ejercicio.'}</p></div>
        <HeaderIllustration scene="achievements" className="menu-header-art" />
        <span className="achievement-count">{earned} de {achievements.length} conseguidas</span>
      </div>
      <div className="badge-shelf">
        {achievements.map(achievement => (
          <button key={achievement.id} className={`badge-display ${achievement.unlocked ? 'badge-earned' : 'badge-pending'}`} onClick={() => setSelectedId(achievement.id)} aria-label={`${achievement.title}. ${achievement.unlocked ? 'Conseguida' : progressText(achievement)}. Ver logro`}>
            <span className="badge-illustration"><BadgeArt index={achievement.artwork} /><span className="badge-state" aria-hidden="true">{achievement.unlocked ? <Check size={15} /> : <LockKeyhole size={13} />}</span></span>
            <strong>{achievement.title}</strong>
            <span className="badge-progress-text">{achievement.unlocked ? 'Conseguida' : progressText(achievement)}</span>
          </button>
        ))}
      </div>
      {selected && (
        <ModalFrame onClose={() => setSelectedId(null)} labelledBy="achievement-detail-title">
          <div className="modal-container achievement-dialog">
            <div className="modal-header"><span className="modal-overline">{selected.unlocked ? 'Una chapa para tu colección' : 'Tu próximo pequeño logro'}</span><button className="modal-close-btn" onClick={() => setSelectedId(null)} aria-label="Cerrar logro"><X size={21} /></button></div>
            <div className="achievement-detail">
              <BadgeArt index={selected.artwork} />
              <h2 id="achievement-detail-title">{selected.title}</h2>
              <p>{selected.description}</p>
              <progress max={selected.target} value={selected.current} aria-label={`Progreso de ${selected.title}`} />
              <span>{selected.unlocked ? '¡Conseguida! Ya forma parte de tu colección.' : progressText(selected)}</span>
            </div>
            <div className="modal-footer"><button className="touch-btn touch-btn-primary" onClick={() => setSelectedId(null)}>Volver a mi colección</button></div>
          </div>
        </ModalFrame>
      )}
    </section>
  );
}
