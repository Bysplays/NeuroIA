import type { ExerciseId } from '../types';

type HeaderScene = ExerciseId | 'home' | 'catalog' | 'achievements' | 'therapist' | 'rest';

export function HeaderIllustration({ scene, className = '' }: { scene: HeaderScene; className?: string }) {
  if (scene === 'daily-sequencing' || scene === 'categorization') {
    const crop = scene === 'daily-sequencing'
      ? { x: 27, y: 80, width: 489, height: 375 }
      : { x: 548, y: 57, width: 466, height: 419 };
    const size = Math.max(crop.width, crop.height);
    return <span className={`header-illustration header-illustration-transparent ${className}`} aria-hidden="true">
      <span className="header-scene-crop" style={{
        width: `${crop.width / size * 90}%`,
        height: `${crop.height / size * 90}%`,
        backgroundImage: `url('${import.meta.env.BASE_URL}images/headers/organization.png')`,
        backgroundSize: `${1024 / crop.width * 100}% ${512 / crop.height * 100}%`,
        backgroundPosition: `${crop.x / (1024 - crop.width) * 100}% ${crop.y / (512 - crop.height) * 100}%`,
      }} />
    </span>;
  }
  return <img className={`header-illustration ${className}`} src={`${import.meta.env.BASE_URL}images/headers/${scene}.png`} alt="" aria-hidden="true" width="512" height="512" draggable={false} />;
}
