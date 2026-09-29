import { UserRound, UsersRound } from 'lucide-react';
/** Decorative cards from approved concept A, never used as question stimuli. */
export function PracticeMotif({ professional = false }: { professional?: boolean }) {
  if (professional) return (
    <div className="practice-motif professional-motif" aria-hidden="true">
      <span className="motif-orbit"/>
      <span className="professional-profile professional-profile-back">
        <span className="professional-avatar"><UserRound strokeWidth={2.4}/></span>
        <span className="professional-profile-lines"><i/><i/></span>
      </span>
      <span className="professional-profile professional-profile-front">
        <span className="professional-avatar"><UsersRound strokeWidth={2.4}/></span>
        <span className="professional-profile-lines"><i/><i/></span>
      </span>
      <span className="motif-spark"/>
      <span className="motif-dot"/>
    </div>
  );
  return (
    <div className="practice-motif" aria-hidden="true">
      <span className="motif-orbit" />
      <span className="motif-card motif-card-back">
        <i />
      </span>
      <span className="motif-card motif-card-front">
        <i />
      </span>
      <span className="motif-spark" />
      <span className="motif-dot" />
    </div>
  );
}
