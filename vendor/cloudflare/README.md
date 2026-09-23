# NeuroIA billing on Cloudflare Workers

`vendor/cloudflare/index.mjs` is a standalone module Worker: copy its entire content into Cloudflare's
**Edit code** editor and deploy, or use `npx wrangler deploy --config vendor/cloudflare/wrangler.jsonc`
from an authenticated local CLI. It uses Fetch and Web Crypto, not Firebase Functions.
The configured endpoint is `https://neuroia-billing.kikefontanlorenzo.workers.dev`.
No domain purchase or Firebase Blaze deployment is required.

## Configuration

Set these ordinary runtime variables on the Worker (also recorded in `vendor/cloudflare/wrangler.jsonc`):

- `APP_URL=https://bysplays.github.io/app-ictus/`
- `FIREBASE_PROJECT_ID=ceoaberto-neuroia`
- `STRIPE_MONTHLY_PRICE_ID=price_1UItenAWZtSdGYThrex9dsNh`
- `STRIPE_MODE=test`
- `ALLOWED_ORIGINS=http://localhost:5173` (comma-separated extra exact origins).

Set these **Secret** bindings directly in Cloudflare:

- `STRIPE_SECRET_KEY`: sandbox secret key.
- `FIREBASE_SERVICE_ACCOUNT`: complete JSON for the dedicated Google service account
  with `roles/datastore.user`. Its `project_id` must match the configured project.
- `STRIPE_WEBHOOK_SECRET`: signing secret for the specific endpoint below.

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
   Checkout returns to `APP_URL`; with the deployed configuration that is GitHub Pages.
   Do not enable purchase UI before the backend, webhook and portal are configured.

Use a designated test account without invitation access. Complete a sandbox Checkout,
confirm the signed webhook updates access, reload, then test portal cancellation and
its end-of-period behavior. Confirm a declined card never unlocks the app. Stripe CLI
fixture events alone do not grant access: subscription metadata must match the stored
Checkout attempt. No live payment or fixture user in the real Firebase project is
created by the automated tests.

## Contracts

- POST `/checkout`, `/portal`, `/cancel-checkout`, `/status`: require a Firebase ID token in
  `Authorization: Bearer …`; origin allowlist is additional browser protection.
- POST `/webhook`: requires a Stripe signature over unmodified bytes, with a five-minute
  timestamp tolerance. Unsigned bodies cannot reach Firestore.
- GET `/health`: public liveness only; never returns secrets.
- Firebase JWTs are verified against Google's public keys, issuer, audience, subject,
  issued/expiry/authentication times. Subject IDs use the alphanumeric, dash and
  underscore format of this Google-login app; custom IDs outside that format are rejected. Like default Admin token verification this does
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
