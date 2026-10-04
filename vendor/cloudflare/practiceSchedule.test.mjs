import {createHandler} from './index.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {practiceScheduleStatus,updatePracticeSchedule} from './practiceSchedule.mjs';
const env={PROPOSAL_SCHEDULE_ENABLED:'true'},now=Date.parse('2026-10-04T23:30:00Z');
const input={operationId:'op',baseRevision:0,timeZone:'Europe/Madrid',daysMask:42,dailyExercises:3};
const access=async()=>({active:true});
function store(){const docs=new Map();let queue=Promise.resolve();return {docs,runTransaction(fn){const promise=queue.then(async()=>{const writes=[];const value=await fn({get:async path=>structuredClone(docs.get(path)??null),getMany:async paths=>paths.map(path=>structuredClone(docs.get(path)??null)),set:(path,row)=>writes.push([path,row])});writes.forEach(([path,row])=>docs.set(path,structuredClone(row)));return value;});queue=promise.catch(()=>{});return promise;}};}
test('schedule revisions start tomorrow in the fixed local zone and request retries are idempotent',async()=>{
  const db=store();await updatePracticeSchedule('owner',input,env,db,access,now);
  const status=await practiceScheduleStatus('owner',env,db,now);
  assert.equal(status.current.effectiveFrom,'2026-10-06');assert.equal(status.current.revision,1);
  assert.deepEqual(await updatePracticeSchedule('owner',input,env,db,access,now+86400000),{revision:1,replayed:true});
  assert.equal(db.docs.size,3);
  await assert.rejects(updatePracticeSchedule('owner',{...input,daysMask:7},env,db,access,now),{status:409});
});
test('concurrent edits use optimistic revision checks and cannot change historical timezone',async()=>{
  const db=store();const results=await Promise.allSettled(['a','b'].map(operationId=>updatePracticeSchedule('owner',{...input,operationId},env,db,access,now)));
  assert.equal(results.filter(row=>row.status==='fulfilled').length,1);
  await assert.rejects(updatePracticeSchedule('owner',{...input,operationId:'c',baseRevision:1,timeZone:'UTC'},env,db,access,now),{status:409});
  await updatePracticeSchedule('owner',{...input,operationId:'pause',baseRevision:1,daysMask:0},env,db,access,now);
  assert.equal(db.docs.get('users/owner/scheduleRevisions/0000000001').daysMask,42);
  assert.equal(db.docs.get('users/owner/scheduleRevisions/0000000002').daysMask,0);
});
test('disabled, unauthorized, malformed and backdated inputs cannot create schedules',async()=>{
  for(const patch of [{daysMask:128},{dailyExercises:0},{effectiveFrom:'2000-01-01'},{timeZone:'invalid-zone'},{baseRevision:-1},{operationId:'../other'}])await assert.rejects(updatePracticeSchedule('owner',{...input,...patch},env,store(),access,now),{status:400});
  await assert.rejects(updatePracticeSchedule('owner',input,{},store(),access,now),{status:503});
  await assert.rejects(updatePracticeSchedule('owner',input,env,store(),async()=>({active:false}),now),{status:403});
});

test('calendar HTTP routes authenticate the caller, bound input and reject target or date overrides',async()=>{
  const db=store();db.docs.set('users/owner/access/main',{kind:'trial',trialStartedAt:Date.now()});
  const settings={...env,APP_URL:'https://neuroia.es',FIREBASE_PROJECT_ID:'demo-neuroia'};
  const handler=createHandler({database:()=>db,verifyUser:async()=> 'owner'});
  const request=(path,body,headers={Authorization:'Bearer fixture',Origin:'https://neuroia.es'})=>new Request(`https://worker${path}`,{method:'POST',headers,body:JSON.stringify(body)});
  assert.equal((await handler(request('/practice/schedule',input,{}),settings)).status,401);
  assert.equal((await handler(request('/practice/schedule',{...input,targetUid:'someone'}),settings)).status,400);
  assert.equal((await handler(request('/practice/schedule',{...input,effectiveFrom:'2000-01-01'}),settings)).status,400);
  assert.equal((await handler(request('/practice/schedule',input),settings)).status,200);
  const status=await (await handler(request('/practice/schedule/status',{}),settings)).json();
  assert.equal(status.current.revision,1);assert.equal(status.enabled,true);
  db.docs.set('accountDeletions/owner',{phase:'tree'});
  assert.equal((await handler(request('/practice/schedule/status',{}),settings)).status,409);
});
