import {test} from 'node:test';
import assert from 'node:assert/strict';
import {database} from './index.mjs';

test('real REST transactions retry conflicts and preserve unrelated document fields in demo emulator',async()=>{
 const nativeFetch=globalThis.fetch;
 const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',hash:'SHA-256',modulusLength:2048,publicExponent:new Uint8Array([1,0,1])},true,['sign','verify']);
 const privateKey=Buffer.from(await crypto.subtle.exportKey('pkcs8',keys.privateKey)).toString('base64');
 globalThis.fetch=(input,init)=>{
  const url=String(input);
  if(url==='https://oauth2.googleapis.com/token')return Promise.resolve(Response.json({access_token:'owner',expires_in:3600}));
  if(url.startsWith('https://firestore.googleapis.com/v1/projects/demo-neuroia/'))return nativeFetch(url.replace('https://firestore.googleapis.com','http://127.0.0.1:8080'),init);
  throw Error('Unexpected network destination');
 };
 try{
 const db=database({FIREBASE_PROJECT_ID:'demo-neuroia',FIREBASE_SERVICE_ACCOUNT:JSON.stringify({project_id:'demo-neuroia',client_email:'worker@demo-neuroia.iam.gserviceaccount.com',private_key:`-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`})});
 await db.saveMaintenance({cursor:'sub_test',nextRunAt:123,startedAt:null});
 assert.deepEqual(await db.maintenance(),{cursor:'sub_test',nextRunAt:123,startedAt:null});
 const uid='worker-rest-'+Date.now();
 await db.transaction(uid,(access,billing,patch)=>{assert.deepEqual(access,{});assert.deepEqual(billing,{});patch(0,{kind:'trial',trialStartedAt:123});patch(1,{attempt:'original',count:0});});
 await Promise.all(Array.from({length:2},()=>db.transaction(uid,async(_a,b,patch)=>{await new Promise(r=>setTimeout(r,50));patch(1,{count:b.count+1});})));
 await db.transaction(uid,(access,billing,patch)=>{assert.equal(access.trialStartedAt,123);assert.equal(billing.count,2);assert.equal(billing.attempt,'original');patch(0,{kind:'subscription',expiresAt:2000000000000});patch(1,{attempt:null});});
 await db.transaction(uid,(access,billing)=>{assert.equal(access.trialStartedAt,123);assert.equal(access.kind,'subscription');assert.equal(billing.attempt,null);});
 }finally{globalThis.fetch=nativeFetch;}
});
