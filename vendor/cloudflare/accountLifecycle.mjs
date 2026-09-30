// Server-only account lifecycle. Durable jobs outlive tabs and retain no permanent UID tombstone.
const error = (status, message) => Object.assign(new Error(message), { status });
const jobPath = uid => `accountDeletions/${uid}`;
const terminalSubscription = value => ['canceled', 'incomplete_expired'].includes(value.status);
const trialDuration = 7 * 86400000;
const validTrialStart = value => Number.isSafeInteger(value) && value > 0 && value <= Date.now();
export async function trialIdentity(email, secret) {
  if (!secret || secret.length < 32) throw error(503, 'La gestión de cuentas no está disponible temporalmente.');
  if (typeof email !== 'string' || !email.includes('@')) throw error(403, 'Verifica tu correo antes de continuar.');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(email.trim().toLowerCase()));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
export async function trialOffer(email, env, db) {
  const identity = await trialIdentity(email, env.TRIAL_IDENTITY_SECRET);
  const used = await db.runTransaction(tx => tx.get(`trialUsage/${identity}`));
  if (!used) return 'new';
  return validTrialStart(used.trialStartedAt) && used.trialStartedAt + trialDuration > Date.now() ? 'resume' : 'expired';
}
export async function startTrial(uid, email, env, db) {
  const identity = await trialIdentity(email, env.TRIAL_IDENTITY_SECRET);
  await db.runTransaction(async tx => {
    const [access, billing, used] = await tx.getMany([`users/${uid}/access/main`, `billing/${uid}`, `trialUsage/${identity}`]);
    if (access) throw error(409, 'Esta cuenta ya tiene un acceso registrado.');
    if (billing?.attempt || billing?.checkoutId || billing?.subscriptionId) throw error(409, 'Hay un pago pendiente de confirmar.');
    const trialStartedAt = used ? used.trialStartedAt : Date.now();
    if (!validTrialStart(trialStartedAt) || trialStartedAt + trialDuration <= Date.now()) {
      throw error(409, 'Esta cuenta ya ha utilizado su acceso de prueba.');
    }
    tx.set(`trialUsage/${identity}`, { used: true, trialStartedAt }, false);
    tx.set(`users/${uid}/access/main`, { kind: 'trial', trialStartedAt }, false);
  });
  return { ok: true };
}
// Check Stripe itself: an expired local entitlement is not proof that billing stopped.
export async function deletionEligibility(uid, db, stripe) {
  const checkedSubscriptions = new Set();
  const [billing, professionalBilling, access] = await db.runTransaction(tx => tx.getMany([`billing/${uid}`, `professionalBilling/${uid}`, `users/${uid}/access/main`]), 4, true);
  if (billing?.attempt || billing?.checkoutId || professionalBilling?.pendingSeatId) {
    return { allowed: false, reason: 'pending', professional: Boolean(professionalBilling?.pendingSeatId), message: 'Hay un pago pendiente. Cancélalo o espera su confirmación antes de borrar tu cuenta.' };
  }
  if (billing?.subscriptionId && !terminalSubscription(await stripe(`subscriptions/${encodeURIComponent(billing.subscriptionId)}`))) {
    return { allowed: false, reason: 'subscription', professional: false };
  }
  for (const [value, professional] of [[billing, false], [professionalBilling, true]]) {
    if (!value?.customerId) continue;
    let cursor = '';
    do {
      const page = await stripe(`subscriptions?customer=${encodeURIComponent(value.customerId)}&status=all&limit=100${cursor ? `&starting_after=${encodeURIComponent(cursor)}` : ''}`);
      if (!Array.isArray(page.data)) throw Error('invalid-stripe-response');
      if (page.data.some(sub => !terminalSubscription(sub))) return { allowed: false, reason: 'subscription', professional };
      for (const sub of page.data) checkedSubscriptions.add(sub.id);
      if (page.has_more && !page.data.length) throw Error('empty-stripe-page');
      cursor = page.has_more ? page.data.at(-1).id : '';
    } while (cursor);
  }
  // A seat can outlive an interrupted/missing professional billing update.
  const owners = await db.find('professionals', 'ownerUid', uid, false, 100);
  for (const owner of owners) {
    let cursor;
    do {
      const page = await db.list(`${owner.path}/seats`, cursor);
      for (const seat of page.documents || []) {
        if (seat.checkoutId || seat.status === 'pending') return { allowed: false, reason: 'pending', professional: true, message: 'Hay un pago profesional pendiente. Cancélalo antes de borrar la cuenta.' };
        if (seat.subscriptionId && !checkedSubscriptions.has(seat.subscriptionId) && !terminalSubscription(await stripe(`subscriptions/${encodeURIComponent(seat.subscriptionId)}`))) return { allowed: false, reason: 'subscription', professional: true };
        if (seat.status === 'active' && !seat.subscriptionId) throw error(409, 'No hemos podido confirmar la suscripción de uno de tus asientos. Contacta con soporte.');
      }
      cursor = page.nextPageToken;
    } while (cursor);
  }
  // An access record without its billing reference must be reconciled, not guessed away.
  if (access?.kind === 'subscription' && access.expiresAt > Date.now() && !billing?.customerId) {
    return { allowed: false, reason: 'subscription', professional: false };
  }
  return { allowed: true, proof: JSON.stringify([billing, professionalBilling, access]) };
}
export async function requestDeletion(uid, identity, input, env, db, stripe) {
  if (input?.confirmation !== 'ELIMINAR MI CUENTA') throw error(400, 'Escribe ELIMINAR MI CUENTA para confirmar.');
  if (!Number.isFinite(identity.authTime) || Date.now() / 1000 - identity.authTime > 300) throw error(401, 'Confirma de nuevo tu identidad para borrar la cuenta.');
  const hash = await trialIdentity(identity.email, env.TRIAL_IDENTITY_SECRET);
  const previous = await db.runTransaction(tx => tx.get(jobPath(uid)), 4, true);
  if (previous) return { accepted: true };
  const eligibility = await deletionEligibility(uid, db, stripe);
  if (!eligibility.allowed) return eligibility;
  await db.runTransaction(async tx => {
    const [job, billing, proBilling, access, used] = await tx.getMany([jobPath(uid), `billing/${uid}`, `professionalBilling/${uid}`, `users/${uid}/access/main`, `trialUsage/${hash}`]);
    if (job) return;
    if (JSON.stringify([billing, proBilling, access]) !== eligibility.proof) throw error(409, 'El acceso ha cambiado. Vuelve a intentarlo.');
    // Reservations are read in the same transaction as the deletion lock.
    if (billing?.attempt || billing?.checkoutId || proBilling?.pendingSeatId) throw error(409, 'Se ha iniciado un pago. Cancélalo antes de borrar tu cuenta.');
    if (access?.kind === 'trial' || access?.trialStartedAt != null) {
      // Retain the earliest known start; deletion must never restart the trial clock.
      const starts = [used?.trialStartedAt, access?.trialStartedAt].filter(validTrialStart);
      tx.set(`trialUsage/${hash}`, { used: true, ...(starts.length ? { trialStartedAt: Math.min(...starts) } : {}) }, false);
    }
    tx.set(jobPath(uid), { phase: 'seats', createdAt: Date.now(), lastRunAt: 0, leaseUntil: 0 }, false);
  }, 4, true);
  return { accepted: true };
}
const putJob = (db, uid, values) => db.runTransaction(async tx => { await tx.get(jobPath(uid)); tx.set(jobPath(uid), values); }, 4, true);
async function prune(db, queue, budget = 12) {
  for (let count = 0; queue.length && count < budget; count++) {
    const task = queue.pop();
    if (task.kind === 'delete') { await db.erase([task.path]); continue; }
    if (task.kind === 'document') {
      const page = await db.collections(task.path, task.cursor);
      if (page.nextPageToken) queue.push({ ...task, cursor: page.nextPageToken });
      else queue.push({ kind: 'delete', path: task.path });
      for (const name of page.collectionIds || []) queue.push({ kind: 'collection', path: `${task.path}/${name}` });
    } else {
      const page = await db.list(task.path, task.cursor, true);
      if (page.nextPageToken) queue.push({ ...task, cursor: page.nextPageToken });
      for (const document of page.documents || []) queue.push({ kind: 'document', path: document.path });
    }
  }
  return queue;
}
export async function processDeletion(uid, db, authAdmin, invitationCode) {
  const lease = crypto.randomUUID();
  const job = await db.runTransaction(async tx => {
    const value = await tx.get(jobPath(uid));
    if (!value || value.leaseUntil > Date.now()) return null;
    tx.set(jobPath(uid), { lease, leaseUntil: Date.now() + 20 * 60000 });
    return value;
  }, 4, true);
  if (!job) return;
  try {
    if (job.phase === 'done') {
      // Firebase ID tokens live for up to an hour. Keep the write lock until they expire.
      if (job.finishedAt + 65 * 60000 < Date.now()) await db.erase([jobPath(uid)]);
      return;
    }
    if (job.phase === 'seats') {
      const seats = await db.find('seats', 'occupantUid', uid, true, 3);
      for (const row of seats) await db.runTransaction(async tx => {
        const seat = await tx.get(row.path);
        if (seat?.occupantUid !== uid) return;
        const professionalId = row.path.split('/')[1], seatId = row.path.split('/')[3];
        const code = invitationCode();
        if (await tx.get(`seatInvitations/${code}`)) throw Error('invitation-collision');
        tx.set(row.path, { occupantUid: null, patientName: null, invitationCode: code });
        tx.delete(`seatInvitations/${seat.invitationCode}`);
        tx.set(`seatInvitations/${code}`, { professionalId, seatId }, false);
      }, 4, true);
      if (!seats.length) await putJob(db, uid, { phase: 'patients' });
    } else if (['patients', 'sessions'].includes(job.phase)) {
      const rows = await db.find(job.phase, 'patientId', uid, true, 30);
      if (rows.length) await db.erase(rows.map(row => row.path));
      else await putJob(db, uid, { phase: job.phase === 'patients' ? 'sessions' : 'owners' });
    } else if (job.phase === 'owners') {
      const owners = await db.find('professionals', 'ownerUid', uid, false, 1);
      if (owners.length) await putJob(db, uid, { phase: 'owner-access', owner: owners[0].path.split('/')[1] });
      else await putJob(db, uid, { phase: 'tree', queue: JSON.stringify(['users', 'professionals', 'billing', 'professionalBilling', 'seatRedemptions'].map(name => ({ kind: 'document', path: `${name}/${uid}` }))) });
    } else if (job.phase === 'owner-access') {
      const rows = await db.find('access', 'professionalId', job.owner, true, 3);
      for (const row of rows) await db.runTransaction(async tx => {
        const value = await tx.get(row.path);
        if (value?.professionalId === job.owner) tx.set(row.path, { kind: 'revoked', ...(value.trialStartedAt != null ? { trialStartedAt: value.trialStartedAt } : {}) }, false);
      }, 4, true);
      if (!rows.length) await putJob(db, uid, { phase: 'owner-codes' });
    } else if (job.phase === 'owner-codes') {
      const rows = await db.find('seatInvitations', 'professionalId', job.owner, false, 100);
      if (rows.length) await db.erase(rows.map(row => row.path));
      else await putJob(db, uid, { phase: 'owner-tree', queue: JSON.stringify([{ kind: 'document', path: `professionals/${job.owner}` }]) });
    } else if (job.phase === 'owner-tree' || job.phase === 'tree') {
      const queue = await prune(db, JSON.parse(job.queue));
      await putJob(db, uid, { queue: JSON.stringify(queue), ...(queue.length ? {} : { phase: job.phase === 'tree' ? 'auth' : 'owners' }) });
    } else if (job.phase === 'auth') {
      await authAdmin('delete', uid);
      await putJob(db, uid, { phase: 'done', finishedAt: Date.now(), queue: null, owner: null });
    }
  } finally {
    await db.runTransaction(async tx => {
      const current = await tx.get(jobPath(uid));
      if (current?.lease === lease) tx.set(jobPath(uid), { lease: null, leaseUntil: 0, lastRunAt: Date.now() });
    }, 4, true);
  }
}
