import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLiveRoundSession} from '../src/services/liveRoundSession.ts';
import {summarizeEvidence} from '../src/services/evidenceSummary.ts';
import {readRoundResult} from '../src/services/roundResult.ts';
import type {EvidenceChunk} from '../src/services/sessionEvidence.ts';
function fixture(extra={}){
 let now=0;const chunks:EvidenceChunk[]=[];
 const session=createLiveRoundSession({id:'live-round',exerciseId:'language-naming',level:5,baseLevel:5,mode:'normal',locked:false,manual:false,activeNow:()=>now,sink:chunk=>chunks.push(chunk),...extra});
 const answer=(i:number)=>{session.evidence.present(`q${i}`,session.config().level);now+=1000;session.evidence.respond(true);};
 return {session,chunks,answer};
}
test('live bridge changes only after three closed response rounds and keeps the original round target',()=>{
 const {session,chunks,answer}=fixture();session.start();session.start();
 for(let i=0;i<5;i++){
  answer(i);if(i<4)session.next();
  assert.equal(session.config().rounds,5);assert.equal(session.config().level,i>=2?6:5);
 }
 const encoded=session.finish('result');assert.equal(session.finish('result'),encoded);
 assert.throws(()=>session.finish('different'));assert.throws(()=>session.next());
 const summary=summarizeEvidence(chunks);assert.equal(summary.status,'completed');assert.equal(summary.rounds?.length,5);
 assert.deepEqual(readRoundResult(encoded)?.levels,[5,5,5,6,6]);assert.equal(readRoundResult(encoded)?.finalDecision.reason,'insufficient-evidence');
});
test('active input blocks transitions; abandonment closes the controller without inventing a completed result',()=>{
 const {session,chunks}=fixture();session.start();session.evidence.present('open',5);
 assert.throws(()=>session.next(),/not-ready/);assert.equal(session.config().level,5);
 session.evidence.abandon('back');assert.throws(()=>session.next());assert.equal(summarizeEvidence(chunks).status,'abandoned');
});
test('manual, assigned and non-normal runs never change level',()=>{
 for(const extra of [{manual:true},{locked:true},{mode:'placement' as const}]){
  const {session,chunks,answer}=fixture(extra);session.start();
  for(let i=0;i<4;i++){answer(i);if(i<3)session.next();assert.equal(session.config().level,5);}
  session.finish('result');assert.equal(summarizeEvidence(chunks).status,'completed');
 }
});

test('recording readiness notifies only after its initial evidence is queued, and is idempotent',async()=>{
 const {createSessionRecording}=await import('../src/services/sessionRecording.ts');
 for(const adaptive of [true,false]){
  const chunks:EvidenceChunk[]=[];
  const recording=createSessionRecording({id:'ready',exerciseId:'language-naming',level:5,baseLevel:5,mode:'normal',locked:false,manual:false,activeNow:()=>0,sink:chunk=>chunks.push(chunk),enabled:true,adaptive});
  assert.equal(recording.isReady(),false);let notices=0;
  const unsubscribe=recording.subscribeReady(()=>{notices++;assert.equal(recording.isReady(),true);assert.deepEqual(chunks.flatMap(c=>JSON.parse(c.events)).map(e=>e.kind),adaptive?['start','round-start']:['start']);});
  recording.start();recording.start();assert.equal(notices,1);unsubscribe();
 }
});
