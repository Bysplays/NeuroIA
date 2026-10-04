import test from 'node:test';
import assert from 'node:assert/strict';
import { levelTimeline, historicalLevelMean } from '../src/services/levelStatistics.ts';
import type { ExerciseResult } from '../src/types/index.ts';
const result = (id: string, date: string, level?: number): ExerciseResult => ({ id, date, level, exerciseId:'visual-scanning', domain:'attention', durationSeconds:20, accuracy:100, correctAnswers:5, totalQuestions:5, score:0, feedbackMessage:'' });
test('level history deduplicates, orders real dates and excludes missing levels, other games and practice', () => {
  const a = result('a', '2026-09-01', 2);
  const b = result('b', '2026-09-04', 5);
  const values = levelTimeline([b, a, b, result('legacy','2026-09-02'), { ...a, id:'practice', practice:true }, { ...a, id:'other', exerciseId:'memory-pairs' }, result('invalid','2026-09-03',11)], 'visual-scanning');
  assert.deepEqual(values.map(x => [x.id, x.level]), [['a',2], ['b',5]]);
  assert.equal(values[1].time - values[0].time, 3 * 86400000);
  assert.equal(values[0].date, '2026-09-01');
});

test('level mean counts each recorded session once and excludes unknown levels and practice', () => {
  const a = result('a', '2026-09-01', 2);
  const b = { ...result('b', '2026-09-02', 6), exerciseId: 'memory-pairs' };
  assert.equal(historicalLevelMean([a, a, b, result('missing', '2026-09-03'), { ...a, id: 'practice', practice: true }, result('invalid', '2026-09-04', 11)]), 4);
  assert.equal(historicalLevelMean([]), null);
});

test('mixed history shows the played range and last level without inventing a mean or mutating the result',async()=>{
 const {createLiveRoundSession}=await import('../src/services/liveRoundSession.ts');
 const {playedLevels,playedLevelLabel}=await import('../src/services/levelStatistics.ts');
 let now=0;const session=createLiveRoundSession({id:'mixed',exerciseId:'visual-scanning',level:5,baseLevel:5,mode:'normal',locked:false,manual:false,activeNow:()=>now,sink:()=>{}});
 session.start();
 for(let i=0;i<4;i++){session.evidence.present(`q${i}`,session.config().level);now+=300;session.evidence.respond(true);if(i<3)session.next();}
 const mixed={...result('mixed','2026-10-04',9),configVersion:1,evidenceSessionId:'mixed',roundAdaptation:session.finish('mixed')};
 assert.deepEqual(playedLevels(mixed),[5,5,5,6]);assert.equal(playedLevelLabel(mixed),'Niveles 5–6');assert.equal(mixed.level,9);
 const [point]=levelTimeline([mixed,mixed],'visual-scanning');assert.deepEqual([point.level,point.low,point.high],[6,5,6]);
 assert.equal(historicalLevelMean([mixed]),null);assert.equal(historicalLevelMean([mixed,result('fixed','2026-10-03',2)]),2);
 for(const bad of [{...mixed,roundAdaptation:'{}'},{...mixed,evidenceSessionId:undefined},{...mixed,exerciseId:'memory-path'}]){
  assert.equal(playedLevels(bad),null);assert.equal(playedLevelLabel(bad),'Nivel no registrado');
  assert.equal(levelTimeline([bad],bad.exerciseId as 'visual-scanning').length,0);
 }
});

test('a next-session recommendation never becomes a played level',async()=>{
 const {createLiveRoundSession}=await import('../src/services/liveRoundSession.ts');
 let now=0;const session=createLiveRoundSession({id:'recommendation',exerciseId:'visual-scanning',level:5,baseLevel:5,mode:'normal',locked:false,manual:false,activeNow:()=>now,sink:()=>{}});session.start();
 for(let i=0;i<3;i++){session.evidence.present(`q${i}`,5);now+=300;session.evidence.respond(true);if(i<2)session.next();}
 const encoded=session.finish('recommendation');assert.equal(JSON.parse(encoded).finalDecision.nextLevel,6);
 const saved={...result('recommendation','2026-10-04'),configVersion:1,evidenceSessionId:'recommendation',roundAdaptation:encoded};
 assert.deepEqual(levelTimeline([saved],'visual-scanning').map(p=>[p.level,p.low,p.high]),[[5,5,5]]);
 assert.equal(historicalLevelMean([saved]),5);
});
