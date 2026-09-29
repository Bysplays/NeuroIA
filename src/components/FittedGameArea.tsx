import { useLayoutEffect, useRef, type ReactNode } from 'react';

/** Fit the complete board, including its next action, below the fixed task header. */
export function FittedGameArea({ children }: { children: ReactNode }) {
  const area = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const outer = area.current!, inner = board.current!;
    const fit = () => {
      const scale = Math.min(1, outer.clientHeight / Math.max(1, inner.scrollHeight), outer.clientWidth / Math.max(1, inner.scrollWidth));
      inner.style.transform = `scale(${scale})`;
    };
    const observer = new ResizeObserver(fit);
    observer.observe(outer);
    observer.observe(inner);
    fit();
    return () => observer.disconnect();
  }, []);
  return <div className="exercise-viewport" ref={area}><div className="game-playground" ref={board}>{children}</div></div>;
}
