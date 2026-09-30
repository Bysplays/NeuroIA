import { TabletPager } from './TabletTabs';
import { useViewportPanel } from '../services/viewport';
import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { ArrowLeft, Check, LockKeyhole, Trophy, X, Footprints, Music2, Star, Sprout, Clock3, Compass, Route, Mountain, Hourglass, Heart, Eye, ScanSearch, MessageCircle, MessagesSquare, Link, Images, Shapes, ListChecks, Hand, PencilLine } from 'lucide-react';
import type { UserProfile } from '../types';
import { getAchievements, type Achievement } from '../services/achievements';
import { ModalFrame } from './ModalFrame';

// Stable artwork indices match the cumulative milestones in achievements.ts.
const badgeIcons = [Footprints, Music2, Star, Sprout, Clock3, Compass, Route, Mountain,
  Hourglass, Heart, Eye, ScanSearch, MessageCircle, MessagesSquare, Link, Images,
  Shapes, ListChecks, Hand, PencilLine];

function BadgeArt({ index, unlocked }: { index: number; unlocked: boolean }) {
  const Icon = badgeIcons[index] ?? Trophy;
  return <span className={`achievement-emblem${unlocked ? ' achievement-emblem-earned' : ''}`} aria-hidden="true">
    <svg className="achievement-emblem-frame" viewBox="0 0 100 100" fill="none">
      <path d="M50 4 90 27v46L50 96 10 73V27Z" fill="currentColor" fillOpacity=".08" stroke="currentColor" strokeWidth="1.5"/>
      <path d="m50 12 33 19v38L50 88 17 69V31Z" stroke="currentColor" strokeOpacity=".3"/>
    </svg>
    <Icon className="achievement-emblem-icon" size={38} strokeWidth={1.6}/>
  </span>;
}

export function AchievementShowcase({ profile, onBack, embedded = false }: { embedded?: boolean; profile: UserProfile; onBack: () => void }) {
  const Heading = embedded ? 'h2' : 'h1';
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (!embedded) headingRef.current?.focus({ preventScroll: true }); }, [embedded]);
  const achievements = getAchievements(profile);
  const panel = useViewportPanel<HTMLElement>();
  const [page, setPage] = useState(0);
  const pageSize = 4;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = achievements.find(achievement => achievement.id === selectedId);
  const earned = achievements.filter(achievement => achievement.unlocked).length;
  const progressText = (achievement: Achievement) => `${achievement.current} de ${achievement.target} ${achievement.unit}`;

  return (
    <section ref={panel} className={`achievement-showcase achievement-page tablet-screen${embedded ? ' achievements-embedded' : ''}`} id="achievements" aria-labelledby="achievements-title" tabIndex={-1}>
      {!embedded && <button className="text-link achievement-back" onClick={onBack}><ArrowLeft size={18} /> Volver al inicio</button>}
      <div className="achievement-heading">
        <div className="workspace-section-heading">
          <span className="workspace-section-icon" aria-hidden="true"><Trophy size={26}/></span>
          <div><Heading id="achievements-title" tabIndex={-1} ref={headingRef}>Logros</Heading><p>{earned ? 'Los logros conseguidos se conservan en tu colección.' : 'Completa un juego para empezar tu colección.'}</p></div>
        </div>
        <div className="achievement-count" role="progressbar" aria-label="Logros conseguidos"
          aria-valuemin={0} aria-valuemax={achievements.length} aria-valuenow={earned}
          aria-valuetext={`${earned} de ${achievements.length} conseguidos`}
          style={{ '--achievement-progress': `${achievements.length ? earned / achievements.length * 100 : 0}%` } as CSSProperties}>
          <span>{earned} de {achievements.length} conseguidos</span>
        </div>
      </div>
      <div className="badge-shelf">
        {achievements.slice(Math.min(page, Math.ceil(achievements.length / pageSize) - 1) * pageSize, (Math.min(page, Math.ceil(achievements.length / pageSize) - 1) + 1) * pageSize).map(achievement => (
          <button key={achievement.id} className={`badge-display ${achievement.unlocked ? 'badge-earned' : 'badge-pending'}`} onClick={() => setSelectedId(achievement.id)} aria-label={`${achievement.title}. ${achievement.unlocked ? 'Conseguida' : progressText(achievement)}. Ver logro`}>
            <span className="badge-illustration"><BadgeArt index={achievement.artwork} unlocked={achievement.unlocked} /><span className="badge-state" aria-hidden="true">{achievement.unlocked ? <Check size={15} /> : <LockKeyhole size={13} />}</span></span>
            <strong>{achievement.title}</strong>
            <progress className="badge-progress" max={achievement.target} value={achievement.current} aria-label={`Progreso de ${achievement.title}`}/>
            <span className="badge-progress-text">{achievement.unlocked ? 'Conseguida' : progressText(achievement)}</span>
          </button>
        ))}
      </div>
      <TabletPager page={Math.min(page, Math.ceil(achievements.length / pageSize) - 1)} pages={Math.ceil(achievements.length / pageSize)} onChange={setPage} label="Páginas de logros"/>
      {selected && (
        <ModalFrame onClose={() => setSelectedId(null)} labelledBy="achievement-detail-title">
          <div className="achievement-dialog">
            <header className="achievement-dialog-header"><span className="achievement-status">{selected.unlocked ? <Check size={16}/> : <LockKeyhole size={16}/>} {selected.unlocked ? 'Logro conseguido' : 'Logro pendiente'}</span><button className="preferences-close" onClick={() => setSelectedId(null)} aria-label="Cerrar logro"><X size={20}/></button></header>
            <div className="achievement-dialog-title"><BadgeArt index={selected.artwork} unlocked={selected.unlocked}/><h2 id="achievement-detail-title">{selected.title}</h2></div>
            <p className="achievement-dialog-description">{selected.description}</p>
            <div className="achievement-dialog-progress"><span>{progressText(selected)}</span><progress className="badge-progress" max={selected.target} value={selected.current} aria-label={`Progreso de ${selected.title}`}/></div>
            <button className="touch-btn touch-btn-primary achievement-dialog-close" onClick={() => setSelectedId(null)}>Cerrar</button>
          </div>
        </ModalFrame>
      )}
    </section>
  );
}
