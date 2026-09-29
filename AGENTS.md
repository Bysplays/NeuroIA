# Working on NeuroIA

## Locally protected design archive

The owner archived `codex/neuroia-ahead-redesign` on 2026-09-29. Preserve this
branch and the `archive/neuroia-ahead-redesign-2026-09-29` tag. Do not commit,
reset, rebase, force-update or delete either reference without an explicit new
instruction to reopen or remove this archive. New experiments must start on a
separate branch. A local Git reference-transaction hook enforces this protection
in the shared Git directory; its maintenance notes are in
`.git/info/neuroia-protected-design.md` (resolved against the common Git directory).
This is a local archive, not a remote branch-protection rule or a published backup.


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
| `src/components/ProfessionalSessions.tsx`, `AssignedSessions.tsx`, `src/services/assignedSessions.ts` and `firestoreSessions.ts` | Immutable professional game proposals, per-step result reconciliation and participant play; see `docs/PROFESSIONALS.md` |
| `src/components/AccessGate.tsx` and `OnboardingModal.tsx` | Personal account entry before progress and games |
| `src/services/firestoreAccess.ts` and `accessService.ts` | Spark-compatible entitlement reads, trials and atomic CEOABERTO redemption and invitation departure; see `docs/ONBOARDING.md` |
| `vendor/cloudflare/` | Cloudflare Stripe backend, signed webhooks, daily reconciliation and Firestore REST transactions; see `vendor/cloudflare/README.md` |
| `vendor/firebase/functions/` | Previous Firebase billing backend and administrator-only professional ownership script |
| `src/App.tsx` | View state, profile refresh, game dispatch, daily-plan progression |
| `src/types/index.ts` | Domain, exercise, profile, result, and settings contracts |
| `src/services/productCopy.ts` and `src/components/ProductInformation.tsx` | Supplied public presentation and notice, accessible from login and dashboard |
| `src/components/Dashboard.tsx` | Home, entry points to areas and all exercises |
| `src/components/ExerciseCatalog.tsx` | Eight-game catalog and area filters |
| `src/services/exerciseCatalog.ts` | Eight active exercise definitions and short summaries |
| `src/services/activityExercises.ts` | Historical names and stable chart styles, including retired daily sequencing |
| `src/components/HeaderIllustration.tsx` | Typed decorative scene selection for game/menu headers and results |
| `src/components/PlacementPreferences.tsx` and `src/services/placementPreferences.ts` | Two-step interests/functional movement choices and thematic assessment selection; see `docs/PLACEMENT.md` |
| `src/components/GameSession.tsx` | Pre-game instructions, help, pause and active-time clock provider |
| `src/services/gameClock.ts` | Pausable timers and animation frames |
| `src/services/gameSession.ts` | Shared session context and `useGameSession` hook, separate from component exports |
| `src/services/memorySequence.ts` | Memory-round sequence generation, called only on round start |
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
| `src/components/AchievementShowcase.tsx` | Standalone badge collection and details |
| `src/components/TherapistReport.tsx` | Professional guidance, notes, history, and print view |
| `src/components/WellnessGlyph.tsx` | Distinct catalog illustrations for each game |
| `src/components/GameObject.tsx` and `src/services/gameArtwork.json` | Shared game stimuli: `illustratedArtwork.json` maps active objects to transparent atlases with measured crops in `illustratedAtlasBounds.json`; standalone table/towel/soup assets and legacy atlas fallback remain supported |
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
auth session from the visible home header, Mi cuenta or Settings. Entry and
recovery screens retain their logout exits. After Firebase restores the UID, cached appearance is applied from
that account before cloud loading; cached identity never grants access. `StorageService.setAccount` is set by the auth observer; cache
and pending writes are scoped to the UID. Auth changes unmount the old boundary,
unsubscribe listeners, and prevent late callbacks from touching the next account.

`AccessGate` is lazy loaded after authentication and validates server-owned access through the authenticated Worker `/access` endpoint before mounting `CloudProgress`. Its server-time confirmation lasts at most 60 seconds, capped by expiry, with 30-second refresh; failure, offline or unconfirmed resume closes play. The Worker API URL is required independently of the purchase feature flag. See [ONBOARDING.md](docs/ONBOARDING.md) for setup, provisioning and billing tests. `CloudProgress` is lazy loaded after access approval. It loads from the server
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

`ActivityStatistics` is embedded in the player dashboard’s Actividad tab, with an additional Logros tab rendering `AchievementShowcase`. Primary `TabletTabs` navigation uses a portal into Header’s fixed bottom navigation slot; the panels retain their existing React state and ARIA relationships. Header has no separate statistics button. Professional activity keeps its standalone back navigation. Activity surfaces use
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
Only the welcome and final level summary require progression buttons. Advance
after the current trial appears in the parent progress snapshot; do not infer
missing evidence or start the next game before that update. Manual help and pause
retain their existing clock behavior; ordinary games still open instructions.

Classification renders its object-listening button into GameSession’s assistance
slot through a React portal. The slot sits beside manual help on the bottom
navigation row (wrapping directly above it on narrow phones), keeping the current-object narration callback owned by the game.

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
state. The adapter reads at most eight deterministic result documents for confirmed
steps under the linked participant; existing active-seat rules enforce access.
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
`GameSession.feedback` owns brief non-blocking correct-answer status using its
pausable timer. Assessment failure in Simon finishes once; ordinary replay remains.
Pairs start face down; voluntary preview remains a counted hint.

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
daily plans and assigned sessions; `ExerciseWrapper` derives progress from whole-level completion. Individual
objects, answers, pairs and contact time must not fill stage segments. Help uses ModalFrame and pauses the existing game clock without
unmounting the board.
