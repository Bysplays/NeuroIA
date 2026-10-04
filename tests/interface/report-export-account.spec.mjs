import {test,expect} from '@playwright/test';
test('actual report export is scoped to its initiating account and rejects a late result after identity change',async({page})=>{
  const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
  await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
  await page.route('**/src/services/firebase.ts*',route=>route.fulfill({contentType:'text/javascript',body:`
    import {initializeApp} from '/node_modules/.vite/deps/firebase_app.js';
    const observers=new Set();
    export const auth={app:initializeApp({apiKey:'demo-key',projectId:'demo-neuroia'},'report-export'),currentUser:{uid:'fixture-owner'},onAuthStateChanged(fn){observers.add(fn);queueMicrotask(()=>fn(auth.currentUser));return()=>observers.delete(fn)}};
    window.changeReportAccount=()=>{auth.currentUser={uid:'different-owner'};observers.forEach(fn=>fn(auth.currentUser))};
  `}));
  await page.route('**/src/services/reportEvidenceArchive.ts*',route=>route.fulfill({contentType:'text/javascript',body:`
    export async function loadReportEvidenceExport(db,uid,serverPage,signal){window.reportRequestedUid=uid;
      await new Promise(resolve=>window.finishAccountReport=resolve);signal.throwIfAborted();return {version:1};}
  `}));
  await page.route('**/tests/interface/fixture.tsx*',route=>route.fulfill({contentType:'text/javascript',body:`
    import React from '/node_modules/.vite/deps/react.js';
    import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
    import {ReportEvidenceExportButton} from '/src/components/ReportEvidenceExportButton.tsx';
    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(ReportEvidenceExportButton));
  `}));
  let downloads=0;page.on('download',()=>downloads++);
  await page.goto('/tests/interface/index.html');
  await page.getByRole('button',{name:'Exportar registro de informes'}).click();
  await expect.poll(()=>page.evaluate(()=>window.reportRequestedUid)).toBe('fixture-owner');
  await page.evaluate(()=>{window.changeReportAccount();window.finishAccountReport();});
  await expect(page.getByRole('alert')).toBeVisible();expect(downloads).toBe(0);expect(pageErrors).toEqual([]);
});
