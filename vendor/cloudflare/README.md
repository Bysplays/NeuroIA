# NeuroIA billing on Cloudflare Workers

`vendor/cloudflare/index.mjs` is a module Worker that imports `accountLifecycle.mjs`.
Deploy both through `npx wrangler deploy --config vendor/cloudflare/wrangler.jsonc`
from an authenticated local CLI. It uses Fetch and Web Crypto, not Firebase Functions.
The configured endpoint is `https://neuroia-billing.kikefontanlorenzo.workers.dev`.
No domain purchase or Firebase Blaze deployment is required.

The reviewed Worker is deployed with verified-email enforcement, `/access`,
`/professional/status`, per-seat portal cancellation, reserved short invitation codes and the five-minute
reconciliation trigger. Current version: `dac53e3c-bb91-4c8f-bb83-436277722a55`. Runtime secrets are retained, Stripe stays in test mode,
preview URLs remain disabled and existing observability is enabled. Health,
localhost CORS, unauthenticated access and unsigned-webhook rejection were verified;
signed payment lifecycle and scheduled reconciliation still need live validation.

## Configuration

Set these ordinary runtime variables on the Worker (also recorded in `vendor/cloudflare/wrangler.jsonc`):

- `APP_URL=https://neuroia.es/`
- `FIREBASE_PROJECT_ID=ceoaberto-neuroia`
- `STRIPE_MONTHLY_PRICE_ID=price_1UItenAWZtSdGYThrex9dsNh`
- `STRIPE_MODE=test`
- `ACCOUNT_DELETION_ENABLED=false` until the activation sequence is complete.
- `ALLOWED_ORIGINS=http://localhost:5173,https://neuroia.es` (comma-separated extra exact origins).

Set these **Secret** bindings directly in Cloudflare:

- `STRIPE_SECRET_KEY`: sandbox secret key.
- `FIREBASE_SERVICE_ACCOUNT`: complete JSON for the dedicated Google service account
  with `roles/datastore.user`. Its `project_id` must match the configured project.
- `STRIPE_WEBHOOK_SECRET`: signing secret for the specific endpoint below.
- `TRIAL_IDENTITY_SECRET`: stable cryptographically random secret of at least 32 characters.
  Generate directly into the secret binding; never print or commit it. Keep it backed
  up securely: changing it without a ledger migration allows repeat trials.

The service account IAM role grants database-wide data access. The Worker constrains
its writes to validated account access/billing records, professional seats and
reciprocal care links, and an administrator-only
`billingMaintenance/daily` reconciliation checkpoint. Never put
these secrets in the frontend, GitHub Pages variables, committed files or chat.
Firestore read/write usage still counts against the Firebase project's quota.
Worker Free also has CPU/subrequest limits; 100k requests/day is not the only limit.
Measure deployed CPU usage during test Checkout before considering this production-ready.

## Stripe setup and frontend activation

1. Deploy the module and visit `/health`; expect `ok: true` and `mode: test`.
   This checks the running code only, not credentials or Stripe/Firestore connectivity.
2. In the same Stripe sandbox as the price, add a webhook destination:
   `https://neuroia-billing.kikefontanlorenzo.workers.dev/webhook`.
3. Select snapshot events: `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`,
   and `invoice.payment_failed`. Copy the signing secret into the Worker binding above.
4. Configure the sandbox customer portal to allow cancellation.
5. In GitHub repository **Settings > Secrets and variables > Actions > Variables**, set:
   `VITE_BILLING_API_URL=https://neuroia-billing.kikefontanlorenzo.workers.dev`
   and `VITE_STRIPE_ENABLED=true`. The existing Pages build now reads these variables.
   These are public configuration, not secrets. A rebuild is required.
6. Local Vite can use the same values in root `.env.local` and must be restarted.
   Checkout returns to server-owned `APP_URL`. The target production value is
   `https://neuroia.es/`; apply the [domain migration](../../docs/DEPLOYMENT.md)
   to update the deployed binding. A local Worker can use `http://localhost:5173/`
   only with `STRIPE_MODE=test`; all other return URLs require HTTPS.
   Do not enable purchase UI before the backend, webhook and portal are configured.

Use a designated test account without invitation access. Complete a sandbox Checkout,
confirm the signed webhook updates access, reload, then test portal cancellation and
its end-of-period behavior. Confirm a declined card never unlocks the app. Stripe CLI
fixture events alone do not grant access: subscription metadata must match the stored
Checkout attempt. No live payment or fixture user in the real Firebase project is
created by the automated tests.

## Contracts

- POST `/access`: server-confirmed player entitlement, effective seat expiry and
  reciprocal link validation; returns `serverNow` and `validForMs: 60000`.
- POST `/professional/status`: owner-only server time with the same lease.
- POST `/professional/portal`: optional `{seatId}` opens cancellation confirmation
  for an owner seat; configure period-end cancellation in the Stripe portal.
- POST `/checkout`, `/portal`, `/cancel-checkout`, `/status`: require a Firebase ID token in
  `Authorization: Bearer …`; origin allowlist is additional browser protection.
- POST `/webhook`: requires a Stripe signature over unmodified bytes, with a five-minute
  timestamp tolerance. Unsigned bodies cannot reach Firestore.
- GET `/health`: public liveness only; never returns secrets.
- Password-provider JWTs also require `email_verified: true` before any authenticated
  billing or seat route. Deploy this guard and the corresponding Firestore rules
  before enabling Email/Password in Firebase; Google login behavior is unchanged.
- Firebase JWTs are verified against Google's public keys, issuer, audience, subject,
  issued/expiry/authentication times. Subject IDs use the alphanumeric, dash and
  underscore format of Firebase-generated account IDs; custom IDs outside that format are rejected. Like default Admin token verification this does
  not query revocation/disabled-user status on every request; tokens expire normally.
- Firestore REST transactions bind Checkout attempts, block invitation redemption during
  pending payment, and prevent duplicate subscription creation. Stripe idempotency keys
  reuse the durable attempt; an unresolved attempt older than 23 hours without a session
  requires operator reconciliation, rather than risking a second charge after key expiry.
- Webhooks re-read Stripe's current subscription inside transaction retries; old or repeated
  events cannot replay historical payload state. Only a matching stored subscription or
  Checkout attempt and configured price can grant access. Paid access is never granted
  by the browser's success URL. Active subscriptions use Stripe's period end; cancellation
  at period end retains access until that date. Invitations never become paid implicitly.
- `vendor/firebase/functions/` is retained as the previous Firebase deployment implementation and the
  professional provisioning script. Do not deploy both billing backends for this setup.

## Checks

`node --test vendor/cloudflare/index.test.mjs` covers signatures, request boundaries, payment
idempotency and subscription lifecycle with mocks. `node --test vendor/cloudflare/firestore.test.mjs`
requires the demo-neuroia Firestore emulator on 8080; it exercises real REST transactions,
conflict retries and merge preservation. When running both Firestore suites together,
use `--test-concurrency=1`: the rules suite clears the shared demo database.
Its Google token exchange is mocked, so real
service-account authorization and an end-to-end sandbox payment still need deployment checks.

## Renewal and daily reconciliation

Paid settings append “. Renovación automática” to the end-date paragraph only
when `autoRenew` is explicitly true, alongside the “Gestionar” portal action.
Canceled or unknown renewal state omits that suffix; the end date stays visible. There is no renewal toggle. The backend still records Stripe renewal
state for reconciliation. Scheduled
cancellation disables renewal and keeps the paid period; canceled/unpaid/past-due
subscriptions lose access. Only an active subscription with a paid latest invoice
can extend expiry. An open/draft invoice cannot grant the new billing period.
The existing access gate also checks expiry locally and refreshes Firestore every
30 seconds/on focus; it does not wait for a daily job to expire known access.

Deploy the updated `vendor/cloudflare/index.mjs`, then add a Cron Trigger `*/5 * * * *` under the
Worker's Settings > Trigger Events (Wrangler deployment applies the configured
trigger automatically). The handler processes five Stripe records per invocation,
resumes via `billingMaintenance/daily`, and begins a new sweep daily. The frequent
tick is for bounded batches and retries, not a full scan every five minutes.
Do not run a second independent scheduler against the same checkpoint.
Failures leave the cursor unchanged for the next tick and surface as failed
scheduled invocations in Cloudflare. Stripe outages never extend access.
No client security-rule changes are required; the checkpoint remains denied to clients.

Check scheduled invocation success and `billingCheckedAt` after deployment. Use
Stripe test clocks to test renewal failure, payment recovery and end-of-period
cancellation on a designated test account. These deployed checks remain pending.
For a large Stripe history, monitor sweep duration: five records per five minutes
is at most 1,440 per day, including canceled records. Move to a queue/larger worker
budget before a sweep approaches one day. This is a recovery mechanism alongside
webhooks, not a guarantee during provider outages.

## Professional seats

The same standalone Worker implements professional seat Checkout, portal,
redemption and departure. See [professional contracts](../../docs/PROFESSIONALS.md).
No subscription is required to open the professional panel. Each seat has a
separate subscription and unique code. Optional `STRIPE_SEAT_PRICE_ID` overrides
the existing monthly price for seats; without it the individual monthly price is
used. Codes activate only after a paid Stripe state and are rotated on departure.

Deploy this Worker and the reviewed Firestore rules before the professional
frontend. Keep the same six webhook events and daily reconciliation trigger;
subscription metadata routes seat events independently from personal access.
Configure portal cancellation, without quantity or price changes for seats.
Run `node --test vendor/cloudflare/index.test.mjs vendor/cloudflare/seats.test.mjs`
and the combined sequential emulator command in the professional guide.


## Account deletion and trial identity (staged, activation pending)

`accountLifecycle.mjs` owns POST `/trial`, `/account/deletion-status` and
`/account/delete`. Client rules prohibit direct trial grants. `/trial` atomically
writes access and `trialUsage/{HMAC-SHA256(normalizedVerifiedEmail)}` with only
`{used:true}`. This pseudonymous marker survives UID recreation; raw email and the
old UID are not stored in it. It prevents reuse with the same verified email,
not a new/different email or all provider aliases. Existing trial timestamps are
backfilled when deletion is requested; irrecoverable historical trial evidence
removed by older invitation-departure code cannot be reconstructed.

Deletion requires the exact phrase `ELIMINAR MI CUENTA`, verified live Auth identity
and authentication in the preceding five minutes. Check Stripe subscriptions for
both personal and professional customers and seats. Only `canceled` and
`incomplete_expired` are terminal; a cancellation scheduled for period end still
blocks until that period ends. Trial/invitation entitlements do not block deletion.
Pending checkout must be cancelled first. Stripe failures fail closed. This does
not cancel charges or erase Stripe's customer/invoice records.

Acceptance creates `accountDeletions/{uid}` in the same transaction that rechecks
payment reservations. Rules and Worker transactions block further account writes.
A separate every-minute cron leases the least-recently-processed job and advances
one bounded batch. It removes active seats/rotates codes, reciprocal patient links,
old assigned sessions (including previous professionals), owned professional trees,
invitation codes, access, user progress/results/receipts, billing references and
redemption throttles. Owned-workspace departure revokes participants' access but
preserves those participants' own game results. Recursive traversal includes
missing parent documents and paginates collections/documents. Auth is deleted
last. Partial failures retain the job and retry without claiming completion.

A temporary UID lock remains for 65 minutes after Auth deletion to reject
previously-issued ID tokens; the cron then deletes it. It is not a permanent
account tombstone. Only the trial-use marker is retained permanently. The current
browser's account cache/outbox is cleared after accepted deletion and sign-out;
remote browsers' offline copies cannot be erased by this request. Processing is
asynchronous and depends on backlog/data volume, not an instant-delete guarantee.
Observe failed scheduled invocations and jobs whose `lastRunAt` stops advancing.
The existing five-minute Stripe reconciliation runs separately.

Deployment state: Worker modules and both cron triggers are published, with
`ACCOUNT_DELETION_ENABLED=false`. The stable secret is configured in Cloudflare
and a mode-0600 local backup is kept outside the repository under
`~/.config/neuroia/secrets/trial-identity-secret`. The billing service account has
`projects/ceoaberto-neuroia/roles/neuroiaAccountLifecycle` with only Auth get/delete
permissions. All four collection-group indexes are confirmed READY. Production Firestore rules are unchanged.

The published frontend (`index-B8AG4Q-I.js`) still grants trials directly through
Firestore. Do not switch rules or enable deletion independently of the frontend
migration: old trial activation would fail. Publishing the current frontend remains
subject to the owner's separate choice; backend authorization has already been given.
No real account was deleted. Health and unauthenticated rejection checks passed.

Activation sequence (finish coordinated with frontend publication):

1. Back up/configure `TRIAL_IDENTITY_SECRET` and grant the dedicated service account
   `firebaseauth.users.get` and `firebaseauth.users.delete` through a scoped custom
   project role, in addition to its existing datastore permissions. The reviewed role
   definition is [account-lifecycle-role.yaml](../firebase/account-lifecycle-role.yaml).
   No broader owner role.
2. Deploy `vendor/firebase/firestore.indexes.json`; wait for collection-group indexes.
3. Deploy Worker modules with both cron triggers, keeping `ACCOUNT_DELETION_ENABLED=false`, and verify the new routes without
   deleting a real account. Deploy the rules that prohibit direct trial creation and
   enforce deletion locks **before exposing deletion to users**. Keep old clients
   closed during this transition: they still attempt direct trial creation.
4. Set `ACCOUNT_DELETION_ENABLED=true` only after rules and indexes are confirmed.
   Deploy frontend. Verify reauthentication and deletion with a deliberately created
   disposable account, then verify cron completion and a rejected repeat trial.

Tests: `node --test vendor/cloudflare/accountLifecycle.test.mjs` plus the combined
Firestore REST/rules suite in CONTRIBUTING.md. The Auth emulator does not validate
production IAM. Real permission/cron and Stripe portal checks remain release work.
Provider contracts: [Auth deletion](https://docs.cloud.google.com/identity-platform/docs/reference/rest/v1/projects.accounts/delete),
[Auth lookup](https://docs.cloud.google.com/identity-platform/docs/reference/rest/v1/projects.accounts/lookup),
[recursive Firestore deletion](https://firebase.google.com/docs/firestore/solutions/delete-collections).
