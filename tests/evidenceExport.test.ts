import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildEvidenceExport } from '../src/services/evidenceExport.ts';
import { createSessionEvidence, type EvidenceChunk } from '../src/services/sessionEvidence.ts';
import type { ExerciseResult } from '../src/types/index.ts';
const result = {id:'private-result',evidenceSessionId:'private-session',exerciseId:'language-naming',notes:'private notes'} as ExerciseResult;
function chunks() {
  const chunks:EvidenceChunk[]=[];
  const recorder=createSessionEvidence({sessionId:'private-session',exerciseId:'language-naming',activeNow:()=>0,sink:chunk=>chunks.push(chunk)});
  recorder.start(1,'normal',false);recorder.present('q',1);recorder.respond(true);recorder.finish('private-result');return chunks;
}
test('exports linked completion counts without account/session/result identity or narrative',()=>{
  const exported=buildEvidenceExport(chunks(),[result,result],true);
  assert.equal(exported.counts.registeredNormalCompleted,1);
  assert.equal(exported.attempts[0].measurements?.responseCount,1);
  assert.equal(JSON.stringify(exported).includes('private'),false);
});
test('missing and conflicting result links never count as registered completion',()=>{
  assert.equal(buildEvidenceExport(chunks(),[],true).counts.registeredNormalCompleted,0);
  assert.equal(buildEvidenceExport(chunks(),[{...result,evidenceSessionId:'other'}],true).counts.registeredNormalCompleted,0);
  assert.equal(buildEvidenceExport(chunks(),[result,{...result,notes:'changed'}],true).counts.registeredNormalCompleted,0);
});
test('placement completions are separated from ordinary archived-result coverage',()=>{
  const data=chunks();const events=JSON.parse(data[0].events);events[0].mode='placement';data[0].events=JSON.stringify(events);
  const exported=buildEvidenceExport(data,[],true);
  assert.equal(exported.counts.completed,1);assert.equal(exported.counts.normalCompleted,0);
  assert.equal(exported.counts.registeredNormalCompleted,0);
});
test('partial coverage, malformed documents and unfinished attempts stay explicit',()=>{
  const exported=buildEvidenceExport([chunks()[0],null as unknown as EvidenceChunk],[],false);
  assert.equal(exported.coverage.complete,false);assert.equal(exported.coverage.malformedDocuments,1);
  assert.equal(exported.counts.unfinished,1);assert.equal(exported.counts.completed,0);
  assert.ok(exported.limitations.some(text=>text.includes('Archivo parcial')));
});
