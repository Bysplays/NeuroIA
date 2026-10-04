import { validMuseFeatureFrame, type MuseFeatureFrame } from './museFeatures.ts';
import { validEegMetric, type EegMetric } from './eegData.ts';
export type EegStatus = 'unavailable' | 'disconnected' | 'connecting' | 'connected' | 'error';
export interface EegAdapter {
  id: string;
  metric: EegMetric;
  ppgMetric?: EegMetric;
  supported(): boolean;
  /** Must request Bluetooth permission synchronously from this user gesture. */
  connect(events: { sample(value: number, quality: 'good' | 'poor'): void; disconnected(): void; channels?(frame: MuseFeatureFrame): void; ppg?(value: number, quality: 'good' | 'poor'): void; battery?(percent: number): void }, signal: AbortSignal): Promise<{ disconnect(): void | Promise<void> }>;
}
export function createEegService() {
  let adapter: EegAdapter | undefined;
  let generation = 0;
  let connection: { disconnect(): void | Promise<void> } | undefined;
  let controller: AbortController | undefined;
  let state: { channels: MuseFeatureFrame | null; channelsReceivedAt: number; status: EegStatus; recording: boolean; metric?: EegMetric; adapter?: string; value: number | null; receivedAt: number; ppgMetric?: EegMetric; ppgValue: number | null; ppgReceivedAt: number; battery: number | null } = { channels: null, channelsReceivedAt: 0, status: 'unavailable', recording: false, value: null, receivedAt: 0, ppgValue: null, ppgReceivedAt: 0, battery: null };
  const listeners = new Set<() => void>();
  const update = (patch: Partial<typeof state>) => { state = { ...state, ...patch }; listeners.forEach(fn => fn()); };
  const disconnect = () => { const previous = connection; connection = undefined; generation++; controller?.abort(); controller = undefined; update({ channels: null, channelsReceivedAt: 0, status: adapter ? 'disconnected' : 'unavailable', value: null, recording: false, receivedAt: 0, ppgValue: null, ppgReceivedAt: 0, battery: null }); void Promise.resolve().then(() => previous?.disconnect()).catch(() => {}); };
  return {
    subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
    getSnapshot: () => state,
    install(next: EegAdapter) { if (!validEegMetric(next.metric) || (next.ppgMetric && !validEegMetric(next.ppgMetric)) || !next.id || next.id.length > 80) throw new Error('invalid-eeg-adapter'); disconnect(); adapter = next; update({ status: 'disconnected', metric: { ...next.metric }, adapter: next.id, ppgMetric: next.ppgMetric ? { ...next.ppgMetric } : undefined }); },
    supported: () => !!adapter?.supported(),
    async connect(recording: boolean) {
      if (!adapter || !adapter.supported() || state.status === 'connecting' || state.status === 'connected') return;
      const selected = adapter; const token = ++generation;
      controller = new AbortController();
      update({ status: 'connecting', recording, value: null, channels: null, channelsReceivedAt: 0 });
      try {
        const opened = await selected.connect({ channels(frame) { if (token !== generation) return; update({ channels: validMuseFeatureFrame(frame) ? structuredClone(frame) : null, channelsReceivedAt: Date.now() }); }, sample(value, quality) { if (token !== generation) return; const now = Date.now(); if (quality === 'good' && state.value !== null && now - state.receivedAt < 250) return; update({ value: quality === 'good' && Number.isFinite(value) && value >= selected.metric.min && value <= selected.metric.max ? value : null, receivedAt: now }); }, ppg(value, quality) { if (token !== generation || !selected.ppgMetric) return; const now = Date.now(); update({ ppgValue: quality === 'good' && Number.isFinite(value) && value >= selected.ppgMetric.min && value <= selected.ppgMetric.max ? value : null, ppgReceivedAt: now }); }, battery(percent) { if (token === generation && Number.isFinite(percent) && percent >= 0 && percent <= 100) update({ battery: Math.round(percent) }); }, disconnected() { if (token === generation) disconnect(); } }, controller.signal);
        if (token === generation) { connection = opened; update({ status: 'connected' }); }
        else await opened.disconnect();
      } catch { if (token === generation) { controller?.abort(); update({ status: 'error', value: null, channels: null, channelsReceivedAt: 0 }); } }
    },
    disconnect,
  };
}
/** Bootstrap installs the Muse 2 adapter; tests may install an isolated provider. */
export const eegService = createEegService();
