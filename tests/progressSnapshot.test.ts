import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ProgressSnapshotOrder } from '../src/services/progressSnapshot.ts';
import { applyProgressOperation, patientProgress } from '../src/services/progressData.ts';
import { getInitialProfile } from '../src/services/storageService.ts';

test('a delayed listener cannot revert settings confirmed by a newer server read', () => {
  const order = new ProgressSnapshotOrder();
  const before = patientProgress({ profile: getInitialProfile(), history: [] });
  const after = applyProgressOperation(before, { kind: 'settings', id: 'theme', settings: { contrast: 'soft-dark', fontSize: 'xlarge' } });
  order.accept(before, { seconds: 1, nanoseconds: 100 });
  // A post-commit read overtakes an older listener event in the same millisecond.
  order.accept(after, { seconds: 1, nanoseconds: 200 });
  assert.equal(order.accept(before, { seconds: 1, nanoseconds: 100 }), false);
  assert.equal(order.data?.profile.settings.contrast, 'soft-dark');
  assert.equal(order.data?.profile.settings.fontSize, 'xlarge');
  // Subsequent changes from another device must still be applied.
  const otherDevice = applyProgressOperation(after, { kind: 'settings', id: 'other', settings: { contrast: 'high-contrast' } });
  assert.equal(order.accept(otherDevice, { seconds: 2, nanoseconds: 0 }), true);
  assert.equal(order.data?.profile.settings.contrast, 'high-contrast');
});

test('an older read cannot replace a newer listener snapshot and accounts have independent ordering', () => {
  const a = new ProgressSnapshotOrder();
  const b = new ProgressSnapshotOrder();
  const data = patientProgress({ profile: getInitialProfile(), history: [] });
  a.accept(data, { seconds: 20, nanoseconds: 0 });
  assert.equal(a.accept(data, { seconds: 19, nanoseconds: 999999999 }), false);
  assert.equal(b.accept(data, { seconds: 1, nanoseconds: 0 }), true);
});
