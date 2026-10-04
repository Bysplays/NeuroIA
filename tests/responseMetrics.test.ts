import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSessionEvidence,type EvidenceChunk} from '../src/services/sessionEvidence.ts';
import {buildEvidenceExport} from '../src/services/evidenceExport.ts';
import {responseMetrics} from '../src/services/responseMetrics.ts';
import type {ExerciseResult} from '../src/types/index.ts';
function session(id:string,times:number[],level=1,exercise='language-naming'){
  let now=0;const chunks:EvidenceChunk[]=[];
  const r=createSessionEvidence({sessionId:id,exerciseId:exercise,activeNow:()=>now,sink:c=>chunks.push(c)});
  r.start(level,'normal',false);
  times.forEach((time,i)=>{r.present(`q${i}`,level);now+=time;if(i===0)r.hint();r.respond(i!==0);});r.finish(id);
  return {chunks,result:{id,evidenceSessionId:id,exerciseId:exercise} as ExerciseResult};
}
test('response metrics weight actual responses and keep game/level groups separate',()=>{
  const sessions=[session('a',[1000]),session('b',[2000,3000,4000]),session('c',[8000],2),session('d',[9000],1,'motor-target')];
  const report=responseMetrics(buildEvidenceExport(sessions.flatMap(s=>s.chunks),sessions.map(s=>s.result),true));
  assert.equal(report.rows.length,3);const row=report.rows.find(r=>r.exercise==='language-naming'&&r.level===1)!;
  assert.equal(row.meanResponseMs,2500);assert.equal(row.responses,4);assert.equal(row.sessions,2);assert.equal(row.errors,2);assert.equal(row.hints,2);
});
test('no response totals from partial archives, missing result links, invalid or placement records',()=>{
  const a=session('a',[1000]);assert.deepEqual(responseMetrics(buildEvidenceExport(a.chunks,[a.result],false)).rows,[]);
  assert.equal(responseMetrics(buildEvidenceExport(a.chunks,[],true)).excluded,1);
  const start=JSON.parse(a.chunks[0].events);start[0].mode='placement';a.chunks[0].events=JSON.stringify(start);
  assert.equal(responseMetrics(buildEvidenceExport(a.chunks,[a.result],true)).rows.length,0);
  a.chunks[0].events='invalid';const result=responseMetrics(buildEvidenceExport(a.chunks,[a.result],true));assert.equal(result.rows.length,0);assert.equal(result.excluded,1);
});
test('continuous contact has duration-weighted contact and no fabricated response latency',()=>{
  const chunks:EvidenceChunk[]=[];let now=0;
  const r=createSessionEvidence({sessionId:'tracking',exerciseId:'motor-tracking',activeNow:()=>now,sink:c=>chunks.push(c)});
  r.start(1,'normal',false);now=250;r.track(250,true);now=1000;r.track(750,false);now=3000;r.track(2000,true);r.finish('tracking');
  const result={id:'tracking',evidenceSessionId:'tracking',exerciseId:'motor-tracking'} as ExerciseResult;
  const row=responseMetrics(buildEvidenceExport(chunks,[result],true)).rows[0];
  assert.equal(row.meanResponseMs,null);assert.equal(row.responses,0);assert.equal(row.contactRatio,.75);
});
test('mixed-level attempts retain per-level measurements without double-counting sessions',()=>{
 const chunks:EvidenceChunk[]=[];let now=0;
 const r=createSessionEvidence({sessionId:'mixed',exerciseId:'language-naming',activeNow:()=>now,sink:c=>chunks.push(c)});
 r.start(2,'normal',false);r.present('q1',2);now=1000;r.respond(false);r.present('q2',3);r.hint();now=4000;r.respond(true);r.present('q3',2);now=6000;r.respond(true);r.finish('mixed');
 const result={id:'mixed',evidenceSessionId:'mixed',exerciseId:'language-naming',level:3} as ExerciseResult;
 const exported=buildEvidenceExport([...chunks,...chunks],[result],true),metrics=responseMetrics(exported);
 assert.equal(exported.counts.completed,1);assert.equal(metrics.includedSessions,1);assert.equal(metrics.rows.length,2);
 const [two,three]=metrics.rows;
 assert.equal(two.level,2);assert.equal(two.sessions,1);assert.equal(two.responses,2);assert.equal(two.meanResponseMs,1500);assert.equal(two.errors,1);assert.equal(two.hints,0);
 assert.equal(three.level,3);assert.equal(three.sessions,1);assert.equal(three.responses,1);assert.equal(three.meanResponseMs,3000);assert.equal(three.errors,0);assert.equal(three.hints,1);
});
