# Working on NeuroIA

This is the repository-wide guide for coding agents. Read [DESIGN.md](docs/DESIGN.md)
before changing any interface, interaction, copy, or visual asset. Read
[CONTRIBUTING.md](CONTRIBUTING.md) for branch, commit, and merge conventions.

These documents are living project guidance. Keep them accurate as part of the
change that makes them outdated; do not treat them as a frozen specification.
Explicit user instructions take precedence over this local guidance.

## Product and language

NeuroIA is a Spanish-language entertainment, training and serious-play app with nine exercises
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
Project guides live in `docs/`, provider documentation beside its integration in `vendor/`, and
asset provenance in `docs/assets/` mirroring the public asset directories.
Cloudflare Workers live in `vendor/cloudflare/`; Firebase rules and the legacy
Functions package live in `vendor/firebase/`; Stripe setup lives in `vendor/stripe/`.
The root `firebase.json` remains the CLI entry point and references these paths.
Application adapters stay in `src/`. Asset files remain in `public/`; paths in documentation prose are repository-relative,
while Markdown links are relative to the document. Keep links current when moving guides.

## Code map

| Location | Responsibility |
| --- | --- |
| `src/components/AppLoading.tsx` | Shared initial loading presentation for auth, access, lazy chunks and progress |
| `src/components/AccessGate.tsx` and `OnboardingModal.tsx` | Mandatory account entry before progress and games |
| `src/services/firestoreAccess.ts` and `accessService.ts` | Spark-compatible entitlement reads, trials and atomic CEOABERTO redemption and invitation departure; see `docs/ONBOARDING.md` |
| `vendor/cloudflare/` | Cloudflare Stripe backend, signed webhooks, daily reconciliation and Firestore REST transactions; see `vendor/cloudflare/README.md` |
| `vendor/firebase/functions/` | Previous Firebase billing backend and administrator-only professional ownership script |
| `src/App.tsx` | View state, profile refresh, game dispatch, daily-plan progression |
| `src/types/index.ts` | Domain, exercise, profile, result, and settings contracts |
| `src/services/productCopy.ts` and `src/components/ProductInformation.tsx` | Supplied public presentation and notice, accessible from login and dashboard |
| `src/components/Dashboard.tsx` | Home, entry points to areas and all exercises |
| `src/components/ExerciseCatalog.tsx` | Nine-game catalog and area filters |
| `src/services/exerciseCatalog.ts` | Canonical exercise definitions and short summaries |
| `src/components/HeaderIllustration.tsx` | Typed decorative scene selection for game/menu headers and results |
| `src/components/GameSession.tsx` | Pre-game instructions, help, pause and active-time clock provider |
| `src/services/gameClock.ts` | Pausable timers and animation frames |
| `src/components/ExerciseWrapper.tsx` | Task clues, completion, results and repeat |
| `src/games/` | Individual game interactions and result creation |
| `src/components/ModalFrame.tsx` | Native dialog, focus handling, dismissal, scroll lock |
| `src/services/storageService.ts` | Account-scoped cache/outbox, legacy local operations and daily plan |
| `src/services/progressData.ts` | Pure cloud progress reducer and patient-only import sanitation |
| `src/services/progressSync.ts` | Durable operation queue, local settings overlay, retries and session cancellation |
| `src/services/appearance.ts` | Applies restored and live appearance settings before paint |
| `src/services/firestoreProgress.ts` | Firestore transactions, retry receipts and live updates |
| `src/services/progressSnapshot.ts` | Orders server snapshots by timestamp to reject delayed older data |
| `src/components/CloudProgress.tsx` | Cloud loading, import choice and save-status boundary |
| `src/services/soundService.ts` and `speechVoice.ts` | Shared audio, narrator controls, and Spain-voice selection |
| `src/services/achievements.ts` | Cumulative achievement conditions |
| `src/components/AchievementShowcase.tsx` | Standalone badge collection and details |
| `src/components/TherapistReport.tsx` | Professional guidance, notes, history, and print view |
| `src/components/WellnessGlyph.tsx` | Distinct catalog illustrations for each game |
| `src/components/GameObject.tsx` and `src/services/gameArtwork.json` | Sprite rendering and mapping of game stimuli; Organization opts into the transparent atlas with measured crops in `organizationArtwork.json` |
| `src/components/PaperTarget.tsx` | Illustrated motor-game tokens |
| `public/brand/` and `public/images/` | Brand marks and paper illustrations; provenance in `docs/assets/` |

Navigation currently uses React state, not a routing library. Do not introduce a
router or change persistence solely to implement a visual adjustment.

### Stylesheet ownership

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
npm run test:firestore
npm ci --prefix vendor/firebase/functions # when backend dependencies are needed
npm run test:onboarding
git diff --check
```

Install dependencies when needed, not on every turn. Vite normally serves on port
5173; inspect its output for the actual address and reuse a running preview when
available. `npm run build` runs TypeScript and the production build.
`npm run lint` runs Oxlint.

### GitHub Pages

`.github/workflows/deploy.yml` builds and deploys every push to `main` using Node
22 and `npm ci`. Set the repository's Pages source to **GitHub Actions** before
its first run. The workflow reads public repository variables `VITE_BILLING_API_URL` and
`VITE_STRIPE_ENABLED` for the Cloudflare billing integration; secrets live only in
Worker bindings. The workflow passes the Pages base path to Vite, supporting both
repository subpaths and custom domains. Runtime references to public assets must
use `import.meta.env.BASE_URL`; Vite handles URLs in CSS and HTML during build.
To verify a repository deployment locally, run
`npm run build -- --base /app-ictus/` and
`npm run preview -- --base /app-ictus/`, then open `/app-ictus/`.

### Known tooling gap

As of 2026-09-14, `package.json` does not define `check`, `check:test`,
`check:types`, `check:lint`, `check:format`, or `check:deadcode`, although
CONTRIBUTING.md lists them. Focused unit tests run through `npm test` (Node 22+). `npm run test:firestore`
runs the real Firestore adapter and rules against the demo-only emulator; it
requires Java 21+ on PATH and downloads Firebase CLI 15.30.1 with npx. Existing game
code also produces React-related lint warnings. Report actual command results;
do not claim that missing checks ran or that a zero exit code means zero warnings.
This documents the gap, not an exemption from the merge requirements. Reconcile
it when tooling is updated, and update this paragraph in the same change.

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
are hidden. Audio attribution is in “Sobre NeuroIA”.
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
fallback and independent narrator/effect toggles. Asset URLs use the Vite base.
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

Games use `useGameSession().clock` for durations, timeouts, intervals and animation
frames. Help pauses scheduled activity without discarding answers. GameSession
mounts games only after Start and is keyed by exercise and daily-plan position.
Run `node --experimental-strip-types --test tests/gameClock.test.ts` to verify
the clock, alongside the existing speech-voice tests.

## Firebase entry and orientation

`App` observes Firebase Authentication before mounting the cloud progress boundary.
Configuration and session persistence are in `src/services/firebase.ts`; Analytics
is not loaded. `LoginScreen` uses Google popup sign-in and recoverable error copy.
The user has confirmed Google login. Firebase persists authentication across browser restarts using IndexedDB, with
localStorage, sessionStorage and in-memory fallbacks. Explicit logout clears the
auth session through the bottom of Settings (not the home header). Entry and
recovery screens retain their logout exits. After Firebase restores the UID, cached appearance is applied from
that account before cloud loading; cached identity never grants access. `StorageService.setAccount` is set by the auth observer; cache
and pending writes are scoped to the UID. Auth changes unmount the old boundary,
unsubscribe listeners, and prevent late callbacks from touching the next account.

`AccessGate` is lazy loaded after authentication and validates server-owned access directly in Firestore before mounting `CloudProgress`. See [ONBOARDING.md](docs/ONBOARDING.md) for setup, provisioning and billing tests. `CloudProgress` is lazy loaded after access approval. It loads from the server
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
defaults to true for older profiles and controls the decorative companion family throughout the interface via
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

Professional navigation remains unavailable pending verified roles and care links.
The retained therapist component is not wired to cloud mutations. Current rules
allow only the owner's patient progress, append-only results and immutable retry
receipts; all client role, cross-account, clinical and delete paths stay denied. Strict Firestore rules allow only the permanent CEOABERTO invitation, the reserved unclaimed CeoAberto profile and reciprocal owner-specific care links; owners may atomically revoke their invitation and delete their matching care link; ownership changes remain admin-only and no clinical access is granted. Totals
are self-reported client data, not medically verified records. Publish the exact
reviewed `vendor/firebase/firestore.rules` before using the real project. No rules are deployed
by a frontend build. See `docs/AUTHENTICATION.md` and `docs/TODO.md`.

`LandscapeGate` uses the portrait viewport media query and `ModalFrame`. Its
context in `src/services/orientation.ts` pauses `GameSession` and the workspace
fatigue timer without discarding answers. Locking is attempted only from an
explicit fullscreen button, with a manual-rotation fallback.

`npm test` runs focused unit coverage; `npm run test:firestore` uses project
`demo-neuroia` only and checks isolation, real transactions, idempotency, import
and forbidden writes. Never create fixture users/results in the real project.
Browser verification uses isolated contexts with a test-only identity adapter and
the local Firestore emulator; no authentication bypass ships in application code.

## Installable web metadata

`public/manifest.webmanifest` defines standalone display, landscape preference,
relative start URL/scope/ID and PNG icons for Android/tablets. `index.html` links
the manifest and the 180px Apple touch icon; Vite rewrites their URLs for Pages.
Keep manifest URLs relative so both `/app-ictus/` and custom-domain roots work.
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

`ActivityStatistics` is a React-state workspace view opened from Header.
`activityStats.ts` deduplicates results and computes local-day per-exercise means.
It maps historical result IDs `visual-scan`, `daily-seq` and `motor-coord` to
`visual-scanning`, `daily-sequencing` and `motor-target` in the read-only activity
view, keeping names, filters and chart series consistent without rewriting saved
records. New game results use the canonical catalog IDs.
Speed is seconds per question, not reaction time; exclude zero-question sessions
from speed averages. `activityHistory.ts` reads owner-only result archives in
explicit 200-document pages ordered by document ID. Merge pages with current
cloud history, preserving imported and pending results; disclose partial coverage.
No new writes, authorization rules or progress storage are introduced.
