import {test,expect} from '@playwright/test';
async function launch(page,width=820,suffix=''){
 await page.setViewportSize({width,height:width===820?1180:900});
 await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
 await page.clock.install({time:new Date('2026-10-04T12:00:00Z')});
 await page.clock.pauseAt(new Date('2026-10-04T12:00:00Z'));
 await page.goto(`/tests/interface/index.html?game=motor-tracking&level=5&evidence&adaptive${suffix}`);
 await page.getByRole('button',{name:'Empezar a jugar'}).click();
}
async function saved(page){return page.evaluate(async()=>{
 const {buildEvidenceExport}=await import('/src/services/evidenceExport.ts');
 const results=JSON.parse(document.querySelector('[data-testid="results"]').textContent);
 return {results,exported:buildEvidenceExport(window.evidenceChunks,results,true)};
});}
async function inside(page){
 const a=await page.locator('.motor-tracking-arena').boundingBox(),t=await page.locator('.tracking-target').boundingBox();
 expect(t.x).toBeGreaterThanOrEqual(a.x-1);expect(t.y).toBeGreaterThanOrEqual(a.y-1);
 expect(t.x+t.width).toBeLessThanOrEqual(a.x+a.width+1);expect(t.y+t.height).toBeLessThanOrEqual(a.y+a.height+1);
}
for(const width of [390,820,1280])test(`tracking adopts the released gesture level and completes its original goal at ${width}px`,async({page})=>{
 test.setTimeout(90000);const errors=[];page.on('pageerror',e=>errors.push(e.message));await launch(page,width);
 const target=page.locator('.tracking-target'),level=page.locator('.viewport-navigation-row .soft-label');
 await target.focus();await page.keyboard.down('Space');await page.clock.runFor(3200);
 await expect(level).toHaveText('Nivel 5');await expect(target).toHaveCSS('width','128px');
 await page.keyboard.up('Space');await expect(level).toHaveText('Nivel 6');await expect(target).toHaveCSS('width','120px');await inside(page);
 // The keyup, blur and lost capture must not each create a new decision.
 await target.dispatchEvent('lostpointercapture');await target.blur();await target.focus();
 await page.screenshot({path:`/tmp/neuroia-live-tracking-${width}.png`});
 await page.keyboard.down('Space');await page.clock.runFor(7200);await page.keyboard.up('Space');
 await expect(page.getByRole('heading',{name:'Actividad completada',exact:true})).toBeVisible();
 const {results,exported}=await saved(page),attempt=exported.attempts[0];
 expect(errors).toEqual([]);expect(results).toHaveLength(1);expect(results[0].correctAnswers).toBe(10);expect(results[0].level).toBeUndefined();
 expect(attempt.rounds).toHaveLength(2);expect(attempt.roundResultVerified).toBe(true);expect(attempt.issues).toEqual([]);expect(attempt.measurements.responseCount).toBe(0);
 await page.screenshot({path:`/tmp/neuroia-live-tracking-result-${width}.png`});
 await page.getByRole('button',{name:'Repetir',exact:true}).click();await expect(level).toHaveText('Nivel 5');await page.getByRole('button',{name:'Volver',exact:true}).click();
});
test('tracking pointer release grows a missed target inside the arena and duplicate release is ignored',async({page})=>{
 test.setTimeout(60000);await launch(page,390);const arena=page.locator('.motor-tracking-arena'),target=page.locator('.tracking-target');
 const box=await arena.boundingBox();await page.mouse.move(box.x+10,box.y+box.height/2);await page.mouse.down();await page.clock.runFor(3500);
 await expect(page.locator('.viewport-navigation-row .soft-label')).toHaveText('Nivel 5');await page.mouse.up();
 await expect(page.locator('.viewport-navigation-row .soft-label')).toHaveText('Nivel 4');await expect(target).toHaveCSS('width','136px');await inside(page);
 await arena.dispatchEvent('lostpointercapture');await arena.dispatchEvent('pointercancel');await page.getByRole('button',{name:'Volver',exact:true}).click();
 const {exported}=await saved(page);expect(exported.attempts[0].issues).toEqual([]);expect(exported.attempts[0].rounds).toHaveLength(2);
});
test('assigned tracking remains fixed after releasing a successful gesture',async({page})=>{
 test.setTimeout(60000);await launch(page,820,'&assigned');await page.locator('.tracking-target').focus();await page.keyboard.down('Space');await page.clock.runFor(3200);await page.keyboard.up('Space');
 await expect(page.locator('.viewport-navigation-row .soft-label')).toHaveText('Nivel 5');await page.getByRole('button',{name:'Volver',exact:true}).click();
 const {exported}=await saved(page);expect(exported.attempts[0].rounds[0].decision.reason).toBe('professional');expect(exported.attempts[0].issues).toEqual([]);
});

test('touch cancellation closes one gesture and help excludes paused time from tracking evidence',async({page,context})=>{
 test.setTimeout(60000);await launch(page,820);const box=await page.locator('.motor-tracking-arena').boundingBox();
 const cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+10,y:box.y+box.height/2}]});
 await page.clock.runFor(3200);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
 await expect(page.locator('.viewport-navigation-row .soft-label')).toHaveText('Nivel 4');await inside(page);
 await page.getByRole('button',{name:'Mostrar instrucciones'}).click();await page.clock.runFor(5000);
 await page.getByRole('button',{name:'Continuar jugando'}).click();await page.getByRole('button',{name:'Volver',exact:true}).click();
 const {exported}=await saved(page),attempt=exported.attempts[0];
 expect(attempt.issues).toEqual([]);expect(attempt.rounds).toHaveLength(2);
 const events=await page.evaluate(()=>window.evidenceChunks.flatMap(c=>JSON.parse(c.events)));
 const recorded=events.filter(e=>e.kind==='tracking').reduce((sum,e)=>sum+e.durationMs,0);
 expect(recorded).toBeGreaterThanOrEqual(3100);expect(recorded).toBeLessThan(3500);
 await cdp.detach();
});
