import { test } from 'node:test';
import assert from 'node:assert/strict';
import { museChannelFeatures, museFeatureFrame, validMuseFeatureFrame } from '../src/services/museFeatures.ts';
import { createMuseSignal } from '../src/services/museSignal.ts';
import { createEegService, type EegAdapter } from '../src/services/eegService.ts';
const wave = (frequency: number, amplitude = 10, offset = 0) => Array.from({length: 256}, (_, i) => offset + amplitude * Math.sin(2 * Math.PI * frequency * i / 256));
const near = (a: number, b: number, tolerance = 1e-8) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);

test('four electrodes retain independent RMS and spectral power with physical units', () => {
  const frame = museFeatureFrame(42, [wave(6, 10), wave(10, 20), wave(20, 30), wave(35, 40)]);
  assert.equal(validMuseFeatureFrame(frame), true);
  assert.deepEqual(frame.channels.map(v => v.channel), ['TP9', 'AF7', 'AF8', 'TP10']);
  const bands = ['theta', 'alpha', 'beta', 'gamma'] as const;
  frame.channels.forEach((v, i) => {
    near(v.rms!, (i + 1) * 10 / Math.sqrt(2));
    near(v.power![bands[i]], ((i + 1) * 10) ** 2 / 2);
    const total = Object.values(v.power!).reduce((sum, p) => sum + p, 0);
    near(total, v.power![bands[i]]);
  });
});
test('DC offsets are removed, bands do not double count a boundary', () => {
  const a = museChannelFeatures('AF7', wave(10, 10, 100));
  const b = museChannelFeatures('AF7', wave(10));
  near(a.rms!, b.rms!); near(a.power!.alpha, b.power!.alpha);
  const edge = museChannelFeatures('AF7', wave(8));
  near(edge.power!.theta + edge.power!.alpha, 50);
  near(edge.power!.theta, 50 / 6); // Hann side lobe at 7 Hz.
  near(edge.power!.alpha, 50 * 5 / 6);
});
test('bad channel quality is explicit and never replaces missing evidence with zero power', () => {
  const frame = museFeatureFrame(0, [wave(10), Array(256).fill(0), wave(6, 1100), [NaN]]);
  assert.deepEqual(frame.channels.map(v => v.quality), ['valid', 'flat', 'clipped', 'malformed']);
  assert.equal(validMuseFeatureFrame(frame), true);
  for (const v of frame.channels.slice(1)) { assert.equal(v.rms, null); assert.equal(v.power, null); }
  assert.equal(museChannelFeatures('TP9').quality, 'missing');
  const bad = structuredClone(frame); bad.channels[0].power!.alpha = NaN;
  assert.equal(validMuseFeatureFrame(bad), false);
  bad.channels[0].power!.alpha = 10; bad.channels.reverse();
  assert.equal(validMuseFeatureFrame(bad), false);
});
function packet(index: number, channel: number) {
  const view = new DataView(new ArrayBuffer(20)); view.setUint16(0, index);
  for (let i = 0; i < 12; i += 2) {
    const a = channel === 1 ? 2048 : 2048 - (channel + 1) * 10;
    const b = channel === 1 ? 2048 : 2048 + (channel + 1) * 10;
    const offset = 2 + i / 2 * 3;
    view.setUint8(offset, a >> 4); view.setUint8(offset + 1, ((a & 15) << 4) | b >> 8); view.setUint8(offset + 2, b & 255);
  }
  return view;
}
test('aligned BLE windows preserve usable channels when another is flat and invalidate transport gaps', () => {
  const frames: ReturnType<typeof museFeatureFrame>[] = []; const legacy: string[] = [];
  const processor = createMuseSignal((_, q) => legacy.push(q), f => frames.push(f));
  for (let i = 0; i < 22; i++) for (const c of [3, 1, 0, 2]) processor.push(c, packet(i, c), i * 47 + 1);
  assert.deepEqual(frames[0].channels.map(v => v.quality), ['valid', 'flat', 'valid', 'valid']);
  near(frames[0].channels[2].rms!, 30 * .48828125);
  assert.deepEqual(legacy, ['poor']);
  for (let c = 0; c < 4; c++) processor.push(c, packet(24, c), 1200);
  assert.ok(frames.at(-1)!.channels.every(v => v.quality === 'missing'));
});
test('service snapshots isolate channel data and discard canceled or malformed events', async () => {
  const service = createEegService(); let events!: Parameters<EegAdapter['connect']>[0];
  service.install({id:'test',metric:{id:'rms',label:'RMS',unit:'µV',min:0,max:1000},supported:()=>true,
    connect: async e => { events = e; return {disconnect(){}}; }});
  await service.connect(true);
  const frame = museFeatureFrame(2, [wave(6),wave(10),wave(20),wave(35)]);
  events.channels!(frame);
  frame.channels[0].rms = 500;
  near(service.getSnapshot().channels!.channels[0].rms!, 10 / Math.sqrt(2));
  events.channels!({...frame,sequence:-1}); assert.equal(service.getSnapshot().channels, null);
  service.disconnect(); events.channels!(frame);
  assert.equal(service.getSnapshot().channels, null); assert.equal(service.getSnapshot().channelsReceivedAt, 0);
});
