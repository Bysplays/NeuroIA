import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test.beforeEach(async({page})=>{
  await page.route('**/src/services/evidenceArchive.ts*',route=>route.fulfill({contentType:'text/javascript',body:`
    export async function loadEvidencePage(){}
    export async function loadSessionEvidence(){}
    export async function loadEvidenceExport(db,uid,signal) {
      return new Promise((resolve,reject)=>{
        window.releaseExport=()=>resolve({version:1,coverage:{complete:true},counts:{completed:2}});
        window.failExport=()=>reject(Error('unavailable'));
        signal.addEventListener('abort',()=>{window.exportAborted=true;reject(signal.reason);});
      });
    }` }));
});
for(const width of [390,820,1280]) test(`evidence export downloads with a busy state and accessible confirmation at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.goto('/tests/interface/index.html?evidence-export');
  await page.screenshot({path:`/tmp/neuroia-evidence-action-${width}.png`});
  const button=page.getByRole('button',{name:'Exportar datos de evaluación'});
  await button.click();
  await expect(page.getByRole('button',{name:'Preparando datos…'})).toBeDisabled();
  const download=page.waitForEvent('download');
  await page.evaluate(()=>window.releaseExport());
  const file=await download;
  expect(file.suggestedFilename()).toBe('neuroia-evaluacion.json');
  expect(JSON.parse(await readFile(await file.path(),'utf8')).counts.completed).toBe(2);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.screenshot({path:`/tmp/neuroia-evidence-export-${width}.png`});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(button).toBeFocused();
});
test('failed export can retry; leaving cancels a pending export',async({page})=>{
  await page.goto('/tests/interface/index.html?evidence-export');
  const button=page.getByRole('button',{name:'Exportar datos de evaluación'});
  await button.click();await page.evaluate(()=>window.failExport());
  await expect(page.getByRole('alert')).toContainText('todos los datos');
  await button.click();await page.getByRole('button',{name:'Volver',exact:true}).click();
  expect(await page.evaluate(()=>window.exportAborted)).toBe(true);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
