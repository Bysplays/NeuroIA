/** Bounded signal summary or documented SDK indicator; never raw EEG or a medical score. */
export interface EegMetric { id: string; label: string; unit: string; min: number; max: number }
export interface EegRecording { version: 1; metric: EegMetric; adapter: string; points: string }
export type EegPoint = [number, number | null];
export function validEegMetric(m: EegMetric): boolean {
  return !!m && typeof m.id === 'string' && m.id.length > 0 && m.id.length <= 80
    && typeof m.label === 'string' && m.label.length > 0 && m.label.length <= 80
    && typeof m.unit === 'string' && m.unit.length <= 20
    && Number.isFinite(m.min) && Number.isFinite(m.max) && m.min < m.max && Math.abs(m.min) <= 1e6 && Math.abs(m.max) <= 1e6;
}
export function readEegPoints(recording?: EegRecording): EegPoint[] {
  if (!recording || recording.version !== 1 || !validEegMetric(recording.metric) || typeof recording.adapter !== 'string' || recording.adapter.length > 80 || typeof recording.points !== 'string' || recording.points.length > 6000) return [];
  try {
    const points = JSON.parse(recording.points);
    if (!Array.isArray(points) || !points.length || points.length > 120) return [];
    let previous = -1;
    for (const point of points) {
      if (!Array.isArray(point) || point.length !== 2 || !Number.isFinite(point[0]) || point[0] < 0 || point[0] > 86400 || point[0] <= previous || (point[1] !== null && (!Number.isFinite(point[1]) || point[1] < recording.metric.min || point[1] > recording.metric.max))) return [];
      previous = point[0];
    }
    return points;
  } catch { return []; }
}
export function createEegRecorder() {
  let metadata: { metric: EegMetric; adapter: string } | undefined;
  let points: EegPoint[] = [];
  let interval = 1;
  let sum = 0, count = 0;
  let last = -Infinity;
  let meanLast = -Infinity;
  return {
    add(seconds: number, source: { metric: EegMetric; adapter: string; value: number | null }) {
      if (!Number.isFinite(seconds) || seconds < 0 || seconds > 86400 || seconds - meanLast < 1 || !validEegMetric(source.metric)) return;
      if (!metadata) metadata = { metric: { ...source.metric }, adapter: source.adapter.slice(0, 80) };
      const matching = JSON.stringify(metadata.metric) === JSON.stringify(source.metric) && metadata.adapter === source.adapter;
      const value = matching && source.value !== null && Number.isFinite(source.value) && source.value >= metadata.metric.min && source.value <= metadata.metric.max ? Math.min(metadata.metric.max, Math.max(metadata.metric.min, Math.round(source.value * 1000) / 1000)) : null;
      if (value !== null) { sum += value; count++; }
      meanLast = seconds;
      if (seconds - last < interval) return;
      points.push([Math.round(seconds * 1000) / 1000, value]); last = seconds;
      if (points.length >= 120) {
        // Bound storage, retain the full time span and preserve missing-signal gaps.
        points = points.filter((_, i) => i % 2 === 0).map((p, i) => [p[0], p[1] === null || points[i * 2 + 1]?.[1] === null ? null : p[1]]);
        interval *= 2;
      }
    },
    mean(): number | undefined { return count ? sum / count : undefined; },
    snapshot(): EegRecording | undefined {
      return metadata && points.some(p => p[1] !== null) ? { version: 1, ...metadata, points: JSON.stringify(points) } : undefined;
    },
    reset() { sum = 0; count = 0; meanLast = -Infinity; metadata = undefined; points = []; interval = 1; last = -Infinity; },
  };
}
