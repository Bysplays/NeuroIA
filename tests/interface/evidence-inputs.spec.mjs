import {test,expect} from '@playwright/test';
const games=[['visual-scanning','.scanning-cell'],['language-naming','.naming-options-grid button'],['word-completion','.letter-options-grid button'],['memory-path','.memory-tile'],['memory-pairs','.memory-card-tile'],['categorization','.category-bins-grid button'],['motor-target','.motor-target-circle'],['motor-tracking','.tracking-target']];
test.use({hasTouch:true,viewport:{width:820,height:1180}});
for(const mode of ['keyboard','touch'])for(const [game,selector] of games)test(`${game} records ${mode} input and excludes help time`,async({page})=>{
 test.setTimeout(60000);
 await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
 await page.clock.install({time:new Date('2026-10-04T12:00:00Z')});
 await page.goto(`/tests/interface/index.html?game=${game}&evidence`);
 await page.clock.pauseAt(new Date('2026-10-04T12:00:10Z'));
 const activate=async locator=>{if(mode==='touch')await locator.tap();else{await locator.focus();await page.keyboard.press('Enter');}};
 await activate(page.getByRole('button',{name:'Empezar a jugar'}));
 if(game==='memory-path'||game==='memory-pairs'){
  await activate(page.getByRole('button',{name:'Comenzar',exact:true}));
  await page.clock.runFor(4400);
  const hide=page.getByRole('button',{name:/Ocultar/});if(await hide.count())await activate(hide);
 }
 await page.clock.runFor(100);
 await activate(page.getByRole('button',{name:'Mostrar instrucciones'}));
 await expect(page.getByRole('dialog')).toBeVisible();
 await page.clock.runFor(5000);
 await activate(page.getByRole('button',{name:'Continuar jugando'}));
 await page.clock.runFor(300);
 const target=page.locator(selector).first();
 if(game==='motor-tracking'){
  if(mode==='keyboard'){
   await target.focus();await page.keyboard.down('Space');await page.clock.runFor(200);await page.keyboard.up('Space');
  }else{
   const cdp=await page.context().newCDPSession(page);const box=await target.boundingBox();
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:0}]});
   await page.clock.runFor(100);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
 }else{
  await activate(target);
  if(game==='memory-pairs'){await page.clock.runFor(250);await activate(page.locator(selector).nth(1));}
  if(['language-naming','word-completion','categorization'].includes(game)){
   const label=await target.getAttribute('aria-label');
   const recorded=await page.evaluate(()=>window.evidenceChunks.flatMap(chunk=>JSON.parse(chunk.events)).filter(event=>event.kind==='response'));
   expect(recorded).toHaveLength(1);expect(recorded[0].correct).toBe(label.includes('Respuesta correcta'));
   await expect(target).toBeDisabled();
  }
 }
 await activate(page.getByRole('button',{name:'Volver',exact:true}));
 const summary=await page.evaluate(async()=>{const {summarizeEvidence}=await import('/src/services/evidenceSummary.ts');return summarizeEvidence(window.evidenceChunks);});
 expect(summary.status).toBe('abandoned');expect(summary.issues).toEqual([]);
 expect(summary.events.at(-1)).toMatchObject({kind:'abandon',reason:'back'});
 if(game==='motor-tracking'){
  expect(summary.metrics.responseCount).toBe(0);expect(summary.metrics.meanResponseMs).toBeNull();
  expect(summary.metrics.trackingMs).toBeLessThan(1000);expect(summary.metrics.contactMs).toBeGreaterThan(0);
 }else{
  expect(summary.metrics.responseCount).toBe(1);expect(summary.metrics.hints).toBe(1);
  expect(summary.metrics.meanResponseMs).toBeGreaterThanOrEqual(200);expect(summary.metrics.meanResponseMs).toBeLessThan(1000);
  expect(summary.metrics.selections).toBe(game==='memory-pairs'?1:0);
 }
});

for(const mode of ['keyboard','touch'])for(const [game,selector] of games.filter(([id])=>['language-naming','word-completion','categorization'].includes(id)))test(`${game} ${mode} completion links every round to one result`,async({page})=>{
 await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
 await page.goto(`/tests/interface/index.html?game=${game}&evidence`);
 const activate=async locator=>{if(mode==='touch')await locator.tap();else{await locator.focus();await page.keyboard.press('Enter');}};
 await activate(page.getByRole('button',{name:'Empezar a jugar'}));
 const rounds=Number(await page.getByRole('progressbar').getAttribute('aria-valuemax'));
 const correctness=[];
 for(let i=0;i<rounds;i++){
  const target=page.locator(selector).first();await activate(target);
  correctness.push((await target.getAttribute('aria-label')).includes('Respuesta correcta'));
  await activate(page.getByRole('button',{name:'Continuar',exact:true}));
 }
 await expect(page.getByRole('heading',{name:'Actividad completada',exact:true})).toBeVisible();
 const {summary,results}=await page.evaluate(async()=>{const {summarizeEvidence}=await import('/src/services/evidenceSummary.ts');return {summary:summarizeEvidence(window.evidenceChunks),results:JSON.parse(document.querySelector('[data-testid="results"]').textContent)};});
 expect(summary.status).toBe('completed');expect(summary.issues).toEqual([]);expect(results).toHaveLength(1);
 expect(summary.metrics.responseCount).toBe(rounds);expect(summary.metrics.errors).toBe(correctness.filter(value=>!value).length);
 expect(summary.events.filter(event=>event.kind==='response').map(event=>event.correct)).toEqual(correctness);
 expect(new Set(summary.events.filter(event=>event.kind==='stimulus').map(event=>event.stimulus)).size).toBe(rounds);
 expect(summary.resultId).toBe(results[0].id);expect(results[0].evidenceSessionId).toBe(summary.sessionId);
 expect(results[0].correctAnswers).toBe(rounds-summary.metrics.errors);expect(results[0].totalQuestions).toBe(rounds);
 await activate(page.getByRole('button',{name:'Repetir',exact:true}));await activate(page.locator(selector).first());await activate(page.getByRole('button',{name:'Volver',exact:true}));
 const groups=await page.evaluate(()=>[...new Set(window.evidenceChunks.map(chunk=>chunk.sessionId))]);expect(groups).toHaveLength(2);
 expect(JSON.parse(await page.getByTestId('results').textContent())).toHaveLength(1);
});
