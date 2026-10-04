import {test,expect} from '@playwright/test';
const archive=`import {createLiveRoundSession} from '/src/services/liveRoundSession.ts';
export async function loadActivityPage(){
 let now=0;const session=createLiveRoundSession({id:'mixed',exerciseId:'language-naming',level:5,baseLevel:5,mode:'normal',locked:false,manual:false,activeNow:()=>now,sink:()=>{}});session.start();
 for(let i=0;i<4;i++){session.evidence.present('q'+i,session.config().level);now+=300;session.evidence.respond(true);if(i<3)session.next();}
 return {more:false,results:[{id:'mixed',exerciseId:'language-naming',domain:'language',date:'2026-10-04T12:00:00Z',durationSeconds:20,accuracy:100,correctAnswers:4,totalQuestions:4,score:0,feedbackMessage:'',configVersion:1,evidenceSessionId:'mixed',roundAdaptation:session.finish('mixed')}]};
}`;
test.beforeEach(async({page})=>{page.on('pageerror',error=>{throw error;});});
for(const width of [390,820,1280])test(`mixed levels remain visible in history, detail and chart at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:width===820?1180:900});
 await page.route('**/src/services/activityHistory.ts',route=>route.fulfill({contentType:'text/javascript',body:archive}));
 await page.route('**/src/services/evidenceArchive*',route=>route.fulfill({contentType:'text/javascript',body:'export async function loadEvidenceExport(){return {chunks:[],results:[],complete:true}}; export async function loadSessionEvidence(){return {status:"completed",resultId:"mixed",exerciseId:"language-naming",events:[]}}'}));
 await page.goto('/tests/interface/index.html?activity-demo');await page.getByRole('tab',{name:'Actividad',exact:true}).click();
 await page.getByRole('tab',{name:'Gráficas',exact:true}).click();
 const chart=page.locator('.activity-line-chart').last();
 await expect(chart.locator('.stats-level-range')).toHaveCount(1);await expect(chart.locator('.stats-level-range title')).toContainText('niveles 5–6; último jugado 6');
 await expect(chart.locator('.stats-average')).toHaveText('Media histórica de partidas con nivel constante: 6');
 await chart.locator('.stats-average').scrollIntoViewIfNeeded();await page.evaluate(()=>window.scrollBy(0,160));await page.screenshot({path:`/tmp/neuroia-mixed-chart-${width}.png`});
 await page.getByRole('tab',{name:'Historial',exact:true}).click();await expect(page.locator('.stats-history tbody tr').first()).toContainText('Niveles 5–6');
 await page.locator('.stats-history tbody tr').first().getByRole('button').click();
 await expect(page.locator('.exercise-analytics')).toContainText('Niveles 5–6');await expect(page.locator('.stats-played-levels')).toContainText('5 → 6');
 await expect(page.getByText('No se guardaron muestras de los cuatro canales en esta partida.')).toBeVisible();
 await page.screenshot({path:`/tmp/neuroia-mixed-detail-${width}.png`});
 await page.locator('.exercise-analytics').getByRole('button',{name:'Volver',exact:true}).click();await expect(page.locator('.stats-history')).toBeVisible();
});
