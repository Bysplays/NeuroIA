import {test,expect} from '@playwright/test';
test('history rejects a mismatched result and can retry without displaying another attempt',async({page})=>{
  await page.route('**/src/services/evidenceArchive.ts*',route=>route.fulfill({contentType:'text/javascript',body:`
    import {museFeatureFrame} from '/src/services/museFeatures.ts';
    export async function loadEvidencePage(){} export async function loadEvidenceExport(){}
    let calls=0;
    export async function loadSessionEvidence(){
      const wave=Array.from({length:256},(_,i)=>20*Math.sin(2*Math.PI*10*i/256));
      return {status:'completed',resultId:++calls===1?'wrong-result':'fixture-result',exerciseId:'motor-target',events:[{kind:'eeg',activeMs:1000,frame:museFeatureFrame(0,[wave,wave,wave,wave])}]};
    }` }));
  await page.goto('/tests/interface/index.html?muse-archive');
  await expect(page.getByRole('alert')).toContainText('registro completo');
  await expect(page.locator('.muse-channel-grid')).toHaveCount(0);
  await page.getByRole('button',{name:'Reintentar',exact:true}).click();
  await expect(page.locator('.muse-channel-grid .muse-channel')).toHaveCount(4);
  await expect(page.getByRole('alert')).toHaveCount(0);
});
test('leaving the result cancels pending channel history retrieval',async({page})=>{
  await page.route('**/src/services/evidenceArchive.ts*',route=>route.fulfill({contentType:'text/javascript',body:`
    export async function loadEvidencePage(){} export async function loadEvidenceExport(){}
    export async function loadSessionEvidence(db,uid,id,signal){return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>{window.channelLoadAborted=true;reject(signal.reason);}));}` }));
  await page.goto('/tests/interface/index.html?muse-archive');
  await expect(page.getByRole('status')).toContainText('Cargando el registro');
  await page.getByRole('button',{name:'Volver',exact:true}).click();
  expect(await page.evaluate(()=>window.channelLoadAborted)).toBe(true);
});
