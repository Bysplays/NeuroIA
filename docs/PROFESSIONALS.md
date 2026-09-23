# Professional workspace and sponsored seats

Professional entry is free. Selecting the professional Google login registers a
self-owned `professionals/{uid}` workspace. The same Google account can also
have a player profile, personal subscription and progress. Explicit personal login
opens the player flow without reading professional records. Restored sessions
show a profile choice; Checkout return parameters select the matching workspace.
“Cambiar de perfil” is available in player settings, entry/recovery screens and
the professional header. Switching unmounts the previous workspace, preserves
queued progress and never changes either subscription. Only professional entry
registers/loads the professional profile; failures never block player entry. There is no professional trial, personal purchase modal,
or fabricated patient list. Registration identifies the account owner, not a
verified healthcare qualification.

`ProfessionalDashboard` subscribes to the owner's seats. Empty accounts show no
people or seats. Purchases fund participants, not access to the dashboard. One
Checkout creates exactly one monthly subscription and one seat. Repeated requests
reuse the seat's persisted attempt/session; only one pending purchase per owner
is allowed. A durable client-generated seat UUID identifies that purchase across
reloads through the server seat list. Completed/cancelled IDs cannot start a new
charge. Unknown attempts older than 23 hours require operator reconciliation.

## Data and authorization

- `professionals/{uid}`: `ownerUid`, `name`, `active`, server `createdAt`. Clients
  may create their own fixed-ownership workspace and read it, not edit ownership.
- `professionals/{uid}/seats/{seatId}`: server-only purchase attempt, Checkout and
  subscription IDs, configured price, status, expiry, renewal state, invitation
  code, occupant UID and participant-supplied display name. Only its owner reads
  this collection. A name is display data, not a verified identity.
- `professionalBilling/{uid}`: server-only Stripe customer and pending seat ID;
  separate from personal billing so buying a seat never changes personal access.
- `seatInvitations/{code}`: server-only mapping to professional and seat. Codes
  have a `NIA-` prefix and a random UUID payload, and cannot be enumerated by clients.
- `professionals/{uid}/patients/{participantUid}`: server-only reciprocal link
  with participant UID, seat ID and link time.
- `users/{participantUid}/access/main`: sponsored invitation with professional ID,
  seat ID, code and confirmed paid expiry. Existing activity is untouched.

A code is usable only after Stripe confirms payment, while the seat is active,
and only for one occupant. Redemption is one REST transaction covering the seat,
access and care link; concurrent claims have one winner. Repeated redemption by
the same participant is idempotent. A pending personal purchase, an existing or still-paid personal subscription, or
a different invitation prevents redemption. A fully ended personal subscription
with no pending billing can be replaced by a sponsored invitation. Self-redemption by the buyer is denied.
The invitation form explains that using a code shares activity with the professional.

An assigned, active reciprocal link allows the owner to read the participant's
progress document and result archive, never write them. The progress document
also contains display name, aggregate counters and accessibility settings; the
UI uses only name and history. Firestore cannot grant access to individual fields
within a document. There are no clinical records, editable notes or clinical
permissions. The existing `ActivityStatistics` view provides the charts, filters,
table and explicit archive pagination. A missing profile has an honest empty
history; permission/network errors must never be presented as zero activity.

Rules independently check professional ownership, both link directions, seat
occupancy and expiry using server time. Expired seats cannot read participant
analytics even if a dashboard is stale. Live seat removal hides selected activity;
listener authorization errors clear the loaded view. A participant can abandon
the invitation via the Worker: access and link are removed atomically, progress
is preserved, and the seat receives a new code before reassignment. The old code
can never reclaim that seat. Expiry/cancellation retains the relationship for
payment recovery but blocks games and professional reads until active again.

`CEOABERTO` remains a separate, permanent reusable invitation with its reserved,
administrator-owned profile. It does not automatically grant this new workspace
access to its historical participants. Do not claim its ownership from the client.

## Billing lifecycle

The standalone Cloudflare Worker adds authenticated POST routes:

- `/professional/checkout` with `{seatId}`.
- `/professional/cancel-checkout` for the owner's pending purchase.
- `/professional/portal` for the professional Stripe customer.
- `/redeem-seat` with `{code, name}` and `/leave-seat` for the signed-in participant.

Stripe subscription metadata carries `kind: seat`, owner UID, seat UUID and the
server purchase attempt. The same signed webhook and daily reconciliation route
these subscriptions separately from personal purchases. Both read current Stripe
state inside transaction retries. Only the stored subscription/attempt, matching
customer, configured monthly price and quantity one can grant access. Unpaid
renewals never extend expiry. Past-due, unpaid, paused or canceled subscriptions
block access; cancellation at period end retains the confirmed paid period.
Duplicate/out-of-order events do not create extra codes or relink departed people.

`STRIPE_SEAT_PRICE_ID` is optional and defaults to `STRIPE_MONTHLY_PRICE_ID`. The
frontend does not invent a price: Checkout displays the configured amount.
Keep the existing billing feature flag and API URL. The professional panel remains
accessible if billing is disabled; its purchase action is unavailable. Enable
cancellation in the Stripe customer portal. Do not enable quantity/price changes
for seats: a changed price/quantity deliberately fails entitlement validation.

## Deployment and verification

Deploy the reviewed Firestore rules and Worker before publishing this frontend.
The current production Worker/rules do not acquire these capabilities from a
frontend build. Publishing rules and backend changes requires explicit approval.
No credentials, real users or paid subscriptions are created by automated tests.

Run the existing build, lint and unit checks plus:

```sh
node --test vendor/cloudflare/index.test.mjs vendor/cloudflare/seats.test.mjs
npx --yes firebase-tools@15.30.1 emulators:exec --only firestore --project demo-neuroia \
  "node --experimental-strip-types --test --test-concurrency=1 tests/firestore.rules.test.mjs vendor/cloudflare/firestore.test.mjs"
```

Emulator coverage includes free registration, read-only linked analytics,
forbidden self-grants, expiry/departure, real REST atomic claims, rotation and
conflict retries. REST retries use Firestore's retry transaction token and bounded
backoff. Payment lifecycle tests use a Stripe double; deployed sandbox payment,
webhook delivery, renewal and portal verification remain required before release.

References: [Stripe subscription Checkout](https://docs.stripe.com/payments/checkout/build-subscriptions),
[Checkout metadata](https://support.stripe.com/questions/using-metadata-with-checkout-sessions),
[Firestore field access](https://firebase.google.com/docs/firestore/security/rules-fields).
