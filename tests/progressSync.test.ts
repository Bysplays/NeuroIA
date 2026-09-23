import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ProgressSync, type ProgressBackend } from '../src/services/progressSync.ts';
import { applyProgressOperation, patientProgress, type ProgressData, type ProgressOperation } from '../src/services/progressData.ts';
import { getInitialProfile } from '../src/services/storageService.ts';

const initial = (): ProgressData => patientProgress({ profile: getInitialProfile(), history: [] });
const result = (id: string): ProgressOperation => ({ id: `result:${id}`, kind: 'result', result: { id, exerciseId: 'visual-scanning', domain: 'attention', date: '2026-09-16T12:00:00.000Z', durationSeconds: 65, accuracy: 100, score: 10, correctAnswers: 1, totalQuestions: 1, feedbackMessage: '' } });
const settle = () => new Promise(resolve => setTimeout(resolve, 10));
function backend() {
  let data = initial();
  const receipts = new Set<string>();
  let offline = false;
  const api: ProgressBackend = {
    load: async () => { if (offline) throw Error('offline'); return structuredClone(data); },
    initialize: async value => value,
    commit: async operation => {
      if (offline) throw Error('offline');
      if (!receipts.has(operation.id)) { data = applyProgressOperation(data, operation); receipts.add(operation.id); }
      return structuredClone(data);
    },
    watch: () => () => {},
  };
  return { api, offline: (value: boolean) => { offline = value; }, data: () => data };
}

test('completion preserves counters and difficulty; imported clinical data is excluded', () => {
  let data = initial();
  for (let i = 0; i < 3; i++) data = applyProgressOperation(data, result(String(i)));
  assert.equal(data.profile.totalSessions, 3);
  assert.equal(data.profile.totalMinutes, 3);
  assert.equal(data.profile.domainProgress.attention.level, 2);
  assert.equal(data.profile.domainProgress.attention.avgAccuracy, 100);
  assert.equal(applyProgressOperation(data, result('0')).profile.totalSessions, 3);
  const imported = patientProgress({ profile: { ...getInitialProfile(), therapistGuidanceNote: 'private' }, history: [] });
  assert.equal(imported.profile.strokeDate, undefined);
  assert.equal(imported.profile.therapistGuidanceNote, '');
});

test('two devices merge completions and setting fields without replacing remote totals', async () => {
  const remote = backend();
  const a = new ProgressSync(initial(), [], remote.api, () => {}, () => {});
  const b = new ProgressSync(initial(), [], remote.api, () => {}, () => {});
  a.enqueue(result('a')); b.enqueue(result('b'));
  await settle();
  a.enqueue({ id: 'font', kind: 'settings', settings: { fontSize: 'xlarge' } });
  b.enqueue({ id: 'contrast', kind: 'settings', settings: { contrast: 'high-contrast' } });
  await settle();
  assert.equal(remote.data().profile.totalSessions, 2);
  assert.equal(remote.data().profile.settings.fontSize, 'xlarge');
  assert.equal(remote.data().profile.settings.contrast, 'high-contrast');
  a.stop(); b.stop();
});

test('offline outbox survives reload and duplicate acknowledgments never double count', async () => {
  const remote = backend(); remote.offline(true);
  let stored: ProgressOperation[] = [];
  let status = '';
  const a = new ProgressSync(initial(), [], remote.api, value => { stored = structuredClone(value); }, (_, value) => { status = value; });
  a.enqueue(result('offline'));
  await settle();
  assert.equal(status, 'pending'); assert.equal(stored.length, 1);
  a.stop(); remote.offline(false);
  // Server accepted the operation just before a client lost its acknowledgement.
  await remote.api.commit(stored[0]);
  const b = new ProgressSync(remote.data(), stored, remote.api, value => { stored = value; }, () => {});
  b.start(); await settle();
  assert.equal(remote.data().profile.totalSessions, 1);
  assert.equal(stored.length, 0);
  b.stop();
});

test('stopped account session never publishes or removes pending work after async completion', async () => {
  const remote = backend();
  let release: (() => void) | undefined;
  const api = { ...remote.api, commit: async (op: ProgressOperation) => { await new Promise<void>(resolve => { release = resolve; }); return remote.api.commit(op); } };
  let changes = 0; let stored: ProgressOperation[] = [];
  const sync = new ProgressSync(initial(), [], api, value => { stored = value; }, () => { changes++; });
  sync.enqueue(result('old-account')); const before = changes;
  sync.stop(); release!(); await settle();
  assert.equal(changes, before); assert.equal(stored.length, 1);
});

test('offline indication is immediate and queued work resumes on reconnection', async () => {
  const remote = backend(); let status = '';
  const sync = new ProgressSync(initial(), [], remote.api, () => {}, (_, next) => { status = next; });
  sync.setOnline(false); sync.enqueue(result('reconnect'));
  assert.equal(status, 'pending'); assert.equal(remote.data().profile.totalSessions, 0);
  sync.setOnline(true); await settle();
  assert.equal(status, 'saved'); assert.equal(remote.data().profile.totalSessions, 1);
  sync.stop();
});

test('local settings remain stable through delayed commits, stale reads and live updates', async () => {
  const remote = backend();
  const stale = initial();
  let publish: (data: ProgressData) => void = () => {};
  let release: (() => void) | undefined;
  const observed: ProgressData[] = [];
  const api: ProgressBackend = {
    ...remote.api,
    commit: async operation => {
      await new Promise<void>(resolve => { release = resolve; });
      return remote.api.commit(operation);
    },
    load: async () => structuredClone(stale),
    watch: next => { publish = next; return () => {}; },
  };
  const sync = new ProgressSync(initial(), [], api, () => {}, data => observed.push(data));
  sync.start();
  observed.length = 0;
  sync.enqueue({ id: 'local-theme', kind: 'settings', settings: { contrast: 'soft-dark', fontSize: 'xlarge' } });
  assert.equal(observed.at(-1)?.profile.settings.contrast, 'soft-dark');
  release!();
  await settle();
  publish(stale);
  const otherDevice = applyProgressOperation(stale, result('remote-progress'));
  otherDevice.profile.settings.handDominance = 'left';
  publish(otherDevice);
  assert.ok(observed.every(data => data.profile.settings.contrast === 'soft-dark' && data.profile.settings.fontSize === 'xlarge'));
  assert.equal(observed.at(-1)?.profile.totalSessions, 1);
  assert.equal(observed.at(-1)?.profile.settings.handDominance, 'left');
  sync.stop();
  // A new session adopts the current cloud state, without inheriting the old session's overrides.
  let nextData = initial();
  const nextSession = new ProgressSync(otherDevice, [], remote.api, () => {}, data => { nextData = data; });
  nextSession.start();
  assert.equal(nextData.profile.settings.contrast, otherDevice.profile.settings.contrast);
  nextSession.stop();
});

test('restored pending settings and rapid edits preserve the last local choice', async () => {
  const remote = backend();
  let publish: (data: ProgressData) => void = () => {};
  let displayed = initial();
  const queued: ProgressOperation = { id: 'restored-font', kind: 'settings', settings: { fontSize: 'xlarge' } };
  const sync = new ProgressSync(initial(), [queued], { ...remote.api, watch: next => { publish = next; return () => {}; } }, () => {}, data => { displayed = data; });
  sync.start();
  sync.enqueue({ id: 'font-normal', kind: 'settings', settings: { fontSize: 'normal' } });
  sync.enqueue({ id: 'font-large', kind: 'settings', settings: { fontSize: 'large' } });
  await settle();
  publish(initial());
  assert.equal(displayed.profile.settings.fontSize, 'large');
  assert.equal(remote.data().profile.settings.fontSize, 'large');
  sync.stop();
});
