import type { ReactNode } from 'react';
import { ArrowLeft, UserRound } from 'lucide-react';

/** Shared title and navigation row for professional detail pages. */
export function ProfessionalPageHeader({ title, icon, name, detail, backLabel, onBack, action }: {
  title: string; icon: ReactNode; name?: string; detail?: string;
  backLabel: string; onBack: () => void; action?: ReactNode;
}) {
  return <>
    <header className="professional-heading professional-home-heading"><span className="professional-section-icon" aria-hidden="true">{icon}</span><h1>{title}</h1></header>
    <div className="professional-page-toolbar">
      <button className="stats-quiet-button" onClick={onBack}><ArrowLeft size={20} aria-hidden="true"/>{backLabel}</button>
      {(name || detail) && <div className="professional-page-person">{name && <UserRound size={20} aria-hidden="true"/>}<div>{name && <span>{name}</span>}{detail && <small>{detail}</small>}</div></div>}
      {action}
    </div>
  </>;
}
