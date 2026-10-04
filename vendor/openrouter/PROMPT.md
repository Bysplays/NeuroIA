# Spanish activity prompt: where to fill data

The executed source is [prompts.mjs](prompts.mjs), not this guide. The Worker calls
`activityMessages(insights, mode)` after authenticated Firestore retrieval and
`buildActivityInsights`. Do not manually interpolate raw account documents.

## Fixed request settings

- `RESPONSE_FORMAT = { type: 'json_object' }`.
- `ZERO_DATA_RETENTION = false` (owner-selected routing policy).
- Model reasoning is disabled in the request so it does not consume the bounded
  response budget intended for short Spanish drafts.
- Root `.env` supplies `OPENROUTER_API` and `OPENROUTER_MODEL`. Output mode and ZDR
  are not read from env. `data_collection: deny` remains a separate routing setting.

## Insertion points

| Field/block | Who fills it | Source / rule |
| --- | --- | --- |
| `DATOS_VERIFICADOS` | Server | `JSON.stringify(insights)`: filtered aggregates, facts, candidate suggestions and limitations |
| `IDS_DE_HECHOS_PERMITIDOS` | Server | Exact `insights.facts[].id`; section names are not valid evidence |
| `FUENTES_PARA_OBSERVACIONES` | Server | Up to four report / three recommendation facts, prioritizing comparable speed, recent accuracy and games with recorded activity |
| `PLANTILLA_A_RELLENAR` | Server | `responseTemplate(insights, mode)`; each observation has one exact fact ID and its source text; candidate IDs are also filled |
| `summary` | Model | Brief Spanish synthesis of the current selection only |
| `observations[].text` | Model | One factual observation per entry; omit unsupported claims |
| `observations[].evidence` | Server template; model preserves | One prefilled fact ID per observation; the model may omit an unsupported slot, not broaden its scope |
| `recommendations[].suggestionId` | Server template; model preserves | Exactly one per supplied candidate, in supplied order |
| `recommendations[].explanation` | Model | Explain that candidate using its evidence; add no action or level |

The narrative contains no template markers when finished. Empty suggestions produce
an empty recommendations array. Observations can be empty when evidence is weak.
Report and recommendation modes share the same structure; reports allow four
observations, recommendations three. Numerical evidence is displayed/exported by
the application, so the prose need not repeat every metric.

## Worked example

`EXAMPLE_INPUT` and `EXAMPLE_RESPONSE` in prompts.mjs are the complete paired example
sent in the system prompt. They demonstrate recorded practice and same-level accuracy in a partial
selection, with optional variety and next-level candidates.
They are teaching data, not default activity; the prompt explicitly separates them
from the current request. `responseTemplate` uses only current facts and suggestion IDs.
Version 9 assigns observation sources before generation rather than asking the model
to choose references after writing. The full current facts remain available for
summary and recommendation explanations. This is a prompt constraint, not a proof
that every generated sentence follows its assigned source. The shared validator
retains its compatible 1–3-reference contract and existing scope rejection.

The runtime validator rejects invented references such as `limitations` and
`suggestions`, unknown candidate IDs, extra fields, disallowed markup and unfilled
markers. It does not prove every sentence factually correct; Spanish factuality
review on synthetic scenarios remains necessary before release.

## Editing and verification

Edit Spanish wording in `activityMessages`; update `PROMPT_VERSION` when changing
behavior. Keep schema/example field names aligned with `AiNarrative` and
`validAiNarrative` in src/services/activityInsights.ts. Run:

```sh
node --experimental-strip-types --test vendor/openrouter/prompts.test.mjs vendor/cloudflare/ai.test.mjs
```

`npm run ai:verify` explicitly calls the configured real provider with synthetic
data for both output modes (recommendations/report). It is not part of automated
CI. Success validates the structure/references, not universal quality or uptime.

The summary describes recorded activity only; actions belong in recommendations.
The teaching summary contains no invitation to a challenge that could be copied
into a case without a corresponding candidate.
