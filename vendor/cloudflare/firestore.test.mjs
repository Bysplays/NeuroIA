import {updatePracticeSchedule} from './practiceSchedule.mjs';
import {withReportEvidence,readReportEvidence} from './reportEvidence.mjs';
import { startTrial, requestDeletion, processDeletion } from './accountLifecycle.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {database, confirmedAccess, redeemSeat, leaveSeat, syncSeatSubscription} from './index.mjs';

test('real REST transactions retry conflicts and preserve unrelated document fields in demo emulator',async()=>{
 const nativeFetch=globalThis.fetch;
 const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',hash:'SHA-256',modulusLength:2048,publicExponent:new Uint8Array([1,0,1])},true,['sign','verify']);
 const privateKey=Buffer.from(await crypto.subtle.exportKey('pkcs8',keys.privateKey)).toString('base64');
 globalThis.fetch=(input,init)=>{
  const url=String(input);
  if(url==='https://oauth2.googleapis.com/token')return Promise.resolve(Response.json({access_token:'owner',expires_in:3600}));
  if(url.startsWith('https://firestore.googleapis.com/v1/projects/demo-neuroia/'))return nativeFetch(url.replace('https://firestore.googleapis.com', `http://${process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080'}`),init);
  throw Error('Unexpected network destination');
 };
 try{
 const db=database({FIREBASE_PROJECT_ID:'demo-neuroia',FIREBASE_SERVICE_ACCOUNT:JSON.stringify({project_id:'demo-neuroia',client_email:'worker@demo-neuroia.iam.gserviceaccount.com',private_key:`-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`})});
 await db.saveMaintenance({cursor:'sub_test',nextRunAt:123,startedAt:null});
 assert.deepEqual(await db.maintenance(),{cursor:'sub_test',nextRunAt:123,startedAt:null});
 const uid='worker-rest-'+Date.now();
 // Real nested Firestore encoding, archive ordering and imported-history coverage.
 const aiUid='ai-rest-'+Date.now();
 const value=v=>v===null?{nullValue:null}:Array.isArray(v)?{arrayValue:{values:v.map(value)}}:typeof v==='object'?{mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,value(x)]))}}:typeof v==='number'?{integerValue:String(v)}:typeof v==='boolean'?{booleanValue:v}:{stringValue:v};
 const put=async(path,data)=>{const response=await nativeFetch(`http://${process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080'}/v1/projects/demo-neuroia/databases/(default)/documents/${path}`,{method:'PATCH',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:JSON.stringify(value(data).mapValue)});assert.equal(response.status,200);};
 await put(`users/${aiUid}/progress/main`,{schemaVersion:1,data:{profile:{totalSessions:5,gameLevels:{'memory-pairs':{level:4,evidence:[]}},placement:{preferences:{movement:'taps'}}},history:[{id:'imported',date:'2026-09-01',exerciseId:'memory-pairs'}]}});
 await put(`users/${aiUid}/results/archive`,{id:'archived',date:'2026-09-20T12:00:00Z',exerciseId:'memory-pairs'});
 const source=await db.readActivity(aiUid);
 assert.deepEqual(source.history.map(r=>r.id),['imported','archived']);assert.equal(source.levels['memory-pairs'].level,4);assert.equal(source.tapsOnly,true);assert.equal(source.partial,true);

 const reportEnv={PROPOSAL_REPORT_EVIDENCE:'true',OPENROUTER_MODEL:'fixture/model'};
 await withReportEvidence(aiUid,'report',reportEnv,db,undefined,async context=>{context.stage='complete';return {provenance:{promptVersion:'fixture-v1',snapshotHash:'a'.repeat(64)}};});
 await Promise.all(Array.from({length:27},()=>put(`users/${aiUid}/reportAttempts/${crypto.randomUUID()}`,{version:1,status:'started',startedAt:123,model:'fixture/model'})));
 const reportFirst=await readReportEvidence(aiUid,{},db);
 assert.equal(reportFirst.records.length,25);assert.ok(reportFirst.nextCursor);
 const reportSecond=await readReportEvidence(aiUid,{cursor:reportFirst.nextCursor},db);
 const reportRows=[...reportFirst.records,...reportSecond.records];
 assert.equal(reportRows.length,28);assert.equal(reportSecond.nextCursor,null);
 assert.equal(new Set(reportRows.map(row=>row.attemptId)).size,28);
 assert.equal(reportRows.filter(row=>row.status==='generated').length,1);
 assert.equal(reportRows.filter(row=>row.invalid).length,0);
 await db.erase(reportRows.map(row=>`users/${aiUid}/reportAttempts/${row.attemptId}`));
 await db.erase([`users/${aiUid}/progress/main`,`users/${aiUid}/results/archive`]);
 await db.transaction(uid,(access,billing,patch)=>{assert.deepEqual(access,{});assert.deepEqual(billing,{});patch(0,{kind:'trial',trialStartedAt:123});patch(1,{attempt:'original',count:0});});
 await Promise.all(Array.from({length:2},()=>db.transaction(uid,async(_a,b,patch)=>{await new Promise(r=>setTimeout(r,50));patch(1,{count:b.count+1});})));
 await db.transaction(uid,(access,billing,patch)=>{assert.equal(access.trialStartedAt,123);assert.equal(billing.count,2);assert.equal(billing.attempt,'original');patch(0,{kind:'subscription',expiresAt:2000000000000});patch(1,{attempt:null});});
 await db.transaction(uid,(access,billing)=>{assert.equal(access.trialStartedAt,123);assert.equal(access.kind,'subscription');assert.equal(billing.attempt,null);});

 const professional = 'rest-professional-' + Date.now();
 const seatId = '12345678-1234-1234-1234-123456789abc';
 const code = 'NIA-' + crypto.randomUUID().replaceAll('-', '').toUpperCase();
 const seatPath = `professionals/${professional}/seats/${seatId}`;
 await db.runTransaction(async tx => {
   tx.set(`professionals/${professional}`, { ownerUid: professional, name: 'Rest test', active: true }, false);
   tx.set(seatPath, { status: 'active', invitationCode: code, occupantUid: null, expiresAt: Date.now() + 60000, priceId: 'price_seat', attempt: 'rest-attempt', subscriptionId: 'sub_rest' }, false);
   tx.set(`seatInvitations/${code}`, { professionalId: professional, seatId }, false);
 });
 const people = [professional + '-a', professional + '-b'];
 const claimed = await Promise.allSettled(people.map(person => redeemSeat(person, { code, name: person }, db)));
 assert.equal(claimed.filter(result => result.status === 'fulfilled').length, 1);
 const seat = await db.runTransaction(tx => tx.get(seatPath));
 assert.ok(people.includes(seat.occupantUid));
 await syncSeatSubscription(professional, seatId, 'sub_rest', {}, db, async () => ({ id: 'sub_rest', metadata: { uid: professional, kind: 'seat', seatId, attempt: 'rest-attempt' }, customer: 'cus_rest', status: 'active', latest_invoice: { status: 'paid' }, items: { data: [{ quantity: 1, price: { id: 'price_seat' }, current_period_end: 2000000000 }] } }));
 const access = await db.runTransaction(tx => tx.get(`users/${seat.occupantUid}/access/main`));
 assert.equal(access.expiresAt, 2000000000000);
 assert.equal((await confirmedAccess(seat.occupantUid, db)).active, true);
 await leaveSeat(seat.occupantUid, db);
 assert.equal((await confirmedAccess(seat.occupantUid, db)).active, false);
 const afterLeave = await db.runTransaction(tx => tx.getMany([seatPath, `users/${seat.occupantUid}/access/main`, `professionals/${professional}/patients/${seat.occupantUid}`]));
 assert.equal(afterLeave[0].occupantUid, null); assert.equal(afterLeave[1].kind, 'revoked'); assert.equal(afterLeave[2], null);
 await assert.rejects(redeemSeat(people[1], { code }, db));

 const scheduleUid='calendar-rest-'+Date.now();
 const scheduleInput={operationId:'first',baseRevision:0,timeZone:'Europe/Madrid',daysMask:42,dailyExercises:3};
 await updatePracticeSchedule(scheduleUid,scheduleInput,{PROPOSAL_SCHEDULE_ENABLED:'true'},db,async()=>({active:true}));
 const schedule=await db.runTransaction(tx=>tx.get(`users/${scheduleUid}/scheduleRevisions/0000000001`));
 assert.equal(schedule.daysMask,42);assert.equal(schedule.dailyExercises,3);
 assert.deepEqual(await updatePracticeSchedule(scheduleUid,scheduleInput,{PROPOSAL_SCHEDULE_ENABLED:'true'},db,async()=>({active:true})),{revision:1,replayed:true});
 await db.runTransaction(async tx=>tx.set(`accountDeletions/${scheduleUid}`,{phase:'tree'},false));
 await assert.rejects(updatePracticeSchedule(scheduleUid,{...scheduleInput,operationId:'blocked',baseRevision:1},{PROPOSAL_SCHEDULE_ENABLED:'true'},db,async()=>({active:true})),{status:409});
 await db.erase([`accountDeletions/${scheduleUid}`,`users/${scheduleUid}/scheduleRevisions/0000000001`,`users/${scheduleUid}/scheduleOperations/first`,`users/${scheduleUid}/practiceSchedule/current`]);
 const lifecycleEnv={TRIAL_IDENTITY_SECRET:'demo-lifecycle-secret-32-characters-minimum'};
 const deletedUid='delete-rest-'+Date.now();
 const email=deletedUid+'@example.test';
 await startTrial(deletedUid,email,lifecycleEnv,db);
 const originalTrial=await db.runTransaction(tx=>tx.get(`users/${deletedUid}/access/main`));
 await db.runTransaction(async tx=>{
   tx.set(`users/${deletedUid}/results/a`,{value:'private'},false);
   tx.set(`users/${deletedUid}/operations/a`,{value:'receipt'},false);
   tx.set(`users/${deletedUid}/reportAttempts/a`,{version:1,status:'started'},false);
   tx.set(`users/${deletedUid}/saveEvents/a`,{version:1,status:'started'},false);
   tx.set(`users/${deletedUid}/scheduleRevisions/a`,{version:1,revision:1},false);
   tx.set(`professionals/old/seats/missing/participants/${deletedUid}/sessions/a`,{patientId:deletedUid},false);
 });
 assert.ok(await db.nextDeletion() === undefined);
 await requestDeletion(deletedUid,{email,authTime:Date.now()/1000},{confirmation:'ELIMINAR MI CUENTA'},lifecycleEnv,db,async()=>{throw Error('unexpected Stripe');});
 assert.equal(await db.nextDeletion(),deletedUid);
 await assert.rejects(db.runTransaction(async tx=>{await tx.get(`users/${deletedUid}/results/a`);tx.set(`users/${deletedUid}/results/new`,{bad:true});}),{status:409});
 const deleted=[];
 for(let i=0;i<60;i++) {
   await processDeletion(deletedUid,db,async(action,id)=>deleted.push([action,id]),()=> 'NIA-ABCD-23');
   const job=await db.runTransaction(tx=>tx.get(`accountDeletions/${deletedUid}`),4,true);
   if(job.phase==='done') break;
 }
 assert.deepEqual(deleted,[['delete',deletedUid]]);
 const remaining=await db.runTransaction(tx=>tx.getMany([`users/${deletedUid}/access/main`,`users/${deletedUid}/results/a`,`users/${deletedUid}/operations/a`,`users/${deletedUid}/reportAttempts/a`,`users/${deletedUid}/saveEvents/a`,`users/${deletedUid}/scheduleRevisions/a`,`professionals/old/seats/missing/participants/${deletedUid}/sessions/a`]),4,true);
 assert.deepEqual(remaining,[null,null,null,null,null,null,null]);
 await startTrial('recreated-'+deletedUid,email,lifecycleEnv,db);
 const resumedTrial=await db.runTransaction(tx=>tx.get(`users/recreated-${deletedUid}/access/main`));
 assert.equal(resumedTrial.kind,'trial');
 assert.equal(resumedTrial.trialStartedAt,originalTrial.trialStartedAt);
 }finally{globalThis.fetch=nativeFetch;}
});
