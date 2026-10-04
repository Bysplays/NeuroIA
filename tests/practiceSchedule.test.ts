import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculateAdherence,validScheduleRevision,scheduleDay,type PracticeScheduleRevision} from '../src/services/practiceSchedule.ts';
import type {ExerciseResult} from '../src/types/index.ts';
const revision=(patch:Partial<PracticeScheduleRevision>={}):PracticeScheduleRevision=>({version:1,revision:1,timeZone:'Europe/Madrid',createdAt:Date.parse('2026-01-01T12:00:00Z'),effectiveFrom:'2026-01-02',daysMask:127,dailyExercises:2,...patch});
const result=(id:string,date:string):ExerciseResult=>({id,date,exerciseId:'motor-target',domain:'motor',durationSeconds:30,correctAnswers:1,totalQuestions:1,accuracy:100,score:0,feedbackMessage:''});
const options={asOf:Date.parse('2026-01-05T12:00:00Z'),complete:true};
test('adherence uses elapsed planned days and deduplicated completions, not total game count or streak',()=>{
  const rows=[result('a','2026-01-02'),result('b','2026-01-02'),...Array.from({length:6},(_,i)=>result(`extra-${i}`,'2026-01-04'))];
  const data=calculateAdherence([revision()],[...rows,...rows,result('today','2026-01-05')],options);
  assert.equal(data.plannedDays,3);assert.equal(data.metDays,2);assert.equal(data.ratio,2/3);
  assert.deepEqual(data.days.map(day=>day.met),[true,false,true]);
});
test('prospective pauses and same-day revisions preserve the original denominator',()=>{
  const pause=revision({revision:2,createdAt:Date.parse('2026-01-03T12:00:00Z'),effectiveFrom:'2026-01-04',daysMask:0});
  const resumed=revision({...pause,revision:3,createdAt:pause.createdAt+1000,daysMask:127,dailyExercises:1});
  const data=calculateAdherence([resumed,revision(),pause],[result('one','2026-01-04')],options);
  assert.equal(data.plannedDays,3);assert.equal(data.metDays,1);assert.equal(data.days[2].revision,3);
  assert.equal(calculateAdherence([revision(),pause],[],options).plannedDays,2);
});
test('calendar uses fixed timezone, DST and original date-only days without inventing times',()=>{
  assert.equal(scheduleDay(Date.parse('2026-03-28T23:30:00Z'),'Europe/Madrid'),'2026-03-29');
  const schedule=revision({createdAt:Date.parse('2026-03-28T12:00:00Z'),effectiveFrom:'2026-03-29',dailyExercises:1});
  const data=calculateAdherence([schedule],[result('dst','2026-03-28T23:30:00Z')],{asOf:Date.parse('2026-03-30T01:00:00Z'),complete:true});
  assert.equal(data.plannedDays,1);assert.equal(data.metDays,1);
  assert.equal(validScheduleRevision({...schedule,effectiveFrom:'2026-03-28'}),false);
});
test('partial, conflicting, missing or absent evidence cannot establish a percentage',()=>{
  const partial=calculateAdherence([revision()],[],{...options,complete:false});
  assert.equal(partial.ratio,null);assert.equal(partial.metDays,null);assert.ok(partial.days.every(day=>day.met===null));
  assert.equal(calculateAdherence([],[],options).ratio,null);
  assert.equal(calculateAdherence([revision({revision:2})],[],options).plannedDays,null);
  assert.equal(calculateAdherence([revision(),revision({dailyExercises:3})],[],options).ratio,null);
  assert.equal(calculateAdherence([revision()],[result('same','2026-01-02'),result('same','2026-01-03')],options).ratio,null);
});
test('practice and retired exercises do not fulfill planned activity; weekday masks and date filters remain explicit',()=>{
  const rows=[{...result('practice','2026-01-02'),practice:true},{...result('retired','2026-01-02'),exerciseId:'daily-sequencing'}];
  const data=calculateAdherence([revision({daysMask:1<<5,dailyExercises:1})],rows,options);
  assert.equal(data.plannedDays,1);assert.equal(data.metDays,0);
  assert.equal(calculateAdherence([revision()],[],{...options,from:'2026-01-03',to:'2026-01-03'}).plannedDays,1);
});
