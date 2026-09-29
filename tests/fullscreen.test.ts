import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enterFullscreen } from '../src/services/fullscreen.ts';

test('explicit fullscreen can retry after rejection and never locks orientation', async () => {
  let requests = 0;
  let reject = true;
  let orientationLocks = 0;
  const document = { fullscreenElement: null as object | null, documentElement: { requestFullscreen: async () => { requests++; if (reject) throw new Error('denied'); document.fullscreenElement = {}; } } };
  let standalone = false;
  const previous = ['document', 'window', 'screen'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  Object.defineProperties(globalThis, {
    document: { configurable: true, value: document },
    window: { configurable: true, value: { matchMedia: () => ({ matches: standalone }) } },
    screen: { configurable: true, value: { orientation: { lock: async () => { orientationLocks++; } } } },
  });
  try {
    assert.equal(await enterFullscreen(), false);
    assert.equal(requests, 1);
    reject = false;
    assert.equal(await enterFullscreen(), true);
    assert.equal(requests, 2);
    assert.ok(document.fullscreenElement);
    assert.equal(orientationLocks, 0);
    assert.equal(await enterFullscreen(), true);
    document.fullscreenElement = null;
    assert.equal(await enterFullscreen(), true, 'an explicit request can reenter');
    assert.equal(requests, 3);
    document.fullscreenElement = null;
    standalone = true;
    assert.equal(await enterFullscreen(), true);
    assert.equal(requests, 3, 'installed standalone app needs no request');
  } finally {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
