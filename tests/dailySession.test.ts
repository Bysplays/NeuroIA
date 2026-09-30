import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DAILY_SESSIONS, dailySession } from '../src/services/dailySession.ts';
import { ALL_EXERCISES } from '../src/services/exerciseCatalog.ts';

test('all 56 distinct triples have a unique explicit title and three active games', () => {
  assert.equal(DAILY_SESSIONS.length, 56);
  assert.equal(new Set(DAILY_SESSIONS.map(session => session.title)).size, 56);
  assert.equal(new Set(DAILY_SESSIONS.map(session => [...session.games].sort().join(','))).size, 56);
  for (const session of DAILY_SESSIONS) {
    assert.equal(new Set(session.games).size, 3);
    assert.ok(session.games.every(id => ALL_EXERCISES.some(game => game.id === id)));
  }
});

test('same account and local day retain games, title and order across remounts', () => {
  const early=dailySession('player-a',new Date(2026,8,30,0,1));
  const late=dailySession('player-a',new Date(2026,8,30,23,59));
  assert.deepEqual(early,late);
  assert.notDeepEqual(early,dailySession('player-a',new Date(2026,9,1)));
  assert.notDeepEqual(early,dailySession('player-b',new Date(2026,8,30)));
});

test('a full cycle offers every combination without repeating', () => {
  const names = new Set(Array.from({length:56},(_,day)=>dailySession('player-a',new Date(2026,0,1+day)).title));
  assert.equal(names.size,56);
});
