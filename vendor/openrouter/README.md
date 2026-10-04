# OpenRouter integration

The existing Cloudflare Worker performs remote inference with standard `fetch`;
there is no browser API key, SDK dependency, vector database or autonomous agent.
Bounded Firestore retrieval supplies calculated facts for optional writing.
See [product/architecture](../../docs/AI.md) and [runtime prompts](prompts.mjs).

## Configuration

Set the following bindings on `vendor/cloudflare/wrangler.jsonc` or the equivalent
Worker environment. The production configuration enables the owner-approved AI release; set AI_ENABLED=false to disable generation.

| Binding | Meaning |
| --- | --- |
| `OPENROUTER_API_KEY` / `OPENROUTER_API` | Worker **secret** (canonical name takes precedence); never a `VITE_` variable, source file or committed config |
| `OPENROUTER_MODEL` | Explicit model ID; selected: `dots-studio/dots-3-note-preview:free`; no automatic model fallback |
| `AI_ENABLED` | `true` in the production config; absent/false disables generation |
| `AI_DAILY_LIMIT` | Optional integer 1–50, default 10 attempts per caller per UTC day |
| `OPENROUTER_PROVIDER` | Optional exact provider slug to pin in `provider.only` |
| `OPENROUTER_REGION` | Optional `eu` selects `https://eu.openrouter.ai/api/v1/chat/completions`; otherwise uses the standard API |

Regional endpoints can require an eligible OpenRouter plan. Confirm availability
and model/provider support rather than assuming that an EU endpoint works on every
account. The implementation never falls back from EU to the standard endpoint.

Example secret setup (interactive, no key in shell history):

```sh
npx wrangler secret put OPENROUTER_API_KEY --config vendor/cloudflare/wrangler.jsonc
```

## Root .env workflow

The owner supplies `OPENROUTER_API` and `OPENROUTER_MODEL` in root `.env`.
Output mode and ZDR are fixed in `prompts.mjs`: `RESPONSE_FORMAT` is
`{ type: 'json_object' }` and `ZERO_DATA_RETENTION` is `false`. They are not env
bindings and obsolete env values are ignored. The prompt includes a worked example,
a per-request fill-in template and the exact allowed evidence IDs. See
[PROMPT.md](PROMPT.md) for the editing and data-insertion guide.

Run `npm run ai:configure` to copy only the allowlisted AI bindings into ignored
`vendor/cloudflare/.dev.vars`, with local `AI_ENABLED=true` and mode 0600. The script
preserves existing billing/service-account bindings verbatim. It never changes
`.env.local` or prints secrets. Neither env file is committed or exposed as a Vite
variable. Run again after changing the model/key. Start local Wrangler with
`npx wrangler dev --config vendor/cloudflare/wrangler.jsonc`; the existing Worker
still needs its Firebase service-account bindings to serve authenticated activity.

`npm run ai:verify` performs up to two **real inference requests** against the
configured model using only synthetic in-memory records, then saves drafts to
`/tmp/neuroia-openrouter-synthetic.json` for inspection. It never reads/writes
Firebase. It is opt-in, never part of build/CI; a paid model would incur charges.

The frontend reuses `VITE_BILLING_API_URL` and the authenticated `/ai/status` endpoint.
Root `.env` alone does not reconfigure the deployed Worker. Production activation
requires adding the Worker secret, setting `AI_ENABLED=true`, and deploying the
reviewed Worker/frontend under the existing release authorization. The committed production configuration enables generation with Dots3-Note Preview free.

## Model selection and cost

The configured production model is `dots-studio/dots-3-note-preview:free`.
Real synthetic recommendations and report smoke checks passed with the v4 prompt
and disabled reasoning. The endpoint remains configurable; these smoke cases do
not certify general factuality, latency or availability. JSON object mode and ZDR
remain hardcoded, with no paid or automatic model fallback. Gemma previously
returned temporary upstream rate limits. Provider 429 errors have a distinct
Spanish message. Broader Spanish acceptance remains pending.

Use synthetic scenarios: empty/partial history, little-played games, high precision
with more time, same-level speed trends, different-level history, assigned sessions,
unknown hints and legacy dates. Compare facts, clarity, actionable wording and
latency. Do not label a model approved from a schema-only or mocked test.

Set a spending limit on the OpenRouter key/account. The per-account application
quota is not a global billing cap and does not prevent aggregate cost across many
new accounts. Provider response tokens are bounded to 1,400 (suggestions) or 2,200
(reports). The first daily visit to Resumen generates and caches recommendations. No automatic retry or model fallback is
implemented. Failures/cancellation count against the quota; cancellation may not
prevent provider billing for already-started work.

## Privacy and routing

Only de-identified aggregate game activity is transmitted. This is not a claim
that the data is legally anonymous. Names, emails, account/result IDs, health
context, free-text notes, original responses and EEG/PPG are excluded. The caller
affirmatively acknowledges each request; professionals must have the appropriate
authority for external processing of a linked participant's summary.

The selected configuration requests:

```json
{
  "provider": {
    "require_parameters": true,
    "data_collection": "deny",
    "zdr": false,
    "allow_fallbacks": false
  },
  "response_format": { "type": "json_object" }
}
```

Also review account-level prompt logging/privacy settings and the selected
provider's terms. Do not enable prompt/body logging in Worker observability.
The owner explicitly disabled the application-level ZDR filter for Gemma. Do not
claim zero retention for this configuration; `data_collection: deny` is a separate
routing setting, not proof of zero retention or a particular data location. Controller/provider review remains a release gate.

Official references checked during implementation:

- [Structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs)
- [Provider routing and privacy parameters](https://openrouter.ai/docs/guides/routing/provider-selection)
- [Provider logging](https://openrouter.ai/docs/guides/privacy/provider-logging)
- [Regional routing](https://openrouter.ai/docs/guides/get-started/sovereign-ai)

## Verification

```sh
node --experimental-strip-types --test tests/activityInsights.test.ts
node --experimental-strip-types --test vendor/cloudflare/ai.test.mjs vendor/openrouter/local-config.test.mjs vendor/openrouter/prompts.test.mjs
npm run test:interface -- tests/interface/activity-ai.spec.mjs tests/interface/activity-ai-transport.spec.mjs
```

The combined Firestore command in CONTRIBUTING also covers the real REST adapter
for nested profile/history and archived results. Existing Firestore rules deny
client reads/writes to the server-only quota path; no new client authorization rule
is needed. Recursive account deletion covers that subcollection. Report content remains download-only. The optional proposal report-attempt ledger
stores server operational metadata without drafts; see the Worker guide for its
flag, pagination, authorization and deletion contract.

## Reproducible report evaluation

`node --experimental-strip-types scripts/evaluation/reports.mjs --output /tmp/neuroia-reports-run`
runs ten versioned synthetic cases through the production generation function with
an offline provider fixture. It covers empty/partial history, sparse evidence,
same-level speed, slower accurate performance, mixed levels, professional assignments,
unknown hints, date-only records and retired/invalid games. It does not access Firebase.
The output directory must be new; each result is checkpointed before the next case.
The empty case must reject before calling the provider.

Add `--live` before `--output` only for an explicit provider run. It uses the local
OpenRouter configuration, sends synthetic aggregates only, makes up to nine provider
calls without retry/fallback and can consume provider quota/credits. Neither fixture
success nor live schema success constitutes factuality or user acceptance.

Outputs include exact narrative/source snapshots, bounded provider replies (including
rejected drafts for diagnosis), model/prompt provenance, generation
time, a case-set hash, and a Spanish per-case rubric in `reviews.json`. Review every
summary, observation and recommendation against its exact facts and candidate actions.
Use a pseudonymous reviewer code; do not enter names or participant information.
Mark each criterion, factuality, Spanish clarity, usefulness and scope explicitly.
Record preparation durations only from observed, comparable manual/assisted workflows;
include reading, correction and finalization. Record synthesis units using a definition
agreed before evaluation, counting units accepted without editing against all required
units. Leave unavailable measurements null, never infer them from download time.

After review, run:

```sh
node --experimental-strip-types scripts/evaluation/reports.mjs --review /tmp/neuroia-reports-run/records.json /tmp/neuroia-reports-run/reviews.json /tmp/neuroia-reports-reviewed.json
```

Reviews are bound to the exact record hash; stale, unknown or duplicate reviews fail.
The summary exposes reviewed-case, paired-timing and synthesis-unit coverage. Reduction
uses `1 - sum(assisted) / sum(manual)` over complete pairs; automation uses accepted
units / total units over measured cases. Targets retain strict `<600 seconds` and
`>70%`, and inclusive `>=50%` reduction. Passing these on synthetic cases does not
prove pilot KPIs, report usefulness in the target population, or TRL 7. This tooling
is separate from the implemented runtime report/save telemetry and adherence calendar.
The pilot reconciliation CLI in docs/PROPOSAL.md consolidates registration/adherence;
real reviewer measurements and final pilot acceptance remain open.

## Observation scope validation

The shared browser/Worker validator rejects
collective game observations (for example, “el resto de juegos”), duplicate fact
references and a named game without its own `game:`, `recent:` or `speed:` evidence.
The three-reference limit remains unchanged. Generic optional variety wording in
the summary is not itself a collective factual observation.
Prompt `neuroia-es-activity-v9` additionally prepares one-source observation slots,
prioritizing comparable measurements and recorded games without filling the report
with absent-game observations. It preserves the full source facts for synthesis. These lexical/scope
checks are conservative, not a semantic truth verifier: numerical correctness,
causality, trends, uncited summary text and usefulness still need human review.

Daily cached recommendations now require the current prompt version and must pass
current narrative validation before release. Stale, malformed or newly rejected
cache entries trigger the ordinary generation path, preserving existing quotas and
authorization checks. A quota/provider failure never releases rejected cached text.
The evaluation summary version is `report-evaluation-v2`; archived broad claims remain
flagged for review even when the new validator now rejects them. Existing record
hashes remain tied to the original outputs; do not rewrite historical provider replies.

The summary describes recorded activity only; actions belong in recommendations.
The teaching summary contains no invitation to a challenge that could be copied
into a case without a corresponding candidate.
