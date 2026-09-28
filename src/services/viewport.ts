import { useEffect, useLayoutEffect, useState } from 'react';

export function useCompactViewport() {
  const [compact, setCompact] = useState(() => window.matchMedia('(max-height: 700px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-height: 700px)');
    const update = () => setCompact(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return compact;
}

/** Space below preceding toolbars; content may grow for accessibility. */
export function useViewportPanel<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null);
  useLayoutEffect(() => {
    if (!element) return;
    const measure = () => {
      const top = element.getBoundingClientRect().top + window.scrollY;
      element.style.setProperty('--panel-height', `${Math.max(240, window.innerHeight - top)}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (element.parentElement) observer.observe(element.parentElement);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [element]);
  return setElement;
}
