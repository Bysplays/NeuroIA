import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seatCheckout, syncSeatSubscription, redeemSeat, leaveSeat, professionalRequest, webhook, reconcileDaily, createHandler } from './index.mjs';
const env = { APP_URL: 'https://example.com/app/', STRIPE_MONTHLY_PRICE_ID: 'price_monthly', STRIPE_MODE: 'test' };
const uid = 'professional-a';
const id = '12345678-1234-1234-1234-123456789abc';
const path = `professionals/${uid}/seats/${id}`;
const code = 'NIA-0123456789ABCDEF0123456789ABCDEF';
const profile = { ownerUid: uid, name: 'Ana', active: true };
function store(extra = {}) {
  const docs = new Map(Object.entries({ [`professionals/${uid}`]: profile, ...extra }));
  let lock = Promise.resolve();
  return { docs, runTransaction(callback) {
    const work = lock.then(async () => {
      const copy = structuredClone(docs); let wrote = false;
      const tx = {
        get: async key => { assert.equal(wrote, false); return copy.get(key) || null; },
        getMany: async keys => { assert.equal(wrote, false); return keys.map(key => copy.get(key) || null); },
        set(key, value, merge = true) { wrote = true; copy.set(key, merge ? { ...copy.get(key), ...value } : value); },
        delete(key) { wrote = true; copy.delete(key); },
      };
      const result = await callback(tx);
      docs.clear(); for (const entry of copy) docs.set(...entry);
      return result;
    });
    lock = work.catch(() => {}); return work;
  } };
}
const activeSeat = { status: 'active', occupantUid: null, invitationCode: code, expiresAt: Date.now() + 86400000, priceId: 'price_monthly', attempt: 'attempt', subscriptionId: 'sub_seat' };
const sub = () => ({ id: 'sub_seat', customer: 'cus_pro', metadata: { uid, kind: 'seat', seatId: id, attempt: 'attempt' }, status: 'active', latest_invoice: { status: 'paid' }, items: { data: [{ quantity: 1, price: { id: 'price_monthly' }, current_period_end: 2000000000 }] } });
const invitationStore = () => store({ [path]: { ...activeSeat }, [`seatInvitations/${code}`]: { professionalId: uid, seatId: id } });

test('seat Checkout authenticates owner, creates one subscription per seat and reuses retries', async () => {
  const db = store(); const calls = [];
  const stripe = async (endpoint, params, key) => {
    calls.push({ endpoint, params, key });
    if (endpoint.startsWith('prices/')) return { active: true, recurring: { interval: 'month', interval_count: 1 } };
    if (endpoint === 'checkout/sessions') return { id: 'cs_seat', url: 'https://checkout.stripe.com/seat' };
    return { status: 'open', url: 'https://checkout.stripe.com/seat' };
  };
  await seatCheckout(uid, id, env, db, stripe); await seatCheckout(uid, id, env, db, stripe);
  const creates = calls.filter(call => call.endpoint === 'checkout/sessions');
  assert.equal(creates.length, 1); assert.equal(creates[0].params['line_items[0][quantity]'], '1');
  assert.equal(creates[0].params['subscription_data[metadata][kind]'], 'seat');
  assert.equal(db.docs.get(path).status, 'pending'); assert.equal(db.docs.has(`users/${uid}/access/main`), false);
  assert.equal(db.docs.has(`seatInvitations/${db.docs.get(path).invitationCode}`), false);
  await assert.rejects(seatCheckout('other', id, env, db, stripe), { status: 403 });
  await assert.rejects(seatCheckout(uid, '12345678-1234-1234-1234-123456789abd', env, db, stripe), { status: 409 });
});

test('unconfirmed payments do not activate codes; signed subscription synchronization activates one stable code', async () => {
  const db = store({ [path]: { ...activeSeat, subscriptionId: null, status: 'pending', expiresAt: 0 }, [`professionalBilling/${uid}`]: { pendingSeatId: id } });
  await syncSeatSubscription(uid, id, 'sub_seat', env, db, async () => ({ ...sub(), latest_invoice: { status: 'open' } }));
  assert.equal(db.docs.get(path).expiresAt, 0); assert.equal(db.docs.has(`seatInvitations/${code}`), false);
  await syncSeatSubscription(uid, id, 'sub_seat', env, db, async () => sub());
  await syncSeatSubscription(uid, id, 'sub_seat', env, db, async () => sub());
  assert.equal(db.docs.get(path).status, 'active'); assert.equal(db.docs.get(path).invitationCode, code);
  assert.equal(db.docs.get(`professionalBilling/${uid}`).pendingSeatId, null);
  assert.deepEqual(db.docs.get(`seatInvitations/${code}`), { professionalId: uid, seatId: id });
});

test('simultaneous claims bind one occupant only and repeat redemption does not rewrite the relationship', async () => {
  const db = invitationStore();
  const attempts = await Promise.allSettled(['person-a', 'person-b'].map(person => redeemSeat(person, { code: code.toLowerCase(), name: person }, db)));
  assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1);
  const owner = db.docs.get(path).occupantUid;
  const original = structuredClone(db.docs.get(`users/${owner}/access/main`));
  await redeemSeat(owner, { code, name: 'new name' }, db);
  assert.deepEqual(db.docs.get(`users/${owner}/access/main`), original);
  assert.equal(db.docs.get(`professionals/${uid}/patients/${owner}`).seatId, id);
});

test('expired, occupied, unrelated and self invitations cannot be redeemed', async () => {
  for (const changes of [{ expiresAt: 1 }, { status: 'inactive' }, { occupantUid: 'someone-else' }, { invitationCode: 'rotated' }]) {
    const db = invitationStore(); Object.assign(db.docs.get(path), changes);
    await assert.rejects(redeemSeat('person', { code }, db)); assert.equal(db.docs.has('users/person/access/main'), false);
  }
  await assert.rejects(redeemSeat(uid, { code }, invitationStore()));
  for (const existing of [{ kind: 'subscription', expiresAt: Date.now() + 60000 }, { kind: 'invitation', professionalId: 'other', seatId: id }]) {
    const db = invitationStore(); db.docs.set('users/person/access/main', existing);
    await assert.rejects(redeemSeat('person', { code }, db));
  }
  const db = invitationStore(); db.docs.set('billing/person', { attempt: 'pending' });
  await assert.rejects(redeemSeat('person', { code }, db));
});

test('leaving removes access and care link, preserves results, and rotates the code before reassignment', async () => {
  const db = invitationStore(); db.docs.set('users/person/progress/main', { untouched: true });
  await redeemSeat('person', { code, name: 'Persona' }, db); await leaveSeat('person', db);
  assert.equal(db.docs.get('users/person/access/main').kind, 'revoked');
  assert.equal(db.docs.has(`professionals/${uid}/patients/person`), false);
  assert.equal(db.docs.get(path).occupantUid, null);
  assert.deepEqual(db.docs.get('users/person/progress/main'), { untouched: true });
  await assert.rejects(redeemSeat('other-person', { code }, db));
  const nextCode = db.docs.get(path).invitationCode; assert.notEqual(nextCode, code);
  await redeemSeat('other-person', { code: nextCode }, db);
  assert.equal(db.docs.get(path).occupantUid, 'other-person');
});

test('renewals update assigned access, failed payments revoke it and late events cannot reinstate a departed link', async () => {
  const db = invitationStore(); await redeemSeat('person', { code }, db);
  await syncSeatSubscription(uid, id, 'sub_seat', env, db, async () => ({ ...sub(), cancel_at_period_end: true }));
  assert.equal(db.docs.get(path).autoRenew, false); assert.equal(db.docs.get('users/person/access/main').expiresAt, 2000000000000);
  const oldExpiry = db.docs.get(path).expiresAt;
  const unpaid = sub(); unpaid.latest_invoice.status = 'open'; unpaid.items.data[0].current_period_end += 86400;
  await syncSeatSubscription(uid, id, 'sub_seat', env, db, async () => unpaid); assert.equal(db.docs.get(path).expiresAt, oldExpiry);
  await syncSeatSubscription(uid, id, 'sub_seat', env, db, async () => ({ ...sub(), status: 'past_due' }));
  assert.equal(db.docs.get('users/person/access/main').expiresAt, 0);
  await leaveSeat('person', db);
  await syncSeatSubscription(uid, id, 'sub_seat', env, db, async () => sub());
  assert.equal(db.docs.get('users/person/access/main').kind, 'revoked');
});

test('wrong metadata, wrong plan quantities, customer mismatch and subscription substitution never grant access', async () => {
  for (const mutate of [s => s.metadata.uid = 'other', s => s.metadata.attempt = 'other', s => s.items.data[0].quantity = 2, s => s.items.data[0].price.id = 'wrong']) {
    const db = store({ [path]: { ...activeSeat, status: 'pending', subscriptionId: null, expiresAt: 0 } }); const value = sub(); mutate(value);
    await syncSeatSubscription(uid, id, 'sub_seat', env, db, async () => value);
    assert.equal(db.docs.get(path).expiresAt, 0); assert.equal(db.docs.has(`seatInvitations/${code}`), false);
  }
  const db = invitationStore(); db.docs.set(`professionalBilling/${uid}`, { customerId: 'other' });
  await assert.rejects(syncSeatSubscription(uid, id, 'sub_seat', env, db, async () => sub()));
  const other = invitationStore(); const value = sub(); value.id = 'sub_other';
  await syncSeatSubscription(uid, id, 'sub_other', env, other, async () => value);
  assert.equal(other.docs.get(path).subscriptionId, 'sub_seat');
});

test('portal uses only professional customer; cancellation preserves completed seats and expires pending checkout', async () => {
  const db = store({ [path]: { ...activeSeat, status: 'pending', checkoutId: 'cs_pending' }, [`professionalBilling/${uid}`]: { customerId: 'cus_pro', pendingSeatId: id } });
  const calls = []; let complete = true;
  const stripe = async (endpoint, params) => { calls.push([endpoint, params]); return { status: complete ? 'complete' : 'open', url: 'https://billing.stripe.com/portal' }; };
  await professionalRequest('/professional/portal', uid, {}, env, db, stripe);
  assert.equal(calls[0][1].customer, 'cus_pro');
  await assert.rejects(professionalRequest('/professional/cancel-checkout', uid, {}, env, db, stripe));
  complete = false; await professionalRequest('/professional/cancel-checkout', uid, {}, env, db, stripe);
  assert.ok(calls.some(([endpoint]) => endpoint.endsWith('/expire'))); assert.equal(db.docs.get(path).status, 'cancelled');
});

test('webhooks and daily sweeps route professional subscriptions without touching personal entitlements', async () => {
  const db = invitationStore(); db.docs.set(`users/${uid}/access/main`, { kind: 'trial' });
  let state = {}; db.maintenance = async () => state; db.saveMaintenance = async next => { state = next; };
  const stripe = async endpoint => endpoint.startsWith('subscriptions?') ? { data: [sub()], has_more: false } : sub();
  await webhook({ type: 'invoice.paid', livemode: false, data: { object: { parent: { subscription_details: { subscription: 'sub_seat' } } } } }, env, db, stripe);
  await reconcileDaily(env, db, stripe);
  assert.deepEqual(db.docs.get(`users/${uid}/access/main`), { kind: 'trial' });
});

test('seat routes reject anonymous and malformed requests before creating any paid access', async () => {
  const handler = createHandler({ database: () => store(), verifyUser: async () => uid });
  for (const path of ['/professional/checkout','/professional/portal','/redeem-seat','/leave-seat']) {
    assert.equal((await handler(new Request(`https://worker${path}`, { method: 'POST' }), env)).status, 401);
  }
  const response = await handler(new Request('https://worker/professional/checkout', { method: 'POST', headers: { Authorization: 'Bearer test' }, body: '{' }), env);
  assert.equal(response.status, 400);
});

test('a fully ended personal subscription can be replaced by a sponsored seat without starting a new charge', async () => {
 const db = invitationStore();
 db.docs.set('users/person/access/main', { kind: 'subscription', expiresAt: 0 });
 db.docs.set('billing/person', { subscriptionId: null, checkoutId: null, attempt: null });
 await redeemSeat('person', { code }, db);
 assert.equal(db.docs.get('users/person/access/main').kind, 'invitation');
 assert.equal(db.docs.get(path).occupantUid, 'person');
});
