import {test,expect} from '@playwright/test';
async function open(page,{failure=false}={}){
 await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
 await page.route('**/src/services/firebase.ts*',route=>route.fulfill({contentType:'text/javascript',body:`import {initializeApp} from '/node_modules/.vite/deps/firebase_app.js';export const auth={app:initializeApp({apiKey:'demo-key',projectId:'demo-neuroia'},'responses'),currentUser:{uid:'fixture'}};window.switchAccount=()=>auth.currentUser={uid:'other'};`}));
 await page.route('**/src/services/evidenceArchive.ts*',route=>route.fulfill({contentType:'text/javascript',body:`
 import {createSessionEvidence} from '/src/services/sessionEvidence.ts';import {buildEvidenceExport} from '/src/services/evidenceExport.ts';
 let fail=${failure};export async function loadEvidenceExport(db,uid,signal){await new Promise(r=>setTimeout(r,100));signal.throwIfAborted();if(fail){fail=false;throw Error('offline');}
 const chunks=[];let now=0;const r=createSessionEvidence({sessionId:'fixture',exerciseId:'language-naming',activeNow:()=>now,sink:c=>chunks.push(c)});r.start(2,'normal',false);r.present('q',2);now=1500;r.hint();r.respond(false,false);now=4000;r.respond(true);r.finish('result');return buildEvidenceExport(chunks,[{id:'result',evidenceSessionId:'fixture',exerciseId:'language-naming'}],true);}
 `}));
 await page.route('**/tests/interface/fixture.tsx*',route=>route.fulfill({contentType:'text/javascript',body:`import React from '/node_modules/.vite/deps/react.js';import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';import {ResponseMetrics} from '/src/components/ResponseMetrics.tsx';import '/src/index.css';import '/src/interface.css';import '/src/games.css';ReactDOM.createRoot(document.getElementById('root')).render(React.createElement('main',{className:'main-content'},React.createElement(ResponseMetrics,{uid:'fixture'})));`}));
 await page.goto('/tests/interface/index.html');
}
for(const width of [390,820,1280])test(`measured response UI loads actual validated evidence at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await open(page);await page.getByRole('button',{name:'Consultar respuestas medidas'}).click();
 await expect(page.getByRole('heading',{name:'Ponle nombre · Nivel 2'})).toBeVisible();
 await expect(page.locator('dd').nth(1)).toHaveText('2');await expect(page.locator('dd').nth(2)).toHaveText('2 s');await expect(page.locator('dd').nth(3)).toHaveText('1');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`/tmp/neuroia-responses-${width}.png`,fullPage:true});
});
test('failed load is retryable and late account response is rejected',async({page})=>{
 await open(page,{failure:true});await page.getByRole('button',{name:'Consultar respuestas medidas'}).click();await expect(page.getByRole('alert')).toBeVisible();
 await page.getByRole('button',{name:'Consultar respuestas medidas'}).click();await expect(page.getByRole('heading',{name:'Ponle nombre · Nivel 2'})).toBeVisible();
 await page.getByRole('button',{name:'Actualizar respuestas medidas'}).click();await page.evaluate(()=>window.switchAccount());await expect(page.getByRole('alert')).toBeVisible();await expect(page.locator('.response-metrics-list article')).toHaveCount(0);
});
