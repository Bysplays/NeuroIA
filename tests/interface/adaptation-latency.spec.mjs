import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';

// Real game input -> feature observation -> learned actor -> progress reducer ->
// React commit. The fixture uses the production reducer but no cloud adapter.
// Keep that boundary explicit: this is not BLE acquisition or server durability.
for(const {width,slowdown} of [{width:390,slowdown:1},{width:820,slowdown:1},{width:1280,slowdown:1},{width:820,slowdown:4}]){
 test(`adaptive frontend pipeline at ${width}px, CPU throttle ${slowdown}`,async({page},testInfo)=>{
  test.setTimeout(60000);
  await page.setViewportSize({width,height:900});
  await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:slowdown});
  const samples=[];
  for(let run=0;run<5;run++){
   await page.goto('/tests/interface/index.html?game=motor-target&level=5&evidence&adaptive');
   await page.getByRole('button',{name:'Empezar a jugar'}).click();
   for(let i=0;i<8;i++)await page.locator('.motor-target-circle').click();
   expect(JSON.parse(await page.getByTestId('levels').textContent())['motor-target'].level).toBe(5);
   await page.evaluate(()=>{
    const levels=document.querySelector('[data-testid="levels"]');
    let started=null,committed=null,completed=false;
    window.latencySample=null;
    const onInput=event=>{
     if(event.target instanceof Element&&event.target.closest('.motor-target-circle')){
      started=performance.now();document.removeEventListener('click',onInput,true);
     }
    };
    document.addEventListener('click',onInput,true);
    const observer=new MutationObserver(()=>{
     if(started===null||completed)return;
     const next=JSON.parse(levels.textContent)['motor-target'].level;
     if(next===5)return;
     completed=true;committed=performance.now();observer.disconnect();
     // Two animation frames bracket one browser paint opportunity after commit;
     // this is not a physical display/sensor timestamp.
     requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const results=JSON.parse(document.querySelector('[data-testid="results"]').textContent);
      window.latencySample={inputToCommitMs:committed-started,inputToPaintOpportunityMs:performance.now()-started,nextLevel:next,audit:JSON.parse(results.at(-1).adaptation)};
     }));
    });
    observer.observe(levels,{childList:true,characterData:true,subtree:true});
   });
   await page.locator('.motor-target-circle').click();
   await expect.poll(()=>page.evaluate(()=>window.latencySample)).not.toBeNull();
   const sample=await page.evaluate(()=>window.latencySample);
   expect(sample.audit.reason).toBe('policy');expect(sample.nextLevel).toBe(sample.audit.nextLevel);expect(sample.nextLevel).toBe(6);
   expect(sample.inputToCommitMs).toBeGreaterThanOrEqual(sample.audit.inferenceMs);
   expect(sample.inputToPaintOpportunityMs).toBeGreaterThanOrEqual(sample.inputToCommitMs);
   samples.push(sample);
  }
  const ordered=samples.map(row=>row.inputToPaintOpportunityMs).sort((a,b)=>a-b);
  const result={version:1,generatedAt:new Date().toISOString(),scope:'synthetic game input to local default-level commit and browser paint opportunity; excludes BLE, cloud durability and waiting to enter another game',browser:page.context().browser().version(),viewport:{width,height:900},cpuThrottle:slowdown,samples,summary:{medianMs:ordered[2],maxMs:ordered.at(-1),allUnderOneSecond:ordered.every(ms=>ms<1000)},hardwareAcceptance:false};
  const output=`/tmp/neuroia-adaptation-pipeline-${width}-${slowdown}.json`;await writeFile(output,JSON.stringify(result,null,2));await testInfo.attach('pipeline-measurements',{path:output,contentType:'application/json'});
  expect(result.summary.allUnderOneSecond).toBe(true);
 });
}
