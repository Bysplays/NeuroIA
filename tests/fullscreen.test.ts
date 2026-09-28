import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enterFullscreen } from '../src/services/fullscreen.ts';

test('fullscreen rejection never blocks play, automatic entry happens once, explicit retry remains available', async () => {
  let requests = 0;
  let reject = true;
  const document = { fullscreenElement: null as object | null, documentElement: { requestFullscreen: async () => { requests++; if (reject) throw new Error('denied'); document.fullscreenElement = {}; } } };
  let standalone = false;
  const previous = ['document', 'window', 'screen'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  Object.defineProperties(globalThis, {
    document: { configurable: true, value: document },
    window: { configurable: true, value: { matchMedia: () => ({ matches: standalone }) } },
    screen: { configurable: true, value: { orientation: { lock: async () => { throw new Error('unsupported'); } } } },
  });
  try {
    assert.equal(await enterFullscreen(true), false);
    assert.equal(await enterFullscreen(true), false);
    assert.equal(requests, 1);
    reject = false;
    assert.equal(await enterFullscreen(), true);
    assert.equal(requests, 2);
    assert.ok(document.fullscreenElement, 'orientation failure retains fullscreen');
    assert.equal(await enterFullscreen(true), true);
    document.fullscreenElement = null;
    assert.equal(await enterFullscreen(true), false, 'leaving fullscreen is respected');
    assert.equal(requests, 2);
    standalone = true;
    assert.equal(await enterFullscreen(), true);
    assert.equal(requests, 2, 'installed standalone app needs no request');
  } finally {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
