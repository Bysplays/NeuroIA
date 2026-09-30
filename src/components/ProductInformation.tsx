import type { ReactNode } from 'react';
import type { InformationKind } from './InformationPage';

export function ProductInformation({ children, onOpen }: { children?: ReactNode; onOpen: (kind: InformationKind) => void }) {
  return <nav className="product-information-links" aria-label="Información de NeuroIA">
    <button data-information-link="about" onClick={() => onOpen('about')}>Sobre NeuroIA</button>
    <button data-information-link="notice" onClick={() => onOpen('notice')}>Aviso legal</button>
    {children}
  </nav>;
}
