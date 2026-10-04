import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{
  await page.route('**/*',route=>['127.0.0.1','localhost','fonts.googleapis.com','fonts.gstatic.com'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
});
for(const locked of [false,true]) test(`learned policy applies only after completion and protects assigned levels: ${locked}`,async({page})=>{
  await page.goto(`/tests/interface/index.html?game=motor-target&level=5&evidence&adaptive${locked?'&assigned':''}`);
  await page.getByRole('button',{name:'Empezar a jugar'}).click();
  const count=9;
  for(let i=0;i<count-1;i++) await page.locator('.motor-target-circle').click();
  expect(JSON.parse(await page.getByTestId('levels').textContent())['motor-target'].level).toBe(5);
  await page.locator('.motor-target-circle').click();
  const results=JSON.parse(await page.getByTestId('results').textContent());
  expect(results).toHaveLength(1);
  const audit=JSON.parse(results[0].adaptation);
  expect(audit.reason).toBe(locked?'professional':'policy');
  expect(audit.fromLevel).toBe(5);expect(audit.trainingData).toBe('synthetic');
  expect(audit.observation).toHaveLength(40);
  expect(audit.inferenceMs).toBeLessThan(1000);
  const level=JSON.parse(await page.getByTestId('levels').textContent())['motor-target'].level;
  expect(level).toBe(locked?5:audit.nextLevel);
  if(!locked) {
    expect(level).toBe(6);
    await page.getByRole('button',{name:'Volver al inicio',exact:true}).click();
    await page.getByRole('tab',{name:'Juegos',exact:true}).click();
    await page.getByRole('button',{name:'Coordinación',exact:true}).click();
    await page.getByRole('button',{name:/Toca la diana/}).click();
    await page.getByRole('button',{name:'Empezar a jugar'}).click();
    await expect(page.locator('.viewport-session-footer')).toContainText('Nivel 6');
    await page.screenshot({path:'/tmp/neuroia-policy-new-entry.png'});
  }
});
