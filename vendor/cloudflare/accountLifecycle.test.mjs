import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from './index.mjs';
import { trialIdentity, startTrial, deletionEligibility, requestDeletion, processDeletion } from './accountLifecycle.mjs';
const env = { TRIAL_IDENTITY_SECRET: 'test-only-secret-with-at-least-32-characters' };
const identity = () => ({ email: 'player@example.test', authTime: Date.now()/1000 });
function store(initial = {}) {
  const docs = new Map(Object.entries(initial));
  let serial = Promise.resolve();
  return {
    docs,
    runTransaction(fn, _attempts, allowDeleting = false) {
      const pending = serial.then(async () => {
        const copy = structuredClone(docs); let wrote = false;
        const tx = {
          async getMany(paths) {
            assert.equal(wrote, false);
            if (!allowDeleting && paths.some(path => /^(users|professionals)\//.test(path) && copy.has('accountDeletions/' + path.split('/')[1]))) throw Object.assign(Error('deleting'),{status:409});
            return paths.map(path => copy.get(path) ?? null);
          },
          async get(path) { return (await this.getMany([path]))[0]; },
          set(path, value, merge = true) { wrote = true; copy.set(path, merge ? {...copy.get(path), ...value} : value); },
          delete(path) { wrote = true; copy.delete(path); },
        };
        const value = await fn(tx); docs.clear(); for (const entry of copy) docs.set(...entry); return value;
      });
      serial = pending.catch(() => {}); return pending;
    },
    async find(group, field, value, all = false, limit = 100) {
      return [...docs].filter(([path, data]) => path.split('/').at(-2) === group && (all || path.split('/').length === 2) && data[field] === value).slice(0, limit).map(([path, data]) => ({path, ...data}));
    },
    async erase(paths) { for (const path of paths) docs.delete(path); },
    async collections(path) {
      return {collectionIds:[...new Set([...docs.keys()].filter(key => key.startsWith(path + '/') && key.split('/').length > path.split('/').length + 1).map(key => key.slice(path.length + 1).split('/')[0]))]};
    },
    async list(path) {
      return {documents:[...new Set([...docs.keys()].filter(key => key.startsWith(path + '/')).map(key => path + '/' + key.slice(path.length + 1).split('/')[0]))].map(path => ({path,...docs.get(path)}))};
    },
  };
}
const noStripe = async () => { throw Error('unexpected Stripe access'); };
const request = (uid, db, stripe = noStripe) => requestDeletion(uid, identity(), { confirmation: 'ELIMINAR MI CUENTA' }, env, db, stripe);

test('trial identity is keyed, normalized, stores no email and prevents a second UID claiming the same trial', async () => {
  assert.equal(await trialIdentity(' Player@Example.Test ', env.TRIAL_IDENTITY_SECRET), await trialIdentity('player@example.test', env.TRIAL_IDENTITY_SECRET));
  const db = store();
  await startTrial('old', identity().email, env, db);
  await db.erase(['users/old/access/main']);
  await assert.rejects(startTrial('new', identity().email, env, db), {status:409});
  assert.deepEqual([...db.docs.values()], [{used:true}]);
  await assert.rejects(startTrial('new', identity().email, {}, db), {status:503});
});
test('trial claims are atomic across simultaneous accounts', async () => {
  const db = store();
  const results = await Promise.allSettled(['a','b'].map(uid => startTrial(uid, identity().email, env, db)));
  assert.equal(results.filter(value => value.status === 'fulfilled').length, 1);
});
test('free trials and invitations permit deletion; paid, past due, paused and scheduled cancellation block', async () => {
  for (const kind of ['trial','invitation','revoked']) assert.equal((await deletionEligibility('u', store({'users/u/access/main':{kind}}), noStripe)).allowed, true);
  for (const status of ['active','past_due','paused','unpaid','incomplete','trialing']) {
    const db = store({'billing/u':{customerId:'cus',subscriptionId:'sub'}});
    assert.equal((await deletionEligibility('u', db, async () => ({status,cancel_at_period_end:true}))).allowed, false);
    assert.equal((await request('u', db, async () => ({status}))).allowed, false);
    assert.equal(db.docs.has('accountDeletions/u'), false);
  }
  await assert.rejects(deletionEligibility('u', store({'billing/u':{customerId:'cus'}}), async () => {throw Error('offline');}));
  assert.equal((await deletionEligibility('u', store({'professionalBilling/u':{customerId:'cus'}}), async () => ({data:[{status:'active'}],has_more:false}))).professional, true);
});
test('recent identity, exact confirmation and payment reservations are required; acceptance is idempotent', async () => {
  const db = store();
  await assert.rejects(requestDeletion('u', {...identity(),authTime:1}, {confirmation:'ELIMINAR MI CUENTA'}, env, db, noStripe), {status:401});
  await assert.rejects(requestDeletion('u', identity(), {confirmation:'yes'}, env, db, noStripe), {status:400});
  assert.equal((await request('u', store({'billing/u':{attempt:'pending'}}))).reason, 'pending');
  await request('u', db); const created = db.docs.get('accountDeletions/u').createdAt;
  await request('u', db); assert.equal(db.docs.get('accountDeletions/u').createdAt, created);
});
test('durable deletion removes orphan subcollections, results, receipts, old proposals and invitation links, retains trial marker only permanently', async () => {
  const db = store({
    'users/u/access/main':{kind:'invitation',professionalId:'p',trialStartedAt:123},
    'users/u/progress/main':{name:'Private'}, 'users/u/results/r':{score:1}, 'users/u/operations/o':{applied:true},
    'professionals/p/seats/s':{occupantUid:'u',patientName:'Private',invitationCode:'OLD'},
    'professionals/p/seats/s/participants/u/sessions/a':{patientId:'u'},
    'professionals/old/seats/s/participants/u/sessions/a':{patientId:'u'},
    'professionals/p/patients/u':{patientId:'u'}, 'seatInvitations/OLD':{professionalId:'p',seatId:'s'},
    'seatRedemptions/u':{count:1}, 'users/other/progress/main':{name:'Keep'},
  });
  await request('u', db);
  const authCalls=[];
  for(let i=0;i<40 && db.docs.get('accountDeletions/u')?.phase !== 'done';i++) await processDeletion('u',db,async(action,uid)=>authCalls.push([action,uid]),()=> 'NEW');
  assert.equal(db.docs.get('accountDeletions/u').phase,'done');
  assert.deepEqual(authCalls,[['delete','u']]);
  assert.equal([...db.docs.keys()].some(path=>path.startsWith('users/u/')),false);
  assert.equal([...db.docs.keys()].some(path=>path.includes('/participants/u/')),false);
  assert.equal(db.docs.has('professionals/p/patients/u'),false);
  assert.equal(db.docs.get('professionals/p/seats/s').occupantUid,null);
  assert.equal(db.docs.has('seatInvitations/OLD'),false);
  assert.equal(db.docs.has('users/other/progress/main'),true);
  db.docs.get('accountDeletions/u').finishedAt=1;
  await processDeletion('u',db,async()=>{},()=> 'NEW');
  assert.equal(db.docs.has('accountDeletions/u'),false);
  await assert.rejects(startTrial('newUid',identity().email,env,db),{status:409});
});
test('professional removal revokes linked access without deleting participants own game history', async () => {
  const db=store({'professionals/u':{ownerUid:'u'},'professionals/u/seats/s':{status:'inactive'},'seatInvitations/CODE':{professionalId:'u'},'users/other/access/main':{kind:'invitation',professionalId:'u',trialStartedAt:123},'users/other/results/r':{score:1}});
  await request('u',db);
  for(let i=0;i<50 && db.docs.get('accountDeletions/u')?.phase !== 'done';i++) await processDeletion('u',db,async()=>{},()=> 'NEW');
  assert.equal(db.docs.get('accountDeletions/u').phase,'done');
  assert.deepEqual(db.docs.get('users/other/access/main'),{kind:'revoked',trialStartedAt:123});
  assert.equal(db.docs.has('users/other/results/r'),true);
  assert.equal(db.docs.has('seatInvitations/CODE'),false);
  assert.equal([...db.docs.keys()].some(path=>path.startsWith('professionals/u')),false);
});
test('failed cleanup is retryable and cannot mark deletion finished before Auth deletion succeeds', async () => {
  const db=store();await request('u',db);
  for(let i=0;i<30 && db.docs.get('accountDeletions/u').phase!=='auth';i++) await processDeletion('u',db,async()=>{},()=> 'NEW');
  await assert.rejects(processDeletion('u',db,async()=>{throw Error('offline');},()=> 'NEW'));
  assert.equal(db.docs.get('accountDeletions/u').phase,'auth');
  assert.equal(db.docs.get('accountDeletions/u').leaseUntil,0);
  await processDeletion('u',db,async()=>{},()=> 'NEW');
  assert.equal(db.docs.get('accountDeletions/u').phase,'done');
});


test('HTTP lifecycle routes use verified caller, require recent auth and never accept a body UID', async () => {
  const db=store();
  const handler=createHandler({database:()=>db,stripe:()=>noStripe,verifyUser:async()=> 'caller',authAdmin:async()=>({email:identity().email,emailVerified:true,validSince:'0'})});
  const token='header.'+Buffer.from(JSON.stringify({auth_time:Date.now()/1000})).toString('base64url')+'.signature';
  const runtime={...env,APP_URL:'https://example.test/',FIREBASE_PROJECT_ID:'demo-neuroia',ACCOUNT_DELETION_ENABLED:'true'};
  const response=await handler(new Request('https://worker/account/delete',{method:'POST',headers:{Authorization:`Bearer ${token}`},body:JSON.stringify({uid:'victim',confirmation:'ELIMINAR MI CUENTA'})}),runtime);
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{accepted:true});
  assert.equal(db.docs.has('accountDeletions/caller'),true);assert.equal(db.docs.has('accountDeletions/victim'),false);
  const trial=await handler(new Request('https://worker/trial',{method:'POST',headers:{Authorization:`Bearer ${token}`}}),runtime);
  assert.equal(trial.status,409); // store rejects the deletion lock, never issues a trial.
  assert.equal(db.docs.has('users/caller/access/main'),false);
});

test('a paid seat with missing customer billing still blocks deletion', async()=>{
  const db=store({'professionals/u':{ownerUid:'u'},'professionals/u/seats/s':{subscriptionId:'sub_paid',status:'active'}});
  const state=await deletionEligibility('u',db,async()=>({status:'active'}));
  assert.equal(state.allowed,false);assert.equal(state.professional,true);
});
