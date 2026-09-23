# Stripe integration

[Stripe Dashboard](https://dashboard.stripe.com/)

The active Stripe integration runs in the standalone
[Cloudflare Worker](../cloudflare/index.mjs). It includes Checkout, the customer
portal, signature verification, subscription webhooks and daily reconciliation.
Keeping that deployment in one module preserves the Cloudflare dashboard's
copy-and-deploy workflow; there is no second copy of the billing code here.

The previous Firebase-hosted Stripe implementation remains in
[Firebase Functions](../firebase/functions/index.js), with its SDK dependencies
and lockfile. It is not the active billing backend.

## Sandbox setup

1. Create a monthly recurring price in the test environment.
2. Set `STRIPE_MONTHLY_PRICE_ID` and `STRIPE_MODE=test` on the Worker.
3. Store `STRIPE_SECRET_KEY` and the endpoint's `STRIPE_WEBHOOK_SECRET` as Worker
   secrets, never as frontend environment variables.
4. Register the Worker's `/webhook` endpoint for `checkout.session.completed`,
   `customer.subscription.created`, `customer.subscription.updated`,
   `customer.subscription.deleted`, `invoice.paid` and `invoice.payment_failed`.
5. Enable cancellation in the sandbox customer portal.
6. Test purchase, renewal failure, payment recovery and end-of-period cancellation
   with a designated test account before enabling live billing.

See the [deployment guide](../cloudflare/README.md) for the configured endpoint,
price, bindings, Cron Trigger and frontend activation. Product access rules live
in the [onboarding guide](../../docs/ONBOARDING.md).
