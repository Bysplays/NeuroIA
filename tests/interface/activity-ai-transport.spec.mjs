import { test, expect } from '@playwright/test';
import { mockProfessional } from './professional-mocks.mjs';

for(const clientAttemptId of [undefined,'synthetic-report-id']) test(`AI transport rejects late account results with ${clientAttemptId?'correlated':'legacy'} requests`, async ({ page }) => {
  await page.route('**/*', route => ['127.0.0.1', 'localhost'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
  await page.route('**/ai-transport-fixture', route => route.fulfill({ contentType: 'text/html', body: '<html><body>Isolated transport fixture</body></html>' }));
  await page.route('**/src/services/firebase.ts*', route => route.fulfill({ contentType: 'text/javascript', body: `
    const listeners=new Set();
    export const auth={currentUser:{uid:'caller',getIdToken:async()=> 'fixture-token'},onAuthStateChanged(fn){listeners.add(fn);queueMicrotask(()=>fn(auth.currentUser));return()=>listeners.delete(fn)}};
    window.changeAiAccount=()=>{auth.currentUser={uid:'someone-else',getIdToken:async()=> 'other-token'};listeners.forEach(fn=>fn(auth.currentUser))};
  ` }));
  // Use a local fake service URL even when the developer has no billing .env.
  await page.route('**/src/services/activityAi.ts*', async route => {
    const source = await route.fetch();
    const body = (await source.text()).replace(/const serviceUrl = [^;]+;/, 'const serviceUrl = "http://127.0.0.1:5198";');
    await route.fulfill({ response: source, body });
  });
  let release, body;
  const pending = new Promise(resolve => { release = resolve; });
  await page.route('**/ai/analyze', async route => {
    body = route.request().postDataJSON();
    expect(route.request().headers().authorization).toBe('Bearer fixture-token');
    await pending;
    await route.fulfill({ json: {} }).catch(() => {});
  });
  await page.goto('/ai-transport-fixture');
  await page.evaluate(async clientAttemptId => {
    const { activityAi } = await import('/src/services/activityAi.ts');
    window.aiOutcome = 'pending';
    activityAi.generate('target', { from: '', to: '', domain: '', exercise: '', timeZone: 'Europe/Madrid' }, 'report', new AbortController().signal,clientAttemptId)
      .then(() => window.aiOutcome = 'delivered').catch(error => window.aiOutcome = error.name);
  },clientAttemptId);
  await expect.poll(() => body?.targetUid).toBe('target');
  expect(Object.keys(body).sort()).toEqual(['consent', 'filters', 'mode', 'targetUid',...(clientAttemptId?['clientAttemptId']:[])].sort());
  expect(body.clientAttemptId).toBe(clientAttemptId);
  await page.evaluate(() => window.changeAiAccount());
  release();
  await expect.poll(() => page.evaluate(() => window.aiOutcome)).toBe('AbortError');
});

test('professional report downloads directly with its local participant reference', async ({ page }) => {
  await mockProfessional(page);
  await page.route('**/src/services/firestoreProfessional.ts*', route => route.fulfill({ contentType: 'text/javascript', body: `
    export function firestoreProfessional(){return {subscribeSeats(next){next([{id:'fixture-seat',status:'active',expiresAt:Date.now()+86400000,occupantUid:'fixture-player',patientName:'Ana',invitationCode:'NIA-TEST-AA'}]);return()=>{}},subscribeActivity(uid,next){next({name:'Ana',history:[{id:'x',exerciseId:'memory-pairs',domain:'memory',date:'2026-09-20',durationSeconds:30,correctAnswers:1,totalQuestions:1}]});return()=>{}}}}
  ` }));
  await page.route('**/src/services/activityAi.ts*', route => route.fulfill({ contentType: 'text/javascript', body: 'export const activityAi={async status(){return {available:false}},async generate(){throw Error("Do not send data")}};export function downloadActivityReport(){}' }));
  await page.goto('/tests/interface/index.html?professional');
  await page.getByRole('button', { name: 'Ver actividad de Ana' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Generar informe' }).click();
  await (await download).saveAs('/tmp/neuroia-informe-profesional.pdf');
  await page.getByRole('dialog').getByRole('button', {name:'Entendido'}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
