import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activityMessages, EXAMPLE_INPUT, EXAMPLE_RESPONSE, responseTemplate } from './prompts.mjs';
import { buildActivityInsights, basicNarrative, validAiNarrative } from '../../src/services/activityInsights.ts';
const filters = { from: '', to: '', domain: '', exercise: '', timeZone: 'Europe/Madrid' };

test('worked example satisfies the application validator and references only its own facts/options', () => {
  assert.equal(validAiNarrative(EXAMPLE_RESPONSE, EXAMPLE_INPUT), true);
  assert.deepEqual(EXAMPLE_RESPONSE.recommendations.map(r => r.suggestionId), EXAMPLE_INPUT.suggestions.map(s => s.id));
});
test('runtime template uses actual candidate IDs and isolates teaching data from current activity', () => {
  const insights = buildActivityInsights([], undefined, filters);
  assert.deepEqual(responseTemplate(insights).recommendations, []);
  const messages = activityMessages(insights, 'report');
  const actual = JSON.parse(messages[1].content.split('\n')[1]);
  assert.equal(actual.count, 0);
  assert.deepEqual(actual.suggestions, []);
  assert.ok(!messages[1].content.includes('challenge:visual-scanning'));
  assert.match(messages[0].content, /cuatro objetos/);
  assert.match(activityMessages(insights, 'recommendations')[0].content, /tres objetos/);
  const candidates = { ...insights, suggestions: [{ id: 'continue:memory-pairs' }] };
  assert.deepEqual(responseTemplate(candidates).recommendations.map(r => r.suggestionId), ['continue:memory-pairs']);
});
test('section names and unfilled placeholders from rejected live output remain invalid', () => {
  const valid = EXAMPLE_RESPONSE;
  for (const evidence of [['limitations'], ['suggestions'], ['game:language-naming', 'limitations']]) {
    assert.equal(validAiNarrative({ ...valid, observations: [{ text: 'Una observación', evidence }] }, EXAMPLE_INPUT), false);
  }
  const insights = buildActivityInsights([], undefined, filters);
  assert.equal(validAiNarrative({ ...basicNarrative(insights), summary: 'RELLENAR: síntesis' }, insights), false);
});
