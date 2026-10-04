import {test,expect} from '@playwright/test';
test.use({hasTouch:true});
const games=[['language-naming','.naming-options-grid button','.naming-target-block'],['word-completion','.letter-options-grid button','.completion-image-container'],['categorization','.category-bins-grid button','.categorization-item']];
async function setup(page,game,suffix=''){
 await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
 await page.addInitScript(()=>{Math.random=()=>0;});
 await page.goto(`/tests/interface/index.html?game=${game}&level=5&evidence&adaptive${suffix}`);
}
for(const width of [390,820,1280])for(const [game,selector] of games)test(`live rounds ${game} at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:width===820?1180:900});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await setup(page,game);
 const activate=async button=>{if(width===1280){await button.focus();await page.keyboard.press('Enter');}else await button.tap();};
 await activate(page.getByRole('button',{name:'Empezar a jugar'}));
 const rounds=Number(await page.getByRole('progressbar').getAttribute('aria-valuemax'));expect(rounds).toBe(5);
 for(let i=0;i<rounds;i++){
  const options=page.locator(selector),target=game==='word-completion'?options.first():options.last();
  const before=await page.locator('.game-object').first().innerHTML();
  const level=await page.locator('.viewport-navigation-row .soft-label').textContent();
  await activate(target);
  expect(await page.locator('.game-object').first().innerHTML()).toBe(before);
  expect(await page.locator('.viewport-navigation-row .soft-label').textContent()).toBe(level);
  await activate(page.getByRole('button',{name:'Continuar',exact:true}));
  if(i<rounds-1){
   if(game==='word-completion'){await expect(page.locator('.word-letter-slots')).toHaveCount(1);await expect(page.locator('.letter-options-grid')).toHaveCount(1);}
   await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax','5');
   await expect(page.getByRole('button',{name:'Continuar',exact:true})).toBeDisabled();
   const actual=await page.evaluate(()=>window.evidenceChunks.flatMap(c=>JSON.parse(c.events)).filter(e=>e.kind==='round-start').at(-1).level);
   await expect(page.locator('.viewport-navigation-row .soft-label')).toHaveText(`Nivel ${actual}`);
   if(i===2)await page.screenshot({path:`/tmp/neuroia-live-${game}-${width}.png`});
  }
 }
 await expect(page.getByRole('heading',{name:'Actividad completada',exact:true})).toBeVisible();
 const {result,trace,exported}=await page.evaluate(async()=>{
  const {summarizeEvidence}=await import('/src/services/evidenceSummary.ts');const {buildEvidenceExport}=await import('/src/services/evidenceExport.ts');
  const results=JSON.parse(document.querySelector('[data-testid="results"]').textContent);
  return {result:results[0],trace:summarizeEvidence(window.evidenceChunks),exported:buildEvidenceExport(window.evidenceChunks,results,true)};
 });
 expect(trace.status).toBe('completed');expect(trace.issues).toEqual([]);expect(trace.rounds).toHaveLength(5);
 expect(trace.metrics.responseCount).toBe(5);expect(result.totalQuestions).toBe(5);expect(result.correctAnswers).toBe(5-trace.metrics.errors);
 const audit=JSON.parse(result.roundAdaptation);expect(audit.levels).toEqual(trace.rounds.map(r=>r.level));
 expect(new Set(audit.levels).size).toBeGreaterThan(1);expect(result.level).toBeUndefined();expect(result.adaptation).toBeUndefined();
 expect(exported.attempts[0].roundResultVerified).toBe(true);expect(exported.counts.registeredNormalCompleted).toBe(1);
 await expect(page.locator('.result-message')).toContainText('Niveles');
 await page.screenshot({path:`/tmp/neuroia-live-result-${game}-${width}.png`});
 await activate(page.getByRole('button',{name:'Repetir',exact:true}));
 await expect(page.locator('.viewport-navigation-row .soft-label')).toHaveText('Nivel 5');
 for(let i=0;i<4;i++){await activate(page.locator(selector).first());await activate(page.getByRole('button',{name:'Continuar',exact:true}));}
 await expect(page.locator('.viewport-navigation-row .soft-label')).toHaveText('Nivel 5');
 await activate(page.getByRole('button',{name:'Volver',exact:true}));
 const repeated=await page.evaluate(async()=>{const {summarizeEvidence}=await import('/src/services/evidenceSummary.ts');const id=window.evidenceChunks.at(-1).sessionId;return summarizeEvidence(window.evidenceChunks.filter(c=>c.sessionId===id));});
 expect(repeated.status).toBe('abandoned');expect(repeated.rounds.every(r=>!r.decision||r.decision.reason==='manual-level')).toBe(true);
 expect(errors).toEqual([]);
});

for(const [game,selector] of games)for(const protectedMode of ['assigned','manual'])test(`${game} preserves ${protectedMode} level during live rounds`,async({page})=>{
 await page.setViewportSize({width:820,height:1180});await setup(page,game,protectedMode==='assigned'?'&assigned':'');
 if(protectedMode==='manual'){
  await page.getByRole('button',{name:'Subir nivel'}).click();await page.getByRole('button',{name:'Bajar nivel'}).click();
 }
 await page.getByRole('button',{name:'Empezar a jugar'}).click();
 for(let i=0;i<5;i++){await page.locator(selector).first().click();await page.getByRole('button',{name:'Continuar',exact:true}).click();}
 await expect(page.getByRole('heading',{name:'Actividad completada',exact:true})).toBeVisible();
 const results=JSON.parse(await page.getByTestId('results').textContent()),audit=JSON.parse(results[0].roundAdaptation);
 expect(audit.levels).toEqual([5,5,5,5,5]);expect(results[0].level).toBe(5);
 expect(audit.finalDecision.reason).toBe(protectedMode==='assigned'?'professional':'manual-level');
 expect(JSON.parse(await page.getByTestId('levels').textContent())[game].level).toBe(5);
});
