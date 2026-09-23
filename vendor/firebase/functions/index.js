import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import Stripe from 'stripe';
import { hasAccess, subscriptionAccessPatch } from './access.js';

initializeApp();
const db = getFirestore();
const region = 'europe-west1';
const stripeKey = defineSecret('STRIPE_SECRET_KEY');
const webhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const priceId = defineString('STRIPE_MONTHLY_PRICE_ID', { default: '' });
const appUrl = defineString('APP_URL', { default: '' });
const accessRef = uid => db.doc(`users/${uid}/access/main`);
const billingRef = uid => db.doc(`billing/${uid}`);
function uidOf(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Inicia sesión para continuar.');
  return request.auth.uid;
}
function returnUrl() {
  const url = new URL(appUrl.value());
  if (url.protocol !== 'https:' && !(process.env.FUNCTIONS_EMULATOR && url.hostname === 'localhost')) {
    throw new HttpsError('failed-precondition', 'El pago todavía no está disponible.');
  }
  url.search = ''; url.hash = '';
  return url;
}
export const createCheckout = onCall({ region, secrets: [stripeKey] }, async request => {
  const uid = uidOf(request);
  if (!priceId.value()) throw new HttpsError('failed-precondition', 'La suscripción todavía no está disponible.');
  const stripe = new Stripe(stripeKey.value());
  const price = await stripe.prices.retrieve(priceId.value());
  if (!price.active || price.recurring?.interval !== 'month' || price.recurring.interval_count !== 1) {
    throw new HttpsError('failed-precondition', 'La suscripción mensual todavía no está disponible.');
  }
  const ref = billingRef(uid);
  // Persistent attempt id makes parallel calls and network retries use the same Checkout.
  const billing = await db.runTransaction(async tx => {
    const [access, stored] = await Promise.all([tx.get(accessRef(uid)), tx.get(ref)]);
    if (access.data()?.kind === 'invitation' || (hasAccess(access.data(), Date.now()) && access.data()?.kind === 'subscription')) {
      throw new HttpsError('already-exists', 'Tu cuenta ya tiene acceso.');
    }
    const data = stored.data() ?? {};
    if (data.subscriptionId) throw new HttpsError('failed-precondition', 'Gestiona tu suscripción existente antes de crear otra.');
    const attempt = data.attempt ?? crypto.randomUUID();
    tx.set(ref, { attempt }, { merge: true });
    return { ...data, attempt };
  });
  if (billing.checkoutId) {
    const existing = await stripe.checkout.sessions.retrieve(billing.checkoutId);
    if (existing.status === 'open') return { url: existing.url };
    throw new HttpsError('failed-precondition', 'Actualiza tu acceso o cancela el pago pendiente antes de intentarlo otra vez.');
  }
  const success = returnUrl(); success.searchParams.set('checkout', 'success');
  const cancel = returnUrl(); cancel.searchParams.set('checkout', 'cancelled');
  const session = await stripe.checkout.sessions.create({ mode: 'subscription',
    line_items: [{ price: priceId.value(), quantity: 1 }], client_reference_id: uid,
    metadata: { uid }, subscription_data: { metadata: { uid, attempt: billing.attempt } },
    success_url: success.href, cancel_url: cancel.href,
    ...(billing.customerId ? { customer: billing.customerId } : {}),
  }, { idempotencyKey: `checkout:${uid}:${billing.attempt}` });
  await db.runTransaction(async tx => {
    const latest = (await tx.get(ref)).data();
    if (latest?.attempt === billing.attempt) tx.set(ref, { checkoutId: session.id }, { merge: true });
  });
  return { url: session.url };
});
export const cancelCheckout = onCall({ region, secrets: [stripeKey] }, async request => {
  const ref = billingRef(uidOf(request));
  let data = (await ref.get()).data();
  if (data?.attempt && !data.checkoutId) {
    // Recover an interrupted create with the same idempotency key before expiring it.
    await createCheckout.run(request);
    data = (await ref.get()).data();
  }
  if (!data?.checkoutId) return { ok: true };
  const stripe = new Stripe(stripeKey.value());
  const session = await stripe.checkout.sessions.retrieve(data.checkoutId);
  if (session.status === 'complete') throw new HttpsError('failed-precondition', 'Estamos confirmando tu pago. Reintenta en unos instantes.');
  if (session.status === 'open') await stripe.checkout.sessions.expire(session.id);
  await db.runTransaction(async tx => {
    const latest = (await tx.get(ref)).data();
    if (latest?.checkoutId === session.id) tx.set(ref, { checkoutId: null, attempt: null }, { merge: true });
  });
  return { ok: true };
});
export const createBillingPortal = onCall({ region, secrets: [stripeKey] }, async request => {
  const billing = (await billingRef(uidOf(request)).get()).data();
  if (!billing?.customerId) throw new HttpsError('not-found', 'No hay ninguna suscripción que gestionar.');
  const session = await new Stripe(stripeKey.value()).billingPortal.sessions.create({
    customer: billing.customerId, return_url: returnUrl().href,
  });
  return { url: session.url };
});
export const stripeWebhook = onRequest({ region, secrets: [stripeKey, webhookSecret] }, async (req, res) => {
  const stripe = new Stripe(stripeKey.value());
  let event;
  try { event = stripe.webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], webhookSecret.value()); }
  catch { res.status(400).send('Invalid signature'); return; }
  const relevant = ['checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'];
  if (!relevant.includes(event.type)) { res.sendStatus(200); return; }
  try {
    const object = event.data.object;
    const subscriptionId = event.type.startsWith('checkout.') ? object.subscription : object.id;
    if (!subscriptionId) { res.sendStatus(200); return; }
    // Read Stripe's current state on every retry, rather than replaying stale event payloads.
    const initial = await stripe.subscriptions.retrieve(subscriptionId);
    const uid = initial.metadata.uid;
    if (!uid || !initial.items.data.some(item => item.price.id === priceId.value())) { res.sendStatus(200); return; }
    await db.runTransaction(async tx => {
      const access = (await tx.get(accessRef(uid))).data();
      const ref = billingRef(uid);
      const billing = (await tx.get(ref)).data();
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      if (billing?.subscriptionId !== subscription.id && !(billing?.attempt && billing.attempt === subscription.metadata.attempt)) return;
      const expiresAt = Math.max(...subscription.items.data.map(item => item.current_period_end ?? subscription.current_period_end ?? 0)) * 1000;
      // Only the subscription matched to the stored checkout attempt reaches this point.
      const patch = subscriptionAccessPatch(access, subscription.status, expiresAt);
      if (patch) tx.set(accessRef(uid), patch, { merge: true });
      tx.set(ref, { customerId: subscription.customer, subscriptionId: ['canceled', 'incomplete_expired'].includes(subscription.status) ? null : subscription.id,
        checkoutId: null, attempt: null }, { merge: true });
    });
    res.sendStatus(200);
  } catch { res.sendStatus(500); }
});
