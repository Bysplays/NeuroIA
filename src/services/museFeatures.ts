/** Electrode order follows MuseJS EEG characteristics 0003–0006. */
export const MUSE_CHANNELS = ['TP9', 'AF7', 'AF8', 'TP10'] as const;
export const MUSE_BANDS = ['delta', 'theta', 'alpha', 'beta', 'gamma'] as const;
export type MuseBand = typeof MUSE_BANDS[number];
export type ChannelQuality = 'valid' | 'missing' | 'malformed' | 'flat' | 'clipped';
export interface MuseChannelFeatures {
  channel: typeof MUSE_CHANNELS[number];
  quality: ChannelQuality;
  rms: number | null;
  /** Integrated one-sided power, µV²; not a mental-state score. */
  power: Record<MuseBand, number> | null;
}
export interface MuseFeatureFrame {
  version: 1;
  sampleRate: 256;
  samplesPerChannel: 256;
  /** Counter of the last BLE packet contributing to this window, modulo 65536. */
  sequence: number;
  channels: MuseChannelFeatures[];
}
const limits = [[1, 4], [4, 8], [8, 13], [13, 30], [30, 45]] as const;
const size = 256;
const taper = Array.from({ length: size }, (_, i) => .5 - .5 * Math.cos(2 * Math.PI * i / size));
const normalization = size * taper.reduce((sum, v) => sum + v * v, 0);

/** One-second, detrended periodic-Hann periodogram. Resolution 1 Hz.
 * Half-open band edges prevent double counting. This is not a Welch average,
 * contact classifier, fatigue detector or validated attention measurement.
 */
export function museChannelFeatures(channel: typeof MUSE_CHANNELS[number], samples?: readonly number[]): MuseChannelFeatures {
  const invalid = (quality: ChannelQuality): MuseChannelFeatures => ({ channel, quality, rms: null, power: null });
  if (!samples) return invalid('missing');
  if (samples.length !== size || samples.some(value => !Number.isFinite(value))) return invalid('malformed');
  if (samples.some(value => Math.abs(value) >= 999)) return invalid('clipped');
  const mean = samples.reduce((sum, value) => sum + value, 0) / size;
  const centered = samples.map(value => value - mean);
  const variance = centered.reduce((sum, value) => sum + value * value, 0) / size;
  if (variance === 0) return invalid('flat');
  const windowed = centered.map((value, i) => value * taper[i]);
  const power = { delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 };
  for (let band = 0; band < limits.length; band++) {
    for (let k = limits[band][0]; k < limits[band][1]; k++) {
      let real = 0, imaginary = 0;
      for (let i = 0; i < size; i++) {
        const phase = 2 * Math.PI * k * i / size;
        real += windowed[i] * Math.cos(phase);
        imaginary -= windowed[i] * Math.sin(phase);
      }
      // One-sided density × bin width (1 Hz). DC and Nyquist are excluded.
      power[MUSE_BANDS[band]] += 2 * (real * real + imaginary * imaginary) / normalization;
    }
  }
  return { channel, quality: 'valid', rms: Math.sqrt(variance), power };
}

export function museFeatureFrame(sequence: number, windows: readonly (readonly number[] | undefined)[]): MuseFeatureFrame {
  return { version: 1, sequence, sampleRate: 256, samplesPerChannel: 256,
    channels: MUSE_CHANNELS.map((channel, i) => museChannelFeatures(channel, windows[i])) };
}

/** Adapter boundary: reject arbitrary IDs, non-finite values and contradictory quality. */
export function validMuseFeatureFrame(frame: MuseFeatureFrame): boolean {
  return !!frame && frame.version === 1 && frame.sampleRate === 256 && frame.samplesPerChannel === 256
    && Number.isInteger(frame.sequence) && frame.sequence >= 0 && frame.sequence <= 65535
    && Array.isArray(frame.channels) && frame.channels.length === 4
    && frame.channels.every((value, i) => value?.channel === MUSE_CHANNELS[i]
      && (value.quality === 'valid'
        ? typeof value.rms === 'number' && Number.isFinite(value.rms) && value.rms > 0 && value.rms < 1000
          && !!value.power && Object.keys(value.power).length === 5
          && MUSE_BANDS.every(band => Number.isFinite(value.power![band]) && value.power![band] >= 0 && value.power![band] <= 1e6)
        : ['missing', 'malformed', 'flat', 'clipped'].includes(value.quality) && value.rms === null && value.power === null));
}
