import {test,expect} from '@playwright/test';
for(const action of ['success','account-change','cancel'])test(`report appendix archive ${action}`,async({page})=>{
 await page.route('**/*',r=>['127.0.0.1','localhost'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());
 await page.route('**/report-response-fixture',r=>r.fulfill({contentType:'text/html',body:'<html><body>Isolated report response test</body></html>'}));
 await page.route('**/src/services/firebase.ts*',r=>r.fulfill({contentType:'text/javascript',body:`import {initializeApp} from '/node_modules/.vite/deps/firebase_app.js';export const auth={app:initializeApp({apiKey:'demo-key',projectId:'demo-neuroia'},'report-responses'),currentUser:{uid:'caller'}};window.changeCaller=()=>auth.currentUser={uid:'other'};`}));
 await page.route('**/src/services/evidenceArchive.ts*',r=>r.fulfill({contentType:'text/javascript',body:`export async function loadEvidenceExport(db,uid,signal){window.target=uid;await new Promise(resolve=>window.releaseResponses=resolve);return {coverage:{complete:true,malformedDocuments:0},attempts:[]}};`}));
 await page.goto('/report-response-fixture');
 await page.evaluate(async()=>{const {loadReportResponses}=await import('/src/services/reportResponses.ts');const controller=new AbortController();window.cancelResponses=()=>controller.abort();window.outcome='pending';loadReportResponses('participant',controller.signal).then(data=>{window.outcome='success';window.metrics=data;}).catch(error=>window.outcome=error.name);});
 await expect.poll(()=>page.evaluate(()=>window.target)).toBe('participant');
 await page.evaluate(action=>{if(action==='cancel')window.cancelResponses();if(action==='account-change')window.changeCaller();window.releaseResponses();},action);
 await expect.poll(()=>page.evaluate(()=>window.outcome)).toBe(action==='success'?'success':'AbortError');
 if(action==='success')expect(await page.evaluate(()=>window.metrics)).toEqual({complete:true,includedSessions:0,excluded:0,malformed:0,rows:[]});
});
