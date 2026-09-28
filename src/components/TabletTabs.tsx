import { createPortal } from 'react-dom';
import { useId, useRef, type ReactNode } from 'react';

export function TabletTabs({ label, value, onChange, tabs, header, navigationTarget, position = 'top' }: { position?: 'top' | 'bottom'; navigationTarget?: HTMLElement | null; header?: ReactNode; label: string; value: string; onChange: (value: string) => void; tabs: { id: string; label: string; icon?: ReactNode; content: ReactNode }[] }) {
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const navigation = <div className="tablet-tabs" role="tablist" aria-label={label}>
    {tabs.map((tab, index) => <button key={tab.id} ref={node => { buttons.current[index] = node; }} id={`${id}-${tab.id}-tab`} role="tab" aria-selected={value === tab.id} aria-controls={`${id}-${tab.id}-panel`} tabIndex={value === tab.id ? 0 : -1} onClick={() => onChange(tab.id)} onKeyDown={event => {
      const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
      if (next >= 0) { event.preventDefault(); onChange(tabs[next].id); buttons.current[next]?.focus(); }
    }}>{tab.icon && <span className="tablet-tab-icon" aria-hidden="true">{tab.icon}</span>}{tab.label}</button>)}
  </div>;
  return <div className="tablet-tab-view">{navigationTarget ? createPortal(navigation, navigationTarget) : position === 'top' ? navigation : null}{header}{tabs.map(tab => <div key={tab.id} role="tabpanel" tabIndex={0} id={`${id}-${tab.id}-panel`} aria-labelledby={`${id}-${tab.id}-tab`} hidden={value !== tab.id} className="tablet-tab-panel">{tab.content}</div>)}{!navigationTarget && position === 'bottom' && navigation}</div>;
}
export function TabletPager({ page, pages, onChange, label = 'Páginas' }: { page: number; pages: number; onChange: (page: number) => void; label?: string }) {
  if (pages <= 1) return null;
  return <nav className="tablet-pager" aria-label={label}><button className="stats-quiet-button" disabled={page === 0} onClick={() => onChange(page - 1)}>Anterior</button><span role="status">{page + 1} / {pages}</span><button className="stats-quiet-button" disabled={page + 1 >= pages} onClick={() => onChange(page + 1)}>Siguiente</button></nav>;
}
