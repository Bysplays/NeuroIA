// Cloudflare Worker: Web APIs only, no Firebase Functions or Node runtime.
const encoder = new TextEncoder();
class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (status, message) => { throw new HttpError(status, message); };
const bytes = value => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const base64 = value => btoa(String.fromCharCode(...value)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const json64 = value => base64(encoder.encode(JSON.stringify(value)));
let googleKeys, keyExpires = 0, oauth;

export async function verifyUser(token, project) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw Error();
    const header = JSON.parse(new TextDecoder().decode(bytes(parts[0])));
    const claims = JSON.parse(new TextDecoder().decode(bytes(parts[1])));
    const now = Date.now() / 1000;
    if (header.alg !== 'RS256' || !header.kid || claims.aud !== project || claims.iss !== `https://securetoken.google.com/${project}` ||
      typeof claims.sub !== 'string' || ! /^[A-Za-z0-9_-]{1,128}$/.test(claims.sub) ||
      !Number.isFinite(claims.exp) || claims.exp <= now || !Number.isFinite(claims.iat) || claims.iat > now ||
      !Number.isFinite(claims.auth_time) || claims.auth_time > now) throw Error();
    if (!googleKeys || keyExpires <= Date.now()) {
      const response = await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
      if (!response.ok) throw Error();
      googleKeys = (await response.json()).keys;
      keyExpires = Date.now() + Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] ?? 300) * 1000;
    }
    const jwk = googleKeys.find(key => key.kid === header.kid);
    if (!jwk) throw Error();
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    if (!await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, bytes(parts[2]), encoder.encode(parts.slice(0, 2).join('.')))) throw Error();
    return claims.sub;
  } catch { fail(401, 'Vuelve a iniciar sesión.'); }
}
async function googleToken(env) {
  if (oauth?.secret === env.FIREBASE_SERVICE_ACCOUNT && oauth.until > Date.now()) return oauth.token;
  const account = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  if (account.project_id !== env.FIREBASE_PROJECT_ID) throw Error('project-mismatch');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${json64({ alg: 'RS256', typ: 'JWT' })}.${json64({ iss: account.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const key = await crypto.subtle.importKey('pkcs8', bytes(account.private_key.replace(/-----[^-]+-----|\s/g, '')), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(unsigned));
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${base64(new Uint8Array(signature))}` }) });
  if (!response.ok) throw Error('google-auth');
  const result = await response.json();
  oauth = { secret: env.FIREBASE_SERVICE_ACCOUNT, token: result.access_token, until: Date.now() + (result.expires_in - 60) * 1000 };
  return oauth.token;
}
const encodeValue = value => value === null ? { nullValue: null } : typeof value === 'number' ? { doubleValue: value } : typeof value === 'boolean' ? { booleanValue: value } : { stringValue: value };
const decode = fields => Object.fromEntries(Object.entries(fields ?? {}).map(([k, v]) => [k, 'integerValue' in v ? Number(v.integerValue) : 'doubleValue' in v ? v.doubleValue : v.stringValue ?? v.booleanValue ?? (v.timestampValue ? Date.parse(v.timestampValue) : null)]));
export function database(env) {
  const root = `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;
  async function api(path, method = 'GET', body) {
    const response = await fetch(`https://firestore.googleapis.com/v1/${root}${path}`, { method, headers: { Authorization: `Bearer ${await googleToken(env)}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await response.json();
    if (!response.ok) { const error = new Error('firestore'); error.code = data.error?.status; if (response.status === 404) return null; throw error; }
    return data;
  }
  return {
    // Shared server-only transaction primitive for seats and reciprocal care links.
    async runTransaction(callback, maxAttempts = 4) {
      let retryTransaction;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const { transaction } = await api(':beginTransaction', 'POST', { options: { readWrite: retryTransaction ? { retryTransaction } : {} } });
        const writes = [];
        try {
          const tx = {
            async getMany(paths) {
              if (writes.length) throw Error('reads-after-writes');
              const rows = await api(':batchGet', 'POST', { documents: paths.map(path => `${root}/${path}`), transaction });
              return paths.map(path => {
                const found = rows.find(row => row.found?.name === `${root}/${path}`)?.found;
                return found ? decode(found.fields) : null;
              });
            },
            async get(path) { return (await this.getMany([path]))[0]; },
            set(path, values, merge = true) {
              writes.push({ update: { name: `${root}/${path}`, fields: Object.fromEntries(Object.entries(values).map(([k,v]) => [k, encodeValue(v)])) }, ...(merge ? { updateMask: { fieldPaths: Object.keys(values) } } : {}) });
            },
            delete(path) { writes.push({ delete: `${root}/${path}` }); },
          };
          const value = await callback(tx);
          await api(':commit', 'POST', { transaction, writes });
          return value;
        } catch (error) {
          await api(':rollback', 'POST', { transaction }).catch(() => {});
          if (error.code !== 'ABORTED' || attempt === maxAttempts - 1) throw error;
          retryTransaction = transaction;
          await new Promise(resolve => setTimeout(resolve, 50 * 2 ** attempt + Math.random() * 50));
        }
      }
    },
    async maintenance() {
      return decode((await api('/billingMaintenance/daily'))?.fields);
    },
    async saveMaintenance(values) {
      await api('/billingMaintenance/daily', 'PATCH', { fields: Object.fromEntries(Object.entries(values).map(([k,v]) => [k, encodeValue(v)])) });
    },
    async transaction(uid, callback, maxAttempts = 4) {
      let retryTransaction;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const { transaction } = await api(':beginTransaction', 'POST', { options: { readWrite: retryTransaction ? { retryTransaction } : {} } });
        try {
          const paths = [`users/${uid}/access/main`, `billing/${uid}`];
          const read = await api(':batchGet', 'POST', { documents: paths.map(path => `${root}/${path}`), transaction });
          const docs = paths.map(path => read.find(item => item.found?.name === `${root}/${path}`)?.found);
          const writes = [];
          const patch = (index, values) => writes.push({ update: { name: `${root}/${paths[index]}`, fields: Object.fromEntries(Object.entries(values).map(([k,v]) => [k, encodeValue(v)])) }, updateMask: { fieldPaths: Object.keys(values) } });
          const result = await callback(decode(docs[0]?.fields), decode(docs[1]?.fields), patch);
          await api(':commit', 'POST', { transaction, writes });
          return result;
        } catch (error) {
          await api(':rollback', 'POST', { transaction }).catch(() => {});
          if (error.code !== 'ABORTED' || attempt === maxAttempts - 1) throw error;
          retryTransaction = transaction;
          await new Promise(resolve => setTimeout(resolve, 50 * 2 ** attempt + Math.random() * 50));
        }
      }
    },
  };
}
export async function verifyWebhook(body, signature, secret) {
  const entries = signature?.split(',').map(s => s.split('=')) ?? [];
  const timestamp = entries.find(([k]) => k === 't')?.[1];
  if (!secret || !timestamp || !/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) fail(400, 'Invalid signature');
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  for (const [kind, value] of entries) {
    if (kind !== 'v1' || !/^[a-f0-9]{64}$/.test(value)) continue;
    if (await crypto.subtle.verify('HMAC', key, Uint8Array.from(value.match(/../g), x => parseInt(x, 16)), encoder.encode(`${timestamp}.${body}`))) return;
  }
  fail(400, 'Invalid signature');
}
export function stripeClient(env) {
  return async (path, params, idempotency) => {
    const response = await fetch(`https://api.stripe.com/v1/${path}`, { method: params ? 'POST' : 'GET', headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Stripe-Version': '2025-03-31.basil', ...(idempotency ? { 'Idempotency-Key': idempotency } : {}) }, ...(params ? { body: new URLSearchParams(params) } : {}) });
    const value = await response.json();
    if (!response.ok) throw Error('stripe-request-failed');
    if ('livemode' in value && value.livemode !== (env.STRIPE_MODE === 'live')) throw Error('stripe-mode-mismatch');
    return value;
  };
}
function returnUrl(env) {
  const url = new URL(env.APP_URL);
  if (url.protocol !== 'https:') throw Error('https-required');
  url.search = ''; url.hash = ''; return url;
}
export async function checkout(uid, env, db, stripe) {
  const price = await stripe(`prices/${encodeURIComponent(env.STRIPE_MONTHLY_PRICE_ID)}`);
  if (!price.active || price.recurring?.interval !== 'month' || price.recurring.interval_count !== 1) fail(409, 'El plan mensual no está disponible.');
  const billing = await db.transaction(uid, (access, current, patch) => {
    if (access.kind === 'invitation' || current.subscriptionId || (access.kind === 'subscription' && access.expiresAt > Date.now())) fail(409, 'Tu cuenta ya tiene acceso.');
    if (current.attempt && current.attemptCreatedAt && Date.now() - current.attemptCreatedAt > 23 * 3600000 && !current.checkoutId) fail(409, 'Este pago pendiente necesita revisión.');
    const attempt = current.attempt || crypto.randomUUID();
    const attemptCreatedAt = current.attemptCreatedAt || Date.now();
    patch(1, { attempt, attemptCreatedAt });
    return { ...current, attempt, attemptCreatedAt };
  });
  if (billing.checkoutId) {
    const existing = await stripe(`checkout/sessions/${encodeURIComponent(billing.checkoutId)}`);
    if (existing.status === 'open') return { url: existing.url };
    fail(409, 'Cancela el pago pendiente o espera a su confirmación.');
  }
  const success = returnUrl(env); success.searchParams.set('checkout', 'success');
  const cancel = returnUrl(env); cancel.searchParams.set('checkout', 'cancelled');
  const session = await stripe('checkout/sessions', { mode: 'subscription', 'payment_method_types[0]': 'card', 'line_items[0][price]': env.STRIPE_MONTHLY_PRICE_ID, 'line_items[0][quantity]': '1', client_reference_id: uid, 'metadata[uid]': uid, 'subscription_data[metadata][uid]': uid, 'subscription_data[metadata][attempt]': billing.attempt, success_url: success.href, cancel_url: cancel.href, ...(billing.customerId ? { customer: billing.customerId } : {}) }, `checkout:${uid}:${billing.attempt}`);
  await db.transaction(uid, (_access, current, patch) => { if (current.attempt === billing.attempt) patch(1, { checkoutId: session.id }); });
  return { url: session.url };
}
export async function webhook(event, env, db, stripe) {
  if (event.livemode !== (env.STRIPE_MODE === 'live')) fail(400, 'Wrong Stripe environment');
  if (!['checkout.session.completed','customer.subscription.created','customer.subscription.updated','customer.subscription.deleted','invoice.paid','invoice.payment_failed'].includes(event.type)) return;
  const object = event.data.object;
  const id = event.type.startsWith('customer.subscription.') ? object.id : object.subscription || object.parent?.subscription_details?.subscription;
  if (!id) return;
  const initial = await stripe(`subscriptions/${encodeURIComponent(id)}`);
  const uid = initial.metadata?.uid;
  if (!uid || !/^[A-Za-z0-9_-]{1,128}$/.test(uid)) return;
  if (initial.metadata?.kind === 'seat') await syncSeatSubscription(uid, initial.metadata.seatId, id, env, db, stripe);
  else await syncSubscription(uid, id, env, db, stripe);
}
export async function syncSubscription(uid, id, env, db, stripe, maxAttempts = 4) {
  await db.transaction(uid, async (access, billing, patch) => {
    // Fetch inside every retry so late events cannot replay an obsolete subscription state.
    const sub = await stripe(`subscriptions/${encodeURIComponent(id)}?expand[]=latest_invoice`);
    if (sub.metadata?.uid !== uid || !sub.items.data.some(item => item.price.id === env.STRIPE_MONTHLY_PRICE_ID) ||
      !(billing.subscriptionId === sub.id || (billing.attempt && billing.attempt === sub.metadata.attempt))) return;
    if (billing.customerId && billing.customerId !== sub.customer) throw Error('customer-mismatch');
    if (access.kind === 'invitation') return;
    const periodEnd = Math.max(0, ...sub.items.data.filter(item => item.price.id === env.STRIPE_MONTHLY_PRICE_ID).map(item => item.current_period_end || 0)) * 1000;
    const autoRenew = ['active', 'past_due'].includes(sub.status) && !sub.cancel_at_period_end && !sub.cancel_at && !sub.pause_collection;
    // Never extend access merely because Stripe advanced the billing period.
    // An open/draft renewal invoice has not paid for that new period yet.
    const paid = sub.latest_invoice?.status === 'paid';
    const expiresAt = Math.min(periodEnd, sub.cancel_at ? sub.cancel_at * 1000 : Infinity,
      paid ? periodEnd : Number(access.expiresAt) || 0);
    const state = { subscriptionStatus: sub.status, autoRenew, billingCheckedAt: Date.now() };
    if (sub.status === 'active' && (paid || access.kind === 'subscription')) patch(0, { kind: 'subscription', expiresAt, ...state });
    else if (access.kind !== 'trial') patch(0, { kind: 'subscription', expiresAt: 0, ...state });
    patch(1, { customerId: sub.customer, subscriptionId: ['canceled','incomplete_expired'].includes(sub.status) ? null : sub.id, checkoutId: null, attempt: null, attemptCreatedAt: null });
  }, maxAttempts);
}

// Small resumable batches stay within the Free plan's subrequest budget.
export async function reconcileDaily(env, db = database(env), stripe = stripeClient(env), now = Date.now()) {
  const state = await db.maintenance();
  if (state.nextRunAt > now) return;
  const page = await stripe(`subscriptions?status=all&limit=5${state.cursor ? `&starting_after=${encodeURIComponent(state.cursor)}` : ''}`);
  for (const sub of page.data) {
    const uid = sub.metadata?.uid;
    if (uid && /^[A-Za-z0-9_-]{1,128}$/.test(uid)) {
      if (sub.metadata?.kind === 'seat') await syncSeatSubscription(uid, sub.metadata.seatId, sub.id, env, db, stripe, 1);
      else await syncSubscription(uid, sub.id, env, db, stripe, 1);
    }
  }
  // A failed page is retried next tick; never advance past an unverified account.
  if (page.has_more && !page.data.length) throw Error('empty-stripe-page');
  const startedAt = state.startedAt || now;
  await db.saveMaintenance({ cursor: page.has_more ? page.data.at(-1).id : null,
    startedAt: page.has_more ? startedAt : null, nextRunAt: page.has_more ? 0 : startedAt + 86400000 });
}
const seatIdPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const invitationPattern = /^NIA-[A-F0-9]{32}$/;
const newInvitation = () => `NIA-${crypto.randomUUID().replaceAll('-', '').toUpperCase()}`;
const seatPath = (uid, id) => `professionals/${uid}/seats/${id}`;
const proBillingPath = uid => `professionalBilling/${uid}`;
function requireProfessional(profile, uid) {
  if (!profile || profile.ownerUid !== uid || profile.active !== true) fail(403, 'No hemos podido confirmar tu espacio profesional.');
}
function validSeatId(id) { if (typeof id !== 'string' || !seatIdPattern.test(id)) fail(400, 'El asiento no es válido.'); }
function seatReturn(env, state) { const url = returnUrl(env); url.searchParams.set('seatCheckout', state); return url.href; }

export async function seatCheckout(uid, id, env, db, stripe) {
  validSeatId(id);
  const price = await stripe(`prices/${encodeURIComponent(env.STRIPE_SEAT_PRICE_ID || env.STRIPE_MONTHLY_PRICE_ID)}`);
  if (!price.active || price.recurring?.interval !== 'month' || price.recurring.interval_count !== 1) fail(409, 'El plan mensual no está disponible.');
  const current = await db.runTransaction(async tx => {
    const [profile, billing, existing] = await tx.getMany([`professionals/${uid}`, proBillingPath(uid), seatPath(uid, id)]);
    requireProfessional(profile, uid);
    if (billing?.pendingSeatId && billing.pendingSeatId !== id) fail(409, 'Termina o cancela primero la compra pendiente.');
    if (existing && existing.status !== 'pending') fail(409, 'Este asiento ya se ha procesado. Actualiza el panel.');
    if (existing && !existing.checkoutId && Date.now() - existing.createdAt > 23 * 3600000) fail(409, 'Este pago pendiente necesita revisión.');
    const seat = existing || { status: 'pending', createdAt: Date.now(), attempt: crypto.randomUUID(), invitationCode: newInvitation(), occupantUid: null, patientName: null, expiresAt: 0, subscriptionId: null, checkoutId: null, priceId: env.STRIPE_SEAT_PRICE_ID || env.STRIPE_MONTHLY_PRICE_ID };
    if (!existing) tx.set(seatPath(uid, id), seat, false);
    tx.set(proBillingPath(uid), { pendingSeatId: id });
    return { ...seat, customerId: billing?.customerId };
  });
  if (current.checkoutId) {
    const session = await stripe(`checkout/sessions/${encodeURIComponent(current.checkoutId)}`);
    if (session.status === 'open') return { url: session.url };
    fail(409, 'El pago está en confirmación o ha caducado. Actualiza el panel o cancela la compra pendiente.');
  }
  const session = await stripe('checkout/sessions', {
    mode: 'subscription', 'payment_method_types[0]': 'card',
    'line_items[0][price]': current.priceId, 'line_items[0][quantity]': '1',
    client_reference_id: uid, 'metadata[uid]': uid, 'metadata[seatId]': id,
    'subscription_data[metadata][uid]': uid, 'subscription_data[metadata][kind]': 'seat',
    'subscription_data[metadata][seatId]': id, 'subscription_data[metadata][attempt]': current.attempt,
    success_url: seatReturn(env, 'success'), cancel_url: seatReturn(env, 'cancelled'),
    ...(current.customerId ? { customer: current.customerId } : {}),
  }, `seat:${uid}:${id}:${current.attempt}`);
  await db.runTransaction(async tx => {
    const latest = await tx.get(seatPath(uid, id));
    if (latest?.attempt === current.attempt && latest.status === 'pending') tx.set(seatPath(uid, id), { checkoutId: session.id });
  });
  return { url: session.url };
}

export async function syncSeatSubscription(uid, id, subscriptionId, env, db, stripe, maxAttempts = 4) {
  if (typeof id !== 'string' || !seatIdPattern.test(id)) return;
  await db.runTransaction(async tx => {
    const [seat, billing] = await tx.getMany([seatPath(uid, id), proBillingPath(uid)]);
    if (!seat) return;
    // Read current Stripe state on every retry, never trust event order or URL parameters.
    const sub = await stripe(`subscriptions/${encodeURIComponent(subscriptionId)}?expand[]=latest_invoice`);
    if (sub.metadata?.uid !== uid || sub.metadata?.kind !== 'seat' || sub.metadata?.seatId !== id ||
      !(seat.subscriptionId ? seat.subscriptionId === sub.id : seat.attempt && seat.attempt === sub.metadata.attempt)) return;
    if (billing?.customerId && billing.customerId !== sub.customer) throw Error('seat-customer-mismatch');
    const item = sub.items?.data?.length === 1 ? sub.items.data[0] : null;
    const validPlan = item?.price?.id === seat.priceId && item.quantity === 1;
    const paid = sub.latest_invoice?.status === 'paid';
    const end = Math.min((item?.current_period_end || 0) * 1000, sub.cancel_at ? sub.cancel_at * 1000 : Infinity);
    const expiresAt = validPlan && sub.status === 'active' && !sub.pause_collection
      ? Math.min(end, paid ? end : Number(seat.expiresAt) || 0) : 0;
    const autoRenew = validPlan && ['active','past_due'].includes(sub.status) && !sub.cancel_at_period_end && !sub.cancel_at && !sub.pause_collection;
    const status = expiresAt > Date.now() ? 'active' : 'inactive';
    const invitation = await tx.get(`seatInvitations/${seat.invitationCode}`);
    if (invitation && (invitation.professionalId !== uid || invitation.seatId !== id)) throw Error('invitation-collision');
    const access = seat.occupantUid ? await tx.get(`users/${seat.occupantUid}/access/main`) : null;
    tx.set(seatPath(uid, id), { status, expiresAt, autoRenew, subscriptionStatus: sub.status, subscriptionId: sub.id, checkoutId: null, billingCheckedAt: Date.now() });
    if (status === 'active' && !invitation) tx.set(`seatInvitations/${seat.invitationCode}`, { professionalId: uid, seatId: id }, false);
    tx.set(proBillingPath(uid), { customerId: sub.customer, ...(billing?.pendingSeatId === id ? { pendingSeatId: null } : {}) });
    if (access?.kind === 'invitation' && access.professionalId === uid && access.seatId === id) {
      tx.set(`users/${seat.occupantUid}/access/main`, { expiresAt, autoRenew });
    }
  }, maxAttempts);
}

export async function redeemSeat(uid, input, db) {
  const code = typeof input?.code === 'string' ? input.code.trim().toUpperCase() : '';
  if (!invitationPattern.test(code)) fail(400, 'El código no es válido');
  const name = typeof input.name === 'string' ? input.name.trim().slice(0, 200) : '';
  await db.runTransaction(async tx => {
    const [invitation, access, billing] = await tx.getMany([`seatInvitations/${code}`, `users/${uid}/access/main`, `billing/${uid}`]);
    if (!invitation) fail(400, 'El código no es válido');
    const professionalId = invitation.professionalId;
    if (professionalId === uid) fail(409, 'Comparte este código con la persona que ocupará el asiento.');
    const [profile, seat, link] = await tx.getMany([`professionals/${professionalId}`, seatPath(professionalId, invitation.seatId), `professionals/${professionalId}/patients/${uid}`]);
    if (!profile?.active || !seat || seat.invitationCode !== code || seat.status !== 'active' || seat.expiresAt <= Date.now()) fail(409, 'Esta invitación no está disponible.');
    if (seat.occupantUid && seat.occupantUid !== uid) fail(409, 'Este código ya lo ha utilizado otra persona.');
    if ((access?.kind === 'subscription' && access.expiresAt > Date.now()) || billing?.attempt || billing?.checkoutId || billing?.subscriptionId) fail(409, 'Gestiona tu suscripción o pago pendiente antes de usar una invitación.');
    if (access?.kind === 'invitation' && (access.professionalId !== professionalId || access.seatId !== invitation.seatId)) fail(409, 'Abandona tu invitación actual antes de usar otra.');
    if (access?.kind === 'invitation' && access.seatId === invitation.seatId && seat.occupantUid === uid && link?.seatId === invitation.seatId) return;
    const linkedAt = Date.now();
    tx.set(`users/${uid}/access/main`, { kind: 'invitation', invitationCode: code, professionalId, professionalName: profile.name, seatId: invitation.seatId, expiresAt: seat.expiresAt, linkedAt, ...(access?.trialStartedAt != null ? { trialStartedAt: access.trialStartedAt } : {}) }, false);
    tx.set(seatPath(professionalId, invitation.seatId), { occupantUid: uid, patientName: name || 'Persona invitada' });
    tx.set(`professionals/${professionalId}/patients/${uid}`, { patientId: uid, seatId: invitation.seatId, linkedAt }, false);
  });
  return { ok: true };
}

export async function leaveSeat(uid, db) {
  await db.runTransaction(async tx => {
    const access = await tx.get(`users/${uid}/access/main`);
    if (access?.kind !== 'invitation' || !access.seatId) fail(409, 'Tu cuenta ya no tiene este asiento asignado.');
    const path = seatPath(access.professionalId, access.seatId);
    const seat = await tx.get(path);
    if (!seat || seat.occupantUid !== uid) fail(409, 'No hemos podido confirmar tu invitación.');
    const code = newInvitation();
    const collision = await tx.get(`seatInvitations/${code}`);
    if (collision) throw Error('invitation-collision');
    tx.set(`users/${uid}/access/main`, { kind: 'revoked', leftAt: Date.now() }, false);
    tx.delete(`professionals/${access.professionalId}/patients/${uid}`);
    tx.set(path, { occupantUid: null, patientName: null, invitationCode: code });
    tx.set(`seatInvitations/${code}`, { professionalId: access.professionalId, seatId: access.seatId }, false);
    // The old code remains unusable because it no longer matches the seat.
  });
  return { ok: true };
}

export async function professionalRequest(path, uid, input, env, db, stripe) {
  if (path === '/redeem-seat') return redeemSeat(uid, input, db);
  if (path === '/leave-seat') return leaveSeat(uid, db);
  if (path === '/professional/checkout') return seatCheckout(uid, input?.seatId, env, db, stripe);
  const billing = await db.runTransaction(async tx => {
    const [profile, value] = await tx.getMany([`professionals/${uid}`, proBillingPath(uid)]);
    requireProfessional(profile, uid); return value || {};
  });
  if (path === '/professional/portal') {
    if (!billing.customerId) fail(404, 'Todavía no hay suscripciones que gestionar.');
    return { url: (await stripe('billing_portal/sessions', { customer: billing.customerId, return_url: returnUrl(env).href })).url };
  }
  const id = billing.pendingSeatId;
  if (!id) return { ok: true };
  let seat = await db.runTransaction(tx => tx.get(seatPath(uid, id)));
  if (!seat?.checkoutId && seat?.status === 'pending') {
    await seatCheckout(uid, id, env, db, stripe);
    seat = await db.runTransaction(tx => tx.get(seatPath(uid, id)));
  }
  if (seat?.checkoutId) {
    const session = await stripe(`checkout/sessions/${encodeURIComponent(seat.checkoutId)}`);
    if (session.status === 'complete') fail(409, 'Estamos confirmando el pago. Espera unos instantes.');
    if (session.status === 'open') await stripe(`checkout/sessions/${encodeURIComponent(seat.checkoutId)}/expire`, {});
  }
  await db.runTransaction(async tx => {
    const [latest, current] = await tx.getMany([seatPath(uid, id), proBillingPath(uid)]);
    if (latest?.status === 'pending') tx.set(seatPath(uid, id), { status: 'cancelled', checkoutId: null });
    if (current?.pendingSeatId === id) tx.set(proBillingPath(uid), { pendingSeatId: null });
  });
  return { ok: true };
}

export function createHandler(deps = {}) {
  return async (request, env) => {
    const origin = request.headers.get('Origin');
    const origins = [new URL(env.APP_URL).origin, ...(env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)];
    const cors = origin && origins.includes(origin) ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin' } : {};
    const reply = (body, status = 200) => Response.json(body, { status, headers: { ...cors, 'Cache-Control': 'no-store' } });
    try {
      const path = new URL(request.url).pathname;
      if (path === '/health' && request.method === 'GET') return reply({ ok: true, service: 'neuroia-billing', mode: env.STRIPE_MODE || 'test' });
      if (path !== '/webhook' && origin && !origins.includes(origin)) return reply({ error: 'Origen no permitido.' }, 403);
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
      if (request.method !== 'POST') return reply({ error: 'Método no permitido.' }, 405);
      const db = deps.database?.(env) || database(env);
      const stripe = deps.stripe?.(env) || stripeClient(env);
      if (path === '/webhook') {
        const body = await request.text();
        if (body.length > 262144) return reply({ error: 'Payload too large' }, 413);
        await verifyWebhook(body, request.headers.get('Stripe-Signature'), env.STRIPE_WEBHOOK_SECRET);
        await webhook(JSON.parse(body), env, db, stripe);
        return reply({ received: true });
      }
      if (!['/checkout','/portal','/cancel-checkout','/status', '/professional/checkout', '/professional/cancel-checkout', '/professional/portal', '/redeem-seat', '/leave-seat'].includes(path)) return reply({ error: 'Ruta no encontrada.' }, 404);
      const token = request.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1];
      if (!token) fail(401, 'Inicia sesión para continuar.');
      const uid = await (deps.verifyUser || verifyUser)(token, env.FIREBASE_PROJECT_ID);
      if (path.startsWith('/professional/') || path === '/redeem-seat' || path === '/leave-seat') {
        const body = await request.text();
        if (body.length > 4096) fail(413, 'Solicitud demasiado grande.');
        let input; try { input = body ? JSON.parse(body) : {}; } catch { fail(400, 'Solicitud no válida.'); }
        return reply(await professionalRequest(path, uid, input, env, db, stripe));
      }
      if (path === '/checkout') return reply(await checkout(uid, env, db, stripe));
      let billing = await db.transaction(uid, (_a, b) => b);
      if (path === '/status') return reply({ pendingCheckout: Boolean(billing.attempt || billing.checkoutId), canManageSubscription: Boolean(billing.customerId && billing.subscriptionId) });
      if (path === '/portal') {
        if (!billing.customerId) fail(404, 'No hay una suscripción que gestionar.');
        return reply({ url: (await stripe('billing_portal/sessions', { customer: billing.customerId, return_url: returnUrl(env).href })).url });
      }
      if (billing.attempt && !billing.checkoutId) { await checkout(uid, env, db, stripe); billing = await db.transaction(uid, (_a, b) => b); }
      if (billing.checkoutId) {
        const id = billing.checkoutId;
        const session = await stripe(`checkout/sessions/${encodeURIComponent(id)}`);
        if (session.status === 'complete') fail(409, 'Estamos confirmando tu pago. Espera unos instantes.');
        if (session.status === 'open') await stripe(`checkout/sessions/${encodeURIComponent(id)}/expire`, {});
        await db.transaction(uid, (_a, current, patch) => { if (current.checkoutId === id) patch(1, { checkoutId: null, attempt: null, attemptCreatedAt: null }); });
      }
      return reply({ ok: true });
    } catch (error) {
      return reply({ error: error instanceof HttpError ? error.message : 'No hemos podido gestionar el pago. Inténtalo de nuevo.' }, error.status || 500);
    }
  };
}
export default { fetch: createHandler(), async scheduled(_event, env) { await reconcileDaily(env); } };
