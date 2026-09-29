# NeuroIA — implementation backlog

This is the canonical TODO. The [SDD](SDD.md) defines the target behavior,
architecture, dependencies and acceptance criteria. Existing code is not proof
of a production deployment. Keep project guidance in English and UI copy in Spanish.

## Current remaining scope

The owner confirms real Muse 2 connection, EEG/PPG, battery, reconnection and saved
charts; the payment/seat lifecycle (purchase, renewal, failed payment, cancellation
and reassignment) in Sandbox; and real email delivery, cross-device sync,
installation and fullscreen on the tested devices. Sandbox is sufficient for the
current stage; this is not confirmation of live-money payments. Specific OS/browser
versions were not supplied, so do not infer a universal compatibility matrix.

The remaining work, in the owner's order, is:

1. Narration: finish the 91 clips, audition them and resolve commercial licensing.
2. Notes, reports and local AI: implement the pending workflows.
3. Finishing work: the two recorded interface issues, bundle optimization and
   account/data deletion management.

The detailed inventory below retains future extensions and specific acceptance
conditions; it does not reopen the owner-confirmed checks above.

## Product priorities

The order below follows the owner's priorities. Dependencies can be implemented
first; Muse 2 uses the selected MuseJS Web Bluetooth adapter. No AI model, official SDK,
voice provider or new illustration set has been selected by this planning work.

| Order / ID | Deliverable | Current state | Completion gate |
| --- | --- | --- | --- |
| 1 / EEG | Bluetooth EEG headband | Connection UI, adapter contract, live chart and per-exercise recording/detail prepared; MuseJS-based Web Bluetooth adapter implemented; real-device connection, signals, battery, reconnection and saved charts confirmed by owner | Retain tested-device scope; do not infer support for untested browsers |
| 2 / SEATS | Monthly professional seats and code validity | Payment and seat lifecycle confirmed by owner in Sandbox | Sandbox accepted for current stage; live-money validation is separate |
| 3 / AI | Browser-local report/note assistance | No runtime integration; professional view is read-only | Spanish evidence-linked drafts, human review, supported-device benchmark and non-AI fallback |
| 4 / SESSIONS | Professional-assigned game sequences | Versioned proposals, editor, participant entry, fixed levels, durable completion and resume implemented | Check real paired accounts on physical tablets |
| 5 / EMAIL | Email authentication | Email/password implemented; provider enabled and verified-email rules/Worker published | Real email delivery confirmed by owner; magic links deferred because Spark allows five sign-in emails/day |
| 6 / VOICE | Natural Spanish narration | 279/370 evaluation clips available; 91 pending | Audition, rights, current text inventory and playback/fallback verification |
| 7 / BRAND | Supplied new logo | Implemented from the [original PNG](assets/brand/supplied-mark.png) | App, wordmark, favicon and installation variants use the supplied mark |
| 8 / ART | More realistic illustrated/pictogram game objects | Approved towel/table style integrated across 80 objects, standalone stimuli and motor tokens | Physical-tablet recognition feedback |
| 9 / LEVELS | Difficulty 1–10 | Versioned 1–10 configuration for all games, saved level and timed same-game promotion | User calibration and physical-device checks |
| 10 / PLACEMENT | Guided initial level assessment | Eight shuffled games with 1/4/7/10 placement ladders, separate from access onboarding | Physical-device checks |
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

- [ ] Define separate storage and permissions for private professional notes,
  reviewed reports and participant-visible instructions; implement manual use first.
- [ ] Evaluate small Llama/Gemma-style browser models, runtimes, Spanish quality,
  device memory, download size and licenses before selecting a model.
- [ ] Implement local draft generation, cancellation, explicit review and save;
  never manufacture diagnoses, activity or prescriptions from empty histories.
- [x] Implement versioned session assignments to an actively linked person,
  ordered game IDs/levels, progress/resume, cancellation and completion receipts.
- [x] Test cross-account isolation, seat expiry, departure, replaced occupants,
  duplicate games, concurrent completion and durable result recovery in the emulator.
- [x] Publish the session Firestore rules and verify the active release matches the tested rules.
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

- [ ] Make the header home action close the catalog when already in the
  dashboard view. The catalog currently keeps its internal selection state;
  its own “Volver al inicio” action works.
- [ ] Reproduce the reported blank background in object naming. It was not
  reproduced through the catalog; inspect the domain entry and modal/scroll
  state. Do not mark fixed without a reproduction and verification.

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
  permissions, account deletion, and explicit merge of retained local backups
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
