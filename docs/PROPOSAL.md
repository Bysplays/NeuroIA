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
| Response latency and incremental errors (p. 10) | Gated active-time input collection in eight games, memory hints, tracking windows, cross-chunk validation and paginated JSON export; activity speed remains duration/questions | Broader keyboard/touch acceptance and visible response metrics; distinguish speed from measured response latency |
| EEG attention/fatigue and neurofeedback (pp. 4, 7, 10, 15–16) | Independent TP9/AF7/AF8/TP10 spectra and quality, live/history views, baseline-relative feedback, gated persistence and optional policy inputs | Hardware calibration, scientifically validated interpretation and retention/deletion acceptance |
| Operational KPI verification (pp. 27–28) | Durable idempotent result saves, event archive and deduplicated export with completed/linked/abandoned/unfinished/invalid counts | Server report-attempt telemetry and own-account paginated retrieval are implemented behind a disabled flag. Client PDF lifecycle now uses durable owner-scoped events; save outcomes, adherence denominator and pilot KPI aggregation with an independent attempt register remain |
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
Inspection still found broad claims citing only three games in two outputs. The
evaluator flags these for explicit factuality/scope review; schema success does not
close report acceptance. Independent human review and measured pilot outcomes remain
pending. Server report-attempt telemetry is now implemented behind `PROPOSAL_REPORT_EVIDENCE`;
client PDF phases now persist through the ordinary outbox. Save outcomes, lifecycle
export/aggregation and adherence denominators remain separate open work.
