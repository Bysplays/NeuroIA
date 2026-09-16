import { test } from 'node:test';
import assert from 'node:assert/strict';
import { StorageService, getInitialProfile } from '../src/services/storageService.ts';
import type { ExerciseResult } from '../src/types/index.ts';

const result: ExerciseResult = { id: 'test-result', exerciseId: 'visual-scanning', domain: 'attention', date: new Date().toISOString(), durationSeconds: 60, accuracy: 100, score: 10, correctAnswers: 1, totalQuestions: 1, feedbackMessage: '' };

test('accounts isolate settings, results and resets, preserving the legacy profile', () => {
  const legacy = JSON.stringify(getInitialProfile());
  const data = new Map([['neuroia_profile_v1', legacy], ['neuroia_history_v1', JSON.stringify([result])]]);
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
  } });
  try {
    StorageService.setAccount({ uid: 'alice', displayName: 'Alice' });
    const alice = StorageService.getProfile();
    assert.equal(alice.name, 'Alice');
    assert.equal(alice.strokeDate, undefined);
    assert.equal(alice.affectedSide, undefined);
    assert.equal(alice.totalSessions, 0);
    assert.deepEqual(StorageService.getHistory(), []);
    StorageService.updateSettings({ contrast: 'high-contrast' });
    StorageService.addExerciseResult(result);
    StorageService.setAccount({ uid: 'bob', displayName: 'Bob' });
    assert.equal(StorageService.getProfile().name, 'Bob');
    assert.equal(StorageService.getProfile().settings.contrast, 'standard');
    assert.deepEqual(StorageService.getHistory(), []);
    StorageService.addExerciseResult({ ...result, id: 'bob-result' });
    StorageService.setAccount({ uid: 'alice', displayName: 'Alice' });
    assert.equal(StorageService.getHistory()[0].id, 'test-result');
    assert.equal(StorageService.getProfile().settings.contrast, 'high-contrast');
    StorageService.resetProgress();
    assert.deepEqual(StorageService.getHistory(), []);
    assert.equal(StorageService.getProfile().name, 'Alice');
    StorageService.setAccount({ uid: 'bob', displayName: 'Bob' });
    assert.equal(StorageService.getHistory()[0].id, 'bob-result');
    assert.equal(data.get('neuroia_profile_v1'), legacy);
    assert.equal(JSON.parse(data.get('neuroia_history_v1')!).length, 1);
  } finally {
    StorageService.setAccount(null);
    Reflect.deleteProperty(globalThis, 'window');
    Reflect.deleteProperty(globalThis, 'localStorage');
  }
});

test('outbox acknowledgement cannot erase an operation added by another tab or account', () => {
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() { return data.size; },
  } });
  try {
    StorageService.setAccount({ uid: 'alice', displayName: 'Alice' });
    StorageService.writeOutbox([{ id: 'first', kind: 'settings', settings: { fontSize: 'xlarge' } }]);
    // A second tab appends its own operation after the first tab took its snapshot.
    data.set('neuroia_outbox_v1:alice:second', JSON.stringify({ id: 'second', kind: 'settings', settings: { contrast: 'high-contrast' } }));
    data.set('neuroia_outbox_v1:bob:third', JSON.stringify({ id: 'third', kind: 'settings', settings: { fontSize: 'normal' } }));
    StorageService.writeOutbox([]);
    assert.equal(data.has('neuroia_outbox_v1:alice:first'), false);
    assert.deepEqual(StorageService.readOutbox().map(item => item.id), ['second']);
    assert.equal(data.has('neuroia_outbox_v1:bob:third'), true);
  } finally {
    StorageService.setAccount(null);
    Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
