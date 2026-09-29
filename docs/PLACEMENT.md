# Interest-based assessment (CR-04)

Implemented on the original-design branch. The locally protected Ahead redesign
archive is unchanged. This flow starts after player access/cloud progress loading,
before any initial assessment game. Completed legacy accounts keep their entry;
professional-only entry is unaffected.

## Mobbin references inspected

| Reference | Observed pattern | NeuroIA use |
| --- | --- | --- |
| [Headspace: what's on your mind](https://mobbin.com/screens/6aba84cc-e359-446c-8cf3-b10cae809456) | One question, labelled options with visible selection, primary Continue below | One question per step, large selectable rows and a distinct forward action |
| [Headspace: previous experience](https://mobbin.com/screens/c180da4c-a544-4c8c-aa74-1e6358f241ea) | Small progress indicator, Back, plain-language radio choices | Two-step indicator, reversible navigation and optional movement choices |
| [Elevate: training goals](https://mobbin.com/screens/43ef6cad-b661-4f3c-8b53-ead77a641031) | Independent goals with explicit selected state | Multiple practice areas without forcing a single goal |

Only interaction patterns informed the implementation. No reference screenshot,
third-party mascot, clinical claim or external copy is shipped. Existing paper
companions, clinical-blue Calma palette and shared game/session/settings systems remain.

## Interaction

1. Choose one or more areas: Atención, Memoria, Lenguaje, Organización,
   Coordinación. Continue is disabled until a choice is made. The explicit
   exploration alternative selects all five areas.
2. Optionally choose normal inputs, taps only, or no preference. Taps-only omits
   the moving-target tracking game from assessment. It does not block its later
   catalog entry or change game mechanics. No diagnosis, affected limb, clinical
   history or free-text health information is collected.
3. Review areas and the actual number of selected games. Start or change choices.
   Work through one area before another, using at most two stages per game (1 then 4). A failed Simon trial ends immediately without a forced replay.
4. Finish when all selected games have a saved final trial. Show measured levels,
   omitted trials and untested games distinctly. Unselected games remain playable
   with the normal level-1 fallback; no measured level is manufactured for them.

Back preserves draft selections within the two-step form. Confirming the form
queues its preferences durably. Draft checkbox changes before confirmation are
not saved. Changing a confirmed selection preserves already saved trials and
stages; a removed area is not silently marked skipped. Adding it again can resume
its evidence. “Rehacer prueba” in Settings → Tu cuenta reopens the last accepted
choices and replaces only selected levels after explicit acceptance. Cancelling
or reloading a retake discards its unsaved draft, preserving saved activity.

## Data and compatibility

All writes use ProgressSync, the existing account outbox and permanent placement
receipts. No new account store or authorization bypass is introduced.

- `placement.preferences`: `{ interests: CognitiveDomain[], movement:
  'unspecified' | 'standard' | 'taps' }`. Interests are unique, nonempty and limited
  to the five supported domains. This is the initial assessment's chosen plan.
- `placement.stages[exerciseId]`: next ladder level (4 for new attempts; legacy 7/10 remain compatible) and the actual last
  passed trial. Only a passed nonempty stage advances; retries cannot regress a
  higher stage or replace a finished trial. Finalizing a game removes its stage.
- `placement.trials`: bounded final evidence for games actually attempted/omitted.
  First committed trial wins. Trials do not add ordinary results, streaks or totals.
- `placement.completed`: selected games have finished trials and valid game levels.
  Profiles without preferences keep the original all-eight completion contract.
- `placement.retakePreferences`: last accepted retake choices. Retakes preserve
  original onboarding trials and only replace selected `gameLevels`; keeping the
  historical trial map also avoids the rules expression limit on eight-game retakes.

A missing game level is not a low measured score. Catalog play uses the existing
level-1 default; the first completed ordinary result can establish a practice level.
Level statistics label absent levels “Sin probar” and omit the connected radar
polygon until all levels exist. No zero-valued missing point is presented as evidence.

Completed legacy users are not forced through this flow. Imports still discard
local placement as before. Pending preferences/stages survive an account-scoped
queue restart. Initial assessment reload resumes the next saved stage; it restarts
only an unfinished attempt, not a passed stage. The parent projection must arrive
before starting the next game, including when saves are delayed. Real cloud errors
remain pending and use the existing recovery notice.


Retake acceptance queues two ordered durable operations: the atomic selected-level
replacement, then the accepted retake preferences. The first keeps the entire
initial placement record unchanged to stay within Firestore's expression budget;
the second keeps game levels unchanged. Each operation has its own permanent
receipt and retry. If the second save is pending, the new levels can already be
saved while the preference change remains in the recovery queue.

## Verification and rollout

- `npm test`: preference validation, thematic selection, partial completion,
  unchanged legacy contracts, stage order/retries, outbox restart and selective retakes.
- `npm run test:placement`: isolated real-component browser flow at 390×844,
  820×1180, 1280×800 and 844×390; keyboard selection, optional movement, enlarged text,
  hidden companions, contrast, delayed projections, reload, skip, cancellation and
  actual target-game stage completion. The fixture URL is
  `/tests/placement/index.html`, excluded from the production entry/build.
- Demo Firestore adapter/rules plus professional-session and Worker REST suites:
  real transactions, cross-device receipts, preference/stage validation, partial
  completion, all-eight retake, forbidden fields and cross-account isolation.
- Build, strict lint and diff checks; rendered screenshots reviewed separately.

Publish the updated Firestore rules **before** deploying this frontend. Existing
production rules do not accept the new fields. This task does not publish rules,
merge, deploy, change entitlements or create real participant activity. Verify the
released flow with the client on their target devices after publication.

CR-05's remaining numeric labels, CR-06's misleading results buttons, CR-07's
sequence retry, CR-08's pairs reveal and CR-09's trial pacing remain separate backlog
items. This change does not claim to resolve those game behaviors. Welcome copy
no longer announces numeric ladder steps, but the internal ladder is unchanged.
