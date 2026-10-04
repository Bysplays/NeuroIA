import {test,expect} from '@playwright/test';
test.use({hasTouch:true});
async function launch(page,game,width,suffix='',random=0.5){
 await page.setViewportSize({width,height:width===820?1180:900});
 await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
 await page.addInitScript(value=>{Math.random=()=>value;},random);
 await page.goto(`/tests/interface/index.html?game=${game}&level=5&evidence&adaptive${suffix}`);
 await page.getByRole('button',{name:'Empezar a jugar'}).click();
}
async function evidence(page){return page.evaluate(async()=>{
 const {buildEvidenceExport}=await import('/src/services/evidenceExport.ts');
 const results=JSON.parse(document.querySelector('[data-testid="results"]').textContent);
 return {results,exported:buildEvidenceExport(window.evidenceChunks,results,true)};
});}
async function inside(target,arena){
 const a=await arena.boundingBox(),t=await target.boundingBox();
 expect(t.x).toBeGreaterThanOrEqual(a.x-1);expect(t.y).toBeGreaterThanOrEqual(a.y-1);
 expect(t.x+t.width).toBeLessThanOrEqual(a.x+a.width+1);expect(t.y+t.height).toBeLessThanOrEqual(a.y+a.height+1);
}
for(const width of [390,820,1280])for(const game of ['visual-scanning','motor-target'])test(`${game} adopts live board parameters at ${width}px`,async({page})=>{
 test.setTimeout(60000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await launch(page,game,width);
 const activate=async target=>{if(width===1280){await target.focus();await page.keyboard.press('Enter');}else await target.tap();};
 const count=Number(await page.getByRole('progressbar').getAttribute('aria-valuemax'));
 expect(count).toBe(game==='motor-target'?9:5);
 for(let round=0;round<count;round++){
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax',String(count));
  if(game==='motor-target'){
   const target=page.locator('.motor-target-circle');await inside(target,page.locator('.motor-touch-arena'));
   const level=Number((await page.locator('.viewport-navigation-row .soft-label').textContent()).match(/\d+/)[0]);
   expect(await target.evaluate(e=>parseFloat(e.style.width))).toBe(160-(level-1)*8);
   if(round===3)await page.screenshot({path:`/tmp/neuroia-live-target-${width}.png`});
   await activate(target);
  }else{
   await expect(page.locator('.scanning-grid')).toHaveCount(1);
   const cells=page.locator('.scanning-cell');
   const matches=await cells.evaluateAll(nodes=>{const image=nodes[0].querySelector('.game-object').outerHTML;return nodes.flatMap((node,index)=>node.querySelector('.game-object').outerHTML===image?[index]:[]);});
   expect(matches).toHaveLength(3);
   const level=await page.locator('.viewport-navigation-row .soft-label').textContent();
   const columns=await page.locator('.scanning-grid').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length);
   if(round===0){
    await activate(cells.nth(1)); // Seeded distractor: a failed answer must not advance the board.
    await expect(cells.nth(1)).toHaveAttribute('aria-label','Este objeto no es el que buscas');
    await expect(page.locator('.viewport-navigation-row .soft-label')).toHaveText(level);
   }
   for(const index of matches){await inside(cells.nth(index),page.locator('.scanning-grid'));await activate(cells.nth(index));}
   if(round<count-1){
    await expect(page.locator('.viewport-navigation-row .soft-label')).toHaveText(level);
    expect(await page.locator('.scanning-grid').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length)).toBe(columns);
    await activate(page.getByRole('button',{name:'Continuar',exact:true}));
    if(round===1)await page.screenshot({path:`/tmp/neuroia-live-search-${width}.png`});
   }
  }
 }
 await expect(page.getByRole('heading',{name:'Actividad completada',exact:true})).toBeVisible();
 const {results,exported}=await evidence(page);expect(results).toHaveLength(1);
 const attempt=exported.attempts[0],audit=JSON.parse(results[0].roundAdaptation);
 expect(attempt.status).toBe('completed');expect(attempt.issues).toEqual([]);expect(attempt.roundResultVerified).toBe(true);
 expect(JSON.parse(await page.getByTestId('levels').textContent())[game].level).toBe(audit.finalDecision.nextLevel);
 expect(attempt.rounds).toHaveLength(count);expect(new Set(audit.levels).size).toBeGreaterThan(1);expect(results[0].level).toBeUndefined();
 expect(results[0].totalQuestions).toBe(attempt.measurements.responseCount);
 expect(results[0].correctAnswers).toBe(attempt.measurements.responseCount-attempt.measurements.errors);
 await expect(page.locator('.result-message')).toContainText('Niveles');
 await page.screenshot({path:`/tmp/neuroia-live-${game}-result-${width}.png`});
 await activate(page.getByRole('button',{name:'Repetir',exact:true}));
 await expect(page.locator('.viewport-navigation-row .soft-label')).toHaveText('Nivel 5');
 await activate(page.getByRole('button',{name:'Volver',exact:true}));expect(errors).toEqual([]);
});

for(const width of [390,820,1280])test(`motor target grows only after closing the failed attempt at ${width}px`,async({page})=>{
 await launch(page,'motor-target',width,'',width===390?0:0.999);
 const arena=page.locator('.motor-touch-arena'),target=page.locator('.motor-target-circle');
 for(let i=0;i<4;i++){
  const bounds=await arena.boundingBox();
  await arena.click({position:{x:10,y:bounds.height/2}});
  await expect(page.locator('.viewport-navigation-row .soft-label')).toHaveText('Nivel 5');
  expect(await target.evaluate(e=>e.style.width)).toBe('128px');
 }
 await target.tap();
 await expect(page.locator('.viewport-navigation-row .soft-label')).toHaveText('Nivel 4');
 expect(await target.evaluate(e=>e.style.width)).toBe('136px');await inside(target,arena);
 await page.getByRole('button',{name:'Volver',exact:true}).click();
 const {exported}=await evidence(page);expect(exported.attempts[0].status).toBe('abandoned');
 expect(exported.attempts[0].rounds[0].decision.action).toBe(-1);expect(exported.attempts[0].measurements.errors).toBe(4);
});

for(const game of ['visual-scanning','motor-target'])test(`${game} preserves an assigned level at live boundaries`,async({page})=>{
 await launch(page,game,820,'&assigned');
 for(let round=0;round<4;round++){
  if(game==='motor-target')await page.locator('.motor-target-circle').tap();
  else{
   const cells=page.locator('.scanning-cell'),matches=await cells.evaluateAll(nodes=>{const image=nodes[0].querySelector('.game-object').outerHTML;return nodes.flatMap((node,index)=>node.querySelector('.game-object').outerHTML===image?[index]:[]);});
   for(const index of matches)await cells.nth(index).tap();
   await page.getByRole('button',{name:'Continuar',exact:true}).tap();
  }
  await expect(page.locator('.viewport-navigation-row .soft-label')).toHaveText('Nivel 5');
 }
 await page.getByRole('button',{name:'Volver',exact:true}).click();
 const {exported}=await evidence(page);expect(exported.attempts[0].status).toBe('abandoned');
 expect(exported.attempts[0].rounds.every(round=>round.level===5&&(!round.decision||round.decision.reason==='professional'))).toBe(true);
});
