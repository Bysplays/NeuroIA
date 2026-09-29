import { UsersRound } from 'lucide-react';
/** Decorative cards from approved concept A, never used as question stimuli. */
export function PracticeMotif({ professional = false }: { professional?: boolean }) {
  if (professional) return <div className="practice-motif professional-motif" aria-hidden="true"><span className="motif-orbit"/><span className="professional-motif-card"><UsersRound strokeWidth={1.4}/></span><span className="motif-dot"/></div>;
  return (
    <div className="practice-motif" aria-hidden="true">
      <span className="motif-orbit" />
      <span className="motif-card motif-card-back">
        <i />
      </span>
      <span className="motif-card motif-card-front">
        <i />
      </span>
      <span className="motif-dot" />
    </div>
  );
}
