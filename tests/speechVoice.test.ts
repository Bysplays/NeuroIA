import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectSpainVoice } from '../src/services/speechVoice.ts';

const voice = (name: string, lang = 'es-ES', isDefault = false) => ({ name, lang, default: isDefault }) as SpeechSynthesisVoice;

test('recognizes accented Mónica and never prefers Mexican Paulina by list order', () => {
  const monica = voice('Mónica');
  assert.equal(selectSpainVoice([voice('Paulina', 'es-MX'), voice('Eddy'), monica]), monica);
});
test('Spain accent takes precedence over a natural Latin American voice', () => {
  const monica = voice('Mónica', 'es_ES');
  assert.equal(selectSpainVoice([voice('Google español', 'es-MX'), voice('Paulina Natural', 'es-MX'), monica]), monica);
});
test('prefers enhanced Spain voices when they become available', () => {
  const natural = voice('Microsoft Elvira Online (Natural)');
  assert.equal(selectSpainVoice([voice('Mónica'), natural]), natural);
});
test('leaves es-ES language negotiation to the browser when Spain voices are absent', () => {
  assert.equal(selectSpainVoice([]), null);
  assert.equal(selectSpainVoice([voice('Paulina', 'es-MX'), voice('English', 'en-US')]), null);
});
test('does not mutate the browser voice list', () => {
  const list = [voice('Rocko'), voice('Mónica')];
  const snapshot = [...list];
  selectSpainVoice(list);
  assert.deepEqual(list, snapshot);
});
