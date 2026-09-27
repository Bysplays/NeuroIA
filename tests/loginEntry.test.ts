import { test } from 'node:test';
import assert from 'node:assert/strict';
import { StorageService } from '../src/services/storageService.ts';

test('login preference survives reloads, is account-scoped and can return to player', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  } });
  try {
    assert.equal(StorageService.readProfessionalEntry('a'), false);
    StorageService.saveProfessionalEntry('a', true);
    StorageService.setAccount(null);
    assert.equal(StorageService.readProfessionalEntry('a'), true);
    assert.equal(StorageService.readProfessionalEntry('b'), false);
    StorageService.saveProfessionalEntry('a', false);
    assert.equal(StorageService.readProfessionalEntry('a'), false);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});

test('unavailable device storage does not block login', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw Error('blocked'); } });
  try {
    assert.doesNotThrow(() => StorageService.saveProfessionalEntry('a', true));
    assert.equal(StorageService.readProfessionalEntry('a'), false);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
