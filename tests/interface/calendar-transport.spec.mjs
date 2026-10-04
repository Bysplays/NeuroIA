import {test,expect} from '@playwright/test';
for(const cause of ['account-change','cancel'])test(`calendar transport rejects a late response after ${cause}`,async({page})=>{
  await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
  await page.route('**/calendar-transport-fixture',route=>route.fulfill({contentType:'text/html',body:'<html><body>Isolated calendar transport</body></html>'}));
  await page.route('**/src/services/firebase.ts*',route=>route.fulfill({contentType:'text/javascript',body:`export const auth={currentUser:{uid:'fixture',getIdToken:async()=> 'fixture-token'}};window.changeCalendarAccount=()=>auth.currentUser={uid:'other',getIdToken:async()=> 'other-token'};`}));
  await page.route('**/src/services/accessService.ts*',async route=>{
    const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace(/const billingUrl = [^;]+;/,'const billingUrl = "http://127.0.0.1:5198";')});
  });
  let release,requested=false;const pending=new Promise(resolve=>release=resolve);
  await page.route('**/practice/schedule/status',async route=>{requested=true;expect(route.request().headers().authorization).toBe('Bearer fixture-token');await pending;await route.fulfill({json:{enabled:true,serverNow:1,current:null}}).catch(()=>{});});
  await page.goto('/calendar-transport-fixture');
  await page.evaluate(async()=>{
    const {practiceScheduleService}=await import('/src/services/practiceScheduleService.ts');const controller=new AbortController();window.cancelCalendarRequest=()=>controller.abort();
    window.calendarOutcome='pending';practiceScheduleService.status(controller.signal).then(()=>window.calendarOutcome='delivered').catch(error=>window.calendarOutcome=error.name);
  });
  await expect.poll(()=>requested).toBe(true);
  await page.evaluate(cause=>cause==='cancel'?window.cancelCalendarRequest():window.changeCalendarAccount(),cause);release();
  await expect.poll(()=>page.evaluate(()=>window.calendarOutcome)).toBe('AbortError');
});
