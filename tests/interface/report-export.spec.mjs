import {test,expect} from '@playwright/test';
for(const width of [390,820,1280])test(`report audit export has its own scope and confirmation at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.goto('/tests/interface/index.html?report-export');
  await expect(page.getByText(/informes que has solicitado desde esta cuenta/)).toBeVisible();
  await page.getByRole('button',{name:'Exportar registro de informes'}).click();
  await expect(page.getByRole('button',{name:'Preparando datos…'})).toBeDisabled();
  const download=page.waitForEvent('download');await page.evaluate(()=>window.finishReportExport());
  expect((await download).suggestedFilename()).toBe('neuroia-registro-informes.json');
  await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'Exportar registro de informes'})).toBeFocused();
  await page.screenshot({path:`/tmp/neuroia-report-export-${width}.png`});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('report audit never downloads on load failure or after leaving',async({page})=>{
  await page.goto('/tests/interface/index.html?report-export');let downloads=0;page.on('download',()=>downloads++);
  await page.getByRole('button',{name:'Exportar registro de informes'}).click();await page.evaluate(()=>window.failReportExport());
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button',{name:'Exportar registro de informes'}).click();
  await page.getByRole('button',{name:'Volver',exact:true}).click();
  expect(await page.evaluate(()=>window.reportExportAborted)).toBe(true);await page.evaluate(()=>window.finishReportExport());
  expect(downloads).toBe(0);
});
