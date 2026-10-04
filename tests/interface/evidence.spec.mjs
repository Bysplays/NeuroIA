import { test, expect } from '@playwright/test';
const events = page => page.evaluate(() => window.evidenceChunks.flatMap(chunk => JSON.parse(chunk.events)));
test.beforeEach(async ({page}) => {
  await page.route('**/*', route => ['127.0.0.1','localhost','fonts.googleapis.com','fonts.gstatic.com'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
});
test('evidence is opt-in and instruction exits are not attempts', async ({page}) => {
  await page.goto('/tests/interface/index.html?game=motor-target');
  await page.getByRole('button', {name:'Empezar a jugar'}).click();
  await page.locator('.motor-target-circle').click();
  expect(await events(page)).toEqual([]);
  await page.goto('/tests/interface/index.html?game=motor-target&evidence');
  await page.getByRole('button', {name:'Volver', exact:true}).click();
  expect(await events(page)).toEqual([]);
});
test('target evidence captures responses, completion and a separate repeated attempt', async ({page}) => {
  await page.goto('/tests/interface/index.html?game=motor-target&evidence');
  await page.getByRole('button', {name:'Empezar a jugar'}).click();
  const count = Number(await page.getByRole('progressbar').getAttribute('aria-valuemax'));
  for (let i = 0; i < count; i++) await page.locator('.motor-target-circle').click();
  await expect(page.getByRole('button', {name:'Repetir',exact:true})).toBeVisible();
  const first = await events(page);
  expect(first.filter(e => e.kind === 'start')).toHaveLength(1);
  expect(first.filter(e => e.kind === 'response')).toHaveLength(count);
  expect(first.filter(e => e.kind === 'response').every(e => e.correct && e.latencyMs >= 0)).toBe(true);
  expect(first.filter(e => e.kind === 'finish')).toHaveLength(1);
  expect(first.map(e => e.sequence)).toEqual(first.map((_, i) => i));
  await page.getByRole('button', {name:'Repetir',exact:true}).click();
  await page.locator('.motor-target-circle').click();
  await page.getByRole('button', {name:'Volver',exact:true}).click();
  const all = await events(page);
  expect(all.filter(e => e.kind === 'start')).toHaveLength(2);
  expect(all.filter(e => e.kind === 'finish')).toHaveLength(1);
  expect(all.filter(e => e.kind === 'abandon')).toMatchObject([{reason:'back'}]);
  expect(await page.evaluate(() => new Set(window.evidenceChunks.map(c => c.sessionId)).size)).toBe(2);
});
