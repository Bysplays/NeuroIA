# Account entry and invitations (Firebase Spark)

After Google sign-in, `AccessGate` loads the owner's entitlement directly from
Firestore before mounting `CloudProgress` and games. Invitation redemption and
trials use `src/services/firestoreAccess.ts` and server-enforced Firestore rules.
They do not call Cloud Functions and require no Blaze plan.

## CEOABERTO

`CEOABERTO` is the only accepted code. Leading/trailing spaces and lowercase are
normalized. It grants permanent free access, with no expiration or usage limit.
Every other code is rejected, even if an old invitation document exists.

One transaction creates or updates:

- `users/{uid}/access/main`: `kind: invitation`, `invitationCode: CEOABERTO`,
  `professionalId: ceoaberto`, `professionalName: CeoAberto`, `expiresAt: null`,
  and a server-generated `linkedAt` timestamp. Existing trial history is preserved.
- `professionals/ceoaberto/patients/{uid}`: reverse link with the same timestamp.
- `professionals/ceoaberto`, only if missing: the exact reserved profile
  `{name: 'CeoAberto', active: true, ownerUid: null}`.

Rules use `getAfter()` to require both sides of the link in the committed state.
A patient can bootstrap only that fixed unclaimed profile as part of redemption;
they cannot claim ownership, grant professional roles, create other professionals,
forge subscriptions, delete access, or change their assigned professional.
Existing progress and results are untouched. Repeat redemption preserves the
link date. A missing reverse link can be repaired. Pending billing blocks free
redemption. Existing subscribers must manage their subscription first.

The profile is a persistent professional record, not a fabricated Google account.
Its real owner must later be assigned by an administrator using an existing
Firebase Auth UID. `functions/seed-professional.js` supports that assignment with
Application Default Credentials and verifies the UID outside the demo emulator.
This assignment and the future professional UI are not needed to test redemption.
Clinical access and patient lists remain unavailable to professional clients.

## Trial and subscription

A trial creates one access record with `trialStartedAt: serverTimestamp()`.
Rules require the actual request time and reject restarts, deletes and timestamp
changes. The UI derives the end date as seven days later. It requires no card
and does not turn into a paid subscription. Existing numeric trial timestamps
remain readable. Display countdowns use the browser clock; entitlement timestamps
are server-controlled. Progress write rules remain unchanged for durable pending
saves; the public frontend and downloadable exercise assets are not a secure DRM
boundary.

Stripe Checkout, webhook and portal functions remain in `functions/` for a
separate future billing deployment. `VITE_STRIPE_ENABLED=true` enables the purchase
option only after that backend is configured. Invitation and trial access do not
need it. Stripe still needs `STRIPE_MONTHLY_PRICE_ID`, `APP_URL`, secret-manager
keys, signed webhooks and test-mode payment verification. Never put secret keys
in Vite environment variables.

## Local development

Run `npm run dev` and open `http://localhost:5173/`. Local development uses the
same real Google sign-in and `ceoaberto-neuroia` project as production. There is
no simulated-login preview. Redeem CEOABERTO after signing in normally; the
reviewed rules below must be published first. Existing Google accounts and
patient progress are retained.

## Enable real accounts on the free plan

Publish the reviewed `firestore.rules` to `ceoaberto-neuroia` using an authorized
Firebase administrator. No function deployment, billing account, invitation
seeding or Stripe configuration is required for this flow:

```sh
npx --yes firebase-tools@15.30.1 login
npx --yes firebase-tools@15.30.1 deploy --project ceoaberto-neuroia --only firestore:rules
```

Publishing rules is a separate external action and must be authorized. Missing
rules keep access blocked; infrastructure errors are not shown in the modal at
the product owner's request. Invalid-code feedback stays beside the input.
Access reloads automatically every 30 seconds and when the window gains focus.
The modal cannot be dismissed; logout is available. The orientation gate takes
priority in portrait. No redirect or localStorage flag grants access.

## Verification

`npm run test:firestore` (also `npm run test:onboarding`) exercises the actual
browser adapter and rules, including bootstrap, permanent reuse, reload,
progress preservation, ownership isolation, forbidden partial writes, trial
reuse and pending billing. `npm test`, `npm run build`, `npm run lint` and
`git diff --check` cover the rest. Automated verification uses isolated demo Firestore contexts, without production
fixture users. Normal local development always uses real Google authentication.

References: [Firestore atomic validation](https://firebase.google.com/docs/firestore/security/rules-conditions)
and [Stripe Checkout subscriptions](https://docs.stripe.com/payments/checkout/build-subscriptions).

### Separate invitation and paid access

Invited accounts cannot start Checkout. Settings offers “Abandonar” with confirmation.
Leaving atomically replaces access with `{kind: 'revoked', leftAt: serverTimestamp()}`
and deletes the owner's reciprocal care link. Progress remains intact and trials
cannot restart. The access gate immediately checks the new state. Publish the updated
`firestore.rules` for this operation; a frontend build does not deploy rules.
Users can then redeem an invitation or subscribe when billing is enabled. CEOABERTO
remains the explicit permanent, reusable exception and can be redeemed again.
Trials may subscribe directly. Billing events never turn invited accounts into paid accounts.
