import { test, expect } from '@playwright/test';
const fixture = '/tests/interface/index.html';
async function artworkReady(page) {
  await page.evaluate(async () => {
    const urls = new Set([...document.querySelectorAll('*')].flatMap(e => [...getComputedStyle(e).backgroundImage.matchAll(/url\(["']?(.*?)["']?\)/g)].map(m => m[1])));
    await Promise.all([...urls].map(url => new Promise((resolve,reject) => { const image = new Image(); image.onload = resolve; image.onerror = () => reject(new Error('Missing artwork: '+url)); image.src = url; })));
    await Promise.all([...document.images].filter(image => image.loading !== 'lazy').map(image => image.decode()));
  });
}
const games = ['visual-scanning','language-naming','word-completion','memory-path','memory-pairs','categorization','motor-target','motor-tracking'];
test.beforeEach(async ({ page }) => {
  await page.route('**/*', route => ['127.0.0.1','localhost','fonts.googleapis.com','fonts.gstatic.com'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  await page.addInitScript(() => { window.fullscreenCalls = 0; Element.prototype.requestFullscreen = async () => { window.fullscreenCalls++; }; });
});
for (const size of [{width:390,height:844},{width:820,height:1180},{width:1280,height:800}]) {
  test(`entry, funding, home and eight games at ${size.width}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto(fixture+'?entry');
    await expect(page.getByRole('heading',{name:/Juega a tu ritmo/})).toBeVisible();
    await expect(page.getByText('Quiero suscribirme',{exact:true})).toHaveCount(0);
    await page.getByRole('button',{name:'Financiado por IGAPE'}).click();
    const image = page.locator('.information-page .project-funding > img');
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(e=>e.complete && e.naturalWidth > 0)).toBe(true);
    await expect(page.getByText('IG408M-2026-000-000102',{exact:true})).toBeVisible();
    await page.screenshot({path:`/tmp/calma-funding-${size.width}.png`,fullPage:true});
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('.information-page').getByRole('heading',{name:'NEUROIA',exact:true})).toHaveCount(0);
    await expect(page.getByRole('link',{name:'Ver a tamaño completo'})).toHaveCount(0);
    await page.getByRole('button',{name:'Cerrar',exact:true}).click();
    await expect(page.getByRole('button',{name:'Financiado por IGAPE'})).toBeFocused();
    await page.getByRole('button',{name:'Sobre NeuroIA',exact:true}).click();
    await expect(page.locator('.information-page .project-funding')).toHaveCount(0);
    await page.getByRole('button',{name:'Cerrar',exact:true}).click();
    await page.getByRole('button',{name:'Aviso legal',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Aviso legal',exact:true})).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button',{name:'Cerrar',exact:true}).click();
    await page.getByRole('button',{name:'Comenzar',exact:true}).click();
    await expect(page.getByRole('button',{name:'Entrar',exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Crear cuenta',exact:true}).first().click();
    await expect(page.getByLabel('Repite la contraseña')).toBeVisible();
    await page.goto(fixture);
    await expect(page.getByRole('heading',{name:'Hola, Lucía.'})).toBeVisible();
    await page.screenshot({path:`/tmp/calma-home-${size.width}.png`,fullPage:true});
    await page.getByRole('tab',{name:'Juegos',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Ocho formas de jugar.'})).toBeVisible();
    await page.screenshot({path:`/tmp/calma-catalog-${size.width}.png`,fullPage:true});
    for (const id of games) {
      await page.goto(fixture+'?game='+id);
      await expect(page.getByRole('button',{name:'Empezar a jugar'})).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),id+' instructions overflow').toBe(true);
      await page.screenshot({path:`/tmp/calma-${id}-intro-${size.width}.png`,fullPage:true});
      await page.getByRole('button',{name:'Empezar a jugar'}).click();
      await expect(page.locator('.game-session-play')).toBeVisible();
      expect(await page.evaluate(()=>window.fullscreenCalls)).toBe(0);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),id+' play overflow').toBe(true);
      await artworkReady(page);
      await page.screenshot({path:`/tmp/calma-${id}-play-${size.width}.png`,fullPage:true});
      await page.getByRole('button',{name:'Mostrar instrucciones'}).click();
      await expect(page.getByRole('button',{name:'Continuar jugando'})).toBeVisible();
      await page.getByRole('button',{name:'Continuar jugando'}).click();
    }
  });
}
test('pairs start face down, reveal with keyboard and the optional hint can be ended',async({page})=>{
  await page.goto(fixture+'?game=memory-pairs');
  await page.getByRole('button',{name:'Empezar a jugar'}).click();
  const cards=page.locator('.memory-card-tile');
  await expect(cards).toHaveCount(4);
  await expect(page.locator('.memory-card-tile.tile-flipped')).toHaveCount(0);
  await cards.first().focus(); await page.keyboard.press('Space');
  await expect(cards.first()).toHaveClass(/flipped/);
  await page.getByRole('button',{name:'Volver a ver las cartas'}).click();
  await expect(page.locator('.memory-card-tile.tile-flipped')).toHaveCount(4);
  await page.getByRole('button',{name:/Empezar ahora/}).click();
  await expect(page.locator('.memory-card-tile.tile-flipped')).toHaveCount(0);
});
test('a failed Simon trial saves once and never forces replay',async({page})=>{
  await page.goto(fixture+'?game=memory-path&placement');
  await page.evaluate(()=>{ window.activated=[]; new MutationObserver(()=>{document.querySelectorAll('.memory-tile.tile-active').forEach(e=>{if(!window.activated.includes(e.textContent))window.activated.push(e.textContent);});}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']}); });
  await page.getByRole('button',{name:/Comenzar secuencia/}).click();
  await expect(page.locator('.memory-tile').first()).toBeEnabled({timeout:10000});
  const first=await page.evaluate(()=>window.activated[0]);
  const tiles=page.locator('.memory-tile');
  for(let i=0;i<await tiles.count();i++){ if(await tiles.nth(i).textContent()!==first){await tiles.nth(i).click();break;} }
  await expect.poll(async()=>JSON.parse(await page.getByTestId('results').textContent()).length).toBe(1);
  const result=JSON.parse(await page.getByTestId('results').textContent())[0];
  expect(result.correctAnswers).toBe(0); expect(result.totalQuestions).toBe(1);
  await expect(page.getByRole('button',{name:/Ver de nuevo/})).toHaveCount(0);
});
test('trial continuation has no results promise and target success is visible without sound', async({page})=>{
  await page.goto(fixture+'?game=language-naming&placement');
  await page.locator('.naming-option-btn').first().click();
  await expect(page.getByRole('button',{name:'Continuar',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Ver resultados',exact:true})).toHaveCount(0);
  await page.goto(fixture+'?game=motor-target');
  await page.getByRole('button',{name:'Empezar a jugar'}).click();
  const target=page.getByRole('button',{name:'Tocar diana de coordinación'});
  for(let i=0;i<5;i++){
    const arena=await page.locator('.motor-touch-arena').boundingBox();const box=await target.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(arena.x);expect(box.y).toBeGreaterThanOrEqual(arena.y);
    expect(box.x+box.width).toBeLessThanOrEqual(arena.x+arena.width+1);expect(box.y+box.height).toBeLessThanOrEqual(arena.y+arena.height+1);
    await target.click();
    if(i===0) await expect(page.getByRole('status').filter({hasText:'Bien hecho. Sigue a tu ritmo.'})).toHaveCount(0);
  }
  await expect(page.getByRole('heading',{name:'Un paso más. Bien hecho.'})).toBeVisible();
  expect(JSON.parse(await page.getByTestId('results').textContent())).toHaveLength(1);
});
test('large text, short landscape and settings dialog preserve access',async({page})=>{
  for(const size of [{width:390,height:844},{width:844,height:390}]){
    await page.setViewportSize(size); await page.goto(fixture+'?large&contrast&hidden');
    await page.getByRole('button',{name:'Ajustes de accesibilidad'}).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.screenshot({path:`/tmp/calma-settings-${size.width}.png`,fullPage:true});
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button',{name:'Ajustes de accesibilidad'})).toBeFocused();
    await page.getByRole('tab',{name:'Mi cuenta',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Tu espacio, a tu manera.'})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.goto(fixture+'?game=motor-tracking&large&contrast&hidden');
    await page.getByRole('button',{name:'Empezar a jugar'}).click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:`/tmp/calma-tracking-large-${size.width}.png`,fullPage:true});
  }
});
test('advanced boards keep their actions inside narrow and short viewports',async({page})=>{
  for(const size of [{width:390,height:844},{width:844,height:390}]){
    await page.setViewportSize(size);
    for(const id of games){
      await page.goto(fixture+'?game='+id+'&level=10&large');
      await page.getByRole('button',{name:'Empezar a jugar'}).click();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' advanced board overflow').toBe(true);
    }
  }
});

test('information pages return to settings without restarting the game',async({page})=>{
  await page.goto(fixture+'?game=memory-pairs');
  await page.getByRole('button',{name:'Empezar a jugar'}).click();
  await page.locator('.memory-card-tile').first().click();
  const revealed = await page.locator('.memory-card-tile').first().getAttribute('aria-label');
  await page.getByRole('button',{name:'Ajustes',exact:true}).click();
  await page.getByRole('button',{name:'Sobre NeuroIA',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Sobre NeuroIA',exact:true})).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button',{name:'Cerrar',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button',{name:'Cerrar ajustes',exact:true}).click();
  await expect(page.locator('.memory-card-tile').first()).toHaveAttribute('aria-label',revealed);
  await expect(page.locator('.memory-card-tile').first()).toHaveClass(/tile-flipped/);
});


test('registration error dialog preserves fields and restores focus', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto(fixture+'?entry');
  await page.getByRole('button',{name:'Comenzar',exact:true}).click();
  await page.getByRole('button',{name:'Crear cuenta',exact:true}).click();
  await page.getByLabel('Correo electrónico').fill('preview@example.invalid');
  await page.getByLabel('Contraseña',{exact:true}).fill('test-password');
  await page.getByLabel('Repite la contraseña').fill('different-password');
  const submit = page.locator('button[type="submit"]');
  await submit.click();
  const dialog = page.getByRole('dialog',{name:'No hemos podido continuar'});
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('alert')).toHaveText('Las contraseñas no coinciden.');
  await expect(dialog.getByRole('button',{name:'Volver al formulario'})).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(submit).toBeFocused();
  await expect(page.getByLabel('Correo electrónico')).toHaveValue('preview@example.invalid');
  await expect(page.getByLabel('Contraseña',{exact:true})).toHaveValue('test-password');
  await submit.click();
  await dialog.getByRole('button').click();
  await expect(dialog).toHaveCount(0);
});


test('email and Google failures use the dismissible notification', async ({page}) => {
  await page.goto(fixture+'?entry&auth-failure');
  await page.getByRole('button',{name:'Comenzar',exact:true}).click();
  await page.getByRole('button',{name:'Continuar con Google'}).click();
  const dialog = page.getByRole('dialog',{name:'No hemos podido continuar'});
  await expect(dialog.getByRole('alert')).toContainText('Google');
  await dialog.getByRole('button').click();
  await expect(dialog).toHaveCount(0);
  await page.getByLabel('Correo electrónico').fill('preview@example.invalid');
  await page.getByLabel('Contraseña',{exact:true}).fill('test-password');
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await expect(dialog.getByRole('alert')).toContainText('correo y contraseña');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel('Correo electrónico')).toHaveValue('preview@example.invalid');
});

test('brand returns from the catalog to today without changing the daily suggestion', async ({page}) => {
  await page.goto(fixture);
  const featured = await page.locator('.editorial-home').innerText();
  await page.getByRole('tab', {name:'Juegos', exact:true}).click();
  await expect(page.getByRole('heading',{name:'Ocho formas de jugar.'})).toBeVisible();
  await page.getByRole('button',{name:'NeuroIA, ir al inicio'}).click();
  await expect(page.getByRole('tab',{name:'Hoy',exact:true})).toHaveAttribute('aria-selected','true');
  await expect(page.locator('.editorial-home')).toHaveText(featured, {useInnerText:true});
});


test('verification polling enters automatically and stops after leaving', async ({page}) => {
  // Test-only identity/SDK adapters; no real sign-in or email delivery.
  await page.route('**/src/components/EmailVerification.tsx*', async route => {
    const response = await route.fetch();
    await route.fulfill({response, body:(await response.text()).replaceAll('auth.currentUser === user', 'true')});
  });
  await page.route('**/src/services/emailAuth.ts*', async route => {
    const response = await route.fetch();
    await route.fulfill({response, body:(await response.text()).replace(
      /async function refreshVerification\(user\)\s*\{/,
      'async function refreshVerification(user) { window.verificationChecks = (window.verificationChecks || 0) + 1; return window.verificationChecks >= 2;')});
  });
  await page.clock.install();
  await page.goto(fixture+'?verification');
  await page.clock.runFor(10000);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Verifica tu correo'})).toBeVisible();
  await page.clock.runFor(10000);
  await expect(page.getByRole('button',{name:'Comenzar',exact:true})).toBeVisible();
  await page.clock.runFor(30000);
  expect(await page.evaluate(()=>window.verificationChecks)).toBe(2);
});


test('subscription offers trial and accessible invitation without bypassing availability', async ({page}) => {
  await page.goto(fixture+'?subscription');
  await page.getByRole('button',{name:'Tengo un código de invitación'}).focus();
  await page.keyboard.press('Enter');
  await page.getByLabel('Código de invitación',{exact:true}).fill('INVALIDO');
  await page.getByRole('button',{name:'Usar mi código'}).click();
  await expect(page.getByRole('alert')).toContainText('Este código no es válido');
  await expect(page.getByLabel('Código de invitación',{exact:true})).toHaveValue('INVALIDO');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'Tengo un código de invitación'})).toBeFocused();
  await page.getByRole('button',{name:'Probar gratis 7 días'}).click();
  await expect(page.getByRole('button',{name:'Comenzar',exact:true})).toBeVisible();
  await page.goto(fixture+'?subscription&expired&unavailable');
  await expect(page.getByRole('button',{name:'Suscribirme',exact:true})).toBeDisabled();
  await expect(page.getByRole('button',{name:'Probar gratis 7 días'})).toHaveCount(0);
  await page.goto(fixture+'?subscription&checkout=success');
  await expect(page.getByRole('status')).toContainText('comprobando tu pago');
  await expect(page.getByRole('button',{name:'Cancelar pago pendiente'})).toHaveCount(0);
});


test('invitation automatically cancels pending checkout before redemption', async ({page}) => {
  await page.route('**/src/services/accessService.ts*', async route => {
    const response = await route.fetch();
    let body = await response.text();
    body = body.replace(/async load\(\)\s*\{/, 'async load() { return {active:!!window.invited,serverNow:Date.now(),validForMs:60000,checkoutAvailable:true,pendingCheckout:!window.cancelledCheckout};');
    body = body.replace(/async invite\(code\)\s*\{/, 'async invite(code) { if (!window.cancelledCheckout) throw new Error("checkout still pending"); window.invited = true; return;');
    body = body.replace(/async cancelCheckout\(\)\s*\{/, 'async cancelCheckout() { if (location.search.includes("paid")) throw Object.assign(new Error("Estamos confirmando tu pago. Espera unos instantes."), {code: "billing/request-failed"}); window.cancelledCheckout = true; return;');
    await route.fulfill({response,body});
  });
  await page.goto(fixture+'?access-gate');
  await page.getByRole('button',{name:'Tengo un código de invitación'}).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Código de invitación').fill('CEOABERTO');
  await dialog.getByRole('button',{name:'Usar mi código'}).click();
  expect(await page.evaluate(()=>window.cancelledCheckout)).toBe(true);
  await expect(page.getByText('Acceso confirmado',{exact:true})).toBeVisible();
  await page.goto(fixture+'?access-gate&paid');
  await page.getByRole('button',{name:'Tengo un código de invitación'}).click();
  await page.getByLabel('Código de invitación').fill('CEOABERTO');
  await page.getByRole('button',{name:'Usar mi código'}).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Estamos confirmando tu pago');
  expect(await page.evaluate(()=>!!window.invited)).toBe(false);
});

for (const choice of ['trial', 'checkout']) {
  test(`${choice} invalidates pending payment before starting and stops on cancellation failure`, async ({page}) => {
    await page.route('**/src/services/accessService.ts*', async route => {
      const response = await route.fetch();
      let body = await response.text();
      // Deliberately stale UI snapshot: the server must still be consulted.
      body = body.replace(/async load\(\)\s*\{/, 'async load() { return {active:!!window.startedTrial,serverNow:Date.now(),validForMs:60000,checkoutAvailable:true,pendingCheckout:false};');
      body = body.replace(/async cancelCheckout\(\)\s*\{/, 'async cancelCheckout() { if (location.search.includes("paid")) throw Object.assign(new Error("Estamos confirmando tu pago."), {code:"billing/request-failed"}); window.paymentCancelled = true; return;');
      body = body.replace(/async trial\(\)\s*\{/, 'async trial() { if (!window.paymentCancelled) throw new Error("pending checkout"); window.startedTrial = true; return;');
      body = body.replace(/async checkout\(\)\s*\{/, 'async checkout() { if (!window.paymentCancelled) throw new Error("pending checkout"); window.startedCheckout = true; throw Object.assign(new Error("Checkout preparado"), {code:"billing/request-failed"});');
      await route.fulfill({response,body});
    });
    const label = choice === 'trial' ? 'Probar gratis 7 días' : 'Suscribirme';
    await page.goto(fixture+'?access-gate');
    await page.getByRole('button',{name:label,exact:true}).click();
    await expect.poll(()=>page.evaluate(kind=>kind === 'trial' ? !!window.startedTrial : !!window.startedCheckout,choice)).toBe(true);
    await page.goto(fixture+'?access-gate&paid');
    await page.getByRole('button',{name:label,exact:true}).click();
    await expect(page.getByRole('alert')).toContainText('Estamos confirmando tu pago');
    expect(await page.evaluate(()=>!!window.startedTrial || !!window.startedCheckout)).toBe(false);
  });
}


test('loading phrases rotate without changing the accessible status', async ({page}) => {
  await page.clock.install();
  await page.goto(fixture+'?loading');
  await expect(page.getByText('Eligiendo emociones positivas')).toBeVisible();
  await page.clock.runFor(4000);
  await expect(page.getByText('Recordando que cada día es un regalo')).toBeVisible();
  await expect(page.getByRole('status',{name:'Preparando tu espacio'})).toBeVisible();
  await page.clock.runFor(28000);
  await expect(page.getByText('Eligiendo emociones positivas')).toBeVisible();
});


test('save failure can be dismissed while remaining pending or retried', async ({page}) => {
  await page.goto(fixture+'?save-error&failure');
  await page.getByRole('button',{name:'Reintentar',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button',{name:'Avanzar sin sincronizar'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('Guardado pendiente');
  await page.getByRole('button',{name:'Reintentar',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.goto(fixture+'?save-error');
  await page.getByRole('button',{name:'Reintentar',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('Guardado pendiente.')).toHaveCount(0);
});

test('sound toggle enables narration and effects together and mute stops speech', async ({page}) => {
  await page.goto(fixture+'?game=language-naming&placement');
  await page.evaluate(async () => {
    const {soundService} = await import('/src/services/soundService.ts');
    soundService.speak = Object.getPrototypeOf(soundService).speak.bind(soundService);
    window.voiceCalls = 0; window.voiceStops = 0;
    soundService.narration.speak = () => { window.voiceCalls++; return true; };
    soundService.narration.stop = () => { window.voiceStops++; };
    soundService.speak('Prueba');
  });
  expect(await page.evaluate(()=>window.voiceCalls)).toBe(0);
  await page.getByRole('button',{name:'Activar sonidos',exact:true}).click();
  await page.evaluate(async()=>{const {soundService}=await import('/src/services/soundService.ts');soundService.speak('Prueba');});
  expect(await page.evaluate(()=>window.voiceCalls)).toBe(1);
  await page.getByRole('button',{name:'Silenciar sonidos',exact:true}).click();
  await page.evaluate(async()=>{const {soundService}=await import('/src/services/soundService.ts');soundService.speak('Prueba');});
  expect(await page.evaluate(()=>window.voiceCalls)).toBe(1);
  expect(await page.evaluate(()=>window.voiceStops)).toBeGreaterThan(0);
});

test('game progress replaces title counters and help restores the same board', async ({page}) => {
  await page.goto(fixture+'?game=visual-scanning&placement');
  const bar=page.getByRole('progressbar', {name:'Progreso del juego'});
  await expect(bar).toHaveAttribute('aria-valuenow','0');
  await expect(page.locator('.game-task-title')).not.toContainText(/\d+\/\d+/);
  const board=await page.locator('.scanning-grid').innerHTML();
  await page.getByRole('button',{name:'Mostrar instrucciones'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading',{name:'Cómo jugar'})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Mostrar instrucciones'})).toBeFocused();
  expect(await page.locator('.scanning-grid').innerHTML()).toBe(board);
  await expect(page.locator('.cell-check-overlay')).toHaveCount(0);
});
