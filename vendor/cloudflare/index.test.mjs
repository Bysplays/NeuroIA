import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, verifyWebhook, verifyUser, checkout, webhook, reconcileDaily } from './index.mjs';
const env = { APP_URL:'https://bysplays.github.io/NeuroIA/', FIREBASE_PROJECT_ID:'demo-neuroia', STRIPE_MONTHLY_PRICE_ID:'price_monthly', STRIPE_MODE:'test', STRIPE_WEBHOOK_SECRET:'test-secret' };
function store(access={}, billing={}) {
  return { access, billing, async transaction(uid, callback) {
    assert.equal(uid,'user-a'); const patches=[];
    const result=await callback({...this.access},{...this.billing},(i,v)=>patches.push([i,v]));
    for(const [i,v] of patches) Object.assign(i===0?this.access:this.billing,v);
    return result;
  }};
}
const price={active:true,recurring:{interval:'month',interval_count:1}};
test('unauthenticated requests, hostile origins and unsigned webhooks cannot write',async()=>{
  const handler=createHandler({database:()=>{throw Error('No database access expected')}});
  const noDb=createHandler();
  assert.equal((await noDb(new Request('https://worker/checkout',{method:'POST'}),env)).status,401);
  assert.equal((await handler(new Request('https://worker/checkout',{method:'POST',headers:{Origin:'https://evil.example'}}),env)).status,403);
  assert.equal((await noDb(new Request('https://worker/webhook',{method:'POST',body:'{}'}),env)).status,400);
});
test('Firebase JWTs with forged or wrong-project claims are rejected',async()=>{
  await assert.rejects(verifyUser('not-a-token',env.FIREBASE_PROJECT_ID));
  const part=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
  await assert.rejects(verifyUser(`${part({alg:'none'})}.${part({sub:'user-a'})}.x`,env.FIREBASE_PROJECT_ID));
});
async function signed(body,timestamp=Math.floor(Date.now()/1000)) {
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signature=Buffer.from(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${timestamp}.${body}`))).toString('hex');
 return `t=${timestamp},v1=${signature}`;
}
test('Stripe signatures accept original bytes and reject tampering and old timestamps',async()=>{
 const body='{"id":"evt_1"}';const signature=await signed(body);
 await verifyWebhook(body,signature,env.STRIPE_WEBHOOK_SECRET);
 await assert.rejects(verifyWebhook(body+' ',signature,env.STRIPE_WEBHOOK_SECRET));
 await assert.rejects(verifyWebhook(body,await signed(body,1),env.STRIPE_WEBHOOK_SECRET));
});
test('invited accounts and active subscribers cannot create Checkout',async()=>{
 for(const access of [{kind:'invitation'},{kind:'subscription',expiresAt:Date.now()+100000}]) {
  let calls=0;await assert.rejects(checkout('user-a',env,store(access),async()=>{calls++;return price}));assert.equal(calls,1);
 }
});
test('Checkout reuses its persisted session and carries only server-owned price and identity',async()=>{
 const db=store({kind:'trial'});let created=0;
 const stripe=async(path,params,key)=>{
  if(path.startsWith('prices/'))return price;
  if(path==='checkout/sessions'){created++;assert.equal(params['line_items[0][price]'],'price_monthly');assert.equal(params['metadata[uid]'],'user-a');assert.ok(key.startsWith('checkout:user-a:'));return {id:'cs_1',url:'https://checkout.stripe.com/test'};}
  return {status:'open',url:'https://checkout.stripe.com/test'};
 };
 await checkout('user-a',env,db,stripe);await checkout('user-a',env,db,stripe);assert.equal(created,1);
});
const sub={id:'sub_1',customer:'cus_1',metadata:{uid:'user-a',attempt:'attempt-1'},status:'active',latest_invoice:{status:'paid'},items:{data:[{price:{id:'price_monthly'},current_period_end:2000000000}]}};
const event={type:'customer.subscription.updated',livemode:false,data:{object:{id:'sub_1'}}};
test('webhook matches stored attempt, handles repeat events and uses current cancellation state',async()=>{
 const db=store({kind:'trial'},{attempt:'attempt-1'});let current=structuredClone(sub);
 await webhook(event,env,db,async()=>current);await webhook(event,env,db,async()=>current);
 assert.equal(db.access.kind,'subscription');assert.equal(db.access.expiresAt,2000000000000);
 current={...current,status:'canceled'};await webhook(event,env,db,async()=>current);
 assert.equal(db.access.expiresAt,0);assert.equal(db.billing.subscriptionId,null);
});
test('unmatched subscriptions, wrong prices and invitation accounts cannot gain paid access',async()=>{
 for(const [access,billing,value] of [[{},{},sub],[{},{attempt:'attempt-1'},{...sub,items:{data:[{price:{id:'other'}}]}}],[{kind:'invitation'},{attempt:'attempt-1'},sub]]){
  const db=store(access,billing);await webhook(event,env,db,async()=>value);assert.notEqual(db.access.kind,'subscription');
 }
});
test('renewals via invoice.paid extend access from current Stripe subscription',async()=>{
 const db=store({kind:'subscription'},{subscriptionId:'sub_1',customerId:'cus_1'});
 await webhook({type:'invoice.paid',livemode:false,data:{object:{parent:{subscription_details:{subscription:'sub_1'}}}}},env,db,async()=>sub);
 assert.equal(db.access.expiresAt,2000000000000);
});
test('Firebase signature, audience and expiry are validated with Google JWKS',async()=>{
 const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',hash:'SHA-256',modulusLength:2048,publicExponent:new Uint8Array([1,0,1])},true,['sign','verify']);
 const jwk=await crypto.subtle.exportKey('jwk',keys.publicKey);jwk.kid='unit-key';
 const original=globalThis.fetch;globalThis.fetch=async()=>Response.json({keys:[jwk]},{headers:{'cache-control':'max-age=300'}});
 const part=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
 const now=Math.floor(Date.now()/1000);
 const claims={aud:env.FIREBASE_PROJECT_ID,iss:`https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,sub:'user-a',iat:now,auth_time:now,exp:now+3600};
 async function token(payload){const body=`${part({alg:'RS256',kid:'unit-key'})}.${part(payload)}`;return `${body}.${Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(body))).toString('base64url')}`;}
 try {
  assert.equal(await verifyUser(await token(claims),env.FIREBASE_PROJECT_ID),'user-a');
  await assert.rejects(verifyUser(await token({...claims,aud:'another-project'}),env.FIREBASE_PROJECT_ID));
  await assert.rejects(verifyUser(await token({...claims,exp:now-1}),env.FIREBASE_PROJECT_ID));
  const good=await token(claims);const parts=good.split('.');parts[1]=part({...claims,sub:'victim'});
  await assert.rejects(verifyUser(parts.join('.'),env.FIREBASE_PROJECT_ID));
 }finally{globalThis.fetch=original;}
});
test('portal uses authenticated customer and cancel expires only its pending session',async()=>{
 const db=store({}, {customerId:'cus_1',checkoutId:'cs_1',attempt:'a'});const calls=[];
 const handler=createHandler({database:()=>db,verifyUser:async()=>'user-a',stripe:()=>async(path,params)=>{calls.push([path,params]);if(path==='billing_portal/sessions')return {url:'https://billing.stripe.com/session'};return {status:'open'};}});
 const req=path=>new Request(`https://worker${path}`,{method:'POST',headers:{Authorization:'Bearer unit-token',Origin:'https://bysplays.github.io'}});
 assert.equal((await handler(req('/portal'),env)).status,200);assert.equal(calls[0][1].customer,'cus_1');
 assert.equal((await handler(req('/cancel-checkout'),env)).status,200);assert.equal(db.billing.attempt,null);assert.ok(calls.some(([p])=>p==='checkout/sessions/cs_1/expire'));
});

test('scheduled cancellation keeps paid time and disables renewal', async () => {
 const db=store({kind:'subscription'},{subscriptionId:'sub_1'});
 await webhook(event,env,db,async()=>({...sub,cancel_at_period_end:true}));
 assert.equal(db.access.autoRenew,false);assert.equal(db.access.expiresAt,2000000000000);
 await webhook(event,env,db,async()=>sub);assert.equal(db.access.autoRenew,true);
});
test('unpaid renewal cannot extend access and failed payment revokes access', async () => {
 const db=store({kind:'subscription',expiresAt:123},{subscriptionId:'sub_1'});
 await webhook(event,env,db,async()=>({...sub,latest_invoice:{status:'open'}}));
 assert.equal(db.access.expiresAt,123);
 for(const status of ['past_due','unpaid','canceled']) {
  db.billing.subscriptionId='sub_1';
  await webhook(event,env,db,async()=>({...sub,status,latest_invoice:{status:'open'}}));
  assert.equal(db.access.expiresAt,0);
 }
});
test('daily reconciliation resumes batches, retries failed pages and sleeps until next day',async()=>{
 const db=store({kind:'subscription',expiresAt:2000000000000},{subscriptionId:'sub_1'});
 let checkpoint={},fail=false,calls=0;
 db.maintenance=async()=>checkpoint;db.saveMaintenance=async value=>{checkpoint=value};
 const stripe=async path=>{
  calls++;if(fail)throw Error('offline');
  if(path.startsWith('subscriptions?'))return {data:[sub],has_more:!path.includes('starting_after')};
  return {...sub,status:'past_due'};
 };
 await reconcileDaily(env,db,stripe,1000);assert.equal(db.access.expiresAt,0);assert.equal(checkpoint.cursor,'sub_1');
 fail=true;await assert.rejects(reconcileDaily(env,db,stripe,2000));assert.equal(checkpoint.cursor,'sub_1');
 fail=false;await reconcileDaily(env,db,stripe,3000);assert.equal(checkpoint.cursor,null);assert.equal(checkpoint.nextRunAt,86401000);
 const before=calls;await reconcileDaily(env,db,stripe,4000);assert.equal(calls,before);
});
