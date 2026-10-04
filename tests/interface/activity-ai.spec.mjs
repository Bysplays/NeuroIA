import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

async function mockAi(page, behavior = 'success') {
  await page.route('**/*', route => ['127.0.0.1', 'localhost', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  await page.route('**/src/services/reportResponses.ts*',route=>route.fulfill({contentType:'text/javascript',body:`export async function loadReportResponses(uid,signal){signal.throwIfAborted();return {complete:true,excluded:2,malformed:0,rows:[{exercise:'language-naming',level:2,sessions:2,responses:4,errors:1,hints:1,selections:0,meanResponseMs:1500,trackingMs:0,contactMs:0,contactRatio:null}]}};`}));
  await page.route('**/src/services/activityAi.ts*', route => route.fulfill({ contentType: 'text/javascript', body: `
    import { buildActivityInsights, basicNarrative } from '/src/services/activityInsights.ts';
    window.aiCalls=[];
    export const activityAi={async status(){return {available:${behavior !== 'unavailable'}}},async dailyRecommendations(uid,timeZone,signal){return this.generate(uid,{from:'',to:'',domain:'',exercise:'',timeZone},'recommendations',signal)},async generate(uid,filters,mode,signal){
      window.aiCalls.push({uid,filters,mode});
      ${behavior === 'error' ? "throw Error('No se ha podido comprobar el borrador de IA.');" : ''}
      ${behavior === 'slow' ? 'if(mode==="report") await new Promise(resolve=>window.finishAi=resolve);' : ''}
      window.aiWasAborted=signal.aborted;
      const history=Array.from({length:6},(_,i)=>({id:'fixture-'+i,exerciseId:'visual-scanning',domain:'attention',date:'2026-09-'+(20+i),durationSeconds:30,correctAnswers:3,totalQuestions:3,level:3,configVersion:1,hintsUsed:0}));
      const insights=buildActivityInsights(history,{'visual-scanning':{level:3,evidence:[]}},filters,{partial:true});
      const narrative=basicNarrative(insights);narrative.summary='Puedes dar variedad a tu práctica y elegir un reto que te resulte cómodo. Alterna los juegos que conoces con otras propuestas para explorar las distintas áreas a tu ritmo. Las recomendaciones tienen en cuenta la actividad disponible y puedes elegir libremente qué practicar hoy.';
      return {insights,narrative,provenance:{generatedAt:'2026-09-30T10:00:00Z',model:'fixture/model',promptVersion:'fixture-v1',snapshotHash:'fixture-hash',mode}};
    }};
    export function downloadActivityReport(text){const url=URL.createObjectURL(new Blob([text],{type:'text/plain'}));const a=document.createElement('a');a.href=url;a.download='informe.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  ` }));
  await page.goto('/tests/interface/index.html?activity-demo&evidence');
  await page.getByRole('tab', { name: 'Actividad', exact: true }).click();
}

for (const width of [390, 820, 1280]) test(`direct AI report and recommendations at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await mockAi(page);
  const card = page.locator('.activity-assistant');
  await expect.poll(() => page.evaluate(() => window.aiCalls.length)).toBe(1);
  await expect(card.getByRole('button', { name: /Personalizar|Actualizar/ })).toHaveCount(0);
  const reason = card.locator('.activity-assistant-reason').first();
  await reason.locator('summary').focus(); await page.keyboard.press('Enter');
  await expect(reason.locator('ul')).toBeVisible();
  await reason.screenshot({ path: `/tmp/neuroia-recommendation-reason-${width}.png` });
  await page.keyboard.press('Enter');
  await expect(card).toContainText('Generado con IA');
  await expect(card).toContainText('Puedes dar variedad');
  await card.screenshot({ path: `/tmp/neuroia-ai-recommendations-${width}.png` });
  const summaryWidth = await card.locator('.activity-assistant-summary').evaluate(el => el.getBoundingClientRect().width);
  const introWidth = await card.locator('.activity-assistant-intro').evaluate(el => el.getBoundingClientRect().width);
  expect(Math.abs(summaryWidth - introWidth)).toBeLessThan(2);
  const download = page.waitForEvent('download');
  await card.getByRole('button', { name: 'Generar informe' }).click();
  const file = await download;
  expect((await fs.readFile(await file.path())).subarray(0, 5).toString()).toBe('%PDF-');
  await file.saveAs(`/tmp/neuroia-informe-${width}.pdf`);
  expect(await page.evaluate(()=>window.reportEvents.map(e=>e.phase))).toEqual(['started','ai-ready','pdf-ready','download-requested']);
  const popup = page.getByRole('dialog', {name:'Informe PDF descargado'});
  await expect(popup).toBeVisible();
  await expect.poll(()=>popup.evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThan(100);
  await popup.screenshot({animations:'disabled',path:`/tmp/neuroia-download-popup-${width}.png`});
  await page.keyboard.press('Escape');
  await expect(popup).toHaveCount(0);
  await expect(card.getByRole('button', {name:'Generar informe'})).toBeFocused();
  await expect(card.getByRole('button', { name: 'Generar informe' })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('service failure stays inline and preserves the existing recommendations', async ({ page }) => {
  await mockAi(page, 'error');
  await expect(page.getByRole('alert')).toContainText('No se ha podido comprobar');
  await expect(page.locator('.activity-assistant')).not.toContainText('Generado con IA');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Generar informe' })).toBeEnabled();
});

test('pending report shows progress and cancellation prevents late downloads', async ({ page }) => {
  await mockAi(page, 'slow');
  let downloads = 0; page.on('download', () => downloads++);
  await page.getByRole('button', { name: 'Generar informe' }).click();
  await expect(page.getByRole('button', { name: 'Generando…' })).toBeDisabled();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.evaluate(() => window.finishAi());
  await expect.poll(() => page.evaluate(() => window.aiWasAborted)).toBe(true);
  await page.getByRole('tab', { name: 'Filtros', exact: true }).click();
  await page.getByLabel('Área', { exact: true }).selectOption('attention');
  await page.getByLabel('Desde', { exact: true }).fill('2026-09-20');
  await page.getByRole('tab', { name: 'Resumen', exact: true }).click();
  await page.getByRole('button', { name: 'Generar informe' }).click();
  await expect.poll(() => page.evaluate(() => window.aiCalls.at(-1).filters.domain)).toBe('attention');
  expect(await page.evaluate(() => window.aiCalls.at(-1).filters.from)).toBe('2026-09-20');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  expect(downloads).toBe(0);
  expect(await page.evaluate(()=>window.reportEvents.map(e=>e.phase))).toEqual(['started','cancelled','started','cancelled']);
});

test('large text and high contrast allow a direct basic PDF when AI is unavailable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockAi(page, 'unavailable');
  await page.goto('/tests/interface/index.html?activity-demo&evidence&large&contrast');
  await page.getByRole('tab', { name: 'Actividad', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Personalizar con IA' })).toHaveCount(0);
  await page.locator('.activity-assistant').screenshot({ path: '/tmp/neuroia-recommendations-accessible.png' });
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Generar informe' }).click(); await download;
  expect(await page.evaluate(()=>window.reportEvents.map(e=>e.phase))).toEqual(['started','pdf-ready','download-requested']);
  await page.getByRole('dialog').getByRole('button', {name:'Entendido'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('PDF generation recovers from a missing font', async ({ page }) => {
  await mockAi(page, 'unavailable');
  await page.route('**/fonts/manrope/Manrope-Regular.ttf', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.getByRole('button', { name: 'Generar informe' }).click();
  await expect(page.getByRole('alert')).toContainText('tipografía');
  expect(await page.evaluate(()=>window.reportEvents.map(e=>e.phase))).toEqual(['started','failed']);
  await page.unroute('**/fonts/manrope/Manrope-Regular.ttf');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Generar informe' }).click(); await downloaded;
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('vector report supports complete levels and long text across pages', async ({ page }) => {
  await mockAi(page, 'unavailable');
  const downloaded = page.waitForEvent('download');
  await page.evaluate(async () => {
    const { buildActivityInsights } = await import('/src/services/activityInsights.ts');
    const { ALL_EXERCISES } = await import('/src/services/exerciseCatalog.ts');
    const { createActivityReportPdf, downloadActivityReport } = await import('/src/services/activityReportPdf.ts');
    const insights = buildActivityInsights([], Object.fromEntries(ALL_EXERCISES.map((g,i) => [g.id, {level:i+1,evidence:[]} ])), {from:'',to:'',domain:'',exercise:'',timeZone:'Europe/Madrid'});
    const text = Array.from({length:65}, (_, i) => `Párrafo ${i+1}. Práctica de atención y memoria: precisión y velocidad. Las sugerencias se eligen libremente.`).join('\n\n');
    const responses={complete:true,excluded:1,malformed:0,rows:ALL_EXERCISES.flatMap(game=>Array.from({length:10},(_,i)=>({exercise:game.id,level:i+1,sessions:1,responses:game.id==='motor-tracking'?0:3,errors:1,hints:1,selections:0,meanResponseMs:game.id==='motor-tracking'?null:1500,trackingMs:game.id==='motor-tracking'?3000:0,contactMs:2250,contactRatio:game.id==='motor-tracking'?.75:null})))};
    downloadActivityReport(await createActivityReportPdf({insights,text,reference:'Ana María · Ejemplo ficticio',responses},new AbortController().signal));
  });
  await (await downloaded).saveAs('/tmp/neuroia-informe-largo.pdf');
});

test('leaving a pending report records cancellation and blocks its late PDF',async({page})=>{
  await mockAi(page,'slow');
  await page.getByRole('button',{name:'Generar informe'}).click();
  await expect(page.getByRole('button',{name:'Generando…'})).toBeVisible();
  await page.getByRole('tab',{name:'Historial',exact:true}).click();
  expect(await page.evaluate(()=>window.reportEvents.map(e=>e.phase))).toEqual(['started','cancelled']);
  let downloads=0;page.on('download',()=>downloads++);
  await page.evaluate(()=>window.finishAi());
  await expect.poll(()=>page.evaluate(()=>window.aiWasAborted)).toBe(true);
  expect(downloads).toBe(0);
});

test('response archive failure prevents a misleading complete PDF',async({page})=>{
  await mockAi(page,'unavailable');
  await page.route('**/src/services/reportResponses.ts*',route=>route.fulfill({contentType:'text/javascript',body:'export async function loadReportResponses(){throw Error("No se han podido recuperar las respuestas.")}'}));
  let downloads=0;page.on('download',()=>downloads++);
  await page.getByRole('button',{name:'Generar informe'}).click();
  await expect(page.getByRole('alert')).toContainText('recuperar las respuestas');
  expect(downloads).toBe(0);expect(await page.evaluate(()=>window.reportEvents.map(e=>e.phase))).toEqual(['started','failed']);
});
