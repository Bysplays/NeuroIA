import { test, expect } from '@playwright/test';
import { mockProfessional } from './professional-mocks.mjs';
test.beforeEach(async ({page})=>{await mockProfessional(page);});
for (const width of [390,820,1280]) test(`professional workspace and composer at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.goto('/tests/interface/index.html?professional');
  await expect(page.getByRole('heading',{name:'Espacio profesional'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Sesiones de Ana'})).toBeEnabled();
  await page.screenshot({path:`/tmp/professional-people-${width}.png`,fullPage:true});
  await page.getByRole('tab',{name:'Asientos',exact:true}).click();
  await expect(page.getByLabel('Código de invitación')).toHaveValue('NIA-TEST-BB');
  await page.screenshot({path:`/tmp/professional-seats-${width}.png`,fullPage:true});
  await page.getByRole('tab',{name:'Personas',exact:true}).click();
  await page.getByRole('button',{name:'Sesiones de Ana'}).click();
  await page.getByRole('button',{name:'Nueva sesión',exact:true}).click();
  await page.getByLabel('Título de la sesión').fill('Propuesta de prueba');
  await page.getByRole('button',{name:'Añadir juego'}).click();
  await page.screenshot({path:`/tmp/professional-composer-${width}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Revisar sesión',exact:true}).click();
  await page.getByRole('button',{name:'Compartir sesión',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Propuesta de prueba',exact:true})).toBeVisible();
});
test('individual recommendations retain prescribed steps and refresh three pending slots',async({page})=>{
  await page.goto('/tests/interface/index.html?recommendations');
  await expect(page.getByRole('heading',{name:'Mi propuesta de coordinación'})).toBeVisible();
  await page.locator('.editorial-today-games button').nth(1).click();
  await page.getByRole('button',{name:'Empezar a jugar'}).click();
  const target=page.getByRole('button',{name:'Tocar diana de coordinación'});
  while(await target.count()) await target.click();
  await expect(page.getByRole('heading',{name:'Actividad completada'})).toBeVisible();
  await page.locator('.result-primary').click();
  await expect(page.locator('.editorial-step')).toHaveText(['01','03','04']);
  await page.getByRole('button',{name:'Jugar',exact:true}).click();
  await page.getByRole('button',{name:'Empezar a jugar'}).click();
  while(await target.count()) await target.click();
  await page.locator('.result-primary').click();
  await expect(page.getByText('Ejercicio 3 de 6 · Sesión propuesta',{exact:true})).toBeVisible();
});
test('all individual steps finish the proposal and leave three checked entries',async({page})=>{
  await page.goto('/tests/interface/index.html?recommendations');
  await expect(page.getByRole('heading',{name:'Mi propuesta de coordinación'})).toBeVisible();
  for(let i=0;i<6;i++){
    const entries=page.locator('.editorial-today-games button');
    await expect(entries.filter({has:page.locator('.editorial-step',{hasText:`0${i+1}`})})).toBeVisible();
    await entries.filter({has:page.locator('.editorial-step',{hasText:`0${i+1}`})}).click();
    await page.getByRole('button',{name:'Empezar a jugar'}).click();
    const target=page.getByRole('button',{name:'Tocar diana de coordinación'});
    while(await target.count()) await target.click();
    await page.locator('.result-primary').click();
  }
  await expect(page.getByRole('button',{name:'Sesión completada',exact:true})).toBeDisabled();
  await expect(page.locator('.editorial-today-games button:disabled')).toHaveCount(3);
});
