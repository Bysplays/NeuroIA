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
test('pairs start face down, preview once and then reveal with keyboard',async({page})=>{
  await page.goto(fixture+'?game=memory-pairs');
  await page.getByRole('button',{name:'Empezar a jugar'}).click();
  const cards=page.locator('.memory-card-tile');
  await expect(cards).toHaveCount(4);
  await expect(page.locator('.memory-card-tile.tile-flipped')).toHaveCount(0);
  await expect(cards.first()).toBeDisabled();
  await page.getByRole('button',{name:'Comenzar',exact:true}).click();
  await expect(page.locator('.memory-card-tile.tile-flipped')).toHaveCount(4);
  await page.getByRole('button',{name:/Ocultar/}).click();
  await expect(page.locator('.memory-card-tile.tile-flipped')).toHaveCount(0);
  await cards.first().focus();
  await page.keyboard.press('Space');
  await expect(cards.first()).toHaveClass(/tile-flipped/);
});
test('a failed Simon trial saves once and never forces replay',async({page})=>{
  await page.goto(fixture+'?game=memory-path&placement');
  await page.evaluate(()=>{ window.activated=[]; new MutationObserver(()=>{document.querySelectorAll('.memory-tile.tile-active').forEach(e=>{if(!window.activated.includes(e.textContent))window.activated.push(e.textContent);});}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']}); });
  await page.getByRole('button',{name:'Comenzar',exact:true}).click();
  await expect(page.locator('.memory-tile').first()).toBeEnabled({timeout:10000});
  const first=await page.evaluate(()=>window.activated[0]);
  const tiles=page.locator('.memory-tile');
  for(let i=0;i<await tiles.count();i++){ if(await tiles.nth(i).textContent()!==first){await tiles.nth(i).click();break;} }
  await expect(page.locator('.sequence-incorrect')).toBeVisible();
  await expect(page.locator('.sequence-correct')).toBeVisible();
  await page.getByRole('button',{name:'Continuar',exact:true}).click();
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
  await expect(page.getByRole('heading',{name:'Actividad completada'})).toBeVisible();
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
    await expect(page.getByRole('heading',{name:'Mi cuenta',exact:true})).toBeVisible();
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
  await page.getByRole('button',{name:'Comenzar',exact:true}).click();
  await page.getByRole('button',{name:/Ocultar/}).click();
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

test('Muse offers connection only when Web Bluetooth is supported', async ({page}) => {
  await page.goto(fixture+'?game=language-naming&placement');
  await page.evaluate(async () => {
    Object.defineProperty(navigator, 'bluetooth', {configurable: true, value: undefined});
    const {eegService} = await import('/src/services/eegService.ts');
    const {createMuseAdapter} = await import('/src/services/museAdapter.ts');
    eegService.install(createMuseAdapter());
  });
  await page.getByRole('button', {name:'Conectar Muse',exact:true}).click();
  await expect(page.getByRole('button',{name:'Conectar diadema',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Navegador no soportado',exact:true})).toBeDisabled();
  await expect(page.getByRole('status')).toHaveText('Diadema no conectada');
  await expect(page.getByText('Pulsa «Conectar diadema» y selecciona tu Muse en la ventana del navegador. Asegúrate de que tu diadema esté desconectada de otras aplicaciones.')).toBeVisible();
  await expect(page.locator('.preferences-body h3')).toHaveText(['Conexión Bluetooth']);
  await page.keyboard.press('Escape');
  await page.evaluate(async () => {
    Object.defineProperty(navigator, 'bluetooth', {configurable: true, value: {requestDevice: async () => {throw new Error('Test only');}}});
    const {eegService} = await import('/src/services/eegService.ts');
    const {createMuseAdapter} = await import('/src/services/museAdapter.ts');
    eegService.install(createMuseAdapter());
  });
  await page.getByRole('button',{name:'Conectar Muse',exact:true}).click();
  await expect(page.getByRole('button',{name:'Conectar diadema',exact:true})).toBeEnabled();
});

test('finding an object or touching a target does not complete a progress stage', async ({page}) => {
  await page.goto(fixture+'?game=visual-scanning&placement');
  const cells = page.locator('.scanning-cell');
  for (let index = 0; index < await cells.count(); index++) {
    await cells.nth(index).click();
    if (await page.locator('.cell-found').count()) break;
  }
  await expect(page.locator('.cell-found')).toHaveCount(1);
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','0');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax','1');
  await page.goto(fixture+'?game=motor-target&placement');
  await page.getByRole('button',{name:'Tocar diana de coordinación'}).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','0');
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax','1');
});

test('authentication dialog closes to home and restores focus from every mode', async ({page}) => {
  await page.goto(fixture+'?entry');
  const opener=page.getByRole('button',{name:'Comenzar',exact:true});
  await opener.click();
  await expect(page.getByRole('dialog',{name:'Te damos la bienvenida'})).toBeVisible();
  await page.getByRole('button',{name:'He olvidado mi contraseña'}).click();
  await expect(page.getByRole('dialog',{name:'Recupera tu contraseña'})).toBeVisible();
  await page.getByRole('button',{name:'Cerrar',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(opener).toBeFocused();
  await opener.click();
  await page.getByRole('button',{name:'Crear cuenta',exact:true}).click();
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
  await opener.click();
  await expect(page.getByRole('dialog').getByRole('button',{name:'Aviso legal',exact:true})).toHaveCount(0);
  await expect(page.getByRole('dialog').getByRole('button',{name:'Sobre NeuroIA',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Cerrar',exact:true}).click();
  await page.getByRole('button',{name:'Aviso legal',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Aviso legal',exact:true})).toBeVisible();
});


test('workspace link closes auth and reveals the corresponding home', async ({page}) => {
  await page.goto(fixture+'?entry');
  await page.getByRole('button',{name:'Comenzar',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'¿Eres un profesional?',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Un espacio para acompañar.'})).toBeVisible();
  await page.getByRole('button',{name:'Comenzar',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Volver al acceso personal',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Juega a tu ritmo.'})).toBeVisible();
});


test('today session checks only completed games from today', async ({page}) => {
  await page.goto(fixture+'?completed-home');
  await expect(page.getByRole('heading',{name:'Tu sesión de hoy',exact:true})).toBeVisible();
  await expect(page.locator('.editorial-today').getByText('Completado hoy',{exact:true})).toHaveCount(3);
  await expect(page.locator('.editorial-streak svg')).toHaveAttribute('fill', 'currentColor');
  await expect(page.getByRole('button',{name:'Realizar sesión completa'})).toHaveCount(0);
  for (const option of ['yesterday','practice']) {
    await page.goto(fixture+'?completed-home&'+option);
    await expect(page.locator('.editorial-today').getByText('Completado hoy',{exact:true})).toHaveCount(0);
    await expect(page.locator('.editorial-streak svg')).toHaveAttribute('fill', 'none');
  }
});

test('account deletion confirmation, subscription guard and keyboard dismissal at phone and desktop sizes', async ({page}) => {
  await page.route('**/src/services/accessService.ts*', async route => {
    const response=await route.fetch();
    const body=(await response.text()).replace(/export async function billingRequest\(path, body\)\s*\{/, `export async function billingRequest(path, body) { if (path === '/account/deletion-status') return location.search.includes('paid') ? {allowed:false,reason:'subscription'} : {allowed:true};`);
    await route.fulfill({response,body});
  });
  for(const width of [390,820,1280]) {
    await page.setViewportSize({width,height:900});
    await page.goto(fixture);
    await page.evaluate(async()=>{
      const {auth}=await import('/src/services/firebase.ts');
      await auth.authStateReady();
      Object.defineProperty(auth,'currentUser',{configurable:true,value:{email:'player@example.test',providerData:[{providerId:'password'}]}});
    });
    await page.getByRole('button',{name:'Ajustes de accesibilidad'}).click();
    await page.getByRole('tablist',{name:'Secciones de ajustes'}).getByRole('tab',{name:'Mi cuenta',exact:true}).click();
    await page.getByRole('button',{name:'Borrar cuenta',exact:true}).click();
    const modal=page.getByRole('dialog',{name:'Borrar cuenta',exact:true});
    await expect(modal.getByLabel('Escribe ELIMINAR MI CUENTA')).toBeVisible();
    await expect(modal.getByRole('button',{name:'Borrar mi cuenta'})).toBeDisabled();
    await modal.getByLabel('Escribe ELIMINAR MI CUENTA').fill('ELIMINAR MI CUENTA');
    await modal.getByLabel('Tu contraseña',{exact:true}).fill('example');
    await expect(modal.getByRole('button',{name:'Borrar mi cuenta'})).toBeEnabled();
    expect(await modal.evaluate(e=>e.scrollWidth <= e.clientWidth)).toBe(true);
    await page.screenshot({path:`/tmp/neuroia-delete-${width}.png`});
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
    await expect(page.getByRole('button',{name:'Borrar cuenta',exact:true})).toBeFocused();
  }
  await page.goto(fixture+'?paid');
  await page.getByRole('button',{name:'Ajustes de accesibilidad'}).click();
  await page.getByRole('tablist',{name:'Secciones de ajustes'}).getByRole('tab',{name:'Mi cuenta',exact:true}).click();
  await page.getByRole('button',{name:'Borrar cuenta',exact:true}).click();
  await expect(page.getByRole('button',{name:'Gestionar suscripción',exact:true})).toBeVisible();
  await expect(page.getByLabel('Escribe ELIMINAR MI CUENTA')).toHaveCount(0);
});

test('remaining trial uses continue wording and expired recreated accounts cannot start a new trial', async ({page}) => {
  for(const width of [390,820,1280]) {
    await page.setViewportSize({width,height:900});
    await page.goto(fixture+'?subscription&resume-trial');
    await expect(page.getByRole('button',{name:'Seguir prueba gratuita',exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:'Probar gratis 7 días'})).toHaveCount(0);
    await page.screenshot({path:`/tmp/neuroia-resume-trial-${width}.png`,fullPage:true});
    await page.getByRole('button',{name:'Seguir prueba gratuita'}).click();
    await expect(page.getByRole('heading',{name:/Juega a tu ritmo/})).toBeVisible();
  }
  await page.goto(fixture+'?subscription&used-trial');
  await expect(page.locator('.onboarding-trial-link')).toHaveCount(0);
});

test('game entry groups level with start and preserves the chosen level through help', async ({page}) => {
  for(const size of [{width:320,height:740},{width:390,height:844},{width:820,height:1180},{width:1280,height:800},{width:844,height:390},{width:390,height:844,large:true}]) {
    await page.setViewportSize(size);
    await page.goto(fixture+'?game=visual-scanning'+(size.large ? '&large' : ''));
    const start=page.getByRole('button',{name:'Empezar a jugar'});
    const levels=page.getByRole('group',{name:'Dificultad del juego'});
    const a=await start.boundingBox(), b=await levels.boundingBox();
    expect(Math.abs(a.y-b.y)).toBeLessThan(2);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await expect(page.locator('.game-instruction-screen .header-illustration')).toHaveCount(0);
    await page.getByRole('button',{name:'Subir nivel'}).click();
    await expect(levels).toContainText('Nivel 2');
    await page.screenshot({path:`/tmp/neuroia-game-entry-${size.width}.png`,fullPage:true});
    await start.click();
    await expect(page.locator('.viewport-session-footer')).toContainText('Nivel 2');
    await page.getByRole('button',{name:'Mostrar instrucciones'}).click();
    await page.getByRole('button',{name:'Continuar jugando'}).click();
    await expect(page.locator('.viewport-session-footer')).toContainText('Nivel 2');
    await page.getByRole('button',{name:'Volver',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Hola, Lucía.'})).toBeVisible();
  }
});


test('focus and valid-lease visibility never hide the game or open a pause dialog', async ({page}) => {
  test.setTimeout(60000);
  await page.clock.install();
  await page.route('**/src/services/accessService.ts*', async route => {
    const response=await route.fetch();
    const body=(await response.text()).replace(/async load\(\)\s*\{/, `async load() {
      window.accessReads=(window.accessReads||0)+1;
      if(window.delayAccess) await new Promise(resolve=>window.releaseAccess=resolve);
      if(window.failAccess) throw new Error('offline');
      return {active:!window.deniedAccess,serverNow:Date.now(),validForMs:60000,checkoutAvailable:true};`);
    await route.fulfill({response,body});
  });
  await page.goto(fixture+'?resume-game');
  await page.getByRole('button',{name:'Empezar a jugar'}).click();
  await page.locator('.game-session').evaluate(el=>el.dataset.preserved='yes');
  const timer=page.getByLabel('Tiempo de juego');
  await page.clock.runFor(1200);
  const before=await timer.textContent();
  await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,value:true});
    Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(3000);
  expect(await timer.textContent()).toBe(before);
  await page.evaluate(()=>{
    window.delayAccess=true;
    Object.defineProperty(document,'hidden',{configurable:true,value:false});
    Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const recovery=page.getByRole('dialog');
  await expect(recovery).toHaveCount(0);
  await expect(page.locator('.game-session')).toBeVisible();
  await page.clock.runFor(2000);
  expect(await timer.textContent()).not.toBe(before);
  await page.evaluate(()=>{window.delayAccess=false;window.releaseAccess();});
  await expect(recovery).toHaveCount(0);
  await expect(page.locator('.game-session')).toHaveAttribute('data-preserved','yes');
  await page.clock.runFor(1200);
  expect(await timer.textContent()).not.toBe(before);
  for(let i=0;i<3;i++) {
    await page.getByRole('button',{name:'Mostrar instrucciones'}).click();
    await page.getByRole('button',{name:'Continuar jugando'}).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await page.evaluate(()=>{window.failAccess=true;window.dispatchEvent(new Event('offline'));});
  await expect(recovery.getByRole('button',{name:'Reintentar'})).toBeVisible();
  await expect(page.locator('.game-session')).toBeVisible();
  expect(await page.locator('.game-session').evaluate(el=>!!el.closest('[inert]'))).toBe(true);
  await page.evaluate(()=>{window.failAccess=false;});
  await recovery.getByRole('button',{name:'Reintentar'}).click();
  await expect(recovery).toHaveCount(0);
  await expect(page.locator('.game-session')).toHaveAttribute('data-preserved','yes');
  for(const width of [390,820,1280]) {
    await page.setViewportSize({width,height:844});
    await expect(page.getByText('Tu actividad está pausada.')).toHaveCount(0);
    await page.screenshot({path:`/tmp/neuroia-no-pause-${width}.png`});
  }
  // Real expiry still blocks input; ordinary focus never invalidates a lease.
  const reads=await page.evaluate(()=>window.accessReads);
  for(let i=0;i<4;i++) await page.evaluate(()=>{window.dispatchEvent(new Event('blur'));window.dispatchEvent(new Event('focus'));});
  await page.clock.runFor(1000);
  expect(await page.evaluate(()=>window.accessReads)).toBe(reads);
  await expect(recovery).toHaveCount(0);
  await page.evaluate(()=>{window.delayAccess=true;});
  await page.clock.runFor(61000);
  await expect(recovery).toBeVisible();
  expect(await page.locator('.game-session').evaluate(el=>!!el.closest('[inert]'))).toBe(true);
  const expiredTime=await timer.textContent();
  await page.clock.runFor(2000);
  expect(await timer.textContent()).toBe(expiredTime);
  await page.evaluate(()=>{window.delayAccess=false;window.releaseAccess();});
  await expect(recovery).toHaveCount(0);
  await expect(page.getByText('Tu actividad está pausada.')).toHaveCount(0);
  await page.evaluate(()=>{window.deniedAccess=true;window.dispatchEvent(new Event('neuroia-access-changed'));});
  await expect(page.getByRole('button',{name:'Suscribirme'})).toBeVisible();
  await expect(page.locator('.game-session')).toHaveCount(0);
});

test('search fills three stages only after completing each board', async ({page}) => {
  await page.goto(fixture+'?game=visual-scanning');
  await page.getByRole('button',{name:'Empezar a jugar'}).click();
  const bar=page.getByRole('progressbar');
  await expect(bar).toHaveAttribute('aria-valuemax','3');
  for(let round=0;round<3;round++) {
    const cells=page.locator('.scanning-cell');
    const count=await cells.count();
    const boardBefore=await page.locator('.scanning-grid').boundingBox();
    for(let i=0;i<count;i++) {
      await cells.nth(i).click();
      if(await page.locator('.exercise-result').count()) break;
    }
    if(round<2) {
      await expect(bar).toHaveAttribute('aria-valuenow',String(round+1));
      expect(await bar.locator('i').evaluateAll(items=>items.filter(e=>e.style.width==='100%').length)).toBe(round+1);
    } else await expect(bar).toHaveCount(0);
    if(round<2) {
      const boardAfter=await page.locator('.scanning-grid').boundingBox();
      expect(boardAfter).toEqual(boardBefore);
      const button=page.getByRole('button',{name:'Continuar',exact:true});
      const buttonBox=await button.boundingBox();
      const board=await page.locator('.game-playground').boundingBox();
      expect(buttonBox.y).toBeGreaterThanOrEqual(board.y+board.height);
      expect(buttonBox.y-board.y-board.height).toBeLessThan(20);
      await page.screenshot({path:`/tmp/neuroia-stable-next-${round}.png`});
      await button.click();
    }
  }
  await expect(page.locator('.exercise-result')).toBeVisible();
});

test('every board fits below its fixed title and progress without page scrolling', async ({page}) => {
  for(const size of [{width:390,height:844},{width:820,height:1180},{width:844,height:390}]) {
    await page.setViewportSize(size);
    for(const mode of ['', '&placement']) for(const id of games) {
      await page.goto(fixture+'?game='+id+'&level=10'+mode);
      if(!mode) await page.getByRole('button',{name:'Empezar a jugar'}).click();
      await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1)).toBe(true);
      const header=await page.locator('.viewport-session-header').boundingBox();
      const title=await page.locator('.game-task-title').boundingBox();
      const bar=await page.locator('.game-stage-progress').boundingBox();
      expect(title.y-header.y-header.height).toBeLessThanOrEqual(24);
      expect(bar.y-title.y-title.height).toBeLessThanOrEqual(24);
      const area=await page.locator('.exercise-viewport').boundingBox();
      const board=await page.locator('.game-playground').boundingBox();
      expect(board.y+board.height).toBeLessThanOrEqual(area.y+area.height+2);
      await expect.poll(() => page.evaluate(() => {
        const board=document.querySelector('.game-playground').getBoundingClientRect();
        const area=document.querySelector('.exercise-viewport').getBoundingClientRect();
        const action=document.querySelector('.game-stage-action')?.getBoundingClientRect();
        const bottom=action ? action.bottom : board.bottom;
        return Math.abs((board.y+bottom)/2-(area.y+area.height/2));
      }), {message:`${id} ${size.width} ${mode}`}).toBeLessThanOrEqual(2);
      if(!mode) await page.screenshot({path:`/tmp/neuroia-fitted-${id}-${size.width}.png`});
    }
  }
});

test('search marks incorrect objects red and clears feedback on the next board', async ({page}) => {
  // Keep a known distractor before the final target, rather than depending on a random board.
  await page.addInitScript(() => { Math.random = () => 0.5; });
  for (const width of [390, 820, 1280]) {
    await page.setViewportSize({width,height:844});
    await page.goto(fixture+'?game=visual-scanning');
    await page.getByRole('button',{name:'Empezar a jugar'}).click();
    const cells = page.locator('.scanning-cell');
    for (let index=0; index<await cells.count(); index++) {
      await cells.nth(index).click();
      if (await page.locator('.cell-incorrect').count()) break;
    }
    const wrong=page.locator('.cell-incorrect').first();
    await expect(wrong).toHaveAttribute('aria-label','Este objeto no es el que buscas');
    await expect(wrong).toHaveCSS('background-color','rgb(244, 217, 211)');
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','0');
    await page.screenshot({path:`/tmp/neuroia-search-incorrect-${width}.png`});
    const boardBefore=await page.locator('.scanning-grid').boundingBox();
    for(let index=0;index<await cells.count();index++) await cells.nth(index).click();
    expect(await page.locator('.scanning-grid').boundingBox()).toEqual(boardBefore);
    const next=page.getByRole('button',{name:'Continuar',exact:true});
    const nextBox=await next.boundingBox();
    const board=await page.locator('.game-playground').boundingBox();
    expect(nextBox.y).toBeGreaterThanOrEqual(board.bottom ?? board.y+board.height);
    expect(nextBox.y-board.y-board.height).toBeLessThan(20);
    await page.screenshot({path:`/tmp/neuroia-next-reserved-${width}.png`});
    await next.click();
    await expect(page.locator('.cell-incorrect')).toHaveCount(0);
  }
});

test('daily home preserves its named three-game session after returning and reloading', async ({page}) => {
  await page.goto(fixture);
  const names=await page.locator('.editorial-today-games strong').allTextContents();
  const title=await page.locator('.editorial-hero h2').textContent();
  expect(names).toHaveLength(3);
  expect(new Set(names).size).toBe(3);
  expect(names).not.toContain(title);
  for(const width of [390,820,1280]) {
    await page.setViewportSize({width,height:844});
    await page.getByRole('button',{name:'Jugar',exact:true}).click();
    await expect(page.locator('#game-instruction-title')).toHaveText(names[0]);
    await page.getByRole('button',{name:'Volver',exact:true}).click();
    await expect(page.locator('.editorial-hero h2')).toHaveText(title);
    expect(await page.locator('.editorial-today-games strong').allTextContents()).toEqual(names);
    await page.screenshot({path:`/tmp/neuroia-named-session-${width}.png`});
  }
  await page.reload();
  await expect(page.locator('.editorial-hero h2')).toHaveText(title);
  expect(await page.locator('.editorial-today-games strong').allTextContents()).toEqual(names);
});

test('completion and level gain use compact responsive surfaces with working exits', async ({page}) => {
  await page.addInitScript(()=>{Math.random=()=>0.5;});
  for(const size of [{width:390,height:844},{width:820,height:1180},{width:1280,height:800},{width:844,height:390}]) {
    await page.setViewportSize(size);
    await page.goto(fixture+'?game=visual-scanning');
    await page.getByRole('button',{name:'Empezar a jugar'}).click();
    for(let round=0;round<3;round++) {
      const cells=page.locator('.scanning-cell');
      for(let i=0;i<await cells.count();i++) {
        await cells.nth(i).click();
        if(await page.locator('.exercise-result').count()) break;
      }
      if(round<2) await page.getByRole('button',{name:'Continuar',exact:true}).click();
    }
    await expect(page.getByRole('heading',{name:'Actividad completada'})).toBeVisible();
    await expect(page.locator('.result-message')).toHaveText('Busca la figura · Nivel 1');
    await expect(page.locator('.game-completion-art')).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1)).toBe(true);
    await page.screenshot({path:`/tmp/neuroia-completion-${size.width}.png`});
    await page.getByRole('button',{name:'Repetir',exact:true}).click();
    await expect(page.getByRole('button',{name:'Empezar a jugar'})).toHaveCount(0);
    await expect(page.locator('.scanning-grid')).toBeVisible();
    await page.goto(fixture+'?level-up');
    const trigger=page.getByRole('button',{name:'Simular resultado'});
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await trigger.click();
    const dialog=page.getByRole('dialog',{name:'Un nuevo nivel'});
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel('Has pasado del nivel 2 al nivel 3')).toBeVisible();
    await page.mouse.click(1,1);
    await expect(dialog).toBeVisible();
    await page.screenshot({path:`/tmp/neuroia-level-up-${size.width}.png`});
    await dialog.getByRole('button',{name:'Continuar',exact:true}).click();
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
});

test.describe('target miss feedback', () => {
  test.use({hasTouch:true});
  test('red circle follows mouse and touch misses without counting target taps twice', async ({page}) => {
    for (const size of [{width:390,height:844},{width:820,height:1180},{width:844,height:390}]) {
      await page.setViewportSize(size);
      await page.goto(fixture+'?game=motor-target');
      await page.getByRole('button',{name:'Empezar a jugar'}).click();
      const arena=page.locator('.motor-touch-arena');
      const bounds=await arena.boundingBox();
      const x=bounds.x+32, y=bounds.y+32;
      await page.mouse.click(x,y);
      const circle=page.locator('.motor-miss-circle');
      await expect(circle).toBeVisible();
      const mark=await circle.boundingBox();
      expect(Math.abs(mark.x+mark.width/2-x)).toBeLessThan(2);
      expect(Math.abs(mark.y+mark.height/2-y)).toBeLessThan(2);
      await expect(circle).toHaveCSS('border-top-color','rgb(170, 97, 86)');
      await page.screenshot({path:`/tmp/neuroia-target-miss-${size.width}.png`});
      await expect(circle).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
      await page.waitForTimeout(1000);
      await expect(circle).toHaveCount(1);
      await page.touchscreen.tap(x,y);
      await expect(circle).toHaveCount(2);
      const target=page.getByRole('button',{name:'Tocar diana de coordinación'});
      for(let hit=0;hit<5;hit++) {
        await expect(target).toBeVisible();
        await target.tap();
        await expect(circle).toHaveCount(hit === 4 ? 0 : 2);
      }
      await expect(page.getByRole('heading',{name:'Actividad completada'})).toBeVisible();
      const results=JSON.parse(await page.getByTestId('results').textContent());
      expect(results).toHaveLength(1);
      expect(results[0].correctAnswers).toBe(5);
      expect(results[0].totalQuestions).toBe(7);
    }
  });
});
