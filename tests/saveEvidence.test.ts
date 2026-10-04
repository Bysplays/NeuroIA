import {test} from 'node:test';
import assert from 'node:assert/strict';
import {summarizeSaveEvidence,validSaveEvent} from '../src/services/saveEvidence.ts';
const start={version:1,attemptId:'attempt',resultId:'private-result',mode:'normal',status:'started',elapsedMs:0,at:'2026-10-04T12:00:00.000Z',errorCategory:'none'};
const failed={...start,status:'failed',elapsedMs:12,errorCategory:'network'};
test('failed send is reconciled with the result archive and retries never inflate result counts',()=>{
  const rows=[start,failed,{...start,attemptId:'retry'},{...start,attemptId:'retry',status:'acknowledged',elapsedMs:3}];
  const summary=summarizeSaveEvidence([...rows,...rows],[{id:'private-result'}]);
  assert.equal(summary.counts.failed,1);assert.equal(summary.counts.acknowledged,1);
  assert.equal(summary.counts.distinctNormalResultsAttempted,1);assert.equal(summary.counts.distinctNormalResultsArchived,1);
  assert.ok(summary.attempts.every(row=>row.resultInArchive));assert.doesNotMatch(JSON.stringify(summary),/private-result|2026-10-04/);
});
test('missing start, mixed result and conflicting outcomes cannot produce save metrics',()=>{
  for(const rows of [[failed],[start,failed,{...failed,status:'acknowledged',errorCategory:'none'}],[start,{...failed,resultId:'other'}]]){
    const summary=summarizeSaveEvidence(rows,[]);assert.equal(summary.counts.invalid,1);assert.equal(summary.attempts[0].elapsedMs,null);
  }
  assert.equal(summarizeSaveEvidence([start],[]).counts.unfinished,1);
  assert.equal(validSaveEvent({...start,error:'private'}),false);
});
