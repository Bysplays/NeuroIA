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
    await expect(page.getByRole('heading',{name:/Jugar también/})).toBeVisible();
    const image = page.locator('.project-funding > img');
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(e=>e.complete && e.naturalWidth > 0)).toBe(true);
    await page.getByText('Leer la información en texto',{exact:true}).click();
    await expect(page.getByText('IG408M-2026-000-000102',{exact:true})).toBeVisible();
    await page.screenshot({path:`/tmp/calma-funding-${size.width}.png`,fullPage:true});
    await page.getByRole('button',{name:'Sobre NeuroIA',exact:true}).click();
    await expect(page.getByRole('dialog').locator('.project-funding')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button',{name:'Sobre NeuroIA',exact:true})).toBeFocused();
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
    if(i===0) await expect(page.getByRole('status').filter({hasText:'Bien hecho. Sigue a tu ritmo.'})).toBeVisible();
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
