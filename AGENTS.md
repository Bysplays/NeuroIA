# Working on NeuroIA

This is the repository-wide guide for coding agents. Read [DESIGN.md](DESIGN.md)
before changing any interface, interaction, copy, or visual asset. Read
[CONTRIBUTING.md](CONTRIBUTING.md) for branch, commit, and merge conventions.

These documents are living project guidance. Keep them accurate as part of the
change that makes them outdated; do not treat them as a frozen specification.
Explicit user instructions take precedence over this local guidance.

## Product and language

NeuroIA is a Spanish-language cognitive rehabilitation app with nine exercises
across attention, language, memory, organization, and coordination. The app also
includes a daily plan, achievements, accessibility settings, and a therapist view.

Keep patient-facing copy in Spanish. Write project guidance in English. Use short,
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

## Code map

| Location | Responsibility |
| --- | --- |
| `src/App.tsx` | View state, profile refresh, game dispatch, daily-plan progression |
| `src/types/index.ts` | Domain, exercise, profile, result, and settings contracts |
| `src/components/Dashboard.tsx` | Home, entry points to areas and all exercises |
| `src/components/ExerciseCatalog.tsx` | Nine-game catalog and area filters |
| `src/services/exerciseCatalog.ts` | Canonical exercise definitions and short summaries |
| `src/components/HeaderIllustration.tsx` | Typed decorative scene selection for game/menu headers and results |
| `src/components/ExerciseWrapper.tsx` | Shared game navigation, introduction, results, and review |
| `src/games/` | Individual game interactions and result creation |
| `src/components/ModalFrame.tsx` | Native dialog, focus handling, dismissal, scroll lock |
| `src/services/storageService.ts` | Local persistence, progress, settings, notes, daily plan |
| `src/services/soundService.ts` and `speechVoice.ts` | Shared audio, narrator controls, and Spain-voice selection |
| `src/services/achievements.ts` | Cumulative achievement conditions |
| `src/components/AchievementShowcase.tsx` | Standalone badge collection and details |
| `src/components/TherapistReport.tsx` | Professional guidance, notes, history, and print view |
| `src/components/WellnessGlyph.tsx` | Distinct catalog illustrations for each game |
| `src/components/GameObject.tsx` and `src/services/gameArtwork.json` | Sprite rendering and mapping of game stimuli; Organization opts into the transparent atlas with measured crops in `organizationArtwork.json` |
| `src/components/PaperTarget.tsx` | Illustrated motor-game tokens |
| `public/brand/` and `public/images/` | Brand marks, paper illustrations, and asset provenance |

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
git diff --check
```

Install dependencies when needed, not on every turn. Vite normally serves on port
5173; inspect its output for the actual address and reuse a running preview when
available. `npm run build` runs TypeScript and the production build.
`npm run lint` runs Oxlint.

### GitHub Pages

`.github/workflows/deploy.yml` builds and deploys every push to `main` using Node
22 and `npm ci`. Set the repository's Pages source to **GitHub Actions** before
its first run. The workflow passes the Pages base path to Vite, supporting both
repository subpaths and custom domains. Runtime references to public assets must
use `import.meta.env.BASE_URL`; Vite handles URLs in CSS and HTML during build.
To verify a repository deployment locally, run
`npm run build -- --base /app-ictus/` and
`npm run preview -- --base /app-ictus/`, then open `/app-ictus/`.

### Known tooling gap

As of 2026-09-14, `package.json` does not define `check`, `check:test`,
`check:types`, `check:lint`, `check:format`, or `check:deadcode`, although
CONTRIBUTING.md lists them. Voice selection has focused coverage via `node --experimental-strip-types --test tests/speechVoice.test.ts` (Node 22+); there is no aggregate repository test script. Existing game
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

Persistence is local to the browser. The current keys are `neuroia_profile_v1` and
`neuroia_history_v1`; narrator preference is managed separately by the sound
service. Preserve compatibility with existing profiles and history. Use
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

Follow the asset workflow and visual constraints in [DESIGN.md](DESIGN.md).
Inspect the actual approved reference before generating replacements. The paper
mascots are raster illustrations; thin vector approximations are not equivalent.
Keep generated assets in `public/images/` and keep their prompt, tool, reference,
and sheet layout documented beside them. Do not reference temporary generator
paths from application code. Check every sprite-to-object mapping, especially
when the image itself is a question or a target.

## Keeping this guide alive

Update this file in the same change whenever commands, architecture, persistence,
verification practices, or the code map change. Update DESIGN.md whenever visual
rules, navigation placement, assets, or interaction patterns change. When both are
affected, update both. Replace obsolete guidance rather than appending a second,
conflicting rule. Keep implementation details here and visual intent in DESIGN.md;
link between them instead of duplicating long explanations.

Before finishing, check whether the next contributor could follow these files
without relying on the conversation history. Do not add a chronological task log
or promise an automated documentation monitor that does not exist.
