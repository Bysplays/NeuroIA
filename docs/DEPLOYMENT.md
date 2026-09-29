# Production domain and local development

The production address is `https://neuroia.es/`. GitHub Pages continues to host
the frontend; Hostinger manages DNS. Local Vite uses `http://localhost:5173/`.
The repository configuration is prepared for this address; provider configuration
and end-to-end verification remain release tasks in [TODO](TODO.md).

## Provider configuration

1. In [repository Pages settings](https://github.com/Bysplays/NeuroIA/settings/pages),
   keep **Source: GitHub Actions** and save **Custom domain: neuroia.es** before
   pointing DNS at GitHub. This workflow does not need a `CNAME` file.
2. In Hostinger, open **Domains > neuroia.es > DNS / Nameservers**. Keep the
   Hostinger nameservers. Replace the existing apex web A record with these
   four records, and replace the existing `www` record:

   | Type | Name | Value |
   | --- | --- | --- |
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | CNAME | www | bysplays.github.io |

   Use the default TTL. Remove conflicting apex A/AAAA/ALIAS parking or old
   hosting records, but preserve unrelated MX/TXT records and subdomains.
   IPv6 is optional; if enabled, use GitHub's documented AAAA values.
3. Wait for the DNS check and certificate, then enable **Enforce HTTPS** in
   GitHub Pages. DNS/certificate propagation can take up to 24 hours.
4. In Firebase project `ceoaberto-neuroia`, open **Authentication > Settings >
   Authorized domains**. Add `neuroia.es` and `www.neuroia.es`; retain `localhost`
   and the Firebase helper domain. Retain `bysplays.github.io` during migration.
   If the browser API key has website restrictions in Google Cloud credentials,
   add `https://neuroia.es/*` and `https://www.neuroia.es/*`, keeping
   `http://localhost:5173/*` and existing Firebase helper referrers.
5. On the `neuroia-billing` Cloudflare Worker, set `APP_URL=https://neuroia.es/`.
   The app origin is automatically allowed; retain
   `ALLOWED_ORIGINS=http://localhost:5173,https://bysplays.github.io` during the
   transition. Apply the reviewed Worker with
   `npx wrangler deploy --config vendor/cloudflare/wrangler.jsonc`, or update
   the binding in Cloudflare. A binding-only update changes production returns;
   the local HTTP exception also requires the updated Worker code.
6. Rebuild/redeploy Pages after saving the custom domain. The workflow uses
   `actions/configure-pages` output for Vite's base, switching from `/NeuroIA/`
   to `/`. After the repository changes are reviewed and merged with explicit
   authorization, the push to `main` triggers deployment. For the already
   published code, GitHub Actions also allows rerunning its deployment workflow.
   Keep the repository's `VITE_BILLING_API_URL` and `VITE_STRIPE_ENABLED` variables.

## Local development

`npm run dev -- --port 5173 --strictPort` keeps the frontend on localhost.
Assets, manifest URLs and state-based navigation already follow the current
origin and Vite base; no production-host redirect belongs in application code.

The existing `.env.local` can keep using the deployed Worker. In that setup,
ordinary play stays local but Stripe returns to the deployed Worker's `APP_URL`.
To test payment returns on localhost too:

1. Create ignored `vendor/cloudflare/.dev.vars` beside the Wrangler config:

   ```dotenv
   APP_URL=http://localhost:5173/
   STRIPE_MODE=test
   ALLOWED_ORIGINS=http://localhost:5173
   ```

   Add the test `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and
   `FIREBASE_SERVICE_ACCOUNT` locally as described in the
   [Worker guide](../vendor/cloudflare/README.md). Do not commit secrets.
2. Run `npx wrangler dev --config vendor/cloudflare/wrangler.jsonc --port 8787`.
3. Set root `.env.local` to `VITE_BILLING_API_URL=http://localhost:8787` and
   `VITE_STRIPE_ENABLED=true`, then restart Vite.
4. For a full local payment lifecycle, forward sandbox Stripe webhooks to
   `http://localhost:8787/webhook` with Stripe CLI and use that listener's
   signing secret locally. Do not replace the deployed webhook destination.

Only the exact HTTP origin `http://localhost:5173` is accepted for payment
returns, and only in Stripe test mode. Production returns require HTTPS.
These settings separate URLs, not accounts or databases: the Firebase project
is still shared. Automated fixtures must continue using `demo-neuroia` emulators.
The production-domain migration does not enable live Stripe charges.

## Identity and external services

The current `authDomain` is `ceoaberto-neuroia.firebaseapp.com`. The recommended
branded target is **auth.neuroia.es**, served by Firebase Hosting in the same
`ceoaberto-neuroia` project. Keep the application at `neuroia.es` on GitHub Pages.
Changing authDomain alone will not work: Pages does not serve Firebase's reserved
`/__/auth/` endpoints. Using the apex for these endpoints would require a hosting
migration or a reverse proxy; the subdomain avoids that infrastructure change.

### Branded authentication rollout (pending)

1. In Firebase Hosting (not App Hosting), connect `auth.neuroia.es` as a custom
   domain. Use the exact ownership and routing DNS records generated by Firebase
   in Hostinger; do not modify the apex/www records serving the application.
   Wait for the domain and HTTPS certificate to be ready. DNS now resolves through
   `ceoaberto-neuroia.web.app`; HTTPS now validates and both `/__/auth/handler` and `/__/auth/action`
   return HTTP 200. This confirms endpoint availability, not a completed sign-in.
2. Add `auth.neuroia.es` to Firebase Authentication's authorized domains, retaining
   the existing app, localhost and helper domains. Authorize
   `https://auth.neuroia.es/__/auth/handler` in the existing Google OAuth web client.
   Check API-key referrer restrictions if configured; allow the new helper origin.
3. Confirm the reserved auth handler is served by Firebase, then change only
   the local build setting `VITE_FIREBASE_AUTH_DOMAIN=auth.neuroia.es` and restart
   Vite. The default remains the original helper when this setting is absent.
   Production build configuration must explicitly receive the same setting after
   validation; the current Pages workflow does not yet pass it. Keep project ID,
   API key and users unchanged. Test Google popup access on local and production
   origins, including cancellation and browser-specific popup behavior.
4. Configure the email template action URL as
   `https://auth.neuroia.es/__/auth/action` after verifying that endpoint. Verification
   and password reset use this hosted action handler; no custom handler is required.
   Merely changing the JavaScript authDomain does not update email templates.
5. Sender branding is a separate configuration in Authentication > Templates >
   Customize domain. Use the exact TXT/CNAME records Firebase supplies, preserve
   unrelated mail records and merge SPF if required rather than adding a second
   SPF record. Apply only once verification completes.
6. Verify real verification/reset emails, expired/used links, return to the app,
   existing account identity/progress and installed-browser Google access. Retain
   the old callback/domain during rollout. Rollback restores the prior authDomain
   and email action URL; do not remove the new helper while issued links need it.

The owner confirmed DNS setup, the authorized domain and Google OAuth callback
addition. HTTPS and both reserved endpoints have been checked successfully.
The local domain override is enabled in ignored `.env.local`; template configuration
and end-to-end Google/email testing remain pending. Production is unchanged. Stripe and Google still use their own domains
for their respective hosted payment and account-selection screens.

References: [Google sign-in custom redirect domain](https://firebase.google.com/docs/auth/web/google-signin#customizing-the-redirect-domain-for-google-sign-in),
[Hosting custom domains](https://firebase.google.com/docs/hosting/custom-domain),
[email action URLs](https://firebase.google.com/docs/auth/custom-email-handler#link_to_your_custom_handler_in_your_email_templates),
[email sender domain](https://firebase.google.com/docs/auth/email-custom-domain).

Authentication sessions, local caches, unsent progress and installed web apps
are origin-scoped. Save pending activity on the old origin before moving, sign
in again on the new domain, and reinstall the web app if needed. The same
Firebase UID restores server-saved progress; changing DNS does not migrate
unsent browser data.

## Release verification

- Check apex A records and `www` CNAME with `dig`.
- Open `https://neuroia.es/`; verify HTTPS, assets, manifest and game audio.
- Check the old GitHub Pages address and `www` reach the intended app.
- Sign in with Google and email/password using an existing designated account;
  verify server-saved progress and verification/recovery flows.
- Confirm the Worker's preflight permits `https://neuroia.es` and localhost.
- Check personal/professional sandbox Checkout success/cancel and portal returns
  on production and the separately configured local Worker.
- Build at `/` and `/NeuroIA/`; run Worker unit tests and required merge checks.

## References

- [GitHub custom domains and DNS](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [Hostinger DNS management](https://support.hostinger.com/en/articles/1583249-how-to-manage-dns-records-at-hostinger)
- [Firebase Google authentication](https://firebase.google.com/docs/auth/web/google-signin)
- [Cloudflare local variables and secrets](https://developers.cloudflare.com/workers/local-development/environment-variables/)

## EEG and PPG result rules

The production `ceoaberto-neuroia` Firestore release includes the optional bounded
EEG/PPG result fields (verified 2026-09-29 against `vendor/firebase/firestore.rules`).
The combined demo adapter/rules/Worker suite passed 29 tests before publication.
The rules deployment is independent of the main-branch Pages workflow that
publishes the Muse frontend. Owner-confirmed device checks and the remaining scope are recorded in [TODO](TODO.md). Existing account and linked-professional
permissions are unchanged. Future rules changes use `firebase deploy --only
firestore:rules --project ceoaberto-neuroia` after emulator verification.
