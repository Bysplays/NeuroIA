import { test, expect } from '@playwright/test';
const fixture = '/tests/placement/index.html';
test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => ['127.0.0.1', 'localhost', 'fonts.googleapis.com', 'fonts.gstatic.com'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  await page.addInitScript(() => { Element.prototype.requestFullscreen = async () => {}; });
});
async function choose(page, area = 'Memoria') {
  await page.getByRole('checkbox', { name: new RegExp(area) }).check();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
}
async function saved(page) { return JSON.parse(await page.getByTestId('profile').textContent()); }
for (const size of [{ width: 390, height: 844 }, { width: 820, height: 1180 }, { width: 1280, height: 800 }, { width: 844, height: 390 }]) {
  test(`three-step choices fit and remain keyboard-accessible at ${size.width}×${size.height}`, async ({ page }) => {
    await page.setViewportSize(size); await page.goto(fixture);
    await expect(page.getByRole('button', { name: 'Continuar', exact: true })).toBeDisabled();
    const memory = page.getByRole('checkbox', { name: /Memoria/ });
    await memory.focus(); await page.keyboard.press('Space');
    await expect(memory).toBeChecked();
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();
    await expect(page.getByRole('heading', { name: '¿Cómo te resulta más cómodo jugar?' })).toBeFocused();
    await page.getByRole('radio', { name: /Prefiero dar toques/ }).check();
    await page.getByRole('button', { name: 'Volver', exact: true }).click();
    await expect(memory).toBeChecked();
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Preparar mis juegos' }).click();
    await expect(page.getByText('0 de 2 juegos preparados')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
test('selected assessment survives reload and finishes without testing unrelated areas', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 }); await page.goto(fixture + '?delay');
  await choose(page); await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Preparar mis juegos' }).click();
  await expect.poll(async () => (await saved(page)).placement?.preferences?.interests).toEqual(['memory']);
  await page.reload(); await expect(page.getByText('0 de 2 juegos preparados')).toBeVisible();
  await page.getByRole('button', { name: 'Empezar', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Secuencia de memoria/ })).toBeVisible();
  await page.getByRole('button', { name: /Omitir/ }).click();
  await expect(page.getByRole('heading', { name: /Parejas de memoria/ })).toBeVisible();
  await page.getByRole('button', { name: /Omitir/ }).click();
  await expect(page.getByRole('heading', { name: 'A tu ritmo, desde aquí' })).toBeVisible();
  await expect(page.getByText('Sin probar', { exact: true })).toHaveCount(6);
  await expect(page.getByText('Prueba omitida', { exact: true })).toHaveCount(2);
  expect((await saved(page)).totalSessions).toBe(0);
  await page.getByRole('button', { name: 'Ir a mis juegos' }).click();
  await expect(page.getByRole('heading', { name: 'Juegos preparados' })).toBeVisible();
});
test('taps plan excludes tracking, choices can change and large text remains usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto(fixture + '?large&hidden&contrast');
  await choose(page, 'Coordinación'); await page.getByRole('radio', { name: /Prefiero dar toques/ }).check();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Preparar mis juegos' }).click();
  await expect(page.getByText('0 de 1 juegos preparados')).toBeVisible();
  await page.getByRole('button', { name: 'Cambiar mis elecciones' }).click();
  await expect(page.getByRole('checkbox', { name: /Coordinación/ })).toBeChecked();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByRole('radio', { name: /Prefiero dar toques/ })).toBeChecked();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Preparar mis juegos' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('explicit area choices persist when editing reassessment', async ({ page }) => {
  await page.goto(fixture + '?retake');
  await expect(page.getByRole('button', { name: /No sé qué elegir/ })).toHaveCount(0);
  for (const checkbox of await page.getByRole('checkbox').all()) await checkbox.check();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Preparar mis juegos' }).click();
  await expect(page.getByText('0 de 8 juegos preparados')).toBeVisible();
  await page.getByRole('button', { name: 'Cambiar mis elecciones' }).click();
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(5);
  await page.getByRole('button', { name: 'Volver', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar prueba' }).click();
  const profile = await saved(page);
  expect(profile.gameLevels['memory-path'].level).toBe(4);
});

test('a passed target stage survives reload and continues at its saved difficulty', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 }); await page.goto(fixture + '?delay');
  await choose(page, 'Coordinación'); await page.getByRole('radio', { name: /Prefiero dar toques/ }).check();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Preparar mis juegos' }).click();
  await page.getByRole('button', { name: 'Empezar', exact: true }).click();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Tocar diana de coordinación' }).click();
  await expect.poll(async () => (await saved(page)).placement?.stages?.['motor-target']?.level).toBe(4);
  await page.reload();
  await page.getByRole('button', { name: 'Empezar', exact: true }).click();
  await expect(page.getByText('A tu ritmo', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Nivel 4', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('progressbar', { name: 'Progreso de la sesión' })).toHaveAttribute('value', '5');
  await expect(page.getByRole('progressbar', { name: 'Progreso de la sesión' })).toHaveAttribute('max', '13');
  const back = await page.getByRole('button', {name: 'Volver', exact: true}).boundingBox();
  const skip = await page.getByRole('button', {name: 'Omitir', exact: true}).boundingBox();
  expect(Math.abs(back.width - skip.width)).toBeLessThan(1);
  await page.getByRole('button', { name: /Omitir/ }).click();
  await expect(page.getByRole('heading', { name: 'A tu ritmo, desde aquí' })).toBeVisible();
  expect((await saved(page)).placement.trials['motor-target'].assessedLevel).toBe(1);
});

test('accepting a selective retake preserves other levels and preselects its saved choices next time', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 }); await page.goto(fixture + '?retake');
  await choose(page, 'Coordinación'); await page.getByRole('radio', { name: /Prefiero dar toques/ }).check();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Preparar mis juegos' }).click();
  await page.getByRole('button', { name: 'Empezar', exact: true }).click();
  await page.getByRole('button', { name: /Omitir/ }).click();
  await expect(page.getByText('Sin cambios', { exact: true })).toHaveCount(7);
  await page.getByRole('button', { name: 'Guardar niveles' }).click();
  await expect.poll(async () => (await saved(page)).placement?.retakePreferences?.interests).toEqual(['motor']);
  expect((await saved(page)).gameLevels['memory-path'].level).toBe(4);
  expect((await saved(page)).gameLevels['motor-target'].level).toBe(1);
  await page.reload();
  await expect(page.getByRole('checkbox', { name: /Coordinación/ })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: /Memoria/ })).not.toBeChecked();
});


test('condition context is optional, consented, saved and does not change the game plan', async ({page}) => {
  await page.goto(fixture+'?invited');
  await choose(page);
  await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Tu condición',exact:true})).toBeFocused();
  await page.getByRole('radio',{name:'He sufrido un ictus',exact:true}).check();
  await page.getByLabel('Lado del cuerpo afectado').selectOption('left');
  await page.getByLabel('¿Cómo es tu movilidad al desplazarte?').selectOption('support');
  await expect(page.getByRole('button',{name:'Preparar mis juegos'})).toBeDisabled();
  await page.getByRole('checkbox',{name:/Consiento guardar/}).check();
  await page.getByRole('button',{name:'Preparar mis juegos'}).click();
  await expect.poll(async()=> (await saved(page)).placement?.preferences?.condition).toEqual({kind:'stroke',side:'left',mobility:'support',consentVersion:1});
  await expect(page.getByText('0 de 2 juegos preparados')).toBeVisible();
  await page.reload();
  await page.getByRole('button',{name:'Cambiar mis elecciones'}).click();
  await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await expect(page.getByLabel('Lado del cuerpo afectado')).toHaveValue('left');
  await page.getByRole('radio',{name:'Prefiero no responder',exact:true}).check();
  await page.getByRole('button',{name:'Preparar mis juegos'}).click();
  await expect.poll(async()=> (await saved(page)).placement?.preferences?.condition).toBeUndefined();
});


test('personal condition context has no professional consent checkbox', async ({page}) => {
  await page.goto(fixture); await choose(page);
  await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await page.getByRole('radio',{name:'He sufrido un ictus',exact:true}).check();
  await expect(page.getByRole('checkbox',{name:/Consiento/})).toHaveCount(0);
  await expect(page.getByText(/Estos datos de salud/)).toHaveCount(0);
  await page.getByRole('button',{name:'Preparar mis juegos'}).click();
  await expect.poll(async()=> (await saved(page)).placement?.preferences?.condition).toEqual({kind:'stroke',side:'unspecified',mobility:'unspecified'});
});
