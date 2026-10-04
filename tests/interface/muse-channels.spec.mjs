import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{
  await page.route('**/*',route=>['127.0.0.1','localhost','fonts.googleapis.com','fonts.gstatic.com'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
});
for(const width of [390,820,1280]) test(`channel history retains all samples and displays independent quality at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.goto('/tests/interface/index.html?muse-history');
  await expect(page.locator('.muse-channel')).toHaveCount(4);
  await expect(page.getByRole('region',{name:'Canal AF8'})).toContainText('Sin señal');
  await expect(page.locator('.muse-history-position')).toContainText('130 de 130');
  await page.getByRole('slider',{name:'Muestra EEG'}).focus();await page.keyboard.press('Home');
  await expect(page.locator('.muse-history-position')).toContainText('1 de 130');
  await expect(page.getByRole('region',{name:'Canal AF8'})).toContainText('Señal válida');
  await page.keyboard.press('End');
  await expect(page.locator('.muse-history-position')).toContainText('130 de 130');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`/tmp/neuroia-muse-history-${width}.png`,fullPage:true});
});
for(const size of [{width:390,height:844},{width:820,height:1180},{width:1280,height:800}]) test(`live values expire and game fits viewport at ${size.width}`,async({page})=>{
  await page.setViewportSize(size);
  await page.goto('/tests/interface/index.html?game=motor-target&evidence');
  await page.getByRole('button',{name:'Empezar a jugar'}).click();
  await page.evaluate(async()=>{
    const {museFeatureFrame}=await import('/src/services/museFeatures.ts');
    const wave=hz=>Array.from({length:256},(_,i)=>20*Math.sin(2*Math.PI*hz*i/256));
    window.eegTestService.install({id:'muse2-webbluetooth-v1',supported:()=>true,metric:{id:'test',label:'Prueba',unit:'µV',min:0,max:100},async connect(events){window.museEvents=events;return {disconnect(){}};}});
    await window.eegTestService.connect(true);
    window.museEvents.channels(museFeatureFrame(0,[wave(10),wave(6),undefined,wave(35)]));
  });
  await expect(page.locator('.muse-compact-grid .muse-channel')).toHaveCount(4);
  await expect(page.locator('.muse-compact-grid').getByRole('region',{name:'Canal TP9'})).toContainText('Señal válida');
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1)).toBe(true);
  await page.screenshot({path:`/tmp/neuroia-muse-live-${size.width}.png`});
  await expect(page.locator('.muse-compact-grid').getByRole('region',{name:'Canal TP9'})).toContainText('Sin señal',{timeout:6000});
  await page.getByRole('button',{name:'Muse conectado',exact:true}).click();
  await expect(page.getByRole('dialog').getByText('No mide atención, fatiga ni relajación.',{exact:false})).toBeVisible();
  await page.screenshot({path:`/tmp/neuroia-muse-dialog-${size.width}.png`});
  await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Muse conectado',exact:true})).toBeFocused();
});
