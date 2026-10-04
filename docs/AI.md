# Activity assistance and Spanish reports

## Scope

The selected design uses OpenRouter for optional Spanish-language writing, not
for game control. Activity → Resumen contains **¿Qué te recomendamos?** for
players and actively linked professionals. The existing deterministic difficulty
system, prescribed levels, daily plans and game results are unchanged.

This is a change from the grant memory's reinforcement-learning/EEG adaptation
proposal. It does not implement that proposal, physiological interpretation,
clinical reports or evidence of efficacy. Report automation and suggestion quality
still require a measured pilot; a working integration is not proof of those KPIs.

The owner-authorized production configuration enables Dots3-Note Preview free.
The Worker is deployed with its server-side secret; health, CORS and unauthenticated
route protection are verified. Signed-in player/professional acceptance remains open.
Missing credentials or AI_ENABLED=false disable generation. See [provider setup](../vendor/openrouter/README.md).

## Interaction

Opening Activity → Resumen automatically retrieves the day's recommendations.
The first successful generation for the caller/participant and local calendar day
is cached on the server and reused across visits and devices. Filters do not cause
new recommendations: the daily snapshot covers overall synchronized activity.
The report continues to use the selected filters. While loading or on failure,
deterministic suggestions remain available. There is no manual AI refresh button.
Game-led cards reveal supporting facts under **Por qué este juego**. **Sobre la IA**
explains daily generation and external processing; **Generado con IA** labels actual
returned AI analysis only. The summary text fills the card's available width.

**Generar informe** requests AI writing and downloads the PDF directly, without an
editor, review checkbox or pre-download confirmation dialog. The button reads **Generando…**
until download starts; Cancelar aborts pending work. An unavailable provider uses
the basic activity template without claiming AI authorship. Generation and asset
errors appear inline and can be retried. Daily recommendations start automatically; report generation remains explicit.
Both requests carry the existing processing-version marker;
it is not legal certification or a substitute for the approved privacy basis.

The lazy-loaded jsPDF module embeds the supplied logo and local Manrope fonts.
No cloud report archive or clinical note storage is introduced. Leaving Resumen,
changing filters or changing accounts cancels pending responses. Archive-page
updates preserve the in-flight daily request rather than starting it again.
Downloaded copies remain under the recipient's control, outside account deletion.

Activity AI and PDFs use only the eight active catalog games. Retired daily sequencing
is excluded from aggregates, tables and prompt evidence. The daily cache carries
the evidence version so older catalog snapshots are regenerated. After download,
a shared ModalFrame confirmation says «Informe PDF descargado», closes with
Entendido or Escape and returns focus to Generar informe. The optional-suggestions
footer uses the available width beside the report action without a character-width cap.

## Deterministic evidence

`src/services/activityInsights.ts` is shared by Vite and the Worker. It projects only
bounded, known activity fields; names, emails, UIDs, result IDs, free text,
condition choices and EEG/PPG never enter the model input. Game titles and
identifiers come from the catalog, never model-generated or user-provided names.

- Dedupe by result ID; map the three historical game IDs; exclude practice,
  invalid/future dates, invalid counts and unsupported games. Date-only history
  keeps its recorded day. Timestamps use the supplied, validated IANA timezone.
- Apply the same area/exercise/date selection as analytics. Current levels are
  labelled separately because they are not historical levels for that interval.
- Accuracy is mean per-game-session accuracy, computed from correct/total counts.
  Speed is mean duration/questions, excluding zero durations; it is not reaction
  time. Sessions here mean completed exercises, not completed daily plans.
- Suggest variety relative to the observed selection; absence in partial history
  never means "never played". The taps-only preference excludes tracking from
  suggestions, without exposing health context to the provider.
- Three comparable results at the same game, level and configuration are needed
  for level suggestions. Under 70% mean precision suggests comfort; at least 90%,
  explicitly zero hints, free play and a current matching level below ten may
  suggest trying the next level. Nothing writes a new level. Prescribed games do
  not produce the increase suggestion. Thresholds are product heuristics, not
  calibrated clinical thresholds.
- Speed trends compare two groups of three at the same game, level and version.
  Show accuracy alongside speed; don't infer improvement from speed alone.
- Return at most three candidate suggestions, evidence references and explicit
  limitations. The LLM explains these options; it cannot create executable actions.

The local summary may include queued activity visible in analytics. The Worker
independently retrieves synchronized data: up to 400 archived results ordered by
date plus the recent/imported profile history, deduplicated with archive precedence.
The 401st row detects truncation; cumulative totals also disclose older missing
history. No fabricated data fills the gaps. Old date filters outside this bounded
window may produce no eligible data. The response shows its own coverage and
states that it uses synchronized records, which can differ from the local charts.

## Server boundaries

`POST /ai/status` requires Firebase identity and returns availability (and the
configured model), never a secret. `POST /ai/recommendations` accepts target UID,
timezone and the processing-version marker. A server-only document at
`users/{actorUid}/aiRecommendations/{targetUid}` stores the local day and serialized
aggregate analysis; updates overwrite the previous snapshot. Cached reads still
check active access. A 45-second transactional lease prevents duplicate concurrent
generation; failures release it, and a later visit can retry subject to the quota.
Recursive account deletion removes this cache. No report PDF is stored. `POST /ai/analyze` accepts only target UID,
validated filters, mode and the consent-version acknowledgement. It never accepts
a caller-supplied prompt, model, statistics, notes or result history.

The Worker verifies Firebase identity and confirmed player access. Cross-account
analysis additionally requires the existing active reciprocal paid-seat relationship;
a free professional login or legacy CEOABERTO ownership alone grants no access.
Checks run before retrieval, again before inference and after inference. Expiry,
unlinking and deletion during generation prevent late delivery. The client also
cancels on identity change and rejects responses for a previous identity.

Quota reservations are transactional at `users/{actorUid}/aiUsage/daily`: one
overwritten document with UTC day, count and last-request time. Default ten attempts
per day, at least thirty seconds apart within each mode, configurable to 1–50 attempts. The automatic daily update does not block an immediate report request. Failed or
cancelled provider calls consume the reservation to bound retries. There are no
automatic retries. The first daily recommendation can call the provider on opening Resumen. Existing deny-by-default
Firestore rules keep this document server-only; recursive account deletion removes
it. No generated text or other participant's data is persisted in this quota.

Provider requests use a configured model, parameter support, denied provider data
collection, no fallback, disabled model reasoning for this writing task, bounded
tokens and a 25-second deadline. Output mode is fixed to JSON object in `vendor/openrouter/prompts.mjs`, alongside
`ZERO_DATA_RETENTION=false`, at the owner's request. Both are code constants, not
environment options. The versioned prompt includes an isolated worked example,
a current-data fill-in template with copied suggestion IDs and an explicit facts
ID allowlist. The server independently validates the returned fields; section names
and leftover template markers are rejected. This configuration makes no
zero-retention claim. Provider
rate limits are surfaced explicitly and never trigger a paid fallback. Optional provider pinning and EU endpoint selection are server-owned.
The response is capped at 64 KiB and independently validated for bounded text,
known evidence/suggestion IDs and obvious prohibited output. Structured output and
keyword checks do not prove factual or linguistic correctness: human review and
model-specific Spanish evaluation remain necessary. No HTML is executed, no tools
are exposed and upstream errors/content/credentials are not logged or returned.

## Report template and provenance

The PDF opens with identity, period, centered activity metrics and both star charts
on the activity page. Summary and recommendations follow on a new page: a pale
blue lead panel, numbered recommendation panels, compact numbered section markers
and fine rules establish hierarchy. Game names are bold in the square-corner table;
supporting observations use small blue markers and scope stays visually secondary.
Long text continues across pages without losing its heading or clipping.

The fixed A4 template contains centered activity metrics, Spanish narrative,
vector star charts for area counts and all eight current levels, a per-game table,
supporting observations and scope/limitations. Table headers repeat across pages;
numeric columns are centered, game cells contain only the title and all table
corners are square. Untried games plot as level 0 in the PDF radar and complete its polygon;
the centered note explains this convention. Stored levels remain unchanged. Current
levels are independent of the activity filters. Long text paginates without clipping.

Internal evidence IDs, game IDs, hashes and prompt/model identifiers are never
printed. API provenance remains available internally. The participant display name
is added locally to the professional PDF, never to the OpenRouter payload.
Prompts and schema are in [prompts.mjs](../vendor/openrouter/prompts.mjs).

## Verification and remaining acceptance

Unit tests cover sparse/partial data, timezone/date-only behavior, invalid data,
same-level comparisons, movement preferences, safe projection, output references
and report provenance. Worker tests cover authorization, expiry/unlinking,
transactional quotas, cancellation, malformed/truncated output and generic errors.
The demo Firestore suite exercises real nested progress decoding and archive reads.
Browser fixtures cover explicit generation, filtered context, cancellation,
download, keyboard focus, responsive layouts and large-text/high-contrast operation.
Browser checks exercise real PDF generation, direct download, long text and
recovery from missing font assets. All provider responses in automated tests are mocked; no real account activity is
sent to OpenRouter by these tests.

For ongoing acceptance, evaluate Spanish drafts against
synthetic reference cases on the real endpoint, set account-level cost/privacy
controls, complete the provider/privacy review, deploy and verify real authorized
player/professional flows. Record costs, latency and factuality. The generation action,
routing settings and automated tests alone do not close those release checks.

## Proposal client report lifecycle

With `VITE_PROPOSAL_EVIDENCE=true`, `ActivityAssistant` records start, AI readiness
(where applicable), PDF readiness, browser download request, failure and explicit
cancellation. Leaving the report view cancels the current attempt; a late async
result cannot create a download. Durations use monotonic wall time, distinct from
game active time and professional preparation time. No draft, participant identity,
filter, title or free-text failure message enters these records.

`CloudProgress` provides the evidence sink for both player and professional
workspaces. The existing account outbox archives immutable events in the caller's
`users/{uid}/reportEvents/{operationId}`, with permanent receipts and server receive
timestamps. Repeated sends do not add events or modify activity totals. Rules allow
only the owner to read; linked professionals cannot read another caller's operational
ledger. Publish compatible rules before enabling the flag; it remains off by default.

An abrupt tab exit or closed account session can leave an unfinished attempt. The
browser only confirms a download request, never successful disk storage. Local-storage
failure retains the ordinary in-memory/pending-save behavior. These events and the
server report-attempt ledger have distinct attempt identifiers and must not be joined
by guessing timestamps. Correlated export/aggregation and measurement of professional
review remain open work; neither ledger alone establishes synthesis automation.
