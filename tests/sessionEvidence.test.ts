import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGameClock } from '../src/services/gameClock.ts';
import { createSessionEvidence, readEvidenceChunk, type EvidenceChunk } from '../src/services/sessionEvidence.ts';
const flatten = (chunks: EvidenceChunk[]) => chunks.flatMap(readEvidenceChunk);
function fixture(sink?: (chunk: EvidenceChunk) => void) {
  const chunks: EvidenceChunk[] = []; const clock = createGameClock(); let wall = Date.parse('2026-10-04T12:00:00Z');
  const recorder = createSessionEvidence({sessionId:'session-1',exerciseId:'language-naming',activeNow:clock.performanceNow,
    wallNow:()=>new Date(wall),sink:sink ?? (chunk=>chunks.push(chunk))});
  return {recorder,clock,chunks,pause:()=>{wall += 30000;}};
}
test('stimulus and response timing use active time, excluding pauses and recording each failed attempt', () => {
  const f=fixture(); f.recorder.start(3,'normal',false); f.recorder.present('question-1',3);
  f.clock.advance(250); f.pause(); f.recorder.respond(false,false);
  f.clock.advance(400); f.recorder.hint(); f.recorder.respond(true); f.recorder.finish('result-1');
  const events=flatten(f.chunks); const responses=events.filter(e=>e.kind==='response');
  assert.deepEqual(responses.map(e=>[e.latencyMs,e.correct,e.final]),[[250,false,false],[400,true,true]]);
  assert.equal(responses[0].at,'2026-10-04T12:00:30.000Z');
  assert.equal(events.at(-1)?.activeMs,650);
  assert.deepEqual(events.map(e=>e.sequence),[0,1,2,3,4,5]);
});
test('start/finish are idempotent and late responses cannot mutate a completed attempt', () => {
  const f=fixture(); f.recorder.start(2,'normal',true); f.recorder.start(2,'normal',true);
  f.recorder.present('q1',2); f.recorder.present('q1',2); f.recorder.respond(true); f.recorder.respond(true);
  f.recorder.finish('r1'); f.recorder.finish('r1'); f.recorder.abandon('leave'); f.recorder.present('q2',2);
  assert.deepEqual(flatten(f.chunks).map(e=>e.kind),['start','stimulus','response','finish']);
});
test('long attempts flush bounded chunks without losing response events', () => {
  const f=fixture(); f.recorder.start(1,'normal',false);
  for(let i=0;i<500;i++){f.recorder.present(`q${i}`,1);f.clock.advance(100);f.recorder.respond(i%2===0);}
  f.recorder.finish('r1');
  assert.ok(f.chunks.every(c=>c.count<=8 && c.events.length<=24000));
  const events=flatten(f.chunks); assert.equal(events.length,1002);
  assert.deepEqual(events.map(e=>e.sequence),Array.from({length:1002},(_,i)=>i));
});
test('a sink failure retains exactly the same terminal chunk for durable retry', () => {
  const chunks: EvidenceChunk[]=[];let fail=false;let attempted: EvidenceChunk|undefined;
  const f=fixture(c=>{if(fail){attempted=c;throw Error('disk-full');}chunks.push(c);});
  f.recorder.start(1,'normal',false);f.recorder.present('q1',1);fail=true;
  assert.throws(()=>f.recorder.finish('r1'),/disk-full/); fail=false; f.recorder.finish('r1');
  assert.deepEqual(chunks.at(-1),attempted);
  assert.equal(flatten(chunks).filter(e=>e.kind==='finish').length,1);
});
test('abandoned and unfinished attempts are distinct from completion', () => {
  const f=fixture();f.recorder.start(1,'normal',false);f.recorder.abandon('back');
  assert.equal(flatten(f.chunks).at(-1)?.kind,'abandon');
  const unfinished=fixture();unfinished.recorder.start(1,'normal',false);
  assert.deepEqual(flatten(unfinished.chunks).map(e=>e.kind),['start']);
});
test('reader rejects invalid latency, out-of-order events and unapproved payload fields', () => {
  const f=fixture();f.recorder.start(1,'normal',false);f.recorder.present('q',1);f.clock.advance(50);f.recorder.respond(true);f.recorder.finish('r');
  const chunk=f.chunks.at(-1)!;
  for(const mutate of [
    (e:any[])=>{e[1].latencyMs=51;},
    (e:any[])=>{e[1].sequence=99;},
    (e:any[])=>{e[0].email='do-not-store@example.com';},
    (e:any[])=>{e[0].activeMs=-1;},
  ]) {const events=JSON.parse(chunk.events);mutate(events);assert.deepEqual(readEvidenceChunk({...chunk,events:JSON.stringify(events)}),[]);}
});
test('preview cancellation restarts latency and card selection has no invented correctness', () => {
  const f=fixture(); f.recorder.start(1,'normal',false); f.recorder.present('pair-1',1);
  f.clock.advance(200); f.recorder.select(); f.clock.advance(300); f.recorder.hint(); f.recorder.cancel();
  f.clock.advance(5000); f.recorder.present('pair-1-replay',1);
  f.clock.advance(100); f.recorder.select(); f.clock.advance(400); f.recorder.respond(false); f.recorder.finish('r');
  const events=flatten(f.chunks);
  assert.deepEqual(events.filter(e=>e.kind==='selection').map(e=>e.latencyMs),[200,100]);
  assert.equal(events.filter(e=>e.kind==='selection').some(e=>'correct' in e),false);
  assert.deepEqual(events.filter(e=>e.kind==='response').map(e=>e.latencyMs),[400]);
  assert.equal(events.filter(e=>e.kind==='cancel').length,1);
});
test('continuous tracking retains partial terminal windows and excludes stopped-clock time', () => {
  const f=fixture(); f.recorder.start(1,'normal',false);
  for (let i=0;i<15;i++) { f.clock.advance(100); f.recorder.track(100,i<7); }
  f.pause(); f.recorder.abandon('back');
  const windows=flatten(f.chunks).filter(e=>e.kind==='tracking');
  assert.deepEqual(windows.map(e=>[e.durationMs,e.contactMs]),[[1000,700],[500,0]]);
  assert.equal(windows.reduce((sum,e)=>sum+e.durationMs,0),1500);
  assert.equal(flatten(f.chunks).at(-1)?.kind,'abandon');
});
