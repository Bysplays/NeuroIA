import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGameClock } from '../src/services/gameClock.ts';

test('instruction pauses do not advance timed steps or elapsed time', () => {
  const clock = createGameClock();
  let steps = 0;
  clock.setTimeout(() => steps++, 1000);
  clock.advance(400);
  assert.equal(steps, 0);
  assert.equal(clock.performanceNow(), 400);
  clock.advance(599);
  assert.equal(steps, 0);
  clock.advance(1);
  assert.equal(steps, 1);
});
test('frames reschedule for the next advance and pending work can be cancelled', () => {
  const clock = createGameClock();
  const times: number[] = [];
  const frame = (time: number) => { times.push(time); clock.requestAnimationFrame(frame); };
  clock.requestAnimationFrame(frame);
  const cancelled = clock.setTimeout(() => assert.fail('cancelled task ran'), 5);
  clock.clearTimeout(cancelled);
  clock.advance(16);
  clock.advance(16);
  assert.deepEqual(times, [16, 32]);
  clock.reset();
  clock.advance(16);
  assert.deepEqual(times, [16, 32]);
});
test('interval can cancel itself without firing again', () => {
  const clock = createGameClock();
  let count = 0;
  const id = clock.setInterval(() => { count++; clock.clearInterval(id); }, 100);
  clock.advance(100);
  clock.advance(100);
  assert.equal(count, 1);
});
