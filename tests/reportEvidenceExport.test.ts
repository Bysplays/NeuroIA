import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildReportEvidenceExport} from '../src/services/reportEvidenceExport.ts';
const events=['started','ai-ready','pdf-ready','download-requested'].map((phase,sequence)=>({version:1,attemptId:'client',sequence,phase,source:'ai',elapsedMs:sequence*100,at:'2026-10-04T12:00:00.000Z'}));
const server={version:1,attemptId:'server',clientAttemptId:'client',status:'generated',startedAt:1,finishedAt:10,durationMs:9,httpStatus:200,stage:'complete',model:'fixture',promptVersion:'v1'};
test('explicit correlation deduplicates retries, orders phases and exports no account or attempt identifiers',()=>{
  const result=buildReportEvidenceExport([...events].reverse().concat(events),[server,server]);
  assert.equal(result.counts.correlatedAiDownloads,1);assert.equal(result.coverage.serverAttempts,1);
  assert.deepEqual(result.attempts[0].phases?.map(e=>e.elapsedMs),[0,100,200,300]);
  assert.doesNotMatch(JSON.stringify(result),/"attemptId"|"clientAttemptId"|2026-10-04/);
});
test('missing and conflicting events never supply download metrics',()=>{
  for(const input of [events.slice(1),[events[0],events[2],events[3]],[...events,{...events[1],elapsedMs:900}],[...events,{...events[0],sequence:4,phase:'failed',elapsedMs:500}]]){
    const result=buildReportEvidenceExport(input,[server]);
    assert.equal(result.attempts[0].status,'invalid');assert.equal(result.attempts[0].phases,null);assert.equal(result.counts.correlatedAiDownloads,0);
  }
});
test('ambiguous server retries, missing client linkage and inconsistent outcomes stay distinct',()=>{
  const ambiguous=buildReportEvidenceExport(events,[server,{...server,attemptId:'second'}]);
  assert.equal(ambiguous.attempts[0].correlation,'ambiguous');assert.equal(ambiguous.counts.correlatedAiDownloads,0);
  const unlinked=buildReportEvidenceExport(events,[{...server,clientAttemptId:undefined}]);
  assert.equal(unlinked.attempts[0].correlation,'absent');assert.equal(unlinked.unlinkedServer.length,1);
  const failed=buildReportEvidenceExport(events,[{...server,status:'failed',httpStatus:502,stage:'validation'}]);
  assert.equal(failed.attempts[0].consistent,false);assert.equal(failed.counts.correlatedAiDownloads,0);
});
test('unfinished, invalid and unknown records remain in coverage without invented endpoints',()=>{
  const result=buildReportEvidenceExport([events[0],{...events[0],attemptId:'broken',extra:'private'},null],[null,{...server,status:'generated',httpStatus:500}]);
  assert.equal(result.counts.unfinished,1);assert.equal(result.counts.invalid,1);
  assert.equal(result.coverage.malformedClient,2);assert.equal(result.coverage.malformedServer,2);
});
