import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEegRecorder, readEegPoints } from '../src/services/eegData.ts';
import { createEegService, type EegAdapter } from '../src/services/eegService.ts';
const metric = { id: 'sdk-index', label: 'Indicador de prueba', unit: '%', min: 0, max: 100 };
test('recordings remain bounded across a full day, preserve gaps and reset between games', () => {
  const recorder = createEegRecorder();
  for (let t = 0; t <= 86400; t++) recorder.add(t, { metric, adapter: 'test', value: t > 40000 && t < 45000 ? null : 40 });
  const saved = recorder.snapshot()!;
  const points = readEegPoints(saved);
  assert.ok(points.length > 0 && points.length <= 120);
  assert.ok(points.at(-1)![0] > 80000);
  assert.ok(points.some(p => p[1] === null));
  assert.ok(saved.points.length <= 6000);
  recorder.reset(); assert.equal(recorder.snapshot(), undefined);
});
test('invalid/out-of-range samples and changed metrics never become meaningful scores', () => {
  const r = createEegRecorder();
  r.add(0, { metric, adapter: 'test', value: NaN }); assert.equal(r.snapshot(), undefined);
  r.add(1, { metric, adapter: 'test', value: 50 });
  r.add(2, { metric: { ...metric, id: 'different' }, adapter: 'test', value: 70 });
  assert.deepEqual(readEegPoints(r.snapshot()), [[0,null],[1,50],[2,null]]);
  assert.deepEqual(readEegPoints({ ...r.snapshot()!, points: '[[0,999]]' }), []);
  assert.deepEqual(readEegPoints({ ...r.snapshot()!, points: '[[2,50],[1,40]]' }), []);
  assert.deepEqual(readEegPoints({ ...r.snapshot()!, points: '{broken' }), []);
});
test('connection cancellation ignores late samples and stale connection completion', async () => {
  const service = createEegService();
  let events: Parameters<EegAdapter['connect']>[0]; let resolve!: (value: { disconnect(): void }) => void; let disconnected = 0;
  service.install({ id:'test', metric, supported:()=>true, connect: e => { events=e; return new Promise(r=>{resolve=r;}); } });
  const pending = service.connect(true);
  service.disconnect(); events!.sample(50,'good'); resolve({ disconnect:()=>{disconnected++;} }); await pending;
  assert.equal(service.getSnapshot().status,'disconnected'); assert.equal(service.getSnapshot().value,null); assert.ok(disconnected > 0);
});
test('permission failure, poor signal, disconnection and explicit retry remain recoverable', async () => {
  const service=createEegService(); let events!: Parameters<EegAdapter['connect']>[0]; let fail=true;
  service.install({id:'test',metric,supported:()=>true,connect:async e=>{events=e;if(fail)throw Error('denied');return {disconnect:()=>{}};}});
  await service.connect(true);assert.equal(service.getSnapshot().status,'error');
  fail=false;await service.connect(false);events.sample(42,'good');assert.equal(service.getSnapshot().value,42);assert.equal(service.getSnapshot().recording,false);
  events.sample(80,'poor');assert.equal(service.getSnapshot().value,null);
  events.disconnected();assert.equal(service.getSnapshot().status,'disconnected');events.sample(42,'good');assert.equal(service.getSnapshot().value,null);
});
test('a canceled connection cannot disconnect a newer connection from the same adapter', async () => {
  const service = createEegService();
  const attempts: ((value: { disconnect(): void }) => void)[] = [];
  const closed: string[] = [];
  service.install({ id: 'test', metric, supported: () => true, connect: () => new Promise(resolve => attempts.push(resolve)) });
  const old = service.connect(true); service.disconnect();
  const current = service.connect(true);
  attempts[1]({ disconnect: () => { closed.push('new'); } }); await current;
  attempts[0]({ disconnect: () => { closed.push('old'); } }); await old;
  assert.equal(service.getSnapshot().status, 'connected');
  assert.deepEqual(closed, ['old']);
  service.disconnect(); await Promise.resolve();
  assert.deepEqual(closed, ['old', 'new']);
});
test('missing and unsupported SDKs never request a device', async () => {
  const service = createEegService();
  await service.connect(true); assert.equal(service.getSnapshot().status, 'unavailable');
  let requested = false;
  service.install({ id: 'test', metric, supported: () => false, connect: async () => { requested = true; return { disconnect() {} }; } });
  await service.connect(true); assert.equal(requested, false); assert.equal(service.getSnapshot().value, null);
});
test('live mean uses every valid active-second sample even after chart decimation', () => {
  const recorder = createEegRecorder();
  for (let t = 0; t < 500; t++) recorder.add(t, { metric, adapter: 'test', value: t % 2 ? 20 : 80 });
  assert.equal(recorder.mean(), 50);
  recorder.add(500, { metric, adapter: 'test', value: null }); assert.equal(recorder.mean(), 50);
  recorder.reset(); assert.equal(recorder.mean(), undefined);
});
test('PPG and battery are bounded, independent of EEG and reset on disconnect', async () => {
  const service=createEegService();let events!:Parameters<EegAdapter['connect']>[0];
  service.install({id:'test',metric,ppgMetric:metric,supported:()=>true,connect:async e=>{events=e;return {disconnect(){}};}});
  await service.connect(true);events.ppg?.(30,'good');events.sample(50,'good');events.battery?.(75.4);
  assert.equal(service.getSnapshot().ppgValue,30);assert.equal(service.getSnapshot().value,50);assert.equal(service.getSnapshot().battery,75);
  events.ppg?.(Infinity,'good');events.battery?.(500);assert.equal(service.getSnapshot().ppgValue,null);assert.equal(service.getSnapshot().battery,75);
  service.disconnect();assert.equal(service.getSnapshot().battery,null);assert.equal(service.getSnapshot().ppgValue,null);
});
