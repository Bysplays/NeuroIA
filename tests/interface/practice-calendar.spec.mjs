import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
async function open(page,{professional=false,lostAck=false}={}) {
  await page.route('**/*',route=>['127.0.0.1','localhost','fonts.googleapis.com','fonts.gstatic.com'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
  await page.route('**/src/services/firebase.ts*',route=>route.fulfill({contentType:'text/javascript',body:`
    import {initializeApp} from '/node_modules/.vite/deps/firebase_app.js';
    export const auth={app:initializeApp({apiKey:'demo-key',projectId:'demo-neuroia'},'calendar-fixture'),currentUser:{uid:'${professional?'professional':'fixture'}'}};
  `}));
  await page.route('**/src/services/practiceScheduleService.ts*',route=>route.fulfill({contentType:'text/javascript',body:`
    const now=Date.parse('2026-10-04T12:00:00Z');
    window.calendarRows=[{version:1,revision:1,timeZone:'Europe/Madrid',createdAt:Date.parse('2026-10-01T12:00:00Z'),effectiveFrom:'2026-10-02',daysMask:127,dailyExercises:1}];
    window.calendarRequests=[];const receipts=new Set();let lose=${lostAck};
    export const practiceScheduleService={async status(){return {enabled:true,serverNow:now,current:window.calendarRows.at(-1)}},async update(input){
      window.calendarRequests.push(input);
      if(!receipts.has(input.operationId)){
        if(input.baseRevision!==window.calendarRows.at(-1).revision)throw Error('Conflicto de versión');
        window.calendarRows.push({version:1,revision:input.baseRevision+1,timeZone:input.timeZone,createdAt:now,effectiveFrom:'2026-10-05',daysMask:input.daysMask,dailyExercises:input.dailyExercises});receipts.add(input.operationId);
      }
      if(lose){lose=false;throw Error('Se ha perdido la respuesta. Puedes reintentar el mismo cambio.');}return {revision:window.calendarRows.at(-1).revision};
    }};
  `}));
  await page.route('**/src/services/practiceScheduleArchive.ts*',route=>route.fulfill({contentType:'text/javascript',body:`
    import {calculateAdherence} from '/src/services/practiceSchedule.ts';
    export async function loadPracticeAdherence(db,uid,asOf,signal){signal.throwIfAborted();return {revisions:structuredClone(window.calendarRows),adherence:calculateAdherence(window.calendarRows,[{id:'fixture-result',exerciseId:'motor-target',date:'2026-10-02',correctAnswers:1,totalQuestions:1,durationSeconds:30}],{asOf,complete:true})};}
  `}));
  await page.route('**/tests/interface/fixture.tsx*',route=>route.fulfill({contentType:'text/javascript',body:`
    import React from '/node_modules/.vite/deps/react.js';import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
    import {PracticeCalendar} from '/src/components/PracticeCalendar.tsx';
    import '/src/index.css';import '/src/interface.css';import '/src/games.css';
    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement('main',{className:'main-content'},React.createElement(PracticeCalendar,{uid:'fixture'})));
  `}));
  await page.goto('/tests/interface/index.html');
}
for(const width of [390,820,1280])test(`prospective calendar edits, pauses and exports preserve historical days at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:1000});await open(page);
  await expect(page.getByText('1 de 2 días previstos cumplidos · 50 %')).toBeVisible();
  await page.getByLabel('Lunes',{exact:true}).uncheck();
  await page.getByRole('button',{name:'Guardar calendario'}).click();
  await expect(page.getByRole('status')).toContainText('5/10/2026');
  await page.getByRole('button',{name:'Pausar desde mañana'}).click();
  await expect(page.getByText(/Calendario en pausa/)).toBeVisible();
  await expect(page.getByText('1 de 2 días previstos cumplidos · 50 %')).toBeVisible();
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar calendario y cumplimiento'}).click();
  const data=JSON.parse(await readFile(await (await download).path(),'utf8'));
  expect(data.revisions).toHaveLength(3);expect(data.adherence.plannedDays).toBe(2);expect(data.revisions.at(-1).daysMask).toBe(0);
  await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Exportar calendario y cumplimiento'})).toBeFocused();
  await page.screenshot({path:`/tmp/neuroia-calendar-${width}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('lost schedule acknowledgment retries the same operation without adding another revision',async({page})=>{
  await open(page,{lostAck:true});await page.getByRole('button',{name:'Guardar calendario'}).click();
  await expect(page.getByRole('alert')).toContainText('confirmar');
  await page.getByRole('button',{name:'Guardar calendario'}).click();await expect(page.getByRole('status')).toContainText('Cambio guardado');
  expect(await page.evaluate(()=>window.calendarRows.length)).toBe(2);
  expect(await page.evaluate(()=>window.calendarRequests[0].operationId===window.calendarRequests[1].operationId)).toBe(true);
});
test('linked professional sees adherence but cannot edit the participant calendar',async({page})=>{
  await open(page,{professional:true});await expect(page.getByText('1 de 2 días previstos cumplidos · 50 %')).toBeVisible();
  await expect(page.getByRole('button',{name:'Guardar calendario'})).toHaveCount(0);await expect(page.getByRole('checkbox')).toHaveCount(0);
});
test('large text and high contrast keep calendar choices inside their touch targets',async({page})=>{
  await page.setViewportSize({width:390,height:844});await open(page);
  await page.evaluate(async()=>{const {applyAppearance}=await import('/src/services/appearance.ts');applyAppearance({fontSize:'xlarge',contrast:'high-contrast',handDominance:'right',pageStyle:'default'});});
  const monday=page.getByLabel('Lunes',{exact:true});await monday.focus();await page.keyboard.press('Space');await expect(monday).not.toBeChecked();
  expect(await page.locator('.practice-calendar-days label').evaluateAll(labels=>labels.every(label=>label.scrollWidth<=label.clientWidth&&label.getBoundingClientRect().height>=48))).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'/tmp/neuroia-calendar-large-contrast.png',fullPage:true});
});
