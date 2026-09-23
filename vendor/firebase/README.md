# Firebase integration

- `firestore.rules`: authoritative client access rules.
- `functions/`: previous billing backend and the administrator-only professional
  provisioning script, with their own npm package and lockfile. Cloudflare is the
  current billing runtime; do not deploy both billing implementations.

The root `firebase.json` points to this directory. Run commands from the repository
root so the Firebase CLI discovers the configuration:

```sh
npm ci --prefix vendor/firebase/functions
node --test vendor/firebase/functions/access.test.js
npm run test:firestore
```

Frontend Firebase adapters remain in `src/services/`. See
[authentication](../../docs/AUTHENTICATION.md) and
[onboarding](../../docs/ONBOARDING.md) for setup and rule publication.
