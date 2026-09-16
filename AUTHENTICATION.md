# Firebase account and progress setup

The web app uses Firebase Authentication and Firestore in `ceoaberto-neuroia`.
The public web configuration is in `src/services/firebase.ts`. Google login has
been confirmed by the project owner. No Analytics or private service keys are used.

## Activate cloud persistence

The implementation is ready locally; the reviewed rules must be published in the
real Firebase project before production-mode access will work:

1. Open Firestore Database > Rules in the Firebase console.
2. Replace the editor with the complete contents of the repository's
   [`firestore.rules`](firestore.rules), then publish.
3. Reload the app and sign in. If local activity exists and the cloud account is
   empty, choose whether to import it. Finish an exercise, ensure there is no pending-save notice, and sign in from
   another browser/device to verify the result appears. Successful saves are silent.

Alternatively, after authenticating an authorized local CLI and explicitly
approving deployment, use:

```sh
npx firebase-tools@15.30.1 deploy --only firestore:rules --project ceoaberto-neuroia
```

The browser configuration is not permission to administer Firebase. The local CLI
was not authenticated during implementation, and no production rules were deployed.
Keep Google enabled and authorize `localhost` and the final deployment hostname.
Use `http://localhost:5173` during local development. Spark supports this phase;
no Functions or paid upgrade is required. Reads/writes remain subject to quotas.

## Data layout

| Path | Purpose |
| --- | --- |
| `users/{uid}/progress/main` | Schema version, patient profile, recent 60 results, server update timestamp |
| `users/{uid}/results/{resultId}` | New exercise results; append-only |
| `users/{uid}/operations/{operationId}` | Immutable applied-operation receipts for retry safety |

The aggregate profile includes counters, achievements' source activity and
accessibility settings. Each operation transaction reads the current profile and
its receipt, updates totals/settings, and writes the receipt atomically. Concurrent
completions add independently; settings patch individual fields. The last committed
edit to the same setting wins. Existing result IDs are the idempotency keys.
Recent profile/domain histories are capped at 60; new individual result documents
are retained separately. No permanent receipt pruning is implemented.

Rules permit only the authenticated UID's data. They reject cross-user access,
role documents, clinical writes, result edits/deletes and receipt mutation.
Progress remains client-reported, not a clinically verified record. Professional
approval, care links and clinical records are not part of this phase.

## Local data and import

Existing account-local or older unscoped activity is only imported after explicit
choice, and only into a missing cloud profile. The importer retains cumulative
counters and the locally available latest 60 results; older result details cannot
be recovered from counters. It removes demo clinical fields, notes and prescribed
instructions and keeps the signed-in display name. It never overwrites an existing
cloud profile. The old unscoped keys remain intact; account cache is backed up to
`neuroia_local_backup_v1:<encoded UID>` before cloud replacement. Importing a backup
into an existing cloud account is a future reconciliation feature.

Account-local cache keys remain `neuroia_profile_v1:<encoded UID>` and
`neuroia_history_v1:<encoded UID>`. Pending operations are separate entries under
`neuroia_outbox_v1:<encoded UID>:<encoded operation ID>` to survive reload without
one tab overwriting another's pending work. Logout retains these entries. If local
storage fails, pending work is memory-only; keep the page open until confirmed saved.
The narrator on/off preference remains device-wide as before.

The app requires a successful initial server load before exercises are available.
After that, offline completions remain pending and retry on reconnect, on request,
and every 30 seconds while pending. Failed reads never replace progress with zeros.
Live server snapshots refresh other devices when no local operations are pending.
Cloud callbacks from a closed account session cannot update the next account.

## Verification

```sh
npm test
npm run test:firestore
npm run build
npm run lint
git diff --check
```

Unit tests require Node 22+. Firestore tests require Java 21+ and download Firebase
CLI 15.30.1 via npx. They use `demo-neuroia`, never the real project, and check actual
adapter transactions, concurrent devices, ownership, immutable results and import.
The emulator suite clears only its demo database at startup.

Browser checks use disposable contexts with mocked identity and the real local
Firestore emulator. Verified initial import, settings after reload, an exercise
completed offline then saved exactly once, cloud recovery after cache removal,
permission-denied recovery, logout, and desktop/tablet/phone layouts. Real-account
cloud verification remains pending publication of the rules.

## Popup and orientation restrictions

Firebase Google popup sign-in uses tab-scoped auth persistence with an in-memory
fallback. A closed popup does not prove intentional cancellation. If it closes
immediately in an embedded browser, use external Safari or Chrome. Do not spoof
browser identity or automatically restart sign-in via redirect after cancellation.
Google restricts OAuth in embedded user agents; cross-domain redirects also need
storage compatibility setup.

The portrait gate preserves state and pauses games. An explicit fullscreen action
attempts landscape locking; browsers may reject it. The manual rotation prompt
is the reliable fallback. Confirm native locking on physical target devices.

- [Google sign-in](https://firebase.google.com/docs/auth/web/google-signin)
- [Google embedded browser policy](https://developers.google.com/identity/protocols/oauth2/policies)
- [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Firestore security rules](https://firebase.google.com/docs/firestore/security/get-started)
