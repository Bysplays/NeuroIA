import { useLayoutEffect, useRef, type ReactNode } from 'react';

/** Center the board and its action together; scale only the board. */
export function FittedGameArea({ children, action }: { children: ReactNode; action?: ReactNode }) {
  const area = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  const hasAction = Boolean(action);
  useLayoutEffect(() => {
    const outer = area.current!, inner = board.current!;
    const fit = () => {
      const controls = actionRef.current;
      const reserved = controls ? controls.offsetHeight + 16 : 0;
      const scale = Math.max(0, Math.min(1, (outer.clientHeight - reserved) / Math.max(1, inner.scrollHeight), outer.clientWidth / Math.max(1, inner.scrollWidth)));
      const top = Math.max(0, (outer.clientHeight - inner.offsetHeight * scale - reserved) / 2);
      inner.style.transform = `scale(${scale})`;
      inner.style.top = `${top}px`;
      if (controls) controls.style.top = `${top + inner.offsetHeight * scale + 16}px`;
    };
    const observer = new ResizeObserver(fit);
    observer.observe(outer);
    observer.observe(inner);
    if (actionRef.current) observer.observe(actionRef.current);
    fit();
    return () => observer.disconnect();
  }, [hasAction]);
  return <div className="exercise-viewport" ref={area}><div className="game-playground" ref={board}>{children}</div>{hasAction && <div className="game-stage-action" ref={actionRef}>{action}</div>}</div>;
}
