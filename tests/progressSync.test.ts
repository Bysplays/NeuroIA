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
