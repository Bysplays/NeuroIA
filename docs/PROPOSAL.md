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
- Keep four-channel acquisition transient until the explicit result/event schema
  and retention boundaries are implemented. Preserve legacy EEG/PPG results.
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
connects starts, explicit back/skip exits, result linkage and response input in
visual scanning, naming, word completion, categorization and motor targets.
The flag defaults off and must stay off until the archive and result-link rules
are published. Memory path, memory pairs and continuous tracking still need their
input instrumentation; hints, four-channel capture and evidence readers/UI also
remain pending. Do not interpret missing terminal events as completed sessions.
The new rules have not been deployed; never claim production event collection.

## Code review against the memory

| Requirement | Current code | Remaining implementation |
| --- | --- | --- |
| Web exercises, accounts and professional follow-up | Eight exercises, placement, durable progress, linked read-only professional activity and assigned sessions | Acceptance on physical devices and real-user workflow validation |
| Structured-data LLM reports (pp. 10–11) | Authenticated server retrieval, OpenRouter prompts/schema validation, Spanish PDF export and recommendations | Report factuality/usefulness evaluation and measurable automation/preparation-time outcomes; generation alone does not prove those KPIs |
| Learned dynamic adaptation (p. 10) | Rule-based progression in `difficulty.ts`; no trained policy | Training, model/version provenance, bounded up/hold/down inference, timing/error/optional EEG inputs, decision audit and benchmark |
| Response latency and incremental errors (p. 10) | Gated active-time event collection in five games; activity speed remains duration/questions | All eight input paths, hints, round linkage and complete event readers/exports; distinguish speed from measured response latency |
| EEG attention/fatigue and neurofeedback (pp. 4, 7, 10, 15–16) | Independent TP9/AF7/AF8/TP10 spectral features and quality; existing live/saved metric is aggregate amplitude | Four-channel persistence and live/history UI, calibration, baseline-relative feedback, policy integration and scientifically validated interpretation |
| Operational KPI verification (pp. 27–28) | Durable idempotent result saves and bounded event archive foundation | Save/report outcome telemetry, explicit attempts and adherence denominator, deduplicated exports and KPI aggregation |
| Validation and TRL 7 (pp. 17–18, 28–29) | Unit/browser/emulator checks; independent numerical EEG comparison | Latency benchmark, report evaluation tooling and documented pilot protocol; hardware and real-user evidence cannot be completed by code alone |

Memory acceptance targets remain unproven: adaptive latency <1 s, correctly
registered sessions >95%, synthesis automation >70%, adherence >60%, report
preparation <10 min and at least 50% reduction from manual preparation. A download
timer measures only generation, not the professional's full preparation workflow.

The previous branch and this branch are pushed. Implementation is in progress;
none of the five workstreams is fully accepted yet. The owner has been asked for
existing pilot records and an approved scientific protocol. Their absence does
not block implementation and synthetic technical verification, but leaves real
validation gates open. Track executable work in [TODO.md](TODO.md).
