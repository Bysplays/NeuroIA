import { test, expect } from '@playwright/test';
const fixture = '/tests/interface/index.html';
test.beforeEach(async ({page}) => {
  await page.route('**/*', route => ['127.0.0.1','localhost','fonts.googleapis.com','fonts.gstatic.com'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
});
const next = page => page.getByRole('button', {name:'Continuar',exact:true});
const begin = page => page.getByRole('button', {name:'Comenzar',exact:true});
const repeat = page => page.getByRole('button', {name:'Repetir',exact:true});
async function artworkReady(page) {
  await page.evaluate(async () => {
    const urls = new Set([...document.querySelectorAll('.game-object')].flatMap(e => [...getComputedStyle(e).backgroundImage.matchAll(/url\(["']?(.*?)["']?\)/g)].map(m => m[1])));
    await Promise.all([...urls].map(url => new Promise((resolve,reject) => { const image = new Image(); image.onload = resolve; image.onerror = reject; image.src = url; })));
    await Promise.all([...document.images].filter(image => image.loading !== 'lazy').map(image => image.decode()));
  });
}
async function launch(page, id, suffix='') {
  await page.goto(`${fixture}?game=${id}${suffix}`);
  if(!suffix.includes('placement')) await page.getByRole('button',{name:'Empezar a jugar'}).click();
}
async function demo(page) {
  await page.evaluate(()=>{
    window.sequence=[];
    window.observer?.disconnect();
    window.observer=new MutationObserver(records=>{
      for(const record of records) if(record.target.matches('.memory-tile.tile-active')) window.sequence.push(record.target.getAttribute('aria-label'));
    });
    window.observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
  });
  await begin(page).click();
  await expect(page.getByRole('button',{name:'Reproduciendo'})).toBeDisabled();
  await page.clock.runFor(6000);
  await page.evaluate(()=>window.observer.disconnect());
  return page.evaluate(()=>window.sequence);
}
test('sequence repeats the same partial attempt and marks failure until Continue',async({page})=>{
  await page.clock.install();
  await launch(page,'memory-path','&level=4');
  const sequence=await demo(page);
  expect(sequence.length).toBeGreaterThanOrEqual(2);
  await page.getByRole('button',{name:sequence[0],exact:true}).click();
  await repeat(page).click();
  await expect(page.getByRole('button',{name:'Reproduciendo'})).toBeDisabled();
  await page.clock.runFor(6000);
  for(const label of sequence) await page.getByRole('button',{name:label,exact:true}).click();
  await expect(page.locator('.sequence-incorrect')).toHaveCount(0);
  await next(page).click();
  const second=await demo(page);
  const wrong=page.locator('.memory-tile').filter({hasNotText:second[0]}).first();
  await wrong.click();
  await expect(page.locator('.sequence-incorrect')).toBeVisible();
  await expect(page.locator('.sequence-correct')).toBeVisible();
  await expect(page.locator('.sequence-incorrect')).toHaveCSS('background-color','rgb(244, 217, 211)');
  await expect(page.locator('.sequence-correct')).toHaveCSS('background-color','rgb(220, 238, 226)');
  expect(JSON.parse(await page.getByTestId('results').textContent())).toHaveLength(0);
  await next(page).click();
  const result=JSON.parse(await page.getByTestId('results').textContent());
  expect(result).toHaveLength(1);
  expect(result[0].accuracy).toBe(0);
  expect(result[0].correctAnswers).toBe(1);
});
test('pairs have three solo boards and one grouped board with restartable current preview',async({page})=>{
  await page.clock.install();
  for(const suffix of ['', '&plan', '&placement', '&assigned&plan']) {
    await launch(page,'memory-pairs',suffix);
    const rounds=suffix ? 1 : 3;
    for(let round=0;round<rounds;round++) {
      await expect(page.locator('.pairs-stat-pill')).toHaveCount(0);
      await expect(page.locator('.tile-flipped')).toHaveCount(0);
      await expect(page.locator('.memory-card-tile').first()).toBeDisabled();
      const actionBox=await begin(page).boundingBox();
      await begin(page).click();
      const labels=await page.locator('.memory-card-tile').evaluateAll(cards=>cards.map(c=>c.getAttribute('aria-label')));
      if(round===0) {
        await page.clock.runFor(1000);
        await expect(page.getByRole('button',{name:/Ocultar/})).toBeVisible();
      }
      await page.getByRole('button',{name:/Ocultar/}).click();
      await page.locator('.memory-card-tile').first().click();
      await repeat(page).click();
      expect(await page.locator('.memory-card-tile').evaluateAll(cards=>cards.map(c=>c.getAttribute('aria-label')))).toEqual(labels);
      await page.clock.runFor(10000);
      await expect(page.locator('.tile-flipped')).toHaveCount(0);
      const groups=Map.groupBy(labels.map((label,index)=>({label,index})), item=>item.label);
      for(const pair of groups.values()) for(const {index} of pair) await page.locator('.memory-card-tile').nth(index).click();
      await expect(next(page)).toBeVisible();
      expect(await next(page).boundingBox()).toEqual(actionBox);
      await next(page).click();
    }
    const results=JSON.parse(await page.getByTestId('results').textContent());
    expect(results).toHaveLength(1);
    expect(results[0].correctAnswers).toBe(rounds*2);
    expect(results[0].accuracy).toBe(100);
    await expect(page.getByRole('progressbar')).toHaveCount(0);
  }
});
test('target progression is solo only; repetition keeps selected level and starts immediately',async({page})=>{
  for(const suffix of ['', '&plan', '&placement', '&assigned&plan']) {
    await launch(page,'motor-target',suffix);
    const bar=page.getByRole('progressbar');
    const before=await bar.getAttribute('aria-valuenow');
    await page.locator('.motor-target-circle').click();
    await expect(bar).toHaveAttribute('aria-valuenow',String(Number(before)+(suffix?0:1)));
  }
  await page.goto(`${fixture}?game=motor-target`);
  await page.getByRole('button',{name:'Subir nivel'}).click();
  await page.getByRole('button',{name:'Empezar a jugar'}).click();
  for(let repeatIndex=0;repeatIndex<2;repeatIndex++) {
    const count=Number(await page.getByRole('progressbar').getAttribute('aria-valuemax'));
    for(let i=0;i<count;i++) await page.locator('.motor-target-circle').click();
    await expect(page.locator('.result-message')).toContainText('Nivel 2');
    await expect(page.getByRole('progressbar')).toHaveCount(0);
    const a=await repeat(page).boundingBox(),b=await page.getByRole('button',{name:'Volver al inicio'}).boundingBox();
    expect(Math.abs(a.width-b.width)).toBeLessThan(1);
    expect(Math.abs(a.height-b.height)).toBeLessThan(1);
    await repeat(page).click();
    await expect(page.locator('.motor-target-circle')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('.viewport-session-footer')).toContainText('Nivel 2');
  }
});
test('tracking contact follows dragging from outside to inside and back',async({page})=>{
  const time=new Date('2026-10-04T12:00:00Z');
  await page.clock.install({time});
  await page.clock.pauseAt(time);
  await launch(page,'motor-tracking');
  const arena=await page.locator('.motor-tracking-arena').boundingBox();
  const target=page.locator('.tracking-target');
  await page.mouse.move(arena.x+10,arena.y+10);
  await page.mouse.down();
  await page.clock.runFor(100);
  await expect(target).not.toHaveClass(/target-contacted/);
  const box=await target.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.clock.runFor(100);
  await expect(target).toHaveClass(/target-contacted/);
  const percent=await page.locator('.tracking-percent').textContent();
  await page.mouse.move(arena.x+10,arena.y+10);
  await page.clock.runFor(1000);
  await expect(target).not.toHaveClass(/target-contacted/);
  expect(await page.locator('.tracking-percent').textContent()).toBe(percent);
  await page.mouse.up();
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:arena.x+10,y:arena.y+10}]});
  await page.clock.runFor(100);
  await expect(target).not.toHaveClass(/target-contacted/);
  const touchBox=await target.boundingBox();
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:touchBox.x+touchBox.width/2,y:touchBox.y+touchBox.height/2}]});
  await page.clock.runFor(100);
  await expect(target).toHaveClass(/target-contacted/);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:arena.x+10,y:arena.y+10}]});
  await page.clock.runFor(100);
  await expect(target).not.toHaveClass(/target-contacted/);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await target.focus();
  await page.keyboard.down('Space');
  await page.clock.runFor(100);
  await expect(target).toHaveClass(/target-contacted/);
  await page.keyboard.up('Space');
  await expect(target).not.toHaveClass(/target-contacted/);
});
for(const size of [{width:390,height:844},{width:820,height:1180},{width:1280,height:800},{width:844,height:390}]) {
  test(`stable Continue controls and memory feedback at ${size.width}`,async({page})=>{
    await page.setViewportSize(size);
    await page.clock.install();
    for(const [id,selector] of [['language-naming','.naming-option-btn'],['word-completion','.letter-option-btn'],['categorization','.category-bin-card']]) {
      await launch(page,id);
      const board=await page.locator('.game-playground').boundingBox();
      if(id==='word-completion') {
        const style=await page.locator(selector).first().evaluate(el=>{const s=getComputedStyle(el);return [s.transform,s.backgroundColor,s.borderColor,s.boxShadow];});
        await page.locator(selector).first().hover();
        await page.clock.runFor(500);
        expect(await page.locator(selector).first().evaluate(el=>{const s=getComputedStyle(el);return [s.transform,s.backgroundColor,s.borderColor,s.boxShadow];})).toEqual(style);
      }
      await page.locator(selector).first().click();
      const button=await next(page).boundingBox();
      expect(button.y).toBeGreaterThanOrEqual(board.y + board.height);
      expect(button.y - board.y - board.height).toBeLessThan(20);
      const after=await page.locator('.game-playground').boundingBox();
      expect(Math.abs(board.y-after.y)).toBeLessThan(2);
      await page.clock.runFor(350);
      await page.screenshot({animations:'disabled',path:`/tmp/neuroia-controls-${id}-${size.width}.png`});
    }
    await launch(page,'memory-path');
    const playbackBox=await begin(page).boundingBox();
    const sequence=await demo(page);
    await page.locator('.memory-tile').filter({hasNotText:sequence[0]}).first().click();
    expect(await next(page).boundingBox()).toEqual(playbackBox);
    await page.clock.runFor(350);
    await expect(repeat(page)).toHaveCount(0);
    await page.screenshot({animations:'disabled',path:`/tmp/neuroia-sequence-feedback-${size.width}.png`});
    await launch(page,'memory-pairs');
    await begin(page).click();
    await artworkReady(page);
    await page.clock.runFor(350);
    await page.screenshot({path:`/tmp/neuroia-pairs-preview-${size.width}.png`,animations:'disabled'});
    await launch(page,'motor-target');
    const arena=await page.locator('.motor-touch-arena').boundingBox();
    await page.mouse.click(arena.x+20,arena.y+20);
    await page.locator('.motor-target-circle').click();
    await page.clock.runFor(2000);
    await page.screenshot({path:`/tmp/neuroia-target-persistent-${size.width}.png`});
  });
}
