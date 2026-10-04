# Working on NeuroIA

This is the repository-wide guide for coding agents. Read [DESIGN.md](docs/DESIGN.md)
before changing any interface, interaction, copy, or visual asset. Read
[CONTRIBUTING.md](CONTRIBUTING.md) for branch, commit, and merge conventions.

These documents are living project guidance. Keep them accurate as part of the
change that makes them outdated; do not treat them as a frozen specification.
Explicit user instructions take precedence over this local guidance.

## Product and language

NeuroIA is a Spanish-language entertainment, training and serious-play app with eight exercises
across attention, language, memory, organization, and coordination. The app also
includes a daily plan, achievements, accessibility settings, and a therapist view.

Keep user-facing copy in Spanish. Follow [CONTENT.md](docs/CONTENT.md) for the supplied
public wording, non-medical positioning and feature-availability limits. Write project guidance in English. Use short,
warm instructions and concrete action labels. Do not add medical efficacy claims
or invent patient activity, results, diagnoses, or professional guidance.

## Start with the existing implementation

1. Inspect the working tree and current branch. Preserve unrelated user changes.
2. Read the relevant components and styles, including the stylesheet cascade.
3. Reuse the shared components and services below instead of creating parallel
   navigation, storage, audio, modal, or visual systems.
4. Implement the requested change and verify its actual rendered behavior.
5. Update the relevant living documentation and report changes, checks, and limits.

Continue on the task's existing branch unless the user asks otherwise. Never
commit directly to `main`. Use Conventional Commits with a mandatory scope, such
as `fix(games): keep paper targets inside the play area`. Do not add
`Co-Authored-By` trailers. Merging requires explicit user authorization, as stated
in CONTRIBUTING.md. A local commit is not authorization to publish or deploy.

## Documentation layout

Keep `README.md`, `CONTRIBUTING.md` and `AGENTS.md` at the repository root.
Project guides live in `docs/`; `docs/TODO.md` is the canonical implementation
backlog and `docs/SDD.md` specifies planned behavior and acceptance criteria, not
shipped capabilities. Provider documentation lives beside its integration in
`vendor/`, and asset provenance lives in `docs/assets/` mirroring the public asset directories.
Cloudflare Workers live in `vendor/cloudflare/`; Firebase rules and the legacy
Functions package live in `vendor/firebase/`; Stripe setup lives in `vendor/stripe/`.
The root `firebase.json` remains the CLI entry point and references these paths.
Application adapters stay in `src/`. Asset files remain in `public/`; paths in documentation prose are repository-relative,
while Markdown links are relative to the document. Keep links current when moving guides.

## Code map

| Location | Responsibility |
| --- | --- |
| `src/components/AppLoading.tsx` | Shared initial loading presentation for auth, access, lazy chunks and progress |
| `src/components/AccountEntry.tsx` | Selects independent player/professional workspaces for the same authenticated account |
| `src/components/LoginScreen.tsx`, `EmailVerification.tsx`, `AccountPassword.tsx` and `src/services/emailAuth.ts` | Google/email entry, verification, recovery and adding a password to the existing UID |
| `src/components/ProfessionalDashboard.tsx` and `src/services/firestoreProfessional.ts` | Free professional panel, sponsored seats and read-only linked activity; see `docs/PROFESSIONALS.md` |
| `src/components/ProfessionalPageHeader.tsx` | Shared icon-led title and separate back/participant/action row for professional sessions and standalone statistics |
| `src/components/ProfessionalSessions.tsx`, `AssignedSessions.tsx`, `src/services/assignedSessions.ts`, `useAssignedRecommendation.ts` and `firestoreSessions.ts` | Professional proposals, Hoy recommendations, independent prescribed-step play and contiguous archived-result reconciliation; see `docs/PROFESSIONALS.md` |
| `src/components/AccessGate.tsx` and `OnboardingModal.tsx` | Personal account entry before progress and games |
| `src/services/firestoreAccess.ts` and `accessService.ts` | Spark-compatible entitlement reads, Worker trials and atomic CEOABERTO redemption and invitation departure; see `docs/ONBOARDING.md` |
| `vendor/cloudflare/` | Cloudflare Stripe backend, signed webhooks, daily reconciliation and Firestore REST transactions; see `vendor/cloudflare/README.md` |
| `vendor/firebase/functions/` | Previous Firebase billing backend and administrator-only professional ownership script |
| `src/App.tsx` | View state, profile refresh, game dispatch, daily-plan progression |
| `src/types/index.ts` | Domain, exercise, profile, result, and settings contracts |
| `src/services/productCopy.ts` and `src/components/ProductInformation.tsx` | Supplied public presentation and notice, accessible from login and dashboard |
| `src/components/Dashboard.tsx` | Home, entry points to areas and all exercises |
| `src/components/ExerciseCatalog.tsx` | Eight-game catalog and area filters |
| `src/services/dailySession.ts` | 56 named three-game combinations, deterministically selected by account and local date for home and daily play |
| `src/services/exerciseCatalog.ts` | Eight active exercise definitions and short summaries |
| `src/services/activityExercises.ts` | Historical names and stable chart styles, including retired daily sequencing |
| `src/services/activityInsights.ts`, `activityAi.ts`, `activityReportPdf.ts` and `src/components/ActivityAssistant.tsx` | Active-game deterministic activity evidence, optional OpenRouter suggestions and direct Spanish PDF report export; see `docs/AI.md` |
| `vendor/cloudflare/ai.mjs` and `vendor/openrouter/` | Authenticated AI endpoints, server retrieval/quota and versioned Spanish prompts; no browser secret or model-driven level writes |
| `src/components/ExerciseIllustration.tsx` | Eight decorative SVG compositions for game introductions; not playable stimuli |
| `src/components/HeaderIllustration.tsx` | Typed decorative scene selection for game/menu headers and results |
| `src/components/PlacementPreferences.tsx` and `src/services/placementPreferences.ts` | Two-step interests/functional movement choices and thematic assessment selection; see `docs/PLACEMENT.md` |
| `src/components/GameSession.tsx` | Pre-game instructions, help and active-time clock provider |
| `src/services/gameClock.ts` | Pausable timers and animation frames |
| `src/services/gameSession.ts` | Shared session context and `useGameSession` hook, separate from component exports |
| `src/services/memorySequence.ts` | Memory-round sequence generation, called only on round start |
| `src/components/FittedGameArea.tsx` | Centers the board and action together; scales the board while keeping action touch size, title, progress and navigation intact |
| `src/components/ExerciseWrapper.tsx` | Task clues, completion, results and repeat |
| `src/games/` | Individual game interactions and result creation |
| `src/components/ModalFrame.tsx` | Native dialog, focus handling, dismissal, scroll lock |
| `src/services/storageService.ts` | Account-scoped cache/outbox, legacy local operations and daily plan |
| `src/services/progressData.ts` | Pure cloud progress reducer and patient-only import sanitation |
| `src/services/progressSync.ts` | Durable operation queue, local settings overlay, retries and session cancellation |
| `src/services/appearance.ts` | Applies restored and live appearance settings before paint |
| `src/services/firestoreProgress.ts` | Firestore transactions, retry receipts and live updates |
| `src/services/progressSnapshot.ts` | Orders server snapshots by timestamp to reject delayed older data |
| `src/components/CloudProgress.tsx`, `ProgressSaveNotice.tsx` | Cloud loading, import choice and dismissible pending-save notification |
| `src/services/soundService.ts` and `speechVoice.ts` | Shared audio, narrator controls, and Spain-voice selection |
| `src/services/achievements.ts` | Cumulative achievement conditions |
| `src/components/AchievementShowcase.tsx` | Badge collection and details; twenty Lucide emblems mapped to stable achievement artwork indices |
| `src/components/TherapistReport.tsx` | Professional guidance, notes, history, and print view |
| `src/components/WellnessGlyph.tsx` | Distinct catalog illustrations for each game |
| `src/components/GameObject.tsx` and `src/services/gameArtwork.json` | Shared game stimuli: `illustratedArtwork.json` maps active objects to transparent atlases with measured crops in `illustratedAtlasBounds.json`; standalone table/towel/soup assets and legacy atlas fallback remain supported |
| `src/components/PaperTarget.tsx` | Illustrated motor-game tokens |
| `public/brand/` and `public/images/` | Brand marks and paper illustrations; provenance in `docs/assets/` |

Navigation currently uses React state, not a routing library. Do not introduce a
router or change persistence solely to implement a visual adjustment.

### Stylesheet ownership

`src/services/viewport.ts` measures a panel's document offset and expresses its
remaining height with CSS `100dvh`, matching the document root. Avoid mixing
fixed JavaScript viewport heights with dynamic CSS heights.
`Dashboard` observes the Header navigation slot to reserve its actual height,
including enlarged labels and the bottom safe area. Interface fixtures
include the real app/main shell; check page overflow as well as board bounds
after resizing and returning home, while preserving scroll for long content.

`src/main.tsx` imports styles in this order:

1. `src/index.css`: base styles, accessibility themes, and legacy game rules.
2. `src/interface.css`: home, catalog, collection, modals, therapist view, and tokens.
3. `src/games.css`: current shared game presentation and responsive layouts.

Inspect computed styles when a rule appears ineffective. Legacy selectors and
`!important` declarations can override newer rules. Prefer correcting or removing
the conflicting rule to accumulating duplicate overrides. Scope game changes so
they do not unexpectedly restyle the home or professional panel.

## Local development and checks

Use the package manager and lockfile already in the repository. Current commands:

```sh
npm ci
npm run dev
npm run build
npm run lint
npm test
npm run test:placement # isolated interest-onboarding browser checks
npm run test:firestore
npm ci --prefix vendor/firebase/functions # when backend dependencies are needed
npm run test:onboarding
npm run test:auth
git diff --check
```

Install dependencies when needed, not on every turn. Vite normally serves on port
5173; inspect its output for the actual address and reuse a running preview when
available. `npm run build` runs TypeScript and the production build.
`npm run lint` runs Oxlint.

### GitHub Pages

The optional local production frontend uses `docker/Dockerfile` and
`docker/compose.yml`: run `docker compose -f docker/compose.yml up --build -d`
from the repository root. Node 22 builds static assets and Nginx serves them on
localhost:5173; Firebase and the Worker stay external. `.dockerignore` allowlists
build inputs. Pass only public Vite settings as build arguments, never secrets.
See `docs/DEPLOYMENT.md` for configuration and shutdown.

The target production URL is `https://neuroia.es/`; Vite development remains on
`http://localhost:5173/`. See `docs/DEPLOYMENT.md` for DNS, Firebase authorization,
Pages rebuilds and Worker payment returns. `APP_URL` is server-owned; HTTP
returns are accepted only for `localhost:5173` with `STRIPE_MODE=test`.

`.github/workflows/deploy.yml` builds and deploys every push to `main` using Node
22 and `npm ci`. Set the repository's Pages source to **GitHub Actions** before
its first run. The workflow reads public repository variables `VITE_BILLING_API_URL` and
`VITE_STRIPE_ENABLED` for the Cloudflare billing integration; secrets live only in
Worker bindings. The workflow passes the Pages base path to Vite, supporting both
repository subpaths and custom domains. Runtime references to public assets must
use `import.meta.env.BASE_URL`; Vite handles URLs in CSS and HTML during build.
To verify a repository deployment locally, run
`npm run build -- --base /NeuroIA/` and
`npm run preview -- --base /NeuroIA/`, then open `/NeuroIA/`.

### Tooling and merge checks

`package.json` intentionally exposes the commands above rather than `check*`
aliases. CONTRIBUTING.md lists the actual required checks, including combined
Firestore adapter/rules and Worker REST coverage. Focused unit tests require
Node 22+; the demo Firestore emulator requires Java 21+ and Firebase CLI 15.30.1.
No Biome/Knip formatter or dead-code check is configured. The current lint baseline
has no warnings. `npm run lint` may exit zero with warnings; use
`npm run lint -- --deny-warnings` for the zero-warning merge gate. Report actual
results and keep unresolved warnings in docs/TODO.md. This is not an exemption
from merge requirements.

### Verify what changed

- For UI changes, inspect real screenshots, not just compilation. Check a narrow
  phone, a tablet, and desktop; 390, 820, and 1280 px are useful starting widths.
- For game layout or imagery changes, check instructions, stimulus identity,
  answer states, the next action, completion, and the way back. Exercise actual
  input paths affected by the change, including touch or keyboard where relevant.
- For moving or repositioned targets, verify the complete hit area stays inside
  the arena at narrow widths. Preserve clear active/contact feedback.
- For dialogs, check centering, content overflow, Escape, keyboard focus, and
  focus return to the opener. Reuse `ModalFrame`.
- For settings-related changes, check large text, contrast modes, sound and speech
  independently, and reduced-motion behavior as applicable.
- Add focused automated coverage when changing behavior warrants it. Avoid tests
  that merely repeat a stylesheet value. State any remaining verification gaps.

Use isolated browser contexts or disposable profiles for test completions and
therapist edits. Do not alter the user's saved progress to manufacture a preview.
Do not commit test screenshots, browser logs, generated build output, or temporary
files. Commit the application assets actually used by the UI.

## Data and interaction contracts

On `propuesta`, `sessionEvidence.ts` defines versioned active-clock response and
four-channel feature chunks. The `evidence` ProgressSync operation uses the same
durable queue/receipt protocol and archives immutable bounded chunks under
`users/{uid}/evidence/{encodedOperationId}`; it never grows `progress/main` or
increments completed-exercise totals. Rules bound the JSON envelope; readers
must use `readEvidenceChunk` and treat values as self-reported. New rules require
emulator verification and separate publication before enabling collection.
`VITE_PROPOSAL_EVIDENCE=true` enables the GameSession provider; leave it unset
until those rules are published. Response hooks cover all eight games; memory
previews suspend the response opportunity, pair selections precede correctness,
and tracking records active contact windows. Result links use optional
`evidenceSessionId`. Fresh four-channel snapshots are archived only while recording,
at most once per active second.
`evidenceSummary.ts` validates contiguous session events across chunks before
exposing metrics; invalid logs and unfinished attempts never count as completions.
`adaptationObservation.ts` derives bounded recent response/contact observations and
independent baseline-relative spectral features. `adaptivePolicy.ts` runs the
versioned PPO actor exported from `scripts/adaptation/train.py`; its current model
is trained on simulation and has not passed real-user acceptance. A separate
`VITE_PROPOSAL_ADAPTATION=true` flag (also requiring evidence collection) enables
end-of-exercise decisions. `difficulty.ts` applies verified decisions only against
the same current base level and excludes professional assignments. The reducer
returns the normalized result as well as bounded progress so the immutable archive
retains application outcome even when an old result falls outside the latest 60.
Never replace the model silently or present simulated evaluation as pilot evidence;
reproduction, independent parity and activation gates are in docs/PROPOSAL.md.
`evidenceArchive.ts` paginates evidence/results from the server with cancellation;
`evidenceExport.ts` omits account/session/result IDs, wall timestamps and free text.
`EvidenceExportButton` exposes the complete evaluation download from Historial
only behind the proposal flag. Page failures never download a partial export;
pagination is not an atomic snapshot and the file discloses that limit.

Firestore is authoritative for signed-in progress. `users/{uid}/progress/main`
contains the profile and latest 60 results; `users/{uid}/results/{resultId}` retains
new completed results and `users/{uid}/operations/{operationId}` holds permanent
retry receipts. Legacy keys are `neuroia_profile_v1` and `neuroia_history_v1`;
authenticated browser caches append `:<encoded Firebase UID>` to each key.
`neuroia_outbox_v1:<encoded UID>:<encoded operation ID>` stores pending work;
`neuroia_local_backup_v1:<encoded UID>` preserves the pre-cloud account cache.
Existing unscoped data is preserved and never imported automatically.
Settings expose text size, the Cozy style (`contrast: standard`) and a subscription
section (`SubscriptionSettings`) using the existing access service and Stripe portal.
Legacy speech, hand-position and contrast values remain compatible; their controls
are hidden. Audio and MuseJS attribution are in “Aviso legal”, under “Licencias”.
Narrator preference remains device-wide and managed by the sound service. Preserve compatibility with existing profiles and history. `leftSideAnchor` is
a legacy persisted setting, defaults to false, and is neither rendered nor
configurable; keep the field for compatibility without restoring its visual guide. Use
`StorageService` for app writes rather than scattering direct localStorage calls.

`totalSessions` currently counts completed exercises, not completed daily plans.
`totalMinutes` accumulates rounded exercise durations with a one-minute minimum.
Legacy `score` and `totalScore` fields still exist for compatibility even though
points are not shown as the reward system. Do not silently reinterpret or remove
these fields during a UI refactor.

Achievements derive from cumulative saved activity. Keep earned milestones stable
across inactive days. A deliberate progress reset is a different operation.
Keep IDs and artwork mappings stable unless a migration is part of the task.

When touching game behavior, preserve answer keys, sequencing, difficulty,
result creation, and the daily-plan callback contract. Clean up timers, animation
frames, and listeners. Prefer native buttons for keyboard-operable actions and
avoid changing hit areas unintentionally when replacing artwork.

## Visual assets

Follow the asset workflow and visual constraints in [DESIGN.md](docs/DESIGN.md).
Inspect the actual approved reference before generating replacements. The paper
mascots are raster illustrations; thin vector approximations are not equivalent.
Keep generated assets in `public/images/` and keep their prompt, tool, reference,
and sheet layout documented under the matching directory in `docs/assets/`. Do not reference temporary generator
paths from application code. Check every sprite-to-object mapping, especially
when the image itself is a question or a target.

Track incomplete deliverables in [TODO.md](docs/TODO.md), including the exact pending
voice clips and the unresolved object-naming report. Keep it synchronized when
resuming or completing those tasks.

## Prerecorded voice evaluation

The shared narrator prefers prerecorded audio and falls back to Spain browser
speech for missing clips or playback errors. Runtime assets are in `public/audio/elevenlabs-v3/`; `docs/assets/audio/elevenlabs-v3/README.md` records the approved voice/model,
license, generation settings, and how to resume without duplicate credit usage.
`scripts/collect_speech_texts.cjs` inventories literal and dynamic speech texts.
`scripts/index_elevenlabs_v3.py` validates downloaded recordings and extracts
individual word clips only when pause segmentation matches the expected count.
It requires Python, NumPy, and soundfile. Keep original word-list recordings,
text mappings, and pending/ambiguous statuses. Do not treat metadata validation
as a pronunciation check. The free-plan recordings require attribution and
are not licensed for commercial release. `src/services/narrationPlayer.ts` owns
playback, cancellation and single completion; `speechRecordings.json` is the
compact text-to-file lookup regenerated by the indexer. Preserve missing-text
fallback. SoundToggle now controls the master mute for both narration and effects;
each page load starts muted until explicit activation. Asset URLs use the Vite base.
Run `node --experimental-strip-types --test tests/narrationPlayer.test.ts` for
playback behavior, alongside voice-selection and game-clock tests.

## Keeping this guide alive

Update this file in the same change whenever commands, architecture, persistence,
verification practices, or the code map change. Update docs/DESIGN.md whenever visual
rules, navigation placement, assets, or interaction patterns change. When both are
affected, update both. Replace obsolete guidance rather than appending a second,
conflicting rule. Keep implementation details here and visual intent in docs/DESIGN.md;
link between them instead of duplicating long explanations.

Before finishing, check whether the next contributor could follow these files
without relying on the conversation history. Do not add a chronological task log
or promise an automated documentation monitor that does not exist.

Games import `useGameSession` from `src/services/gameSession.ts` and use its
`clock` for durations, timeouts, intervals and animation frames. Initialize decks
and question sets with lazy state, and reset answers in the next/restart handlers.
State updater functions must remain pure: do not mutate existing card objects,
schedule work or save results from an updater. Timer effects own their cleanup;
frame callbacks read committed state and stop after a single completion. Help pauses scheduled activity without discarding answers. GameSession
mounts ordinary games only after Start (placement uses autoStart) and is keyed by exercise and daily-plan position.
Run `node --experimental-strip-types --test tests/gameClock.test.ts` to verify
the clock, alongside the existing speech-voice tests.

## Firebase entry and orientation

`App` observes Firebase Authentication before mounting the cloud progress boundary.
Configuration and session persistence are in `src/services/firebase.ts`; Analytics
is not loaded. `LoginScreen` offers Google popup and email/password sign-in,
registration and recovery with recoverable Spanish errors. Its local
personal/professional switch passes the selected intent through either sign-in
callback and persists it before email verification so reload retains the workspace.
`EmailVerification` precedes both workspaces for unverified password accounts;
registration sends one verification email immediately after account creation; restored sessions never auto-send. Delivery failure preserves the account and offers Reenviar. Verification polls every 10 seconds while visible and online, also on focus/reconnect, with cleanup and account-identity guards. Unverified background checks stay silent; verified checks refresh the ID token before automatic entry. Manual checking remains available.
Firestore rules and the Worker require `email_verified` for password-provider tokens;
publish those changes before enabling Email/Password in the real project.
Google access retains its existing behavior. Settings reuse `AccountPassword`
to add a password to the current account with Firebase `updatePassword`, retaining
email, UID, progress and Google access; reload provider data afterward. Firebase
requires recent authentication, with explicit Google reauthentication when needed.
Never merge accounts by matching email strings or store passwords in app storage.
Recovery/verification links use Firebase's hosted action handler, not app query routing.
`AccountEntry` honors explicit player/professional login. Restored sessions use
`StorageService.readProfessionalEntry`, stored per UID under `neuroia_entry_v1`;
older sessions default to player. Checkout return parameters select their
workspace only when there is no explicit login intent. This device preference
grants no permissions and never changes progress or subscriptions. There is no
profile selector; users sign out to choose the other login.
Player entry does not depend on professional reads. Professional settings reuse
CloudProgress and its durable settings operations for account-wide name and
appearance; the shared modal hides personal subscription controls.
`ProductInformation` provides the switch through its optional children slot.
The user has confirmed Google login. Firebase persists authentication across browser restarts using IndexedDB, with
localStorage, sessionStorage and in-memory fallbacks. Explicit logout clears the
auth session from Settings only in the active workspace. Entry and
recovery screens retain their logout exits. After Firebase restores the UID, cached appearance is applied from
that account before cloud loading; cached identity never grants access. `StorageService.setAccount` is set by the auth observer; cache
and pending writes are scoped to the UID. Auth changes unmount the old boundary,
unsubscribe listeners, and prevent late callbacks from touching the next account.

`AccessGate` is lazy loaded after authentication and validates server-owned access through the authenticated Worker `/access` endpoint before mounting `CloudProgress`. Its server-time confirmation lasts at most 60 seconds, capped by expiry, with 30-second refresh; failure, offline or an expired lease blocks play and stops its clock through `AccessSuspendedContext`. Visibility return refreshes in the background while the existing server lease remains valid; focus/blur never invalidate it. Actual recovery keeps the board mounted and visible but inert beneath AccessGate's connection dialog. GameSession has no pause/recovery dialog or recovery ownership context. Confirmed denied access unmounts it; cached access never grants play. The Worker API URL is required independently of the purchase feature flag. See [ONBOARDING.md](docs/ONBOARDING.md) for setup, provisioning and billing tests. `CloudProgress` is lazy loaded after access approval. It loads from the server
before mounting games; an inaccessible/offline initial load shows retry/logout,
never an empty replacement profile. First cloud initialization offers an explicit
import of account-local activity or the older unscoped profile when present.
Import keeps aggregate progress and the available latest 60 results, strips demo
clinical fields and uses the signed-in display name. It only creates a missing
cloud document, never overwrites an existing one. Original local data is retained
or backed up. Merging an older local profile into an existing cloud account is
not implemented; retained backups need an explicit future reconciliation flow.

Use `ProgressSync.enqueue` for authenticated result/settings changes. Do not call
legacy `StorageService.addExerciseResult`/`updateSettings` from the signed-in UI.
Transactions apply operations to the latest server state and write permanent
receipts atomically. Results are idempotent by their existing exercise-result ID;
settings patch individual fields, with the last committed same-field change winning
in the backend. `settings.pageStyle` is optional for older profiles: absent means `default`, and
`cozy` explicitly selects the original paper style. Optional `showCompanions`
defaults to true for older profiles; its retired settings control is no longer rendered. The stored value still controls remaining legacy decorative companions via
`applyAppearance` and `data-companions`; exercise stimuli remain visible. It uses the same settings
cache, queue and cloud patch as other preferences; `contrast` remains independent.
Locally edited fields stay pinned in the current `ProgressSync`
session, including after acknowledgment, to prevent server responses or another
device from changing appearance mid-use. Untouched settings and progress continue
to update live. A new session adopts the latest cloud settings and overlays any
persisted pending operations. The existing account cache stores the displayed
settings; no additional settings store is used.
The Firestore adapter orders server reads and listener snapshots by `updatedAt`
(seconds and nanoseconds) per account session. Delayed older snapshots must not
revert a newer confirmed setting or progress state.
Recent profile/domain histories are bounded at 60; cumulative totals remain intact.
There is no automated receipt pruning. The cloud streak changes on completed
activity, not profile reads. Imported historical totals are preserved.

Pending operations are persisted per operation before sending, to avoid one tab
clearing another tab's pending work. If browser storage fails, in-memory work can
still be sent; the pending UI advises keeping the page open. Retry on reconnect,
explicit retry, and every 30 seconds only while work is pending. Initial offline
entry is not supported. Logout preserves pending operations for the same account's
next login. Successful saves and session identity have no top banner. Only pending/failed
saves show a recovery notice. Cloud errors must not be labeled saved. Device-local narrator toggles
are not synced; accessibility settings in the profile are synced.

Professional owners use a free workspace, not the retained therapist component.
Only server-confirmed paid seats and participant redemption create analytics
permissions. Rules allow active linked owners to read participant progress and
results; cross-account writes, clinical fields and retry receipts remain denied.
Self-registration grants only ownership of an empty workspace, not clinical status.
New paid seat codes use `NIA-XXXX-XX` (six unambiguous random characters); legacy UUID codes remain valid. The Worker reserves codes transactionally and limits redemption attempts in server-only `seatRedemptions/{uid}` records. CEOABERTO remains the permanent reusable exception with administrator-only
ownership. See `docs/PROFESSIONALS.md` for seat paths, codes, departure and billing.
Totals remain self-reported, not medically verified. Publish the reviewed rules
and Worker before this frontend; frontend builds deploy neither. See
`docs/AUTHENTICATION.md` and `docs/TODO.md` for remaining release checks.

Portrait and landscape render the same workspace with responsive composition.
There is no orientation gate or orientation-based clock pause. Fullscreen is
explicit and never locks orientation; help, settings and background visibility
still pause the game clock without discarding answers.

`npm test` runs focused unit coverage; `npm run test:firestore` uses project
`demo-neuroia` only and checks isolation, real transactions, idempotency, import
and forbidden writes. Never create fixture users/results in the real project.
Browser verification uses isolated contexts with a test-only identity adapter and
the local Firestore emulator; no authentication bypass ships in application code.

`npm run test:auth` uses the demo-only Auth emulator on 127.0.0.1:9099 to test
registration, verification, reset and same-UID Google/password access. CLI 15.30.1
does not implement password-policy lookup; that one read-only endpoint is stubbed
in tests. Credentials and action codes still use the real emulator. Live email
delivery, project password policy and physical-device OAuth remain release checks.

## Installable web metadata

`public/manifest.webmanifest` defines standalone display, any-orientation preference,
relative start URL/scope/ID and PNG icons for Android/tablets. `index.html` links
the manifest and the 180px Apple touch icon; Vite rewrites their URLs for Pages.
Keep manifest URLs relative so both `/NeuroIA/` and custom-domain roots work.
Installation does not enable offline access: there is no service-worker cache,
and authentication/access/progress still require the existing online checks.
Verify actual installation and Google sign-in on Android and iPad before release.

Account name edits use the existing `settings` progress operation with an optional
`name` field beside the settings patch. The reducer trims and validates 1–200
characters; ProgressSync pins local name edits for the session and replays pending
names on restart. Firestore saves `profile.name` using the existing settings receipt
kind, so no rule deployment is required. Google display name is only used for initial
profile creation/import and is never updated by the settings input.

## Account activity statistics

The `propuesta` branch implements the full memory-alignment workstreams in
`docs/PROPOSAL.md`, tracked in `docs/TODO.md`. Do not report them complete from
synthetic tests. `museFeatures.ts` preserves independent TP9/AF7/AF8/TP10 RMS and
one-second spectral powers; `EegService.channels` is connection-scoped and currently
transient. The legacy aggregate recording remains compatible. Run
`scripts/verify_muse_features.py` with NumPy/SciPy for an independent synthetic
numerical comparison; real physiological interpretation remains a separate gate.

`ActivityStatistics` is embedded in the player dashboard’s Actividad tab, with Resumen (area radar and labelled current-level radar), Gráficas (accuracy, speed and recorded levels), Historial, Filtros and Logros rendering `AchievementShowcase`. `ActivityLineChart` shares focusable series, emphasis and a noninteractive active-series chip across all three time charts; `LevelStatistics` owns the current-level summary. Primary `TabletTabs` navigation uses a portal into Header’s fixed bottom navigation slot; the panels retain their existing React state and ARIA relationships. Header has no separate statistics button. Professional activity keeps its standalone back navigation. Activity surfaces use
the shared `data-style` attribute and palette tokens; no separate theme state.
`activityStats.ts` deduplicates results and computes local-day per-exercise means.
It maps historical result IDs `visual-scan`, `daily-seq` and `motor-coord` to
`visual-scanning`, `daily-sequencing` and `motor-target` in the read-only activity
view, keeping names, filters and chart series consistent without rewriting saved
records. Daily action sequencing is retired from play; its metadata remains in
`activityExercises.ts`. `ExerciseId` covers active games only, while saved result
IDs remain strings. Organization and daily-plan selection use categorization. New game results use the canonical catalog IDs and full ISO completion
timestamps. Historical date-only results retain their recorded calendar day in
activity filters/charts and display no time; never infer midnight as a known
completion time. Full timestamps display in the device timezone.
Speed is seconds per question, not reaction time; exclude zero-question sessions
from speed averages. `activityHistory.ts` reads owner or authorized active-seat result archives in
explicit 200-document pages ordered by document ID. Merge pages with current
cloud history, preserving imported and pending results; disclose partial coverage.
No new writes, authorization rules or progress storage are introduced.

## Game difficulty and placement

`difficulty.ts` owns version-1 per-game rows, placement scoring and bounded adaptation.
`GameSession` freezes the selected level at start and exposes config in session context.
`GameExercise` dispatches the same eight implementations for ordinary and placement play.
`PlacementOnboarding` gates only player Workspace after access/cloud load. It runs
unscored assessment stages, using durable `placement` operations in ProgressSync for each finished game ladder.
`PlacementPreferences` precedes trials. It saves interests and an optional functional
movement preference under `placement.preferences`, using the existing `placement`
operation and receipt kind. `placement.stages` preserves passed ladder stages.
Only chosen games are required for completion; untested games get no fabricated
trial or level. Legacy placement without preferences still requires all eight.
Selective retakes keep original trials and nonselected levels; accepted choices
are stored in `placement.retakePreferences`. See docs/PLACEMENT.md for rules rollout.
`profile.placement` records bounded per-game evidence; optional `profile.gameLevels`
contains provisional levels/evidence until the final trial marks placement complete.
The reducer, adapter and Firestore rules use the existing atomic progress/receipt
transaction; there is no separate local assessment store or result archive for trials.
First committed trials win across devices; imported local placement is discarded.
The local feedback phase can render before its parent progress snapshot contains
the trial. Guard scoring and next-game navigation until that evidence is present;
verify both measured and skipped transitions with delayed profile delivery.

New exercise results carry numeric level/configVersion and optional hint usage.
Adaptation consumes three eligible results at the current recommended level, capped
at one level change in 1–10. Manual different-level play cannot change recommendations.
Tracking remains manual because its input methods are not comparable; actual pointer
contact is checked against the moving circle on every frame. Preserve historical
results and legacy domain levels. Run difficulty/progress tests and the real demo
Firestore adapter/rules suite together when changing these contracts. Publish rules
before frontend release; see docs/TODO.md for calibration and reassessment gaps.

## Professional game proposals

ProfessionalSessions publishes immutable versioned game sequences scoped to
owner/seat/participant. AssignedSessions uses confirmed access from
`accountAccessContext` (provided by AccessGate), never a second entitlement store.
The player keeps a fixed step mounted until explicit Next; GameSession locks level
selection/repeat and pauses its existing clock. Ordinary results use the durable
ProgressSync queue with deterministic assignment/step IDs. After the archived
result exists, firestoreSessions advances the proposal in a separate transaction.
Resume reconciles interrupted advancement; cancellation and revoked access must
not poison the ordinary result outbox. Matching permanent receipts/current steps
resolve simultaneous-device transaction conflicts without accepting unconfirmed
writes. Assigned results do not adapt personal game levels or complete daily plans.
See docs/PROFESSIONALS.md for paths, rules, limits and publication order.

`npm run test:firestore` includes `tests/sessions.rules.test.mjs` sequentially with
the existing rules suite. Keep sequential execution because each suite resets the
same demo project. The Worker REST test honors `FIRESTORE_EMULATOR_HOST`, so an
isolated emulator port can be used when 8080 is occupied. Pure proposal/adaptation checks are in `npm test`. Use isolated
browser fixtures for editor/player checks; never create real account activity.

## Tablet viewport and fullscreen

`TabletTabs` owns accessible tab selection and `TabletPager` bounded collection
navigation. `useViewportPanel` measures the height below surrounding toolbars and
updates on resize; its min-height allows accessibility overflow. `useCompactViewport`
reduces page sizes in short windows. Keep viewport rules in interface.css and
game geometry in games.css; never hide overflow to simulate a fit.
`FullscreenButton` and `services/fullscreen.ts` share explicit entry/exit. No game
start requests fullscreen or orientation lock. Browser rejection must not block play.
Run `npm test` for the fullscreen retry/exit contract; verify actual fullscreen
entry, exit, tabs, pagination and dialog focus in an isolated browser context.

Placement starts GameSession with `autoStart` for its current stage in the selected thematic order.
New ladders stop after at most levels 1 and 4; saved legacy 7/10 stages remain valid.
Welcome and final summary have their own progression actions; game answer boards
use the shared Continuar action. Once saved, advance automatically after the current
trial appears in the parent progress snapshot; do not infer
missing evidence or start the next game before that update. Help and settings
retain silent clock suspension; ordinary games still open instructions.

Classification renders its object-listening button into GameSession’s assistance
slot through a React portal. The slot sits beside manual help on the bottom
navigation row (wrapping directly above it on narrow phones), keeping the current-object narration callback owned by the game. Its button uses the shared `paper-nav-button` style and 20px Volume2 icon. Empty assistance portal slots are hidden to preserve the same spacing as other games.

GameSession shares the viewport header and assistance/navigation footer between
all placement and ordinary games, including daily sessions. Instruction pages reuse
the shared `placement-*` classes with responsive game-specific composition; starting instructions and difficulty selection remain available outside placement. Narration uses the session instruction;
classification supplies current-object narration through the assistance portal.

Object naming and word completion use shared instruction narration without hint or answer-reveal controls. New results preserve the hintsUsed field with a value of zero.

`SoundToggle` shares the sound service subscription across Header and GameSession (instructions and play). Read the current service state on mount instead of copying profile settings into component state; narrator preference stays independent.

Difficulty promotion uses `gameLevels[id].qualifyingRuns` (optional 0/1) through
existing progress transactions. Each game keeps its own timed run; other games
cannot reset it. Old `evidence` is retained for compatibility but does not count
as timed evidence. See `docs/SDD.md` for strict thresholds and exclusions.
`gameObjectPool.ts` owns the 82 shared illustrated identities, vocabulary tiers
and distractor selection. Keep ambiguous generic/specific labels from competing.
Statistics automatically load all archive pages on the chart tab before showing
an unfiltered historical mean. Exercise data lines are solid and distinct colors;
only the global reference line is dashed. Account changes remount the archive view.

`Reassessment` reuses the placement UI with an in-memory draft and an explicit
Guardar niveles action. Its `placement` operation carries a complete `trials` map;
apply it to the latest server profile and replace only `gameLevels`. Preserve the
original placement and all activity. Existing placement receipts protect retries;
do not write all trials and levels together (Firestore expression budget).
`LevelUpScreen` only announces level gains accompanied by new result IDs. The
Nivel activity tab receives `gameLevels` from the current/authorized participant
profile; `levelStatistics.ts` builds dated played-level series from archived results.

`placementAssessment.ts` owns the two-stage (1/4) assessment and legacy 7/10 compatibility. New final trials carry
optional `assessedLevel` (1, 4, 7 or 10; legacy 5 remains valid); trials without it keep the legacy mapping.
PlacementOnboarding randomly interleaves unfinished games after each assessment turn
(single round except motor-target, which uses its full level-specific target count), keeping
independent stage cursors and avoiding immediate repeats. It resets GameSession at
each stage and saves only completed game ladders. Retakes share this flow. No new
normal results or activity counters are created during assessment.
`ConnectionRecovery` shares the login shell for access and initial progress errors;
keep pending-write notices separate and retain retry/logout behavior.

ProfessionalSessions opens SessionAnalytics by selected session ID using React
state. The adapter reads at most eight deterministic result documents across all
proposed steps, including independently completed steps beyond the contiguous
completedCount prefix, under the linked participant; existing active-seat rules enforce access.
sessionAnalytics.ts checks session/owner/seat/step/game/level/version attribution,
deduplicates by step and derives answer-weighted accuracy and summed durations.
Missing results are disclosed, not counted as zero. Async responses are scoped to
the selected session and refresh attempt; no progress writes or new rules are used.

Session edits use firestoreSessions.edit: only assigned sessions can change title,
note and steps. The transaction checks the original draft to reject stale edits;
rules enforce owner-only editing and preserve status, ownership and all result fields.


## Optional EEG and per-exercise analytics

`eegService.ts` owns the replaceable SDK contract, connection state and account
cleanup. Bootstrap installs `museAdapter.ts`, adapted from MIT Respiire/MuseJS;
`museSignal.ts` decodes EEG/infrared PPG and computes one-second AC RMS.
Source provenance is in `vendor/muse/README.md`; the license ships in public/licenses. `EegButton` reuses ModalFrame; opening it
inside GameSession pauses the clock. `eegData.ts` validates a bounded, versioned
signal series. GameSession owns separate live/save buffers for EEG and PPG and samples its
active clock, pausing in background as well as existing pause conditions.
`GameExercise` attaches independent optional `eeg` and `ppg` recordings at completion, before ordinary or
assigned result callbacks enter ProgressSync. Do not save raw EEG or fabricate
mental-state scores. Repeat/abandon/account change must isolate recordings.

`ExerciseAnalytics` is shared by player/professional history and confirmed
professional proposal steps. `EegChart` validates decoded points and preserves
missing-signal gaps. Firestore's optional EEG/PPG metadata/size rules must ship
before deploying the adapter frontend; existing read permissions and permanent retry receipts
apply. See [EEG handoff](docs/eeg/README.md) for the adapter contract, retention,
bounds and hardware acceptance. Tests: `tests/eeg.test.ts`, `tests/muse.test.ts` and the EEG/PPG transaction
case in the demo Firestore rules suite; no production simulated data or users.


## Interest-onboarding verification

`npm run test:placement` runs Playwright on port 5197 against
`tests/placement/index.html`. The fixture mounts real onboarding/game components
with a ProgressSync test backend and fixture-only sessionStorage; it is not imported
by the production entry. Browser requests are restricted to local assets and fonts.
It covers selected areas, optional movement, changing choices, keyboard input,
large text, contrast, delayed parent updates, reload, actual target-stage completion,
skip and retake cancellation. Server persistence and permissions use the real demo
Firestore adapter/rules tests separately; never seed a real account for screenshots.

## Independent design concepts

`design/concepts/index.html` is a development-only review board with three proposed
clinical-blue directions, real tablet-sized iframes and sample-only navigation.
It is not imported by the production entry and never connects to auth, payments
or progress services. Its only application component import is the read-only
`GameObject` illustration renderer. See `docs/DESIGN-CONCEPTS.md` for references,
scope, limits and the selection gate requested by the owner. Do not treat the
prototype or its sample results as implemented production behavior.

## Calma editorial and client-review entry

`Brand` owns the shared transparent wordmark; `PracticeMotif` is CSS decoration,
not a game stimulus. Default appearance uses clinical-blue Calma tokens and Manrope;
`pageStyle: cozy` remains compatible as Papel. See docs/DESIGN.md.
`ProjectFunding` presents the unmodified owner-supplied IGAPE notice, an HTML transcript on the IGAPE information page and About. Provenance lives in
`docs/assets/images/institutional/README.md`.
`LoginScreen` starts on the unauthenticated app home and switches to inline email forms.
`OnboardingModal` retains its existing API but now renders the access-choice page.
`PlanButton` opens existing subscription management before placement and from
Mi cuenta. Billing availability and entitlement checks remain server-owned.
Dashboard passes its displayed exercise queue to the existing daily-plan callback.
Memory sequence failure marks wrong/correct tiles and finishes once on Continuar.
Replay clears partial input without regenerating the sequence and counts a hint.
Pairs require an opening preview; Repetir resets the same board and counts a hint.
Solo pairs aggregate three boards; grouped/placement pairs retain one.

`tests/interface/` is an isolated real-component browser fixture, never imported
by the production entry; it stores results only in React state and blocks external
network in the suite. Run `npm run test:interface` for entry/funding, eight-game
layout, keyboard pairs, trial failure and fullscreen-regression checks. Screenshots
are written to `/tmp`, not committed. `npm run test:placement` checks preference
persistence and delayed evidence with its isolated backend.

`InformationPage` renders IGAPE, About and the legal notice as ordinary pages with
a shared Brand header and a Cerrar action on all three pages. `ProductInformation` is a controlled link list.
LoginScreen, player Workspace and ProfessionalDashboard own the selected
information view in existing React state. The previous screen remains mounted but
hidden; Settings temporarily closes its native dialog and retains its selected tab.
GameSession remains paused while Settings owns that navigation. No router, history
rewrite or new persistence is introduced.

PlacementPreferences now has three steps; ConditionPreferences owns optional
bounded health-context choices and invitation-only sharing consent. `PlacementPreferences.condition`
is optional, validated identically by the reducer and Firestore rules, and never
influences `placementExercises` or difficulty. The existing progress authorization
means an active linked professional can read it; disclose that before saving. Do
not reuse legacy strokeDate/affectedSide fields or accept free-text diagnoses.
ProgressSaveNotice retains pending data and retries after dismissal; its continue
action never bypasses initial cloud loading or server-confirmed access.

`src/services/sessionProgress.ts` owns stage weights and bounded progress aggregation.
`GameSession.progressScope` carries completed and remaining stages for placement,
daily plans and assigned sessions; `ExerciseWrapper` uses whole rounds/questions,
except solo targets which use successful taps. Solo pairs use three boards. Individual
search objects, matched pairs and contact time do not fill stage segments. Help uses ModalFrame and pauses the existing game clock without
unmounting the board.

LoginScreen keeps the unauthenticated home mounted beneath one ModalFrame for
sign-in, registration and recovery. Closing any mode returns home; mode changes
reset the dialog scroll. Auth errors use a second ModalFrame above the preserved
form. About/legal links are available on the home, not inside the auth modal.


## Account deletion

`DeleteAccount` in Mi cuenta uses the shared ModalFrame and Worker eligibility API.
Confirmation requires `ELIMINAR MI CUENTA` and Firebase reauthentication; no client
batch deletion or local entitlement check can authorize it. `accountLifecycle.mjs`
implements server-only trial identity and resumable deletion jobs, with one-minute
cleanup and separate five-minute billing reconciliation. See the Worker README
for secret/IAM/index/rule deployment order and temporary old-token locks.
`trialUsage` is a keyed verified-email ledger; do not replace it with UID-only
retention. Preserve the original `trialStartedAt` in that ledger: recreated accounts
may resume its remaining seven-day window but never restart or extend it. Unknown
legacy dates fail closed. Personal and professional subscriptions must both be terminal in Stripe.
Keep other participants' own activity when removing a professional workspace.
`StorageService.forgetAccount` clears only the accepted account's device cache and
outbox after sign-out. No production fixture deletion is permitted in tests.
Include `vendor/cloudflare/accountLifecycle.test.mjs` with Worker unit checks; the
combined demo Firestore suite exercises the REST cleanup and deletion write locks.

## Optional activity AI

Read docs/AI.md and vendor/openrouter/README.md before changing inference or reports.
Use `activityInsights.ts` for the browser and Worker metric projection. AI may explain
only the bounded candidates and cite calculated facts; it never writes levels,
results, assignments or clinical notes. `/ai/analyze` retrieves server-owned data
and verifies owner/active reciprocal-seat authorization before and after generation.
Do not accept arbitrary client prompts, models or statistics. Never send account
identity, free text, health context or EEG/PPG to OpenRouter. Recommendations generate automatically on the first daily visit to Resumen; reports
remain explicitly requested. Keep all secrets in Worker bindings. The production configuration sets `AI_ENABLED=true` with Dots3-Note Preview free;
missing credentials or a false flag disable generation.
Reports are direct PDF downloads, not saved cloud documents. The lazy-loaded
`activityReportPdf.ts` uses jsPDF with local embedded Manrope fonts and the supplied
brand logo; fonts and logo use BASE_URL. The PDF includes vector area/level radars, centered metric cards and a square table
with centered numeric columns and no internal identifiers. Export requests cancel
on cancellation or identity/context change; asset failures are recoverable inline. Drafts and requests
are cleared on leaving the overview, changing context or account identity.
The server-only `users/{actorUid}/aiRecommendations/{targetUid}` stores one daily
aggregate analysis per caller/participant, with a transactional generation lease.
Cached reads recheck permissions and the evidence version; filters affect reports but not the daily snapshot.
Recursive account deletion removes it. The server-only `users/{actorUid}/aiUsage/daily` holds bounded counters and is covered
by recursive account deletion; existing rules deny client access. The REST adapter
decodes nested progress values for AI retrieval without changing the billing writes.
Run `node --experimental-strip-types --test vendor/cloudflare/ai.test.mjs` with the
existing Worker suites; npm test includes insight coverage and the combined demo
Firestore suite covers real archive retrieval. Mock provider calls in automated
tests. Real-model Spanish quality, provider configuration and deployment are
separate release checks, tracked in docs/TODO.md.

Game progress uses `exerciseStages` and `ExerciseWrapper.completedStages`: count
whole search boards, naming/completion/classification questions and full memory
sequences. The optional `individual` stage argument enables tap segments for solo
targets and three boards for solo pairs. Grouped pairs/targets and tracking remain
single-stage games. Completion hides progress. All Continue actions occupy the
shared unscaled `nextAction` slot directly below the fitted board. FittedGameArea
measures the board and action as a centered group. Memory playback/repeat and
Continue replace each other in that same slot; do not reserve a second footer action.
Search aggregates all configured rounds into one result. `FittedGameArea` scales
boards only; tracking contact radius must use rendered scale, not raw CSS pixels.
Classification excludes multi-context objects without removing them from naming.

GameSession restarts completed games in place, preserving its selected level even
if the saved profile adapts. It resets its clock and recordings; game restart handlers
reset board state. Ordinary focus changes never require confirmation. Hidden tabs,
help, settings, Muse and access suspension pause the clock; visibility and confirmed
access resume automatically without a second action. There are no pause/resume
controls in ordinary or assigned games. Focus events never trigger recovery. Motor tracking captures pointer
down on the arena and tests contact each frame, including drags beginning outside
the target. Target misses persist as transparent red outlines until restart.

OpenRouter local setup accepts root `.env` `OPENROUTER_API` and `OPENROUTER_MODEL`
through `npm run ai:configure`; secrets are copied only to ignored Worker `.dev.vars`.
The selected Gemma free configuration uses JSON object output with server validation
and an owner-authorized disabled ZDR filter. JSON object mode and ZDR false are
fixed code constants in vendor/openrouter/prompts.mjs, not env options. Never put the key in a Vite variable.
`npm run ai:verify` makes explicit real inference requests with synthetic records
only; it is not a CI test. Test local configuration preservation with
`node --experimental-strip-types --test vendor/openrouter/local-config.test.mjs vendor/openrouter/prompts.test.mjs`. Env setup does not deploy
or activate the remote Worker. See vendor/openrouter/README.md for bindings.

`MuseChannels.tsx` renders independent live electrode features; `MuseHistory.tsx`
loads and validates a complete result-linked evidence session with cancellation.
`museBaseline.ts` shares five-window baseline calculations between live feedback,
archived feedback and policy observations. Live baselines are connection-scoped;
archive/policy baselines use game active time. Keep these meanings distinct.

Report evaluation tooling lives in `scripts/evaluation/`: versioned synthetic cases,
offline-by-default provider runner and hash-bound review/KPI aggregation. See
`vendor/openrouter/README.md` for offline/live commands and measurement definitions.
Do not present mock generation timings or schema checks as factuality or pilot evidence.

`vendor/cloudflare/reportEvidence.mjs` owns the optional server report-attempt ledger
and caller-only paginated read endpoint. `PROPOSAL_REPORT_EVIDENCE` defaults off.
Generated means a server-validated narrative, never a confirmed PDF download or
human-approved report. Client Firestore access is denied; deletion locks guard
writes and every page. See `vendor/cloudflare/README.md` for measurement boundaries.

`CloudProgress` now owns the gated `SessionEvidenceContext` provider for both
workspaces. `reportLifecycle.ts` records client PDF phases via `ProgressOperation`
kind `report`, the existing durable outbox, immutable `reportEvents` and permanent
receipts. Metadata belongs to the caller, not the report subject; never put patient
identity or report text in it. Publish compatible rules before enabling collection.

`reportEvidenceExport.ts` validates report event chains and correlates exact client
request IDs with unique server attempts. `reportEvidenceArchive.ts` reads all client
and server pages before releasing an export. `ReportEvidenceExportButton` uses the
shared `EvidenceDownload` controls; identity and deletion guards remain enforced.
The export belongs to the caller, never a selected participant. Preserve malformed,
unlinked and ambiguous coverage; do not match by wall-clock proximity.

With the proposal evidence flag enabled, `ProgressSync` records result commit
attempts through `save-evidence` operations and immutable `saveEvents`. The same
outbox preserves starts and terminal observations; metadata writes never recursively
instrument themselves. `saveEvidence.ts` validates/deduplicates these events and
reconciles them with archived results in the paginated evaluation export. Failed
transport does not prove a lost result. Preserve the stopped-account guard and
ordinary pending-storage fallback. Publish compatible rules before enabling.

`PracticeCalendar.tsx`, `practiceSchedule.ts`, `practiceScheduleArchive.ts` and
`practiceScheduleService.ts` own prospective personal calendars, their fixed-timezone
elapsed-day adherence calculation and full paginated export. The Worker owns immutable
revisions/current configuration/idempotency receipts; client writes are denied.
The UI uses the proposal evidence flag, while calendar mutations require the separate
server `PROPOSAL_SCHEDULE_ENABLED` flag. Both remain off in production. See
`docs/PROPOSAL.md` for numerator/denominator definitions and independent pilot gates.
Run `vendor/cloudflare/practiceSchedule.test.mjs` with other Worker checks. Billing
transport now accepts an optional cancellation signal and rejects cross-account
responses; preserve those guards when sharing it with calendar requests.

Proposal response analytics use `ResponseMetrics.tsx` and `responseMetrics.ts` in
Actividad → Gráficas behind `VITE_PROPOSAL_EVIDENCE`. The explicit load reuses the
complete validated evidence archive and excludes unlinked, invalid, incomplete and
non-normal attempts. Group by game/level, weight latency by response counts, and
keep tracking contact duration separate. This whole-archive view ignores activity
filters and never replaces the existing duration/questions speed metric. Cancel
on unmount and reject late responses after authenticated account changes.

When the proposal evidence context is present, report generation loads
`reportResponses.ts` before creating the PDF. The optional measured-response appendix
uses the same complete archive/reducer as Gráficas, verifies caller identity, respects
cancellation and fails the download on archive errors. It is a whole-archive appendix,
not filtered activity or LLM input; its copy must disclose that scope. Existing reports
without the evidence context retain the ordinary PDF path.

Pilot registration/adherence reconciliation lives in `scripts/evaluation/pilot.mjs`.
Use the empty `--template` workflow in docs/PROPOSAL.md and observed records only for
real pilot review. `npm test` covers strict KPI boundaries, missing participants,
export hashes, duplicate links and calendar-denominator reconstruction. Outputs use
exclusive creation; codes are pseudonymous, not necessarily anonymous. This CLI
cannot attest observer declarations, infer ambiguous identity-free export matches,
or replace scientific, hardware, report and end-to-end latency acceptance.

Adaptation performance checks separate browser input/local-state/paint-opportunity
measurements (`tests/interface/adaptation-latency.spec.mjs`) from emulator queue/
server-confirmation measurements (`adaptive response pipeline` in Firestore tests).
Their versioned JSON traces live in /tmp and must not be committed. Do not add their
timings together or label either physical-device end-to-end acceptance. For filtered
Firestore runs, verify the named test and trace rather than only exit status. The
verified Node 26 focused command pairs `--test-isolation=none` with
`--test-force-exit`; see docs/PROPOSAL.md. Force-exit alone skipped the selected test
locally. Do not substitute this focused run for the combined rules/REST suite.

AI observation scope is checked by `validObservationScope` inside the shared
`validAiNarrative`: no collective game claims or repeated fact references, and each
named active game needs its own game/recent/speed evidence. These checks do not prove
semantic factuality. Daily recommendation cache reuse also requires the current
prompt version and current narrative validation; failures use existing generation
quotas, never a stale rejected cache. Keep prompt, validator, evaluation regressions
and vendor/openrouter/README.md aligned when changing this contract.

Response-evidence browser verification includes `tests/interface/evidence.spec.mjs`
and `evidence-inputs.spec.mjs`. The latter runs all eight games with keyboard and
emulated touch, checks help pause exclusion and validates reconstructed event links;
it also checks full naming/word-completion/categorization rounds, result linkage and
repeat isolation. This is not coverage of every level or physical tablet input.

`roundAdaptation.ts` is a tested pure controller for pending between-round policy
integration, not yet wired into GameSession. Reuse it when adding explicit round
boundaries; its decision must not mutate an active board. `beginLevel` resets only
performance observation windows, preserving the independent session EEG baseline.
Keep the distinction between local next-round application and server-confirmed
profile writes. See docs/PROPOSAL.md for mixed-level accounting/audit prerequisites.

Evidence reconstruction exposes `levelMeasurements` by actual stimulus level.
ResponseMetrics/PDF use these groups, with `includedSessions` counting distinct
attempts rather than summing per-level row counts. Export `level` remains the initial
level for compatibility. Reject tracking windows spanning a level boundary rather
than estimating contact allocation; round integration must flush them first.

Round evidence uses explicit `round-start`/`round-decision` events. Call
`prepareRoundDecision` before inference to flush partial tracking windows; persisted
actor observations are replayed during reconstruction. Local decision application
remains `pending`; export `nextStarted` only proves that a subsequent round began,
not a cloud profile update. These recorder APIs await GameSession integration.

`roundResult.ts` owns compact mixed-level result metadata (`roundAdaptation`),
separate from legacy single-decision `adaptation`. The reducer normalizes the
single-level field, protects concurrent profile changes and records the transaction
outcome. Full intermediate actor observations remain in evidence events. Export
checks the compact trace against those events before counting registration. The
new result field needs the updated Firestore rules before game integration is enabled.
