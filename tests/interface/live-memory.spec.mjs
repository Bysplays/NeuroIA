import {test,expect} from '@playwright/test';
test.use({hasTouch:true});
async function launch(page,game,width=820,suffix=''){
 await page.setViewportSize({width,height:width===820?1180:900});
 await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
 await page.clock.install({time:new Date('2026-10-04T12:00:00Z')});
 await page.goto(`/tests/interface/index.html?game=${game}&level=6&evidence&adaptive${suffix}`);
 await page.clock.pauseAt(new Date('2026-10-04T12:00:10Z'));
 await page.getByRole('button',{name:'Empezar a jugar'}).click();
}
async function activate(page,locator,width){if(width===1280){await locator.focus();await page.keyboard.press('Enter');}else await locator.tap();}
async function showSequence(page,repeat=false){
 await page.evaluate(()=>{
  window.shown=[];window.sequenceObserver?.disconnect();
  window.sequenceObserver=new MutationObserver(records=>{for(const record of records)if(record.target.matches('.memory-tile.tile-active'))window.shown.push(record.target.getAttribute('aria-label'));});
  window.sequenceObserver.observe(document.querySelector('.memory-tiles-grid'),{subtree:true,attributes:true,attributeFilter:['class']});
 });
 await page.getByRole('button',{name:repeat?'Repetir':'Comenzar',exact:true}).click();await page.clock.runFor(6500);
 await expect(page.getByRole('button',{name:'Repetir',exact:true})).toBeEnabled();
 return page.evaluate(()=>{window.sequenceObserver.disconnect();return window.shown;});
}
async function revealPairs(page,repeat=false){
 await page.getByRole('button',{name:repeat?'Repetir':'Comenzar',exact:true}).click();
 await page.clock.runFor(1000);
 const labels=await page.locator('.memory-card-tile').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('aria-label')));
 const pairs=[...new Set(labels)].map(label=>labels.flatMap((value,index)=>value===label?[index]:[]));
 expect(pairs.every(pair=>pair.length===2)).toBe(true);
 await page.getByRole('button',{name:/Ocultar/}).click();return {labels,pairs};
}
async function matchPair(page,pair,width){
 await page.clock.runFor(100);await activate(page,page.locator('.memory-card-tile').nth(pair[0]),width);
 await page.clock.runFor(200);await activate(page,page.locator('.memory-card-tile').nth(pair[1]),width);
}
async function saved(page){return page.evaluate(async()=>{
 const {buildEvidenceExport}=await import('/src/services/evidenceExport.ts');
 const results=JSON.parse(document.querySelector('[data-testid="results"]').textContent);
 return {results,exported:buildEvidenceExport(window.evidenceChunks,results,true),events:window.evidenceChunks.flatMap(c=>JSON.parse(c.events))};
});}
for(const width of [390,820,1280])for(const game of ['memory-path','memory-pairs'])test(`${game} completes live memory rounds at ${width}px`,async({page})=>{
 test.setTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await launch(page,game,width);let responseCount=0,completedPairs=0;const sizes=[];
 for(let round=0;round<3;round++){
  const level=await page.locator('.viewport-navigation-row .soft-label').textContent();
  if(game==='memory-path'){
   const sequence=await showSequence(page);sizes.push(sequence.length);expect(sequence.length).toBeGreaterThanOrEqual(4);
   for(const label of sequence){await page.clock.runFor(250);await activate(page,page.getByRole('button',{name:label,exact:true}),width);await expect(page.locator('.viewport-navigation-row .soft-label')).toHaveText(level);responseCount++;}
  }else{
   await expect(page.locator('.pairs-grid')).toHaveCount(1);
   const {pairs}=await revealPairs(page);sizes.push(pairs.length);completedPairs+=pairs.length;
   for(const pair of pairs){await matchPair(page,pair,width);await expect(page.locator('.viewport-navigation-row .soft-label')).toHaveText(level);responseCount++;}
  }
  if(round===1)await page.screenshot({path:`/tmp/neuroia-live-${game}-${width}.png`});
  await activate(page,page.getByRole('button',{name:'Continuar',exact:true}),width);
 }
 await expect(page.getByRole('heading',{name:'Actividad completada',exact:true})).toBeVisible();
 const {results,exported,events}=await saved(page),attempt=exported.attempts[0];
 expect(results).toHaveLength(1);expect(attempt.status).toBe('completed');expect(attempt.issues).toEqual([]);expect(attempt.roundResultVerified).toBe(true);
 expect(attempt.rounds).toHaveLength(3);expect(new Set(attempt.rounds.map(r=>r.level)).size).toBeGreaterThan(1);expect(new Set(sizes).size).toBeGreaterThan(1);
 expect(attempt.measurements.responseCount).toBe(responseCount);expect(attempt.measurements.errors).toBe(0);expect(results[0].level).toBeUndefined();
 expect(events.filter(e=>e.kind==='response').every(e=>e.latencyMs<2500)).toBe(true);
 expect(results[0].correctAnswers).toBe(game==='memory-path'?3:completedPairs);expect(results[0].totalQuestions).toBe(game==='memory-path'?3:responseCount);expect(results[0].accuracy).toBe(100);
 if(game==='memory-pairs'){expect(completedPairs).toBe(14);expect(attempt.measurements.selections).toBe(responseCount);}
 const audit=JSON.parse(results[0].roundAdaptation);expect(JSON.parse(await page.getByTestId('levels').textContent())[game].level).toBe(audit.finalDecision.nextLevel);
 await expect(page.locator('.result-message')).toContainText('Niveles');await page.screenshot({path:`/tmp/neuroia-live-${game}-result-${width}.png`});
 await activate(page,page.getByRole('button',{name:'Repetir',exact:true}),width);await expect(page.locator('.viewport-navigation-row .soft-label')).toHaveText('Nivel 6');
 await activate(page,page.getByRole('button',{name:'Volver',exact:true}),width);expect(errors).toEqual([]);
});

test('sequence failure after an adapted round preserves played counts and existing failure scoring',async({page})=>{
 test.setTimeout(90000);await launch(page,'memory-path');
 const first=await showSequence(page);for(const label of first){await page.clock.runFor(250);await page.getByRole('button',{name:label,exact:true}).click();}
 await page.getByRole('button',{name:'Continuar',exact:true}).click();
 const second=await showSequence(page),wrong=await page.locator('.memory-tile').evaluateAll((nodes,expected)=>nodes.map(node=>node.getAttribute('aria-label')).find(label=>label!==expected),second[0]);
 await page.getByRole('button',{name:wrong,exact:true}).click();await expect(page.locator('.sequence-incorrect')).toBeVisible();await expect(page.locator('.sequence-correct')).toBeVisible();
 await page.getByRole('button',{name:'Continuar',exact:true}).click();
 const {results,exported}=await saved(page);expect(results[0].correctAnswers).toBe(1);expect(results[0].totalQuestions).toBe(2);expect(results[0].accuracy).toBe(0);
 expect(exported.attempts[0].rounds).toHaveLength(2);expect(exported.attempts[0].measurements.errors).toBe(1);expect(exported.attempts[0].roundResultVerified).toBe(true);
});

test('pairs replay preserves locations and counts additional attempts without inflating completed pairs',async({page})=>{
 test.setTimeout(60000);await launch(page,'memory-pairs',820,'&assigned');
 const original=await revealPairs(page);await matchPair(page,original.pairs[0],820);
 const repeated=await revealPairs(page,true);expect(repeated.labels).toEqual(original.labels);
 for(const pair of repeated.pairs)await matchPair(page,pair,820);
 await page.getByRole('button',{name:'Continuar',exact:true}).click();
 const {results,exported}=await saved(page),result=results[0],attempt=exported.attempts[0];
 expect(result.correctAnswers).toBe(4);expect(result.totalQuestions).toBe(5);expect(result.accuracy).toBe(80);expect(result.hintsUsed).toBe(1);
 expect(result.level).toBe(6);expect(attempt.rounds).toHaveLength(1);expect(attempt.rounds[0].decision.reason).toBe('professional');expect(attempt.measurements.responseCount).toBe(5);
 expect(attempt.measurements.hints).toBe(1);expect(attempt.roundResultVerified).toBe(true);
});

test('sequence replay preserves its demonstrated order and assigned level across boundaries',async({page})=>{
 test.setTimeout(120000);await launch(page,'memory-path',820,'&assigned');
 const original=await showSequence(page);
 await page.clock.runFor(250);await page.getByRole('button',{name:original[0],exact:true}).click();
 const repeated=await showSequence(page,true);expect(repeated).toEqual(original);
 for(const label of repeated){await page.clock.runFor(250);await page.getByRole('button',{name:label,exact:true}).click();}
 await page.getByRole('button',{name:'Continuar',exact:true}).click();
 await expect(page.locator('.viewport-navigation-row .soft-label')).toHaveText('Nivel 6');
 await page.getByRole('button',{name:'Volver',exact:true}).click();
 const {exported}=await saved(page),attempt=exported.attempts[0];expect(attempt.status).toBe('abandoned');expect(attempt.rounds[0].decision.reason).toBe('professional');
 expect(attempt.measurements.hints).toBe(1);expect(attempt.measurements.responseCount).toBe(original.length+1);
});
