import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionEvidence, type EvidenceChunk } from '../src/services/sessionEvidence.ts';
import { summarizeEvidence } from '../src/services/evidenceSummary.ts';
function fixture() {
  let time=0; const chunks:EvidenceChunk[]=[];
  const recorder=createSessionEvidence({sessionId:'attempt',exerciseId:'memory-pairs',activeNow:()=>time,sink:c=>chunks.push(c)});
  recorder.start(1,'normal',false); recorder.present('pair-1',1); recorder.flush();
  time=100; recorder.select(); recorder.flush(); time=300; recorder.respond(false); recorder.flush();
  recorder.finish('result'); return chunks;
}
test('out-of-order duplicate pages reconstruct exactly one attempt with linked latency',()=>{
  const chunks=fixture(); const summary=summarizeEvidence([...chunks].reverse().concat(chunks));
  assert.equal(summary.status,'completed'); assert.equal(summary.resultId,'result');
  assert.deepEqual(summary.metrics,{responseCount:1,errors:1,hints:0,selections:1,meanResponseMs:200,activeMs:300,trackingMs:0,contactMs:0});
});
test('missing chunks and conflicting retries cannot become completed KPI evidence',()=>{
  const chunks=fixture();
  const missing=summarizeEvidence(chunks.filter((_,i)=>i!==2));
  assert.equal(missing.status,'invalid'); assert.equal(missing.metrics,null);
  const copy=structuredClone(chunks[2]); const events=JSON.parse(copy.events); events[0].latencyMs=99;copy.events=JSON.stringify(events);
  const conflict=summarizeEvidence([...chunks,copy]);
  assert.ok(conflict.issues.includes('conflicting-event')); assert.equal(conflict.resultId,undefined);
});
test('an intact prefix is unfinished, not abandoned or completed',()=>{
  const chunks=fixture(); const summary=summarizeEvidence(chunks.slice(0,-1));
  assert.equal(summary.status,'unfinished'); assert.equal(summary.resultId,undefined);
  assert.equal(summarizeEvidence([]).status,'invalid');
});
test('cross-chunk timestamps and response associations are checked beyond envelope validation',()=>{
  const chunks=fixture(); const events=JSON.parse(chunks[3].events);events[0].latencyMs=300;
  chunks[3]={...chunks[3],events:JSON.stringify(events)};
  assert.ok(summarizeEvidence(chunks).issues.includes('invalid-response-link'));
});
