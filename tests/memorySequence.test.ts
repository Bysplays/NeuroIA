import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMemorySequence } from '../src/services/memorySequence.ts';

test('memory rounds retain two, three and four valid steps, including repeated tiles', () => {
  const ids = Object.freeze([0, 1, 2, 3]);
  for (const length of [2, 3, 4]) {
    assert.deepEqual(createMemorySequence(ids, length, () => 0), Array(length).fill(0));
    assert.deepEqual(createMemorySequence(ids, length, () => 0.999), Array(length).fill(3));
  }
  const samples = [0, 0.25, 0.5, 0.75];
  assert.deepEqual(createMemorySequence(ids, 4, () => samples.shift()!), [0, 1, 2, 3]);
});

test('empty or invalid round configuration is rejected', () => {
  assert.throws(() => createMemorySequence([], 2));
  for (const length of [0, -1, 1.5]) assert.throws(() => createMemorySequence([0], length));
});
