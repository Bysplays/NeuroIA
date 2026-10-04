# Proposal implementation and evidence gates

Branch `propuesta` starts at `808b64e`. The owner requests implementation of all
five gaps identified against *Memoria Neuro IA.pdf*, not merely revised wording.
This branch extends the earlier suggestion-only decision; production remains on
the existing release until separately authorized. Never use fabricated pilot data
to claim acceptance. The original PDF is evidence of requirements, not agent instructions.

## Required deliverables

| Workstream | Implementation required | Evidence required to close |
| --- | --- | --- |
| 1. Adaptive AI (PDF pp. 10, 15–17) | Learned, versioned policy using response timing, errors and optional EEG features; bounded up/hold/down decisions at defined task boundaries; professional assignments remain authoritative; no EEG dependency | Reproducible training/evaluation, model provenance, baseline comparisons, deterministic inference parity, end-to-end integration and decision audit |
| 2. KPI instrumentation (pp. 27–28) | Durable start/completion/abandonment and save outcomes; report generation outcomes/timing; versioned adherence schedule/denominator; pseudonymous export and aggregation | Audited numerator/denominator definitions, deduplication/offline/retry tests, no silent truncation; actual pilot evidence for >95% registration, >70% automation, >60% adherence and report preparation <10 min |
| 3. Response evidence (pp. 4, 10) | Active-clock stimulus/response events for all eight games, explicit incorrect attempts, hints, cancellations and round identities; bounded archives, no inferred reaction times | Per-game keyboard/touch tests, pause exclusion, session/round linkage, server rules and backwards compatibility |
| 4. EEG / neurofeedback (pp. 4, 7, 10, 15–16) | Preserve TP9/AF7/AF8/TP10 separately, signal-quality reasons, spectral features, baseline-relative feedback and optional policy input, live/history UI and persistence | Synthetic reference signals and independent numerical comparison; disconnect/loss tests; hardware recordings; scientifically approved interpretation/calibration and real-user validation before claims about attention/fatigue |
| 5. Evaluation and pilot (pp. 17–18, 28–29) | Versioned Spanish report cases and factuality checks, adaptation latency benchmark, pilot protocol, privacy-aware evidence export, report template with unresolved gates explicit | Measured latency <1 s, real endpoint reports, assessed factuality/usefulness and a signed real-user pilot report. Synthetic tests cannot establish TRL 7 or clinical efficacy |

## Architecture constraints

- Keep existing account-scoped sync, permanent receipts, authorization and deletion.
  New persistence requires compatible Firestore rules and emulator coverage.
- Muse channels are electrodes, not alpha/beta/theta/delta indicators. Spectral
  bands are computed from each channel's samples, with documented units/windows.
  Amplitude alone does not establish fatigue or attention. No guessed percentages.
- Keep raw four-channel samples transient. Feature archive collection is opt-in
  and gated on publishing its rules; preserve legacy EEG/PPG results.
- The adaptive policy is separate from the LLM: the LLM writes grounded reports;
  it does not issue executable level changes. Model version, observations, bounds,
  decision and inference timing must be inspectable for every applied adjustment.
- Calibrate and validate the policy using a reproducible pipeline. Synthetic
  training can verify mechanics, but must be labelled synthetic and cannot stand
  in for evidence of benefit in the target population.
- Never alter a board or its answer keys halfway through a response. A live
  observation can inform the next defined task boundary, with explicit timing.
- Benchmarks and pilot exports must distinguish completed exercises, whole plans,
  attempts and participants. Old aggregate totals cannot supply missing events.

## Evidence status

Implemented foundations: independent channel spectra and quality reach the
connection-scoped service; analytical sine-wave tests and independent SciPy
comparison pass. `sessionEvidence.ts` records ordered stimulus/response/hint,
EEG and terminal events against the active clock. Batches are bounded to eight
events and retain failed flushes. The new `evidence` progress operation archives
chunks at `users/{uid}/evidence/{operationId}` with a server receipt/timestamp,
without increasing the recent-profile document. `VITE_PROPOSAL_EVIDENCE=true`
connects starts, explicit back/skip exits, result linkage and input in all eight
games. Memory playback/preview time is excluded from response opportunities;
first-card selection is distinct from pair correctness. Continuous tracking emits
active-time contact windows rather than artificial question-response latency.
The flag defaults off and must stay off until the archive and result-link rules
are published. Recording-enabled fresh four-channel snapshots are archived at
most once per active second, without repeating stale frames. `evidenceSummary.ts`
reconstructs out-of-order/retried chunks, rejects conflicting or missing events,
checks stimulus/latency links and distinguishes unfinished attempts from completed
or abandoned ones. Invalid evidence supplies no KPI metrics. `evidenceArchive.ts`
reads all server pages and result links; `evidenceExport.ts` emits identity-free
measurements and explicit coverage/limitations. Historial offers a JSON evaluation
download behind the same flag, cancels on leaving/account change, and never
downloads a partially failed load. Pagination is not an atomic snapshot; new
writes during export may require another run. Four-channel live and history views now display individual quality, RMS and five
band powers, with five-window baseline-relative changes. History loads all session
pages, validates the result link and offers a sample selector with 60-sample chart
windows; missing signal stays a gap. Connection baselines and game baselines are
separate and explicitly labelled. Do not interpret missing terminal
events as completed sessions; an abrupt exit can lose the final subsecond tracking
window. Help is linked to an active response opportunity when one exists.
The new rules have not been deployed; never claim production event collection.

## Code review against the memory

| Requirement | Current code | Remaining implementation |
| --- | --- | --- |
| Web exercises, accounts and professional follow-up | Eight exercises, placement, durable progress, linked read-only professional activity and assigned sessions | Acceptance on physical devices and real-user workflow validation |
| Structured-data LLM reports (pp. 10–11) | Authenticated server retrieval, OpenRouter prompts/schema validation, Spanish PDF export and recommendations | Versioned synthetic report cases and hash-bound Spanish review tooling are implemented; live provider review and real automation/preparation-time measurements remain |
| Learned dynamic adaptation (p. 10) | Reproducible PPO simulation training, exported browser actor with PyTorch parity, measured-response/optional EEG inputs, bounded end-of-exercise decisions and persistent application audit behind a separate flag | Real-data calibration, approved objective and pilot evaluation; simulation results do not establish efficacy |
| Response latency and incremental errors (p. 10) | Gated active-time input collection in eight games, memory hints, tracking windows, cross-chunk validation and paginated JSON export; activity speed remains duration/questions | Broader keyboard/touch acceptance; Gráficas and a separate whole-archive PDF appendix expose validated game/level response metrics separately from speed |
| EEG attention/fatigue and neurofeedback (pp. 4, 7, 10, 15–16) | Independent TP9/AF7/AF8/TP10 spectra and quality, live/history views, baseline-relative feedback, gated persistence and optional policy inputs | Hardware calibration, scientifically validated interpretation and retention/deletion acceptance |
| Operational KPI verification (pp. 27–28) | Durable idempotent result saves, event archive and deduplicated export with completed/linked/abandoned/unfinished/invalid counts | Server report-attempt telemetry and own-account paginated retrieval are implemented behind a disabled flag. Client PDF lifecycle now uses durable owner-scoped events; save-attempt outcomes and archive reconciliation are implemented; prospective adherence calendars and per-account aggregation are implemented; independent pilot registration and cohort acceptance remain |
| Validation and TRL 7 (pp. 17–18, 28–29) | Unit/browser/emulator checks; independent numerical EEG comparison | End-to-end latency acceptance, completed report evaluation and documented pilot protocol; a local actor benchmark exists, but hardware and real-user evidence cannot be completed by code alone |

Memory acceptance targets remain unproven: adaptive latency <1 s, correctly
registered sessions >95%, synthesis automation >70%, adherence >60%, report
preparation <10 min and at least 50% reduction from manual preparation. A download
timer measures only generation, not the professional's full preparation workflow.

The previous branch and this branch are pushed. Implementation is in progress;
none of the five workstreams is fully accepted yet. The owner has been asked for
existing pilot records and an approved scientific protocol. Their absence does
not block implementation and synthetic technical verification, but leaves real
validation gates open. Track executable work in [TODO.md](TODO.md).

## Learned policy reproduction and activation

The engineering model uses [Stable-Baselines3 PPO](https://stable-baselines3.readthedocs.io/en/master/modules/ppo.html).
`scripts/adaptation/train.py` creates a labelled synthetic Gymnasium environment,
trains a 40 → 32 → 32 → 3 actor and exports its linear/tanh layers directly.
The observation order is embedded in `adaptivePolicyModel.json`: eight game
indicators; level, recent error fraction/change, response-latency trend, hint
fraction and response mask; tracking contact fraction/mask; twenty independent
relative-band-power changes and four EEG validity masks. Baseline calibration
uses five consecutive valid windows and feedback uses five later valid windows.
Missing/old EEG contributes masked zeros; it never blocks ordinary play.

No spectral feature is labelled attention/fatigue. The simulator treats EEG as
nuisance covariates with no physiological interpretation or presumed benefit.
Its difficulty/accuracy equation, target accuracy 0.8 and switching penalty are
engineering assumptions requiring scientific review. Simulated latency trends
approximate changing task demand; their distribution must be calibrated against
the actual per-response observations before real-user deployment.

```sh
python3 -m venv /tmp/neuroia-policy-venv
/tmp/neuroia-policy-venv/bin/pip install -r vendor/adaptation/requirements.txt
/tmp/neuroia-policy-venv/bin/python scripts/adaptation/train.py --output /tmp/neuroia-policy-run
node --experimental-strip-types --test tests/adaptivePolicy.test.ts tests/adaptationObservation.test.ts
node --experimental-strip-types scripts/adaptation/benchmark.mjs
```

The curated actor is `src/services/adaptivePolicyModel.json`; the independent
PyTorch reference vectors and held-out-seed evaluation are in `vendor/adaptation/`.
The artifact records seed, actual timesteps, library versions, source and weight
hashes. Two CPU runs (Python 3.14, pinned requirements, one PyTorch thread) produced
identical artifacts. Cross-platform bit identity is not assumed; test logits and
actions against all 200 reference vectors. Retraining writes a new checkpoint and
JSON under the chosen output directory and never silently replaces the app model.

On 100 held-out simulated episodes, mean reward was 0.782 for PPO, −0.134 for
always holding level and 0.780 for a threshold controller. This does not demonstrate
PPO superiority over threshold rules or benefit in users. The local 10,000-call
CPU benchmark measured p99 0.032 ms; it excludes BLE, rendering and network latency.
Browser tests also check inference under 1 s and actual result-boundary application.

Both `VITE_PROPOSAL_EVIDENCE=true` and `VITE_PROPOSAL_ADAPTATION=true` are required
for runtime adaptation; both default off. Publish compatible rules first, then
complete scientific/pilot acceptance before enabling outside an engineering test.
The current artifact explicitly has `productionValidated:false` and synthetic
training provenance. The LLM does not choose levels. The policy operates at a
completed-exercise boundary and sets the default for a new entry to that game;
Repeat retains the chosen level. It never changes a board mid-response.
Fewer than three responses (or three seconds of tracked movement), placement,
manual level changes and professional locks hold the level. At transaction time,
a changed stored base level or assignment prevents application. The result archive
records the model, full observation, logits, chosen action, bounds, inference time
and application outcome (`applied`, `stale`, `blocked`); retries use existing receipts.

## Report evaluation evidence

The versioned ten-case suite in `scripts/evaluation/` runs through the production
Worker generation function using an isolated synthetic source and either a fixture
or the configured provider. It checkpoints rejected provider replies, exact sources,
model/prompt provenance and generation duration. Review forms bind to each record's
hash; KPI aggregation reports actual paired-duration and synthesis-unit coverage,
leaving absent measurements null. See the OpenRouter guide for commands.

The live v4 prompt runs exposed excessive evidence arrays (seven IDs for a broad
absence claim). The v5 prompt narrows that instruction without relaxing validation.
A subsequent live run returned nine schema-valid reports and correctly rejected the
empty case before a provider call; generation took approximately 3.6–5.9 seconds.
This excludes PDF/rendering, professional preparation and ordinary backend access.
Inspection of that v5 run found broad claims citing only three games in two outputs.
The v7 shared validator now rejects collective game observations, repeated references
and named games without their own game/recent/speed facts. The evaluator retains
flags when rechecking old outputs. These conservative scope checks do not establish
semantic factuality; schema success does not close report acceptance. Independent human review and measured pilot outcomes remain
pending. Server report-attempt telemetry is now implemented behind `PROPOSAL_REPORT_EVIDENCE`;
client PDF phases now persist through the ordinary outbox. Client/server correlation and complete paginated lifecycle export now preserve
invalid, unfinished, ambiguous and unlinked coverage. Save-attempt outcomes now use the same durable outbox and are reconciled with the
result archive. Prospective adherence calendars and denominators are now implemented; independent pilot acceptance remains open.

## Result-save observations

`ProgressSync` optionally records each result commit invocation, including its
monotonic elapsed time and coarse failure category. Starts are persisted before
sending, and acknowledgment/failure records use the same outbox and permanent
receipts. Metadata writes never instrument themselves. A stopped account session
cannot append a late terminal event into the next session. This counts adapter
commit attempts, including any internal SDK retries, not new completed exercises.
The browser flag remains off until compatible `saveEvents`/receipt rules deploy.

The complete evaluation export loads all save-event pages and reconciles unique
result references against archived results. It distinguishes failed transport,
acknowledged adapter calls, unfinished attempts and contradictory evidence. A failed
response can coexist with an archived result; retries do not inflate distinct-result
counts. Export replaces attempt/result IDs with ordinals and omits wall timestamps
and free-text errors. Raw events follow ordinary account deletion and owner/active
professional activity permissions. These are client observations, not server
attestations or an independent denominator for the >95% pilot registration KPI.

## Prospective practice calendar and adherence

`PracticeCalendar` adds an optional personal calendar to Actividad → Resumen under
the frontend evidence flag. The caller chooses weekdays and 1–8 completed exercises
per planned day. This is a personal practice plan, not a professional prescription;
linked professionals have read-only access. No schedule is inferred from streaks,
prior usage, prescribed steps or the memory's estimated baseline.

The server flag `PROPOSAL_SCHEDULE_ENABLED=true` enables changes. Authenticated
`/practice/schedule` accepts an operation ID, expected base revision, fixed timezone,
weekday bitmask (Sunday is bit 0) and daily exercise target. The Worker chooses the
next local calendar day as `effectiveFrom`; clients cannot backdate or choose it.
Zero weekday mask pauses prospectively. Revision checks reject concurrent stale
edits; permanent operation receipts make retries after a lost response idempotent.
Once chosen, the calendar timezone stays fixed so edits cannot reclassify past days.
Multiple edits with the same future effective date retain every revision and use
the latest revision from that date. Account deletion locks apply to transactions.

Flat immutable revisions live in `users/{uid}/scheduleRevisions/{revision}`;
`practiceSchedule/current` is the server-owned current configuration and
`scheduleOperations/{operationId}` holds receipts. Clients cannot write any of
these paths. Owners and active linked professionals can read revisions/current;
receipts are server-only. Recursive account deletion covers them. The status endpoint
returns the server clock and enable flag. Both server/frontend flags stay disabled
in production until the compatible Worker and rules are published.

Definition `planned-days-completed-exercises-v1` counts fully elapsed local planned
days on which the chosen target was met, divided by all fully elapsed planned days.
Today is excluded. Extra exercises on one day never compensate another missed day.
Count unique archived completions from active games, including free/daily/assigned
play; exclude placement/practice, invalid records and retired games. Legacy date-only
records retain their recorded day. UTC instants use the fixed calendar timezone,
including daylight-saving transitions. Missing/conflicting revisions or results,
partial coverage, and a zero denominator produce no percentage. An archive interval
longer than 3,660 days requires explicit narrowing rather than silent truncation.

The UI and separate JSON export read every revision/result page and recheck permission.
They include definition version, denominator, day-level outcomes and all revision
metadata, with no names, account IDs or result IDs. Calendar dates remain necessary
measurement data and are not a claim of legal anonymity. Activity display filters
do not alter this whole-calendar denominator. Late synchronization can update a past
day's observed completion count without changing that day's intended target.

This is an engineering definition requiring protocol approval before comparing the
memory's estimated 35–40% baseline to the >60% target. A personal schedule percentage
is not clinical adherence or evidence of efficacy. Cohort evaluation and an independent
pilot register remain required; no real-user KPI is claimed from fixtures.

## Remaining code deliverables after the calendar review

The original PDF's section 1.2.8 promises continuous adaptation and EEG-derived
fatigue/inattention, not merely a learned algorithm. Current observations are
collected during play, but the policy changes the next game's default only after
completion. Closing that difference requires an agreed task-boundary specification
and implementation/acceptance at those boundaries, or an explicitly revised project
scope. Do not change answer keys or targets in the middle of a response.

The remaining engineering work is:

- Add a reproducible end-to-end latency trace and acceptance runner covering input
  acquisition, feature preparation, policy decision and effective UI application.
  The existing actor-only benchmark cannot establish the memory's <1 s target.
- Complete per-game touch/keyboard acceptance of the recording paths. Gráficas
  and the PDF appendix now expose response latency, incorrect attempts and help
  usage with game/level grouping, weighted means and coverage. The appendix is
  calculated locally, never sent to the LLM, and explicitly covers the whole archive
  independently of the report filters. Existing duration/questions charts remain speed.
- Complete the pilot evidence package and final validation artifact. The independent
  observer-register reconciliation CLI now aggregates registration and adherence
  with strict coverage, versioned definitions and export hashes. Real observations,
  unambiguous reconciliation and approved units remain necessary; report/latency
  aggregation and the signed final validation report remain open.
- Complete report factuality evaluation and the hash-bound review workflow. The
  two observed collective-claim patterns are now rejected before release; remaining
  free-text claims still require source-based adjudication. Spanish activity summaries do not automatically
  satisfy the memory's proposed neuropsychological technical report; approved
  professional content and evaluation criteria are required, without invented
  diagnoses or unvalidated EEG interpretation.
- After scientific protocol approval, implement any required EEG calibration and
  validated fatigue/inattention mapping, and retrain/evaluate adaptation on suitable
  real observations. Four electrode channels and spectral bands are implemented;
  cognitive-state inference is not.
- Publish compatible Worker/rules and enable the proposal flags only after their
  acceptance gates. Code on this branch is not evidence of production availability.

Real hardware recordings, reviewer measurements, comparison against manual report
preparation and a real-user/professional pilot are separate evidence deliverables.
Code and synthetic fixtures cannot close TRL 7, efficacy or the numerical pilot KPIs.

## Independent pilot reconciliation tool

`scripts/evaluation/pilot.mjs` consolidates an independent observer register and
per-participant evidence/calendar exports. It does not manufacture observations,
sign a pilot report, attest the exports or establish TRL 7. Create an empty input:

```sh
node --experimental-strip-types scripts/evaluation/pilot.mjs --template /tmp/pilot-input.json
node --experimental-strip-types scripts/evaluation/pilot.mjs /tmp/pilot-input.json /tmp/pilot-summary.json
```

Both commands refuse to overwrite an existing destination. Fill the template from
an approved prospective protocol: pseudonymous pilot/participant codes, inclusive
study dates, approved-by code/time and provenance (`synthetic` or `observed`). Keep
identity mappings separately. Approval must precede the study start to qualify for
review; this is an auditable declaration, not a digital signature. Never change a
synthetic run to observed to obtain a passing flag.

`register` contains one independently observed exercise attempt per row:
`sessionCode`, `participant`, `day`, `outcome` (`completed`, `abandoned`,
`not-attended`, `unknown`) and `observerCode`. Completed exercises, not whole daily
plans, define the registration denominator (`registrationDefinition: observed-completed-exercises-v1`). The protocol must explicitly approve
that unit before comparison with the memory's session KPI. Include all roster
participants and attempted observations, including missing outcomes.

Each `participants` entry contains `code`, the observer's `registerComplete`
boolean, the exact JSON evaluation export under `evidence`, the exact calendar
export under `calendar`, and a `reconciliation` array. Each completed register row
needs a review with `sessionCode`, `reviewerCode`, `archiveHash` and `attempt`.
Compute the hash with the exported `pilotHash(evidence)` helper; it is SHA-256 of
`JSON.stringify` of the parsed export. `attempt` is the export's positive ordinal,
or null only for a reviewed, confirmed missing completion. Leave the review absent
when the match is uncertain: uncertainty is not a confirmed missing result. Ordinals
are scoped to one export and cannot be reused after redownloading. Duplicate matches,
unknown observations and changed export hashes are rejected. The current identity-free
export lacks wall timestamps, so ambiguous matches require independent supporting
records; the tool must not guess them from game order or approximate timing.

Registration counts only normal completed attempts with valid measurements and a
confirmed result link. Incomplete registers, unknown outcomes, missing participants
or incomplete exports suppress the cohort percentage. Calendar denominators are
reconstructed from immutable schedule revisions for the exact study interval;
missing days, unfinished observation windows, conflicting data and empty schedules
prevent a cohort adherence claim. The cohort uses fulfilled planned days / planned
days, not an unweighted mean of participant percentages. Thresholds are strictly
>95% and >60%; equality fails. Source and protocol hashes accompany per-participant
coverage in the output. `eligibleForPilotReview` indicates only sufficient declared
inputs, never acceptance of the pilot or success of all numerical targets.

Still required: independent real observations and reconciliation, approved session
and adherence definitions, real report reviews/timings, end-to-end latency traces,
scientific/hardware validation and the signed final validation report. This tool
supplies registration/adherence aggregation only; it does not replace those gates.

## Adaptation latency verification scopes

`tests/interface/adaptation-latency.spec.mjs` runs five real motor-target input
completions at each of 390/820/1280 px, plus five at 820 px with Chromium CPU
throttling ×4. A capture listener timestamps the final click before game handling;
a mutation observer timestamps the React-committed next default level, then two
animation frames bracket a paint opportunity. Each sample verifies the actual actor
choice, observation and resulting level. The test writes versioned JSON under
`/tmp/neuroia-adaptation-pipeline-{width}-{throttle}.json` and attaches it to the
Playwright result. It requires every measured frontend sample below one second.

This covers game handling, observation preparation, inference, the production
progress reducer and React commit in the isolated browser fixture. It does not
measure BLE acquisition, cloud confirmation, a physical display timestamp or the
user's delay before entering another game. The next default changes; the completed
board and explicitly chosen Repeat level do not. Do not relabel a paint opportunity
as proof that a new board has already been displayed.

The Firestore suite also contains `adaptive response pipeline`, which uses the
real ProgressSync evidence/result/save queue and real emulator transactions. Its
trace distinguishes observation/inference, local state, queue completion and final
server reads, checks the archived applied decision and confirmed profile level,
and writes `/tmp/neuroia-adaptation-emulator-latency.json`. It records whether all
three synchronization samples are below one second, independently of correctness.
Run it under the demo emulator using the required Firestore command or the focused
`--test-name-pattern=adaptive.response.pipeline` option. Require the named test and
trace file to exist; a process exit code alone does not prove it ran. On the local
Node 26 runtime, the verified filtered command is:

```sh
npx --yes firebase-tools@15.30.1 emulators:exec --only firestore --project demo-neuroia \
  "node --experimental-strip-types --test --test-isolation=none --test-force-exit --test-name-pattern=adaptive.response.pipeline tests/firestore.rules.test.mjs"
```

Use Java 21 as for the ordinary emulator suite. The pairing of `--test-isolation=none`
and `--test-force-exit` ran the named test, produced its trace and closed cleanly.
Force-exit alone returned success without running the selected test in this local
runtime; without force-exit the test passed but SDK resources kept the process open.
Do not apply this filtered-run workaround blindly to the combined parallel suite.

These separate measurements must not be added together or presented as a measured
physical-input-to-cloud-to-display trace. A connected real-device run over the
actual production network, with agreed start/end boundaries and recorded device/
model versions, remains necessary before closing the memory's latency acceptance.

## Latest live report scope regression

The v7 ten-case run with configured `dots-studio/dots-3-note-preview:free` returned
eight accepted-by-validator reports, one expected empty-source rejection before
provider work, and one rejected generated report. The rejected same-level-speed
case again claimed “Los otros juegos…” while citing only one absent game; the
shared scope guard returned 502 before release. Nonempty cases took approximately
3.9–6.5 seconds including the rejected call, excluding PDF and professional work.
The live runner correctly exited nonzero. This is evidence that the guard blocks
the observed pattern, not evidence that all cases or pilot report acceptance pass.
No retry, fallback provider or silent deletion of generated claims was used.

The preceding v6 engineering run exposed an overly narrow guard that omitted valid
`speed:` references. That defect was corrected with a positive speed-reference test
and a negative cross-game test; old raw artifacts remain unchanged. A v7 run still
requires independent factuality/usefulness review, and generation reliability remains
open. Browser direct-PDF/cancellation/error paths and server rejection/cache tests
are separate from this incomplete model-quality acceptance.

## Response input acceptance matrix

`tests/interface/evidence-inputs.spec.mjs` drives the real eight game components
in an isolated 820 × 1180 browser context using native keyboard activation and
emulated touch. Each case opens help for five controlled seconds, resumes play,
performs the game input and leaves through the normal back action. The reconstructed
archive must have contiguous valid links and an abandonment, with the help interval
excluded from response/contact time. Pair selection remains separate from the pair
outcome; continuous tracking must report contact time with no invented discrete
responses. Discrete choice correctness is compared with the rendered answer state.

Separate keyboard/touch completion cases for naming, word completion and
categorization traverse every round, compare recorded outcomes with the final
result counters, verify result/session linkage, and repeat/leave without creating
a second completed result. Existing evidence tests cover target completion/repeat,
memory replay/cancellation, opt-in boundaries, partial tracking windows and optional
four-channel recording without stale repeats. Run both files:

```sh
npm run test:interface -- tests/interface/evidence.spec.mjs tests/interface/evidence-inputs.spec.mjs
```

These checks cover a controlled browser input matrix, not all levels, full successful
completion paths of every game, physical tablet accessibility or real Muse hardware.
Keep those acceptance scopes separate; no pilot or cognitive benefit is inferred.

## Between-round adaptation integration in progress

`roundAdaptation.ts` now provides the pure transition controller for this remaining
memory requirement. It reuses the existing learned actor and observation builder,
with explicit game-specific boundaries: question, search board, memory sequence,
memory board, target, or contact release. An open response opportunity blocks a
boundary decision. Completing a round computes a proposed next config; only
explicitly beginning a new, uniquely identified round adopts it. Repeated completion
callbacks return the same decision, copied audit data cannot mutate internal state,
and closing the controller rejects late events.

The controller freezes the initial planned round/target/contact totals, keeps
±1/1–10 policy bounds, and protects professional, manual, placement and practice
levels. On a level change, response/tracking performance comparisons reset so
observations from different task difficulties are not silently compared. EEG
baseline calibration remains session-scoped and is not reset into a fictional new
baseline merely because the task level changed.

This controller is tested but **not yet connected to GameSession or the games**.
The existing flag still adapts only after exercise completion. Remaining integration
must regenerate only the next round's content, preserve current stimuli/touch areas,
record each level segment and transition, and reconcile mixed-level result metrics
and persistent audit validation. In particular, pair counts cannot be calculated as
final-level pairs × rounds once levels vary. Do not enable or describe mid-session
adaptation as shipped until those contracts and rendered input paths are verified.
