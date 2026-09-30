import { useEffect, useRef, useState } from 'react';
import { activityExerciseStyle, activityExerciseTitle } from '../services/activityExercises';
import { formatActivityDate } from '../services/activityStats';

export type ActivityChartPoint = { id: string; date: string; time: number; value: number };
export type ActivityChartSeries = { id: string; points: ActivityChartPoint[] };
const number = (value: number) => value.toLocaleString('es-ES', { maximumFractionDigits: 1 });

export function ActivityLineChart({ title, description, series, min = 0, max, unit, average, ticks }: {
  title: string; description: string; series: ActivityChartSeries[]; min?: number; max: number; unit: string; average?: number | null; ticks?: number[];
}) {
  const chartRef = useRef<SVGSVGElement>(null);
  const [axisSize, setAxisSize] = useState(12);
  useEffect(() => {
    const svg = chartRef.current;
    if (!svg) return;
    const observer = new ResizeObserver(() => {
      const { width, height } = svg.getBoundingClientRect();
      const scale = Math.min(width / 650, height / 265);
      if (scale > 0) setAxisSize(parseFloat(getComputedStyle(document.documentElement).fontSize) * .6 / scale);
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, [series.length]);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const candidate = highlighted ?? pinned;
  const active = series.some(s => s.id === candidate) ? candidate : null;
  const points = series.flatMap(s => s.points);
  const start = Math.min(...points.map(p => p.time));
  const end = Math.max(...points.map(p => p.time));
  const x = (time: number) => end === start ? 335 : 55 + (time - start) / (end - start) * 555;
  const y = (value: number) => 215 - (value - min) / (max - min) * 180;
  const select = (id: string) => setPinned(current => current === id ? null : id);
  return <section className="stats-card stats-chart activity-line-chart">
    <header className="stats-chart-heading"><h2>{title}</h2>
      <span className="stats-series-label" aria-live="polite">{active ? activityExerciseTitle(active) : series.length === 1 ? activityExerciseTitle(series[0].id) : 'Todos los juegos'}</span>
    </header><p>{description}</p>
    {!points.length ? <p className="stats-empty">Todavía no hay datos para esta gráfica.</p> : <>
      <svg ref={chartRef} style={{ fontSize: axisSize }} viewBox="0 0 650 265" role="group" aria-label={`${title} por fecha`}>
        {(ticks ?? [0, 1, 2, 3, 4].map(i => min + (max - min) * i / 4)).map(value => { return <g key={value}><line x1="55" x2="610" y1={y(value)} y2={y(value)} className="stats-grid-line"/><text x="44" y={y(value) + 4} textAnchor="end">{number(value)}</text></g>; })}
        {average != null && <line x1="55" x2="610" y1={y(average)} y2={y(average)} className="stats-historical-mean" strokeDasharray="7 5" opacity={active ? .2 : 1}><title>Media histórica global: {number(average)}{unit}</title></line>}
        {[start, ...(end !== start ? [end] : [])].map(time => <text key={time} x={x(time)} y="248" textAnchor={end === start ? 'middle' : time === start ? 'start' : 'end'}>{formatActivityDate(points.find(p => p.time === time)!.date).day}</text>)}
        {series.map(({ id, points: values }) => <g key={id} className="stats-chart-series" data-series={id} tabIndex={0} role="button" aria-label={activityExerciseTitle(id)} aria-pressed={active === id} onFocus={() => setHighlighted(id)} onBlur={() => setHighlighted(null)} onKeyDown={event => { if (event.key === 'Escape') { setHighlighted(null); setPinned(null); } if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(id); } }} opacity={active && active !== id ? .15 : 1} stroke={activityExerciseStyle(id).color}
          onPointerEnter={() => setHighlighted(id)} onPointerLeave={() => setHighlighted(null)} onClick={() => select(id)}>
          <polyline fill="none" strokeWidth={active === id ? 4 : 2.5} points={values.map(p => `${x(p.time)},${y(p.value)}`).join(' ')}/>
          <polyline className="stats-series-hit" fill="none" stroke="transparent" strokeWidth="10" points={values.map(p => `${x(p.time)},${y(p.value)}`).join(' ')}/>
          {values.map(p => <g key={p.id}><circle cx={x(p.time)} cy={y(p.value)} r="6" fill="transparent" stroke="none"/><circle cx={x(p.time)} cy={y(p.value)} r={active === id ? 5 : 3.5} fill={activityExerciseStyle(id).color}><title>{activityExerciseTitle(id)} · {formatActivityDate(p.date).day}: {number(p.value)}{unit}</title></circle></g>)}
        </g>)}
      </svg>
      {average != null && <p className="stats-average">Media histórica global: {number(average)}{unit}</p>}

    </>}
  </section>;
}
