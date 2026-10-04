# NeuroIA — implementation backlog

This is the canonical TODO. The [SDD](SDD.md) defines the target behavior,
architecture, dependencies and acceptance criteria. Existing code is not proof
of a production deployment. Keep project guidance in English and UI copy in Spanish.

## Owner interface review

- [x] Unauthenticated home approved.
- [x] IGAPE funding page approved.
- [x] About page approved.
- [x] Legal/privacy page presentation approved; outstanding legal content remains tracked below.
- [x] Login, registration, recovery and error notification presentation approved by owner.
- [x] Subscription presentation approved on mobile and desktop, including plan,
  benefit checklist and invitation modal. New access choices cancel
  pending checkout automatically; completed payments remain protected.
  Presentation approval does not certify live payments or change release requirements.
- [ ] Review authenticated home and catalog with the owner.
- [x] Preserve the original trial start across account recreation; allow recovery
  of remaining days with the same verified email without extending expiry.
- [x] Implement account deletion with typed confirmation, recent identity verification,
  server Stripe checks, resumable cleanup and pseudonymous trial-use retention.
- [x] Prepare live account-lifecycle infrastructure: Worker modules/cron published
  with deletion enabled, stable trial secret configured and scoped Auth IAM granted.
  All four collection-group indexes confirmed READY; no real account was deleted.
- [x] Remove the two owner-approved trial access records, retaining both pseudonymous
  trial-use markers atomically. Read-back confirmed both removals and markers;
  profiles, results, invitations and Auth accounts were preserved.
- [x] Publish the account-deletion Firestore rules to `ceoaberto-neuroia` at the
  owner's explicit request. The active rules match the repository file.
- [x] Enable ACCOUNT_DELETION_ENABLED on the deployed Worker; retain both cleanup
  and billing cron triggers. Resume offers say “Seguir prueba gratuita”.
- [ ] Complete the frontend migration.
  The old published frontend still attempts direct trial grants, now denied by
  the deployed rules; publish the Worker-backed trial flow to restore new web trials.
  GitHub authorization and the required explicit merge approval remain pending. Verify with a disposable account
  to verify the full live deletion lifecycle; backend activation is complete.
- [ ] Review refreshed onboarding preferences and assessment entry with the owner;
  visual styling now matches account entry. Existing assessment acceptance checks remain open.

- [ ] Rename the Stripe sandbox product attached to `price_1UItenAWZtSdGYThrex9dsNh`
  to **NeuroAI**, as requested by the owner. Keep the price and billing interval.
  Requires authenticated Stripe Dashboard/API access; no remote change performed.

- [x] Pending checkout no longer makes CEOABERTO fail silently: Usar mi código
  cancels the pending checkout before redemption; completed-payment/cancellation
  errors stop redemption and remain visible. Isolated browser regression covers both paths.

## Project access handoff

- [ ] Give `david@ceoaberto.com` access to the NeuroIA GitHub repository. Confirm
  the appropriate repository role and verify access without exposing unrelated
  repositories; ownership transfer is a separate decision.
- [ ] Give David access to the NeuroIA Stripe account with the agreed role. Verify
  access to the relevant sandbox/live environments and billing administration as
  needed; do not infer that an invitation transfers account ownership or payouts.

## Current remaining scope

### Proposal branch — full memory alignment

The owner authorized implementation on `propuesta` of all five review gaps.
[PROPOSAL.md](PROPOSAL.md) defines the original scope and completion evidence.
This supersedes suggestion-only scope for this branch, not the deployed release.

- [ ] Preserve four EEG channels and spectral/quality features end to end, including
  live/history views, compatible persistence, authorization and deletion.
  Four-channel live/history views, independent baseline feedback and paginated
  retrieval are implemented. Hardware calibration and retention/deletion acceptance
  remain; archive rules are not deployed.
- [ ] Complete response-level timing and explicit outcomes across all eight games.
  Gated hooks now cover all eight games, including memory preview exclusion,
  hints, card selections and continuous tracking windows. Cross-chunk validation
  rejects gaps and conflicting retries. Server pagination and a JSON evaluation
  export are implemented; broader input acceptance and visible response metrics
  remain. Publish archive/result-link rules before enabling
  `VITE_PROPOSAL_EVIDENCE`.
- [ ] Implement and integrate a learned adaptive policy, training/export provenance,
  bounded decisions, EEG-optional operation and professional-level protection.
  PPO simulation training, deterministic browser inference, bounded result-boundary
  integration and application audit are implemented behind a separate flag. Real
  calibration, scientific reward approval and pilot evaluation remain mandatory.
- [ ] Add durable KPI telemetry, adherence schedules/denominators and audited exports.
- [ ] Add report evaluation, independent signal checks and latency benchmarks.
- [ ] Complete real-user and hardware pilot evidence and scientific interpretation
  review; do not close from synthetic tests or source inspection.

- [x] Prepare three independent clinical-blue, tablet-first concepts using Mobbin
  references from Kit, Ahead and Brilliant. The review board is at
  `/design/concepts/`; see [DESIGN-CONCEPTS.md](DESIGN-CONCEPTS.md).
- [x] Owner selected A — Calma editorial, with the clinical-blue palette.
- [x] Apply A to the application shell, public entry, home, onboarding, catalog,
  instruction pages, game controls, activity and account surfaces. Shared tokens
  also style professional screens. Remove orientation gating and automatic fullscreen.
- [ ] Complete client/device acceptance across signed-in professional, billing and
  recovery flows. Local component screenshots do not replace a full production
  account review; see DESIGN-CONCEPTS.md for the original acceptance matrix.

The owner confirms real Muse 2 connection, EEG/PPG, battery, reconnection and saved
charts; the payment/seat lifecycle (purchase, renewal, failed payment, cancellation
and reassignment) in Sandbox; and real email delivery, cross-device sync,
installation and fullscreen on the tested devices. Sandbox is sufficient for the
current stage; this is not confirmation of live-money payments. Specific OS/browser
versions were not supplied, so do not infer a universal compatibility matrix.

The client first-review items below are the immediate planning focus. The client
estimates roughly one week before an IGAPE report needs final screenshots; the
message supplies no exact deadline, so confirm the date before scheduling a release.
This update records requested work, not authorization to implement, merge or deploy it.

The earlier priorities remain open: finish/audition the 91 narration clips and
resolve licensing; complete AI activation/acceptance and private notes; resolve the existing interface
issues, bundle optimization and account/data deletion management. The client review
adds to this inventory without reopening the owner-confirmed checks above.

## Client first review — next delivery

Source: client feedback supplied by the owner on 2026-09-29. Items remain open
unless explicitly checked below. Reported behavior is not a verified reproduction.
Work continues on the original design; the Ahead experiment is a protected local
archive, not the basis for these changes. The order below is a proposed sequence,
subject to the confirmed deadline and available client materials.

### Delivery dependencies and recovery

- [x] **CR-01 — IGAPE attribution and logos (local).** Complete owner-supplied
  notice appears on the IGAPE information page, unmodified, with a selectable HTML transcript. Image loading, mobile layout and About focus
  return checked. Client approval of publicity compliance/placement remains a
  release check; this is not a legal certification.
- [ ] **CR-02 — Recovery and review environment.** Inventory the deployed version,
  source commit, existing remote backups and data/configuration recovery procedures;
  establish an isolated review URL and document how to restore the last approved
  release before publishing changes. Answer the client's backup question with
  verified facts. Current evidence: the Ahead source is committed on
  `codex/neuroia-ahead-redesign`, with local tag
  `archive/neuroia-ahead-redesign-2026-09-29`, AGENTS guidance and a local Git hook.
  Local main is `801dd54`; origin points to `git@github.com:Bysplays/NeuroIA.git`.
  The checked-out change is isolated on `codex/neuroia-blue-concepts`. Neither
  the deployed commit nor a separate hosted restore URL has been verified.
  This does **not** establish a hosted backup website, remote archive or database
  backup, and it is not a backup of the currently deployed original design.
- [ ] **CR-03 — IGAPE delivery evidence.** Confirm the actual report deadline,
  required screenshot list, devices/orientations and who approves the final build.
  After the agreed fixes and branding are approved, capture the final deployed
  version and record its commit/URL. Use consented or clearly identified sample
  data; do not manufacture participant results for the report.

### Initial assessment: correctness and pacing

- [x] **CR-04 — Interests before assessment (implemented locally).** Three accessible
  steps select practice areas, an optional taps-only preference and optional condition context; thematic trials
  follow those choices. Preferences, passed stages and completed trials resume
  through the existing durable progress queue. Unselected games stay untested;
  choices can be edited before completion and through a selective retake afterward.
  Invitation access requires explicit sharing consent; personal access has no sharing checkbox. No free-text health information is collected. See [implementation,
  Mobbin references and checks](PLACEMENT.md).
- [x] **CR-04 rules —** Published and verified onboarding preferences/stages and
  bounded optional condition context rules in `ceoaberto-neuroia` after demo tests.
  Preserved the existing production level-evidence validation.
- [ ] **CR-04 release —** Owner review, target-device checks and frontend publication.
- [ ] Approve health-context purpose, consent wording, retention/deletion and professional
  disclosure before public release; the implemented consent checkbox is not legal certification.
- [x] **CR-05 — Pressure-free assessment wording (local).** Trial controls say “A tu ritmo”; numeric levels are retained only in ordinary play and the final evidence summary. No numeric trial announcement is narrated.

- [x] **CR-06 — Misleading results action during trials (local).** Every in-game next action says “Continuar” in the shared action slot directly below the board, replacing memory playback/repeat in place. Placement advances after durable evidence. Completion hides progress and gives Repetir the same dimensions as the exit action; repetition preserves the played level and starts directly.

- [x] **CR-07 — Simon failure advances (local).** A wrong input marks both selected and correct tiles, then Continuar saves one failed attempt. No forced replay or attention banner. Before resolution, Repetir clears partial input and replays the same sequence. Browser regression verifies single completion.

- [x] **CR-08 — Pairs preview and repetition (local).** Cards start face down until Comenzar; Ocultar shows a countdown and ends the preview early. Repetir resets the same board and counts a hint. Solo games aggregate three boards; placement and plans use one. Pair/attempt counters are hidden. Mismatch timers clean up on repeat, restart and unmount.

- [x] **Motor feedback and game recovery (local).** Solo targets progress per hit;
  grouped targets remain one stage. Red miss outlines persist. Tracking captures
  drags starting anywhere and checks contact every frame. All game pause/resume controls and the game recovery dialog
  are removed; focus never hides play and valid access rechecks run in the background; help/settings/visibility and server access still pause the clock.
  Browser checks cover 390, 820, 1280 px and short landscape; physical touch acceptance
  remains part of the target-device release check.

- [x] **CR-09 — Shorter assessment (local).** New ladders stop after at most two stages (1/4), with conservative prior evidence on failure. Legacy higher stages remain compatible. Further calibration and client timing acceptance remain open; this is not a validated cognitive measurement.

### Public entry, registration and service access

- [x] **CR-10 — Public explanation (local).** The unauthenticated app home presents a short non-medical introduction and Comenzar. Full product information and IGAPE funding are accessible on separate pages before authentication.

- [x] **CR-11 — Visible registration (local).** Comenzar opens sign-in from the unauthenticated home; Crear cuenta is visible on the access page. Inline forms preserve personal/professional intent, Google entry, confirmation and recovery.

- [x] **CR-12 — Purchase before assessment (local).** The unauthenticated home has no purchase pitch; existing signed-in access choices and Mi acceso expose the authenticated subscription flow before placement and from Mi cuenta. Server availability and Stripe confirmation remain required; repeat real Sandbox lifecycle acceptance before release.

- [x] **CR-13 — Settings sign-out (local).** Cerrar sesión lives only in Settings in the active workspace; Header and the account overview omit it. Queued progress persistence is unchanged.

- [x] **CR-14 — Muse label (local).** Visible Conectar Muse / Conectando Muse / Muse conectado uses the same service and unsupported-browser explanation. Check physical hardware before release.

- [ ] **CR-15 — HIGH PRIORITY: branded authentication email URLs / support follow-up.**
  The owner has submitted a Firebase Support ticket about HTTP 400
  `EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED` when updating
  `notification.sendEmail.callbackUri`. Await the response; ticket ID/link has not
  been supplied. The error reproduces both in Firebase Console and through the
  official admin API using Firebase CLI OAuth credentials. Read-back confirms
  that the original email action URL remains unchanged.

  `auth.neuroia.es` is connected to Firebase Hosting with valid HTTPS; both auth
  endpoints respond successfully. The owner confirmed DNS, authorized domain and
  Google OAuth callback configuration. The local authDomain override is enabled;
  the API-key referrer restriction has been corrected for the new helper, and an
  isolated local popup reaches Google sign-in. Full account sign-in remains to verify;
  the missing local `VITE_BILLING_API_URL` has also been restored and browser CORS
  connectivity checked. Verify entry through AccessGate and cloud progress with
  the owner's existing account; no real account was used for automated checks.
  production remains unchanged. Keep existing email links working while the
  ticket is unresolved. Setup and rollback are in [DEPLOYMENT.md](DEPLOYMENT.md).

  After Support responds, verify the permitted callback update and read it back.
  Check newly issued verification and password-reset emails use
  `https://auth.neuroia.es/__/auth/action`, complete both flows, exercise expired
  and reused links, and verify return navigation and Google sign-in on the tested
  browsers. Confirm existing accounts and progress remain intact. Close this item
  only after the actual email flows pass, not merely on ticket resolution or an
  HTTP 200 from the helper endpoint. Production activation remains a separate
  deployment step.

### Game copy and reinforcement

- [x] **CR-16 — Word-completion naming (local).** Active catalog and instruction title use Completar palabras; legacy IDs and saved history are unchanged. New spoken wording uses the existing recording fallback.

- [x] **CR-17 — Answer feedback revised by owner.** Removed transient praise bubbles and spoken congratulations. Keep in-place answer feedback and ordinary results; continuation actions are stable and click/success effects quieter.

### Verification before client approval

Reproduce CR-06–CR-09 in assessment separately from ordinary practice. Changes to
placement evidence or persistence require the existing difficulty/progress tests
and demo Firestore rules/adapter suite, including delayed saves and resume. Verify
entry/payment/auth changes in their supported test environments, and visually
review the agreed phone/tablet/orientation layouts with large text, touch and
keyboard. Refresh affected DESIGN, CONTENT, SDD and provider guidance when the
corresponding decisions are implemented. Do not mark client items complete solely
from compilation or local source inspection. Merge and deployment still require
explicit authorization.

## Product priorities

The table below retains the earlier product priorities; the client review above
is the immediate delivery planning focus. Dependencies can be implemented
first; Muse 2 uses the selected MuseJS Web Bluetooth adapter. No AI model, official SDK,
voice provider or new illustration set has been selected by this planning work.

| Order / ID | Deliverable | Current state | Completion gate |
| --- | --- | --- | --- |
| 1 / EEG | Bluetooth EEG headband | Connection UI, adapter contract, live chart and per-exercise recording/detail prepared; MuseJS-based Web Bluetooth adapter implemented; real-device connection, signals, battery, reconnection and saved charts confirmed by owner | Retain tested-device scope; do not infer support for untested browsers |
| 2 / SEATS | Monthly professional seats and code validity | Payment and seat lifecycle confirmed by owner in Sandbox | Sandbox accepted for current stage; live-money validation is separate |
| 3 / AI | OpenRouter activity reports and optional suggestions | Implemented: grounded summaries, authenticated API, Spanish prompts/template, direct PDF download; private notes remain pending | Complete broader Spanish/privacy acceptance and real-account verification; see AI.md |
| 4 / SESSIONS | Professional-assigned game sequences | Versioned proposals, editor, participant entry, fixed levels, durable completion and resume implemented | Check real paired accounts on physical tablets |
| 5 / EMAIL | Email authentication | Email/password implemented; provider enabled and verified-email rules/Worker published | Real email delivery confirmed by owner; magic links deferred because Spark allows five sign-in emails/day |
| 6 / VOICE | Natural Spanish narration | 279/370 evaluation clips available; 91 pending | Audition, rights, current text inventory and playback/fallback verification |
| 7 / BRAND | Supplied new logo | Implemented from the [original PNG](assets/brand/supplied-mark.png) | App, wordmark, favicon and installation variants use the supplied mark |
| 8 / ART | More realistic illustrated/pictogram game objects | Approved towel/table style integrated across 80 objects, standalone stimuli and motor tokens | Physical-tablet recognition feedback |
| 9 / LEVELS | Difficulty 1–10 | Versioned 1–10 configuration for all games, saved level and timed same-game promotion | User calibration and physical-device checks |
| 10 / PLACEMENT | Guided initial level assessment | Selected games grouped by interest with bounded 1/4 placement with legacy 7/10 compatibility, separate from access onboarding; thematic entry implemented locally (CR-04); pacing changes implemented locally (CR-05–CR-09) | Client review acceptance and physical-device checks |
| 11 / RETIRE | Remove daily action sequencing | Implemented | Eight playable games; Organization uses categorization; historical names, filters and colors retained |

### Current implementation sequence

The first priority/ease steps are: 0 — mergeable baseline; 1 — retire daily
actions; 2 — supplied logo; 3 — email/password entry. Steps 0–2 are complete.
Step 3 is implemented and locally verified; backend/provider activation is complete.
Seats, difficulty/placement and professional session proposals are also implemented. The main-branch Pages workflow publishes these frontend features; the owner has confirmed real email delivery and the listed device checks. The product-priority table above is separate from this sequence.

### EEG

- [x] Confirm the target headband: Muse 2 (choosemuse.com).
- [x] Adapt the owner-selected MIT MuseJS protocol for EEG, infrared PPG and battery
  over Web Bluetooth, without waiting for the official SDK.
- [x] Prepare the optional connection dialog, SDK adapter contract, bounded live
  indicator and opt-out per-exercise saving through the existing result outbox.
  Player/professional history and confirmed proposal steps open individual analytics.
- [x] Publish EEG/PPG result rules to `ceoaberto-neuroia` (2026-09-29);
  verify the active release against the tested source.
- [x] Owner confirms real Muse 2 connection, EEG/PPG, battery, reconnection and
  saved charts on their tested setup.
- [ ] Implement account/data deletion and retention controls. Current design saves
  no raw EEG and retains opted-in charts with completed results. No EEG-driven adaptation.
  See [EEG handoff](eeg/README.md).

### Seats and expiry

- [x] Owner confirms the Sandbox payment/seat lifecycle: purchase, renewal, failed
  payment, cancellation and reassignment. Sandbox is accepted for this stage.
- [x] Implement authoritative Worker access checks with server time, reciprocal
  seat validation and a 60-second maximum lease; failed refresh/offline/resume
  closes play until confirmed. Professional codes/activity use confirmed time.
- [x] Deploy Worker `/access`, `/professional/status` and the per-seat portal flow;
  verify health, localhost CORS and unauthenticated/unsigned-request rejection.
- [x] Owner confirms end-to-end Sandbox purchase and cancellation.
- [ ] Preserve CEOABERTO as the explicitly documented permanent exception unless
  the owner separately changes that contract; paid `NIA-` codes are never permanent.

### Reports, notes and assigned sessions

- [ ] Define separate storage and permissions for private professional notes and
  participant-visible instructions; the direct PDF report generation is implemented.
- [x] Implement optional OpenRouter activity writing through the existing Worker:
  server-verified data/permissions, quotas, bounded Spanish prompts/schema,
  cancellation and direct PDF report download with vector area/level star charts. Activity Resumen
  shows optional suggestions without AI-driven level changes; see [AI.md](AI.md).
- [x] Wire root `.env` OpenRouter credentials to local Worker bindings; support
  the selected Dots3-Note Preview free model with hardcoded JSON object output and ZDR
  disabled. The versioned prompt includes an example, a fill-in template and
  explicit allowed evidence IDs; keep real-model factuality acceptance separate.
- [x] Deploy the AI Worker with a server-side OpenRouter secret and Dots3-Note
  Preview free enabled. Verify health, both allowed origins and authentication
  enforcement on the production AI routes; signed-in user acceptance remains below.
- [x] Restrict report/AI evidence to the eight active games and invalidate old catalog
  caches. Production inventory found no retired-game results or profile fields;
  two obsolete daily AI snapshots were backed up and removed.
- [x] Generate recommendations automatically on the first daily visit to Resumen,
  reuse an authorized server snapshot across devices and display full-width summary text.
- [x] Validate real Dots3-Note Preview free recommendations and report smoke cases
  using synthetic data and the v4 prompt. Output mode/ZDR remain hardcoded.
- [ ] Complete broader Spanish factuality/latency evaluation and provider processing
  arrangements; verify player and linked-professional generation with real accounts.
  Synthetic smoke checks and mocked tests are not full product acceptance.
- [ ] If required later, define a cloud archive for reviewed reports and distinct
  private-note permissions. Current reports are downloaded only; account deletion
  cannot remove users' downloaded copies.
- [ ] Reconcile the grant memory with the selected suggestion-only AI scope;
  reinforcement learning, EEG interpretation and measured pilot KPIs remain unmet.
- [x] Implement versioned session assignments to an actively linked person,
  ordered game IDs/levels, progress/resume, cancellation and completion receipts.
- [x] Test cross-account isolation, seat expiry, departure, replaced occupants,
  duplicate games, concurrent completion and durable result recovery in the emulator.
- [x] Publish the session Firestore rules and verify the active release matches the tested rules.
- [x] Restyle the professional workspace, proposals and analytics in Calma; prioritize professional proposals in Hoy and rotate three pending steps, supporting individual prescribed games and out-of-order archived-result reconciliation.
- [ ] Publish the session frontend and verify a real professional/participant
  pair on physical tablets. No production fixture activity is used for verification.
- [ ] Add older professional-session pagination beyond the latest 50; participant
  queries filter pending sessions before applying their 50-item limit.
- [ ] Define session invalidation/migration when retiring a game or changing configuration versions.

### Authentication, identity and artwork

- [x] Implement the owner's selected email/password method, registration,
  verification and password recovery, retaining Google and both workspaces.
- [x] Add a password to an authenticated Google account without changing its UID
  or history. Test credentials, verification, reset and server enforcement locally.
- [x] Publish the verified-email Firestore rules and Worker, then enable Firebase
  Email/Password, keeping Google. Spark billing remains unchanged.
- [x] Owner confirms real email delivery and account/device checks. Local automated
  coverage also checks verification/reset and Google/password access on one UID.
  Magic links need an explicit quota solution before replacing passwords: Spark
  permits five sign-in emails/day. See `docs/AUTHENTICATION.md`.
- [x] Integrate the supplied logo reference, preserve its proportions, and verify
  wordmark, loading, header, card backs, favicon and PWA icons on both themes.
- [x] Approve the towel/table illustrated style, inventory active stimuli and
  replace their atlas mappings while preserving answer keys. Fix shirt/lamp/pliers
  identities and separate soup from the pot; document generation and crop review in DESIGN.md.
- [ ] Gather recognition feedback for the new illustrated stimuli on physical tablets.

### Difficulty, placement and game retirement

- [x] Define ten bounded configurations for each of the eight retained games.
- [x] Add versioned placement/level state; existing `domainProgress.level = 1`
  is a default, not evidence that placement has been completed.
- [x] Add 1/4/7/10 assessment stages in shuffled game order; preserve the last passed level after failure or omission.
- [x] Restyle access/progress connection recovery with the shared login presentation.
- [x] Build short guided trials with the existing companions, pause/help,
  accessible instructions and resumable progress. Respect hidden companions.
- [x] Persist actual level/configuration and hint usage per result; adapt between
  exercises using timed same-game runs and allow manual level selection.
- [ ] Validate level pacing and vocabulary ordering with users on physical tablets;
  review memory preview visibility in short landscape viewports.
- [x] Add explicit reassessment from Mi cuenta; preserve saved activity and replace levels only after finishing and saving.
- [x] Add a level-up celebration and the Nivel statistics tab (current bars, radar and recorded level timeline per game).
- [ ] Calibrate pacing and tracking with users.
- [x] Publish the `assessedLevel` trial field rule to `ceoaberto-neuroia` for 1/4/7/10 onboarding saves.
- [x] Publish the `qualifyingRuns` rule extension to `ceoaberto-neuroia`; timed promotion can save its per-game run counters.
- [x] Publish the placement/difficulty Firestore rules; the local frontend can save
  trials and levels. Frontend publication remains separate.
- [x] Remove daily action sequencing from catalog, dispatch and daily plans;
  keep memory beacon sequencing. Preserve `daily-seq` / `daily-sequencing`
  history, achievements and cumulative totals.
- [x] Verify catalog, Organization, daily plan, completion and historical filters
  at phone, tablet and desktop sizes with keyboard and pointer input.

## Engineering and release gates

- [x] Resolve the 28 Oxlint warnings without disabling rules: lazy game
  initialization, event-driven resets, immutable card updates, timer cleanup and
  session hook separation. Keep the strict zero-warning merge check.
- [x] Reconcile CONTRIBUTING's missing `check*` scripts and its Biome/Knip
  references with actual npm/TypeScript/Oxlint commands; retain the zero-warning
  merge gate and explicit merge authorization.
- [ ] Review the production build's chunk-size warning (bundle over 500 kB).
- [ ] Complete the production checks below; local tests do not verify live Stripe,
  deployed Firestore rules, browser hardware support or physical-device installation.

## Existing release and audio detail

The following inventory is retained so no exact audio filenames or unresolved
release issue is lost during prioritization.

## Public text availability

- [ ] Revisit the PDF's professional, AI and EEG sections when those features ship,
  or when future-feature wording is explicitly chosen. See `docs/CONTENT.md`.
- New neutral completion messages use the existing speech fallback if narrated;
  do not regenerate or reintroduce obsolete clinical-claim audio to fill gaps.

## Complete the ElevenLabs audio collection

- The retained recording inventory has 279 of 370 clips available in
  `public/audio/elevenlabs-v3/`. The current speech collector yields 365 texts;
  the older inventory also includes three retired daily-sequencing phrases and
  two previously removed greeting previews. Preserve those original mappings;
  regenerate the active inventory before commissioning new recordings.
- 91 feedback clips remain (listed below); the account last showed 6 credits.
- Resume with Alejandro Castellanos (`WWVK6dYMrl0ZHnHT7cRj`), Eleven v3,
  Spanish override (`es`), stability 0.5. Do not regenerate existing blocks.
- The pending text totals 2924 characters; actual billed credits may differ.
- Follow the collection README. Wait for full generation completion before
  downloading; recover incomplete downloads from History before regenerating.
- Run `python scripts/index_elevenlabs_v3.py` after downloading. Update this
  checklist, `pending.json`, `generation-status.json`, and the collection README.
- Do not purchase a subscription, merge, or deploy without explicit authorization.

- [ ] `0f79f47a8e305be5.mp3` — ¡Correcto! Cepillo de Dientes pertenece a Higiene y Baño.
- [ ] `b4aea95c021d0022.mp3` — El objeto Cepillo de Dientes corresponde a Higiene y Baño.
- [ ] `c299a3ba7b9abdd9.mp3` — ¡Correcto! Taza pertenece a Cocina.
- [ ] `74926270ed30ccf3.mp3` — El objeto Taza corresponde a Cocina.
- [ ] `15403096e00261d4.mp3` — ¡Correcto! Toalla pertenece a Higiene y Baño.
- [ ] `a69e2953dcefb98f.mp3` — El objeto Toalla corresponde a Higiene y Baño.
- [ ] `6696198efc033022.mp3` — ¡Correcto! Olla pertenece a Cocina.
- [ ] `a8ca6233746a7e18.mp3` — El objeto Olla corresponde a Cocina.
- [ ] `480851e77a6bc588.mp3` — ¡Correcto! Esponja de Baño pertenece a Higiene y Baño.
- [ ] `19699de3b9d2fa33.mp3` — El objeto Esponja de Baño corresponde a Higiene y Baño.
- [ ] `686a7f24b09fcc5d.mp3` — ¡Correcto! Martillo pertenece a Herramientas.
- [ ] `a244ee06529d11b8.mp3` — El objeto Martillo corresponde a Herramientas.
- [ ] `0d3570458142f217.mp3` — ¡Correcto! Sofá pertenece a Muebles del Hogar.
- [ ] `92e213ac2d0493c7.mp3` — El objeto Sofá corresponde a Muebles del Hogar.
- [ ] `5b2b73ba97a078a6.mp3` — ¡Correcto! Destornillador pertenece a Herramientas.
- [ ] `2120e2070799d8ed.mp3` — El objeto Destornillador corresponde a Herramientas.
- [ ] `adf426e76190cc13.mp3` — ¡Correcto! Cama pertenece a Muebles del Hogar.
- [ ] `355bd5e99e85b5de.mp3` — El objeto Cama corresponde a Muebles del Hogar.
- [ ] `66b8864f733fd98f.mp3` — ¡Correcto! Alicates pertenece a Herramientas.
- [ ] `ee0c132bc756ad91.mp3` — El objeto Alicates corresponde a Herramientas.
- [ ] `f4c44e710e339c81.mp3` — ¡Correcto! Silla pertenece a Muebles del Hogar.
- [ ] `f52d78ade85a2687.mp3` — El objeto Silla corresponde a Muebles del Hogar.
- [ ] `412d5586f42421b5.mp3` — ¡Correcto! Perro pertenece a Animales.
- [ ] `3276daa85c5006aa.mp3` — El objeto Perro corresponde a Animales.
- [ ] `3077cf9d9621cb58.mp3` — ¡Correcto! Autobús pertenece a Medios de Transporte.
- [ ] `51df25a436ba929b.mp3` — El objeto Autobús corresponde a Medios de Transporte.
- [ ] `4f64028a5ec39ffe.mp3` — ¡Correcto! Gato pertenece a Animales.
- [ ] `1dabe6a02b997284.mp3` — El objeto Gato corresponde a Animales.
- [ ] `4bf2452bc3cea516.mp3` — ¡Correcto! Bicicleta pertenece a Medios de Transporte.
- [ ] `14cf914989302933.mp3` — El objeto Bicicleta corresponde a Medios de Transporte.
- [ ] `07aee1e4ab93b282.mp3` — ¡Correcto! Caballo pertenece a Animales.
- [ ] `0f492aeb2ddb5ed3.mp3` — El objeto Caballo corresponde a Animales.
- [ ] `97928a064007e7c3.mp3` — ¡Correcto! Avión pertenece a Medios de Transporte.
- [ ] `4d5a5fe046bcc861.mp3` — El objeto Avión corresponde a Medios de Transporte.
- [ ] `d6fd7110d956069a.mp3` — ¡Pareja de Reloj!
- [ ] `a6a2f9cdfcef3d78.mp3` — ¡Pareja de Casa!
- [ ] `5e1f3e1baee0c969.mp3` — ¡Pareja de Llave!
- [ ] `81cfbc51a329e718.mp3` — ¡Pareja de Teléfono!
- [ ] `e620af502e20bca1.mp3` — ¡Pareja de Taza!
- [ ] `8df3c67520a8ebea.mp3` — ¡Pareja de Gafas!
- [ ] `291c91e0a0642318.mp3` — ¡Pareja de Zapato!
- [ ] `f74b76e203536fc4.mp3` — ¡Pareja de Manzana!
- [ ] `29d1245707e04740.mp3` — ¡Pareja de Pan!
- [ ] `ad7eead5bdd09852.mp3` — ¡Pareja de Cuchara!
- [ ] `71c90a8c4455726f.mp3` — ¡Pareja de Camisa!
- [ ] `cac1da12bb87d760.mp3` — ¡Pareja de Coche!
- [ ] `66a397555829ad94.mp3` — ¡Pareja de Silla!
- [ ] `89e4ea5ad025b571.mp3` — ¡Pareja de Lámpara!
- [ ] `c5b28e32f2a9f63d.mp3` — ¡Pareja de Libro!
- [ ] `0e81455f72740bea.mp3` — ¡Pareja de Tijeras!
- [ ] `5542af481aad61fc.mp3` — ¡Pareja de Cepillo!
- [ ] `a767aadfcc95c209.mp3` — ¡Pareja de Paraguas!
- [ ] `0e4e07a3b693c4d5.mp3` — ¡Pareja de Bicicleta!
- [ ] `b133bc4274bb6f8d.mp3` — ¡Pareja de Girasol!
- [ ] `68051a73a9b3def4.mp3` — ¡Pareja de Gato!
- [ ] `5804a6e13373da8a.mp3` — ¡Pareja de Perro!
- [ ] `69e520ccb67d478f.mp3` — ¡Pareja de Plátano!
- [ ] `edce5a363420b1fc.mp3` — ¡Pareja de Cama!
- [ ] `1f38df76717dfc2f.mp3` — ¡Pareja de Guitarra!
- [ ] `aac60d91993e403b.mp3` — ¡Pareja de Radio!
- [ ] `20aac4476d9bba6f.mp3` — ¡Pareja de Plato!
- [ ] `ef223de8b54846c1.mp3` — ¡Pareja de Sombrero!
- [ ] `bb0e3bb76d7ebb76.mp3` — ¡Pareja de Vaso!
- [ ] `ddc59fa2128e65e8.mp3` — ¡Pareja de Jabón!
- [ ] `cd6fe760f9458a56.mp3` — Recuerda buscar las manzanas rojas.
- [ ] `bea21a17325dad5d.mp3` — Recuerda buscar las peras verdes.
- [ ] `2168a55f6174a83f.mp3` — Recuerda buscar las racimos de uvas.
- [ ] `410a3172ee3a1137.mp3` — Recuerda buscar las naranjas.
- [ ] `c729f84ce4215ae7.mp3` — Recuerda buscar las plátanos.
- [ ] `a8add0a362d5fb71.mp3` — Recuerda buscar las fresas.
- [ ] `ad9eabf598eeabd1.mp3` — Recuerda buscar las cerezas.
- [ ] `938fa6921cd1e8ed.mp3` — Recuerda buscar las limones.
- [ ] `1ec915e2b6ce15a2.mp3` — Recuerda buscar las sandías.
- [ ] `0173c327a84f9cd5.mp3` — Recuerda buscar las melocotones.
- [ ] `ff795bfebc258560.mp3` — Recuerda buscar las piñas.
- [ ] `313c73b610514878.mp3` — Recuerda buscar las kiwis.
- [ ] `93ad2f8a398228d1.mp3` — Recuerda buscar las aguacates.
- [ ] `9645f78af0b96fbd.mp3` — Recuerda buscar las cocos.
- [ ] `ec56a8bde7f7a527.mp3` — Recuerda buscar las zanahorias.
- [ ] `9fc48d2f8ecefc0d.mp3` — Recuerda buscar las mazorcas de maíz.
- [ ] `169e07a58d4abade.mp3` — Recuerda buscar las tomates.
- [ ] `1147919de20491ee.mp3` — Recuerda buscar las brócolis.
- [ ] `b651f14c7f8f2001.mp3` — Recuerda buscar las patatas.
- [ ] `63580b578dc4e2ee.mp3` — Recuerda buscar las berenjenas.
- [ ] `6b4a90f2a239e798.mp3` — Recuerda buscar las champiñones.
- [ ] `1ae24b213fcc7629.mp3` — Recuerda buscar las croissants.
- [ ] `7cfaa03e39db9f3d.mp3` — Recuerda buscar las aceitunas.
- [ ] `d427dbbfc08443fb.mp3` — Recuerda buscar las melones.
- [ ] `5a6e02fb621a998b.mp3` — Velocidad de voz pausada y tranquila.
- [ ] `e316be71ff89bb71.mp3` — Velocidad de voz normal.
- [ ] `67cfd5922cec7b1e.mp3` — Lee las opciones y responde a tu ritmo.

## Review and integrate the narrator

- [ ] Listen to the generated clips, especially phonetic hints and extracted
  words. Sample approval does not verify every recording.
- [ ] Confirm licensing before a commercial release. Current recordings were
  generated on the free plan for non-commercial evaluation with attribution.
  A later subscription does not retroactively license those files.
- [x] Connect the accepted audio collection to the shared sound service,
  preserving narration controls, cancellation, callbacks and playback speed.
  Available clips play locally; missing files and playback failures use browser speech.

## Unresolved interface issues

- [x] Header home action returns to Hoy from the catalog and other dashboard tabs.
  Workspace owns tab selection; returning home does not remount the dashboard or
  regenerate the suggested daily queue.
- [ ] Reproduce the reported blank background in object naming. It was not
  reproduced through the current catalog at 390, 820, 1280 or 844×390, including
  answering, advancing and help/resume; sampled image assets loaded successfully.
  Current home area shortcuts do not expose Language, so the historical domain
  entry cannot be exercised there. Keep open for a reproducible owner path/device;
  do not mark fixed from these negative checks.

## Accounts and professional access

- [x] Google sign-in confirmed by the project owner.
- [x] Implement Firestore profile/settings/results synchronization, transaction
  receipts, local pending queue, initial import choice and emulator tests.
- [x] Publish the reviewed `vendor/firebase/firestore.rules` in the real Firebase project.
- [x] Owner confirms real-account synchronization between devices.
- [x] Confirm `bysplays.github.io` is authorized in Firebase Authentication.
- [ ] Complete the `neuroia.es` migration in [deployment](DEPLOYMENT.md): GitHub Pages
  domain, Hostinger DNS, HTTPS, Firebase authorized domains/API-key referrers,
  Worker `APP_URL`, frontend rebuild, Google/email login and payment returns.
  Local configuration is prepared; provider changes and live verification remain pending.
- [x] Implement free self-owned professional workspaces, paid-seat care links,
  read-only analytics and participant departure with code rotation.
- [ ] Verify professional credentials before adding any clinical permissions.
- [ ] Add private clinical notes and patient-facing instructions with distinct
  permissions and explicit merge of retained local backups
  into an already-existing cloud account. Initial empty-account import is available.

## Onboarding and subscriptions

- [x] Mandatory modal, server-timed seven-day trial and transactional invitation
  redemption with care links; CEOABERTO remains permanent and reusable. Paid-seat
  codes are unique, single-occupant and valid only during confirmed paid access.
- [x] Add Stripe Checkout, signed webhook and customer portal integration code.
- [x] Owner confirms the configured payment lifecycle works in Sandbox. See `docs/ONBOARDING.md`.
- [ ] Assign CeoAberto's actual Firebase owner UID before any migration of its
  legacy links. New professional workspaces do not inherit those links.
- [x] Publish reviewed Spark-compatible rules for real-account invitation/trial
  access. No Cloud Functions or Blaze required; localhost:5173 keeps real Google login.
- [x] Deploy the reviewed professional-seat Worker and Firestore rules before
  publishing the professional frontend.
- [x] Owner confirms Sandbox purchase, renewal, failed payment, cancellation and
  seat reassignment end to end. See `docs/PROFESSIONALS.md`.

## Cloudflare billing deployment

- Worker deployed: `/health` reports test mode, localhost CORS preflight succeeds,
  unauthenticated requests return 401 and unsigned webhooks return 400. Local Vite
  billing flags are enabled in ignored `.env.local`. Verify the configured secrets
  and six sandbox webhook events with a signed end-to-end payment.
- Verify real service-account access, signed delivery, Checkout, renewal, declined
  payment and portal cancellation; automated checks do not make live API calls.
- Measure CPU usage against the Workers Free limit before enabling the Pages
  purchase flag. No billing backend was deployed by the local frontend build.

- [x] Deploy the renewal-aware Worker and enable Cron `*/5 * * * *`.
- [ ] Verify daily reconciliation and Stripe test-clock failed renewal/recovery/cancellation.
  See `vendor/cloudflare/README.md` for bounded batches and checkpoint monitoring.

- [x] Owner confirms installation and fullscreen on the tested devices. Specific
  Android/iPad/browser versions were not supplied; offline entry is not supported.

### Tablet release checks

- [x] Owner confirms fullscreen and tablet checks on the tested devices. Do not
  extend that confirmation to unspecified OS/browser combinations.
- [ ] Check longest account/session text and very large text on target devices;
  preserve accessible scrolling for content that cannot fit.

## Calma local verification and release limits

- Unit suite: 93 tests passed; demo Firestore/rules/proposals/Worker REST: 31 passed.
- Demo Auth suite: 3 passed, including automatic verification delivery and retry after failure; build and strict lint pass.
- Isolated placement browser suite: 9 passed, including delayed evidence and reload.
- Interface suite: 12 passed (11-suite run plus focused home-navigation regression), covering
  three widths, eight instruction/play screens, funding
  image/transcript, About focus return, keyboard pairs, failed Simon, trial
  continuation, visible reinforcement, target bounds and enlarged text.
- Production build succeeds with the existing large-bundle advisory (main chunk
  remains above 500 kB); bundle splitting remains a performance follow-up.
- No deployment, real-account writes, database backup, live-payment verification
  or physical-device Bluetooth/installation verification is implied by these checks.
- New instruction copy can fall back to browser speech; the existing pending
  recordings and licensing items remain open.

## Privacy notice release requirements

- [x] Owner confirmed CEO Aberto S.L., NIF B36232361, Vigo address and
  david@ceoaberto.com as privacy contact; included in the legal page.
- [ ] Complete rights-request handling, lawful bases (including EEG/PPG), retention
  periods/criteria, provider agreements and international transfer safeguards.
  Current legal page describes verified app behavior, not a complete approved policy.

- [x] Keep long category labels inside their buttons with wrapping and hyphenation; verified the level-10 narrow/short viewport fixture with large text.
