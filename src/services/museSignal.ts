import type { EegMetric } from './eegData.ts';

export const MUSE_AMPLITUDE: EegMetric = {
  id: 'muse2-ac-rms-v1', label: 'Amplitud EEG', unit: 'µV', min: 0, max: 1000,
};

/** MuseJS 12-bit packet format; attribution/license: vendor/muse/README.md. */
export function decodeMusePacket(data: DataView): { index: number; samples: number[] } | undefined {
  if (data.byteLength !== 20) return;
  const samples: number[] = [];
  for (let i = 2; i < 20; i += 3) {
    const a = data.getUint8(i), b = data.getUint8(i + 1), c = data.getUint8(i + 2);
    samples.push(((a * 16 + (b >> 4)) - 2048) * 0.48828125);
    samples.push((((b & 15) * 256 + c) - 2048) * 0.48828125);
  }
  return { index: data.getUint16(0), samples };
}

/** One second of aligned four-channel AC RMS. This is amplitude, not attention. */
export function createMuseSignal(emit: (value: number, quality: 'good' | 'poor') => void) {
  const pending = new Map<number, (number[] | undefined)[]>();
  let windows: number[][] = [[], [], [], []];
  let previous: number | undefined;
  let lastAt = 0;
  const gap = () => { windows = [[], [], [], []]; emit(0, 'poor'); };
  return {
    push(channel: number, data: DataView, now: number) {
      if (channel < 0 || channel > 3) return;
      const packet = decodeMusePacket(data);
      if (!packet) { pending.clear(); previous = undefined; gap(); return; }
      if (lastAt && now - lastAt > 500) { pending.clear(); previous = undefined; gap(); }
      lastAt = now;
      if (previous !== undefined) {
        const distance = (packet.index - previous + 65536) % 65536;
        if (distance === 0 || distance > 32768) return;
      }
      const frame = pending.get(packet.index) ?? new Array<number[] | undefined>(4).fill(undefined);
      frame[channel] = packet.samples;
      pending.set(packet.index, frame);
      if (pending.size > 8) { pending.delete(pending.keys().next().value!); gap(); }
      if (!frame.every(samples => samples !== undefined)) return;
      pending.delete(packet.index);
      if (previous !== undefined && packet.index !== (previous + 1) % 65536) gap();
      previous = packet.index;
      frame.forEach((samples, i) => windows[i].push(...samples!));
      if (windows[0].length < 256) return;
      const variances = windows.map(samples => {
        const window = samples.splice(0, 256);
        if (window.some(v => Math.abs(v) >= 999)) return NaN; // ADC clipping.
        const mean = window.reduce((sum, v) => sum + v, 0) / window.length;
        return window.reduce((sum, v) => sum + (v - mean) ** 2, 0) / window.length;
      });
      // A flat or clipped channel invalidates the window; this is not a contact classifier.
      if (variances.some(v => !Number.isFinite(v) || v === 0)) { gap(); return; }
      emit(Math.sqrt(variances.reduce((sum, v) => sum + v, 0) / 4), 'good');
    },
  };
}

export const MUSE_PPG: EegMetric = {
  id: 'muse2-ppg-ir-rms-v1', label: 'Amplitud PPG infrarroja', unit: 'kADC', min: 0, max: 8388.608,
};
export function decodeMusePpgPacket(data: DataView) {
  if (data.byteLength !== 20) return;
  const samples: number[] = [];
  for (let i = 2; i < 20; i += 3) samples.push(data.getUint8(i) * 65536 + data.getUint8(i + 1) * 256 + data.getUint8(i + 2));
  return { index: data.getUint16(0), samples };
}
/** AC RMS of one second of infrared PPG (64 Hz), in thousands of ADC units. */
export function createMusePpgSignal(emit: (value: number, quality: 'good' | 'poor') => void) {
  let window: number[] = [], previous: number | undefined, lastAt = 0;
  return {
    push(data: DataView, now: number) {
      const packet = decodeMusePpgPacket(data);
      if (!packet) { window = []; previous = undefined; emit(0, 'poor'); return; }
      const distance = previous === undefined ? 1 : (packet.index - previous + 65536) % 65536;
      if (distance === 0 || distance > 32768) return;
      if (distance !== 1 || (lastAt && now - lastAt > 500)) { window = []; emit(0, 'poor'); }
      previous = packet.index; lastAt = now; window.push(...packet.samples);
      if (window.length < 64) return;
      const samples = window.splice(0, 64);
      const mean = samples.reduce((sum, v) => sum + v, 0) / 64;
      const variance = samples.reduce((sum, v) => sum + (v - mean) ** 2, 0) / 64;
      if (variance === 0 || samples.some(v => v === 0 || v === 16777215)) { emit(0, 'poor'); return; }
      emit(Math.sqrt(variance) / 1000, 'good');
    },
  };
}
