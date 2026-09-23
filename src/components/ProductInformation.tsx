import { useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { ModalFrame } from './ModalFrame';
import { PRODUCT_INTRO, PRODUCT_NOTICE, PRODUCT_SECTIONS } from '../services/productCopy';

export function ProductInformation({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState<'about' | 'notice' | null>(null);
  return <>
    <nav className="product-information-links" aria-label="Información de NeuroIA">
      <button onClick={() => setOpen('about')}>Sobre NeuroIA</button>
      <button onClick={() => setOpen('notice')}>Aviso legal</button>
      {children}
    </nav>
    {open && <ModalFrame labelledBy="product-information-title" onClose={() => setOpen(null)}>
      <article className="product-information">
        <header className="modal-header">
          <h2 id="product-information-title" className="modal-title">{open === 'about' ? 'Sobre NeuroIA' : 'Aviso legal'}</h2>
          <button className="modal-close-btn" aria-label="Cerrar información" onClick={() => setOpen(null)}><X size={22} /></button>
        </header>
        <div className="product-information-body">
          {open === 'about' && <>
            <p>{PRODUCT_INTRO}</p>
            <p><strong>Juega. Practica. Progresa a tu ritmo.</strong></p>
            {PRODUCT_SECTIONS.map(section => <section key={section.title}>
              <h3>{section.title}</h3>
              {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
              {section.items && <ul>{section.items.map(item => <li key={item}>{item}</li>)}</ul>}
            </section>)}
            <p>Voz grabada con <a href="https://elevenlabs.io" target="_blank" rel="noreferrer">elevenlabs.io</a>.</p>
            <h3>Aviso legal</h3>
          </>}
          <p>{PRODUCT_NOTICE}</p>
        </div>
      </article>
    </ModalFrame>}
  </>;
}
