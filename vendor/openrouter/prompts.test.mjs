import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activityMessages, observationSources, EXAMPLE_INPUT, EXAMPLE_RESPONSE, responseTemplate } from './prompts.mjs';
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

test('report prompt narrows broad absence claims instead of accepting excessive evidence', () => {
  const insights = buildActivityInsights([], undefined, filters);
  assert.match(activityMessages(insights, 'report')[0].content, /evidence nunca puede contener más de tres IDs/);
  const evidence = insights.facts.filter(f => f.id.startsWith('game:')).map(f => f.id);
  assert.equal(validAiNarrative({...basicNarrative(insights), observations:[{text:'El resto de juegos no aparece en la selección.',evidence}]},insights),false);
});

test('three existing references cannot authorize a collective absence claim',()=>{
 const insights=buildActivityInsights([],undefined,filters);
 for(const text of ['Los otros juegos no aparecen en esta selección; eso no indica que nunca se hayan jugado.','El resto de los juegos no aparecen en esta selección; eso no indica que nunca los hayas jugado.','Todos los juegos tienen actividad.','Ningún juego aparece en la selección.']){
  assert.equal(validAiNarrative({...basicNarrative(insights),observations:[{text,evidence:['game:language-naming','game:word-completion','game:memory-path']}]},insights),false);
 }
});
test('named games require their own evidence and repeated references are invalid',()=>{
 const insights=buildActivityInsights([],undefined,filters),narrative=basicNarrative(insights);
 for(const evidence of [['activity'],['game:word-completion'],['game:language-naming','game:language-naming']])assert.equal(validAiNarrative({...narrative,observations:[{text:'«Ponle nombre» no aparece en esta selección.',evidence}]},insights),false);
 assert.equal(validAiNarrative({...narrative,observations:[{text:'«Ponle nombre» no aparece en esta selección.',evidence:['game:language-naming']}]},insights),true);
 // An optional variety recommendation is not a factual assertion about all games.
 assert.equal(validAiNarrative({...narrative,summary:'Puedes probar otros juegos si te apetece.'},insights),true);
});

test('valid measured speed evidence supports the named game without unrelated citations',()=>{
 const insights={...EXAMPLE_INPUT,facts:[...EXAMPLE_INPUT.facts,{id:'speed:visual-scanning',text:'Busca la figura: 9 s/pregunta antes y 6 s/pregunta después.'}]};
 const narrative={...EXAMPLE_RESPONSE,observations:[{text:'«Busca la figura» pasó de 9 a 6 segundos por pregunta.',evidence:['speed:visual-scanning']}]};
 assert.equal(validAiNarrative(narrative,insights),true);
 assert.equal(validAiNarrative({...narrative,observations:[{...narrative.observations[0],text:'«Ponle nombre» pasó de 9 a 6 segundos por pregunta.'}]},insights),false);
});


test('observation slots bind one current fact each and prioritize comparable measurements over absent games',()=>{
 const facts=[{id:'activity',text:'Actividad total'}, {id:'game:absent',text:'Juego ausente: 0 partidas'},
  {id:'game:played',text:'Juego practicado: 6 partidas'}, {id:'recent:played',text:'Precisión comparable'},
  {id:'speed:played',text:'Velocidad comparable'}];
 const insights={facts,games:[{id:'absent',count:0},{id:'played',count:6}],suggestions:[]};
 const original=structuredClone(insights);
 assert.deepEqual(observationSources(insights).map(f=>f.id),['speed:played','recent:played','game:played','activity']);
 assert.equal(observationSources(insights,'recommendations').length,3);
 for(const mode of ['report','recommendations']){
  const slots=responseTemplate(insights,mode).observations;
  assert.deepEqual(slots.map(slot=>slot.evidence),observationSources(insights,mode).map(f=>[f.id]));
  for(const slot of slots)assert.ok(slot.text.includes(facts.find(f=>f.id===slot.evidence[0]).text));
  assert.match(activityMessages(insights,mode)[1].content,/FUENTES_PARA_OBSERVACIONES/);
 }
 assert.deepEqual(observationSources({facts:[],games:[],suggestions:[]}),[]);
 assert.deepEqual(insights,original);
});
