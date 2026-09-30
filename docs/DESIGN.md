# NeuroIA design guide

**A — Calma editorial** is the owner-approved direction. The comparison board in
[DESIGN-CONCEPTS.md](DESIGN-CONCEPTS.md) remains a reference; B and C are archived
alternatives, not additional application themes. This guide describes the implemented
visual system. See [AGENTS.md](../AGENTS.md) for architecture and checks and
[TODO.md](TODO.md) for release gaps. Guidance is English; product copy is Spanish.

## Purpose and tone

NeuroIA is entertainment, training and serious play. Follow [CONTENT.md](CONTENT.md)
for supplied public wording. Explain what a game asks the player to do without
medical efficacy claims, pressure or competition. Use short, adult Spanish and
concrete actions. Distinguish real completed activity, provisional starting levels,
omitted trials and games not yet tried. Never manufacture personal progress.

The visual references are Kit's restrained hierarchy, Ahead's approachable guided
choices and Brilliant's focused activity presentation. The inspected Mobbin links
are recorded in DESIGN-CONCEPTS.md. Reference patterns, not their branded assets.

## Color, type and surfaces

The persisted `pageStyle: default` now means **Calma**; `cozy` remains the compatible
**Papel** alternative. Keep the existing profile settings, independent contrast modes
and hide-companions preference. Do not reset a user's appearance to introduce a design.

| Role | Calma value |
| --- | --- |
| Page | `#F3F8FB` |
| Surface | `#FFFFFF` |
| Pale blue panel | `#DCECF7` |
| Supporting blue / subtle border | `#B8D8EC` |
| Primary action | `#276A93` |
| Hover action | `#1D5376` |
| Main ink | `#173B55` |
| Secondary text | `#566F81` |

Use semantic tokens in `src/interface.css`, not independent component palettes.
Contrast themes override surfaces and ink. Preserve stimulus colors. Activity charts
use one stable blue/teal/slate color per exercise across all metrics and legends. Use explicit text,
icons and borders for selection and answer feedback, not color alone.

Manrope is the interface family with a system sans-serif fallback. Headings have
compact line height and moderate weight, body copy comfortable line spacing.
Keep type in rem so normal, large (118%) and very large (135%) settings work.
Controls target 48 px or more, primary actions 54–56 px. Do not disable browser zoom.
Native dropdowns share a global surface, border, text and CSS chevron, with explicit
WebKit appearance reset and room for the arrow. Keep their native keyboard and
mobile picker behavior; the expanded options use the platform picker. Use at least
16px text in dropdowns to prevent focus zoom on iOS. Forced colors restores the
platform arrow. Individual forms may adjust layout but must not reset the shared arrow.
Use a restrained 2 px primary-color focus outline: 2 px offset for actions, flush
with the border for fields. Apply focus-visible rather than outlining every pointer
click; interest cards highlight only keyboard-visible input focus. Preserve contrast
and keyboard focus indication in all themes instead of removing outlines.
Prevent accidental mouse/touch text selection in app chrome, buttons, tabs and game
surfaces. Preserve selection in inputs, textareas, editable content, code and public
information documents. Use `data-selectable="true"` for additional copyable content;
never prevent pointer defaults globally or interfere with keyboard editing.

Use flat opaque panels, approximately 24 px corners, 16–24 px internal gaps and
24–40 px major spacing. Shadows are reserved for floating navigation and brief
feedback. Avoid translucent glass, dark full-screen presentation, ornamental borders
and repetitive centered modal steps. Most entry and instruction screens are pages.

## Brand and illustration

`Brand` combines the existing supplied mark with a restrained Manrope wordmark.
It is transparent against the page. Preserve the source in `public/brand/`; do not
reconstruct institutional or brand logos with generated artwork.

`PracticeMotif` draws two abstract blue cards using CSS for public entry and the
featured daily activity. It is decorative and hidden from accessibility APIs. It
never substitutes for an object the player must identify. Existing paper companions,
header illustrations remain available in their supporting
roles; hiding companions never hides question stimuli.

The game-object recipe below remains authoritative. Preserve answer keys, object
identities, full silhouettes and atlas mappings during all interface work.

## Navigation and home

The player workspace has persistent **bottom navigation**: Hoy, Juegos, optionally
Para ti, Actividad and Mi cuenta. Reuse `TabletTabs`, its ARIA relationships and
keyboard navigation, through the existing Header portal. Keep generous bottom
content clearance and safe-area spacing so the final action remains reachable.
The header contains the brand, labelled Muse connection, sound and settings.
Player and professional headers use the same Settings gear icon.
Sign-out is available only inside Settings in the active workspace. Mi cuenta
uses icon-led action cards for settings, activity, achievements and access, with
no profile illustration or duplicate sign-out. Activity uses equal-width top tabs
that fill the whole row at every viewport, with wrapping labels at large text sizes, and the
same white, softly bordered cards as home. Achievements use twenty distinct blue
Lucide symbols in fine hexagonal frames, with 10px card corners and an icon-led
heading. Detail dialogs use a compact white surface with 8px corners, a status
row, a small emblem beside the title, the requirement and a pale progress panel.
Use one full-width Cerrar action and retain Escape and focus return. Lock/check indicators
and real progress distinguish pending and earned milestones; symbols remain
visible independently of the legacy companion preference.

Hoy keeps copy minimal: a greeting and actual streak, “Para hoy” with a named three-game
session and “Jugar”, a “Tu sesión de hoy” list containing game names only, and icon-led
area shortcuts. Do not repeat greetings with an eyebrow or supporting slogan,
repeat area labels under every game, or add descriptions under area shortcuts.
Use short concrete labels: “Explorar”, “Ver todos”. A linked professional proposal takes precedence in Hoy, identified by its title
and author. Jugar starts or resumes the prescribed sequence; list entries open its
individual steps at the prescribed level. Show the first three pending steps and
replace completed ones with the next pending entries. With fewer than three pending,
fill remaining places with completed steps and checks; completed proposal entries
are disabled. Preserve repeated games as separate steps. Without a proposal, use
the automatic daily queue. The three list entries open
individually; the featured Jugar starts their complete sequence. Each of the 56
unordered triples has its own explicit Spanish title. Account identity and local
calendar day determine the session and its order, independently of completed games
or profile updates. Returning home or reloading must not reshuffle it.
Do not add fake map progress, completion counts or placeholders for patient data.

The authenticated home's featured Jugar action spans its entire title column with
centered text and a right arrow, matching the public entry action. Catalog headers
have no legacy companion illustration; its eight blue Lucide icons describe each
interaction (search, naming, letters, sequence, pairs, sorting, target, tracking).
Use CircleDot for target practice and Hand for continuous tracking.
Keep real illustrated game stimuli unchanged: catalog icons are navigation only.

Juegos presents the eight real exercises with area filters, distinct Lucide line icons and
an explicit instruction entry action. Preserve paging when necessary for viewport
height and text size. Activity and achievements reuse the existing read-only
statistics, archive pagination and cumulative milestone logic. Resumen groups the
practiced-area radar and level radar. Each level axis shows the full game name
and its current level in the same label style as the area radar; no separate table. Unknown levels remain
Sin probar, not zero. Gráficas contains Precisión, Velocidad and Niveles; level
history draws every recorded game together without a game dropdown. Filtros owns
area, exercise and date controls, affecting area counts, all three charts and history;
current levels remain the account's latest values, independently of date filtering.
Use white 10px-corner cards and the shared blue palette. Hovering a series shows its
name in a noninteractive chip at the upper right of the card and fades other lines.
Omit the separate legend. Series support keyboard focus and a persistent click/tap
selection; Escape clears selection. Axis labels stay small at every chart size.
History shows ten results per page on every viewport. Preserve the
full-history disclosure and never show a partial-data historical mean as complete.
All three time charts include the full-history mean. The level mean uses recorded
valid levels per non-practice session, deduplicated by result ID.
Secondary tabs
remain within their section; they must not be confused with the primary navigation.

## Public entry and institutional funding

The signed-in header brand returns to Hoy from every dashboard tab, including
the catalog, without regenerating the suggested daily queue.

The unauthenticated app home introduces NeuroIA before asking for credentials. It has
one short headline (“Juega a tu ritmo”), the subtitle “Practica memoria, atención y
coordinación”, and a primary **Comenzar** action that opens sign-in. Center-align
the headline and subtitle at all widths; highlight the entire “a tu ritmo” phrase
in primary blue, leaving “Juega” in the main ink color; center the subtitle and action column
on the same horizontal axis within the copy area. The centered
“Financiado por IGAPE” link sits directly below it and opens a full document page.
Center this home’s hero vertically in the space between header and footer, allowing
the page to grow and scroll on short viewports or with enlarged text. The sign-in
button matches the subtitle column width, capped at 430 px; its funding link is
centered underneath. This vertical centering applies only to the unauthenticated
home. Credential forms also center within their own header/footer shell; the
signed-in workspace keeps its existing alignment. At widths up to 760 px,
copy and illustration share a centered column capped at 430 px; retain side gutters
and allow heading wrapping. Test intermediate widths around the breakpoint as well
as standard devices so neither the text nor artwork drifts to a different axis. Avoid repeated
authentication actions, promotional eyebrows, illustration captions and explanatory
card grids. Do not show a subscription pitch or the full funding image inline; longer product
explanations remain accessible through Sobre NeuroIA. Registration and sign-in are
inline pages with labelled fields, Google access, recovery and a clear way back.
The access page uses one 440 px maximum column, a single Iniciar sesión / Crear cuenta
selector, then a compact heading and grouped fields. Sign-in includes a Google action and
email divider; registration is email-only with a short note explaining that
third-party accounts can use Iniciar sesión without separate registration.
Use 6 px label/input gaps, 14 px between fields, 48 px minimum inputs and
54 px primary actions. Keep the auth header and footer compact and use a minimum
viewport-height shell. Center the auth form vertically in the available space
between header and footer, reserving a shared 30rem minimum height for sign-in
and registration so their selector stays at the same height; allow natural scrolling on short screens, with a keyboard
or enlarged text. Registration places the third-party note below its submit button in muted 0.7rem
text, not below the heading, with an explicit line break after its first sentence.
Reserve a subtitle-sized blank space below the registration heading before the first field.
Place password length and email verification guidance below the confirmation input,
associated with both password fields for assistive technology. The header holds only the brand and Volver. Do not add a decorative side
panel or duplicate access buttons. Recovery hides the access selector and uses
the header Volver action to return to sign-in, without a duplicate return action
below the form. Reference: [Brilliant sign-in on Mobbin](https://mobbin.com/screens/a7afa68a-7e23-4fe5-8c0d-081a1eecc314),
adapted as a full page with NeuroIA's palette and existing authentication.
Authentication failures and mismatched registration passwords use a compact
ModalFrame notification (440 px maximum, 6 px corners, 4 px action corners).
Place the icon beside the title in one flex row, allowing the title to wrap on narrow screens.
Show the specific error with a short heading and Volver al formulario action.
Justify error paragraphs with Spanish hyphenation; start Google troubleshooting
in a separate paragraph after the Google sentence;
Escape/backdrop also dismiss and return focus while preserving entered values.
Keep recovery success as an inline status. Reference: [Workable error notification](https://mobbin.com/screens/d66e2824-c0f4-415f-ac20-aaf9d46ff1da).
Post-authentication access/progress failures use a full page with the brand and a
centered 440 px maximum recovery panel, 6 px corners and no decorative illustration
or fullscreen control. Keep icon and compact heading together, justify the specific
error message, and offer Volver a intentar followed by Cerrar sesión. Allow natural
scrolling on short viewports. Do not describe missing service configuration as a
problem with the user's internet connection.
Email verification uses the same brand header and centered 440 px column as
sign-in, without a colored card header. Its icon sits beside the title; the email
address stays copyable and wraps without inserted hyphens. Preserve manual resend,
verification check and sign-out actions, with readable inline status/error feedback.
Registration sends verification automatically once; the verification page labels
the manual action Reenviar. Disable resend during the initial delivery and show
its success or failure accurately. Reloading/restoring a session never auto-sends. While visible and online, check
verification every 10 seconds and on returning to the page. Continue automatically
after verification and token refresh; keep the manual check as a fallback. Background
checks do not show repeated error modals or loading indicators.
Email verification checks that remain unverified, and manual send/check failures,
use the same compact notification modal as registration, with a Volver action,
Escape dismissal and focus return. Delivery success stays inline. During a manual
check, the verification link reads Comprobando…; resend reads Enviando… during
delivery. Keep status in the action itself without an extra loading paragraph.
Loading reuses the shared Brand instead of a separate wordmark and keeps its
accessible status and reduced-motion dots. Visible warm loading phrases rotate every
4 seconds in a reserved two-line area; the screen-reader status stays stable
(Preparando tu espacio) to avoid repeated announcements. Clear the interval on exit
and never delay readiness to finish a phrase. Professional entry failures reuse the
same recovery page as player access failures.
Personal/professional intent survives authentication. Existing verification,
recent-authentication and account ownership requirements remain unchanged.

Registration remains available within the sign-in page. Purchases are available
after authentication and remain server-confirmed. Access choice is a page, with subscription, the existing trial
and invitation redemption. Access management remains within Mi cuenta, using the existing subscription
service; onboarding does not repeat the access entry point. Never imply payment has
completed based only on a browser return URL.
The subscription entry uses a brand header and an 880 px content region: three
short benefits beside one monthly-plan card. On narrow screens, center the heading
and use a single compact white surface, capped at 440 px, ordered as plan,
benefit checklist, then the invitation action. Separate the invitation from the
checklist with a fine divider and leave generous space above Suscribirme. Keep
Suscribirme primary and the seven-day trial visibly available below it when
eligible. Explain unavailable checkout rather than leaving an unexplained disabled
button. Do not invent a price: the current adapter exposes availability, not pricing;
price and terms remain in Stripe checkout; do not add a helper paragraph below Suscribirme when checkout is available. Place professional
invitations behind a full-width button with a right arrow below the plan. It opens
a compact ModalFrame with Cerrar, Escape/backdrop dismissal and focus return, with a persistent
input label, inline validation and the activity-sharing explanation. Preserve
subscription management and sign-out; do not show a manual pending-payment cancellation action. Pending actions
show Un momento… inside the activated button; do not add a separate footer or
invitation loading message. Starting subscription, trial or invitation redemption automatically cancels any pending
checkout through the existing server endpoint before continuing. Always consult the
server, including when the current tab has no pending-checkout flag. If payment
is already complete or cancellation fails, stop and show the error inside the modal;
never silently discard redemption or payment errors.
Reference: [Brilliant membership benefits](https://mobbin.com/screens/36a35dc6-cede-421e-8cf1-a4d831fc8a94),
adapted to NeuroIA's real monthly plan and independent trial rather than copying
Brilliant's annual pricing or automatic trial billing.

`ProjectFunding` displays the **entire unchanged owner-supplied IGAPE image** on
the IGAPE information page. Do not crop or recolor its institutional
logos. Preserve aspect ratio and include a selectable
HTML transcript for narrow screens and assistive technology. The supplied AI project
subtitle is attribution, not a claim of a currently available adaptive AI feature.
Asset provenance is in [the institutional asset guide](assets/images/institutional/README.md).
This implementation does not certify grant-publicity compliance.

## Interest onboarding and initial play

Use the shared Brand header and a centered 560 px content column for preferences
and assessment welcome/completion. Omit decorative companion panels. Match entry
typography, restrained 12 px corners, fine choice borders and full-width 52 px primary
actions. Selected choices use a pale blue surface and an explicit check; preserve
keyboard focus and readable descriptions on mobile and with enlarged text.
The onboarding toolbar exposes only Ajustes beside the brand: access has already
been resolved before this stage. Use a labelled 44 px icon button with a fine border
and 8 px corners. Account/settings native dialogs use a white header, inline
icon/title, compact close control and 6 px outer corners, matching entry notifications.

Use three steps: desired areas, optional interaction preference, then optional
Tu condición context.
Present areas in a two-column tile grid, with the final tile spanning both columns;
use one column on very narrow screens. Require at least one area and omit the
explore-all shortcut. Movement preferences retain labelled rows, including Prefiero no elegir ahora,
with Continuar and no separate skip button. The final step offers stroke, other
condition, none, or no response, with optional affected side and mobility. Never
request free-text diagnoses. Show the sharing consent checkbox only for invitation access. Personal access
stores context without a sharing-consent marker. Prefiero no responder stores no
condition object. This context never selects games or changes difficulty. Only selected areas enter initial assessment; tap preference excludes
continuous tracking. Untested games remain accessible with their default level.

New assessment ladders have **at most two stages per game**, starting at 1 and
ending at 4 when successful. These numbers are internal during play: use “A tu ritmo”,
not a numeric exam announcement. Stop a failed ladder, retaining prior passed
evidence. Existing saved higher-stage ladders remain readable and can finish;
ordinary adaptation still supports levels 1–10. This is a conservative starting
recommendation, not a validated measurement of cognitive ability.

A wrong Simon input marks both the selected and expected tile, locks the attempt,
and saves it as failed after Continuar. Replay is available before a round is resolved. The parent waits for durable evidence before advancing. Trial
buttons say “Continuar”, not “Ver resultados”. Initial trials do not enter the
ordinary results archive or count as completed exercises. Reassessment preserves
unselected levels and existing history.

## Game instructions, play and feedback

Visual search keeps incorrectly selected distractors softly red, with a red border
and an accessible incorrect label until the next board. Found targets retain their
green feedback; neither state changes the target or advances a phase on its own.
Reserve the search continuation action below the fitted board before it becomes
visible in the shared action slot directly below the board. Completing
a board must not move or resize its objects.

Each game starts with a full instruction page using `ExerciseIllustration`: eight
distinct blue-and-white compositions tied to each interaction (search, naming,
letters, sequence, pairs, sorting, target and tracking). Never reuse the login/home
`PracticeMotif` or a legacy companion for game introductions. Desktop uses an illustration column
and a compact copy/action column; narrow screens stack a small illustration above
centered instructions. Center the listen action in the introduction footer, with Back on the left
and optional session position on the right. Do not add the in-game help icon here. Group the ordinary-play
level selector and **Empezar a jugar** side by side at equal height, with a small
gap and generous hit areas, including on phones. Level minus/plus controls have
flat internal edges and only the outer group corners are rounded. Keep the back action separate.
Short landscape viewports reduce artwork and spacing; allow scrolling when needed. Help
opens a compact Cómo jugar modal, preserves answers and pauses the existing game clock.

Games have no pause/resume screen or controls, including assigned sessions.
Hidden tabs retain answers and stop active-time accounting silently; help, settings
and Muse likewise suspend the clock only while their explicit dialog is open.
Focus/blur never hides the board or opens a dialog. Returning to a visible tab checks
access in the background while its server lease is still valid. Only actual access
failure/expiry blocks interaction with a connection recovery dialog over the retained,
visible board; successful confirmation closes it automatically. Repetir on completion restarts directly at the played level,
without returning to instructions or adopting a newly adapted level.

Active play has utilities/time above the task, a clear stimulus and response area,
and reachable assistance/back/next controls. Use the shared GameSession and
ExerciseWrapper; do not fork navigation, timers or results. Boards may reflow and
active boards must fit the remaining viewport without page scrolling. Keep the
navigation, title and segmented progress anchored at the top, with modest spacing
above and below the title. Vertically center the board and its action as one group,
reserving the action space even before it appears. Uniformly scale only
the playground when necessary;
keep footer controls outside it. Categorization uses the same outlined Escuchar
control and icon size as other games, retaining current-object narration. Empty
assistance portal slots take no space or extra gap. Keep complete motor hit areas inside their measured arenas.

- Search: retain the exact target and all matching objects.
- Naming and words: distinguish stimulus, choices and next action.
- Simon: preserve the sequence and distinct tile colors/labels. Use blue Comenzar,
  an unfilled disabled Reproduciendo during playback, then white Repetir. Repetition
  clears partial input and replays the same sequence, counting one hint. Omit the
  attention/status banner or automatic “Observa y memoriza” narration. Continuar resolves success or failure; subsequent rounds
  wait for Comenzar instead of playing automatically.
- Pairs: start face down and disabled until Comenzar reveals the board. Ocultar shows
  the countdown and can end the preview early. Repetir resets the current board at
  the same positions, clears matches and replays its preview, counting one hint.
  Do not show pairs/attempt counters. Individual games have three boards with one
  aggregated result; placement, daily and assigned activities have one. Continuar
  advances after all pairs match. Matching and mismatching remain visible.
- Categorization: preserve group identity and clear selected/answer states.
- Targets/tracking: preserve pointer contact, keyboard interaction and arena bounds.
  Missed target taps leave unfilled red circles at the actual contact points until
  restart/completion, including scaled boards. Indicators never intercept input.
  Tracking accepts contact starting anywhere in the arena and reevaluates the
  pointer against the moving target each frame, in both directions.

Use in-place answer states rather than success popups or praise narration. Preserve
spoken instructions, object names and corrective content when needed by the task.
Game continuation always says Continuar: a stable blue action with 12 px corners,
a 52 px minimum height and a right arrow. Keep it 16px below the board in the
shared action slot, not anchored above the footer. In sequence and pairs, Continuar
replaces Comenzar/Repetir in exactly the same position and dimensions. Only the
board scales to fit; actions retain their touch size. Never bounce the action. Secondary controls have restrained
borders. Touch audio uses a quiet sine tone with smooth attack/release; correct
answers use a brief low-volume two-note cue. Audio starts muted on each page load. The sound toggle explicitly enables
effects and narration; muting stops speech and effects. Restored profile audio
settings must not automatically unmute the page. Completion retains the existing result and daily-plan callbacks. The completion
page uses the brand without a progress bar above a centered check, activity name
and played level. Three unboxed metrics show actual answers, accuracy and active
time; the primary action and white Repetir control have identical width and height. No legacy
mascot, confetti or oversized decorative card. Short landscape uses two columns
to preserve readable text and controls. Level gains use the shared compact white
notification modal, a heading with an upward icon, the exercise name and the actual
previous-to-new level in a pale blue strip. Keep its corners subtle and omit bounce
animations; Continuar dismisses it without changing the underlying activity.

## Responsive and accessible behavior

**Portrait and landscape are both supported.** Do not render an orientation gate,
automatically request fullscreen or lock orientation. Fullscreen is only an explicit
optional control. Rotation must preserve the active game and answers. Narrow pages
stack their major regions. Active games keep navigation, title, progress and footer
fixed in the viewport and fit the playground into the remaining space, reducing it
when necessary. Information pages and dialogs may scroll on short screens or with
enlarged text.

Use native buttons, visible focus, descriptive input labels, live status regions
and keyboard-operable tabs. Respect reduced motion. Use `ModalFrame` for transient
settings, Muse and account dialogs: focus containment, Escape, close button,
scroll handling and focus return remain required. IGAPE, About and the legal notice are ordinary pages, with the shared logo, a
heading, readable text and a visible Cerrar action on all three pages. Each uses restrained 0.9rem body copy,
1.15rem section headings and a 1.5–2rem page heading, respecting text-size preferences. Omit the repeated NEUROIA heading and
full-size-image link on its page. Leave 28 px above and below the funding details
table to separate it from the surrounding paragraphs. IGAPE shows the full transcript
and original image; About contains only the product explanation. The legal page contains the
non-medical notice, privacy information and a Licencias section with ElevenLabs
and MuseJS attribution for the Muse 2 integration. Returning restores
the previous entry/settings view without discarding form or game state. Long copy
is selectable and scrollable. Justify document paragraphs at every viewport width, including mobile,
with Spanish hyphenation to reduce uneven word spacing. Titles, controls and data tables are not justified. Separate the AEPD rights link
from the preceding section with 24 px of top spacing. Sound and narration remain independent preferences.

Professional workspace, proposals, participant activity, recovery and verification
share these tokens, controls and typography. The professional home has bottom
Personas/Asientos navigation, an icon-led heading and one purchase action beside it.
Use white cards with 10px corners, blue outlined labelled actions, restrained status
text and the same activity charts. Session editors/review/cancellation dialogs use
compact 8px corners, white headers, shared dropdowns and blue primary actions. Retain functional distinctions: free
professional entry, paid seats, read-only linked activity, immutable proposals and
server-confirmed permissions. Tables need usable horizontal scrolling if they cannot
reflow; do not hide meaningful fields simply to fit a viewport.

## Verification and maintenance

Inspect real rendered entry, home, onboarding, catalog, instructions, active games,
results and dialogs at 390, 820 and 1280 px and a short landscape viewport. Use
isolated browser fixtures; never generate activity in a real account for screenshots.
Check enlarged text, contrast, hidden companions, keyboard focus and actual answer
paths. Unit/build success alone is not visual verification. Record remaining physical
device, auth/payment and release checks in TODO rather than implying they passed.

Update this guide when a visual or interaction pattern changes. Keep implementation
contracts in AGENTS, product wording in CONTENT and asset provenance beside its
matching documentation directory. Do not append contradictory historical rules.

## Game-object illustration recipe

### Approved look

Use `public/images/objects/towel.png` as the primary reference and `table.png` as
an additional material example. Objects should look **realistic but drawn**:
recognizable proportions, soft volume, gentle gouache/colored-pencil shading,
fine tactile grain and clear silhouettes. Preserve identifying colors (red apple,
green pear, purple sequence flower). Avoid photographs, flat emoji, thick cartoon
outlines, plastic/glossy 3D, distracting decoration and faces on ordinary objects.

Use a true transparent alpha background, no floor, cast shadow, frame, labels or
watermarks. Keep the entire object visible and centered with modest safe margins.
Choose the view that makes recognition easiest, rather than forcing all subjects
into the same angle. A towel must look like a towel, a lamp must include a base and
shade, pliers must not look like a saw, and soup must not reuse the cooking pot.

### Repeatable generation prompt

Use the built-in `image_gen` tool with the approved towel/table images attached
as **style references**, not objects to include. Replace the bracketed fields:

```text
Use case: stylized-concept.
Asset: one game stimulus for Spanish label [EXACT LABEL].
Subject: [PRECISE OBJECT, ESSENTIAL PARTS, IDENTIFYING COLOR AND VIEW].
Style: semi-realistic hand-drawn gouache and colored-pencil illustration,
recognizable real proportions and materials, gentle dimensional shading,
delicate tactile grain, soft natural colors, crisp readable silhouette.
Match the attached towel/table references for rendering style only.
Composition: centered complete object on a square canvas, safe margins,
readable at 64–160 CSS pixels. Genuine transparent alpha background.
Avoid: photographs, flat emoji, glossy 3D, faces, extra objects, ground,
cast shadows, text, labels, frames and watermarks.
```

For related objects, generate small atlases (currently 4 columns × 4 rows) with
an explicit numbered row-major inventory. Request equal cells and generous
transparent gutters. Check the returned dimensions: the generator may not return
the requested resolution or perfectly even placement. Never assume grid coordinates
alone identify the complete sprite. `scripts/measure_illustrated_atlas.mjs` measures
alpha bounds in a browser from a decoded image; save reviewed results in
`src/services/illustratedAtlasBounds.json`. It does not alter source pixels.
Inspect all crops against the manifest before integrating them. Regenerate an
ambiguous or clipped object separately rather than changing the answer to fit it.

### Integration and verification

1. Inventory actual stimuli and Spanish labels across every consumer before generating.
   Preserve stable exercise IDs, answer keys, pair keys, ordering and scoring.
2. Save atlas PNGs in `public/images/objects/illustrated/` and standalone PNGs in
   `public/images/objects/`. Record complete prompts, references, tool, layout and
   identity corrections in the matching `docs/assets/images/objects/` directory.
3. Reuse `GameObject` for all question images and matching choices. Use the same
   sprite for a visual-search target and every matching cell. Preserve true alpha
   with normal blending in every theme; do not add a white tile behind it.
4. Review a labelled contact sheet **one object at a time**. Verify silhouette,
   identity, color, complete edges, absence of neighboring sprites and legibility
   at the smallest actual game size. Check for unintended numbers or lettering.
5. Exercise real answer, next, matching, demo and completion paths in isolated
   browser fixtures. Inspect phone, landscape tablet and desktop screenshots,
   including contrast themes. Do not write fixture progress to real accounts.
6. Motor artwork may gain texture and soft volume, but preserve the recognizable
   characters, concentric target center, circular boundary and full hit area.
   Never change gameplay geometry to compensate for an unsuitable image.

The decorative mascot/header family retains its own paper-style references;
this recipe applies to objects and tokens used inside games. UI controls remain
code-native icons. See the [atlas provenance and complete prompts](assets/images/objects/illustrated/README.md).

## Illustration workflow

1. Inspect the existing asset that establishes the style. Use it as a visual
   reference rather than describing a vaguely similar mascot from memory.
2. For characters, generate matching paper raster artwork. For game objects, use the semi-realistic recipe above. Extend
   existing SVG controls as vectors when that is the appropriate asset type.
3. When creating multiple related images, try to generate the whole set in one
   generation as a shared sheet to save tokens and maintain visual consistency.
   Split into smaller sets only when legibility, output limits, or precise edits
   require it. For a sprite sheet, specify row/column count, exact reading order, safe margins,
   recognizable object identity, and no accidental labels or neighboring art.
4. Save the final asset in `public/images/`. Record the final prompt, generation
   tool, reference asset, and grid layout in a Markdown file under the matching `docs/assets/` directory.
5. Integrate it through the existing renderer or a small shared component. Keep
   source images intact and adjust display crops in CSS where appropriate.
6. Inspect every mapping and crop at actual display size. Check for clipped limbs,
   off-center targets, grid lines, white seams, unexpected shadows, and neighboring
   cells. A plausible-looking but wrong object can make an exercise unsolvable.

Do not put faces on ordinary recognition stimuli unless the exercise calls for
one. Do not change answer keys to accommodate an accidental image-generation
error. Check blend modes on each surface and accessibility theme; use the home
asset's established treatment instead of leaving a tinted rectangular patch
around the companions.

Settings tabs have 20 px clearance below the dialog header. The retired Amigos
del bienestar control is not shown; retain stored companion preferences for compatibility.

New profiles and the initial page use Normal text size by default. Preserve explicit
saved text-size preferences. The profile-name input and Guardar use 4 px corners,
matching the other account actions.

Settings includes Financiado por IGAPE beside About and Legal, opening the shared
funding document page and returning to the previous settings state on close.

Pending progress writes show a compact notification with Reintentar and the link-style
Avanzar sin sincronizar. Dismissal keeps the local projection and durable queue;
retain a small pending notice and background retries. Never label unsynced work saved.

Do not interrupt the workspace with timed break reminders or guided rest dialogs.
Opening settings still pauses active gameplay.

Game footer Volver and Omitir and onboarding Escuchar use the shared outlined
entry action. Omit the A tu ritmo footer label during placement. In-game help opens
a compact Cómo jugar native modal with the current instruction and Continuar jugando;
pause the game clock without unmounting the board, and restore focus on dismissal.
The initial instruction screen remains a full page before starting ordinary play.

Active exercises use a full-width segmented progress track below the task title and above the
play area, without numeric counters in the title. Search boards, naming/letter/
classification questions and complete memory sequences each contribute one stage.
Individual target practice fills one segment per successful tap; individual pairs
have three complete-board stages. Grouped target/pair games and tracking have one
stage. Search objects, individual matched pairs and contact time do not fill stages. Daily and professional paths sum the actual stage counts. Placement reserves
its two possible assessment stages per selected game; finishing early or skipping
resolves that game's remaining allocation, so changing games never resets the bar.
A stage fills only when its complete round is resolved; there is no fractional fill.
Search uses the configured number of boards and saves one aggregated result.
Footer Back and Skip actions share the same compact outlined dimensions. Scanning
keeps its found-state treatment without checkmark overlays obscuring the objects.

Progress segments use the onboarding indicator’s blue fill, muted track and small
gaps, within the play area’s lateral padding. The active header keeps the clock
on the left and utilities aligned right at every width. The placement welcome
shows the selected count (e.g. “2 juegos preparados”), without a completed fraction.

Game help places Escuchar at the top right alongside its title. Muse uses the
shared compact preferences modal. The account name field and contrasting Save
action form one joined row. The clock is a noninteractive outlined chip matching
the transparent utility controls. Opening settings pauses placement in place;
closing settings resumes it without a separate rest screen or Retomar action.

The Muse modal places the EEG/PPG explanation beneath its title and introduction,
without a Tus partidas heading. It retains Bluetooth connection controls. It does not show a recording toggle, analytics-sharing
copy or instructions to disconnect to change recording.

The game progress track is inset an additional 16–48px per side inside the play
area. Muse keeps its Conectar Muse entry and modal, showing the EEG/PPG explanation before
Conexión Bluetooth. When Web Bluetooth is unavailable, the modal connection button
is disabled and reads “Navegador no soportado”. The disconnected status remains
“Diadema no conectada” in both supported and unsupported browsers, preserving
the same layout. Connection instructions remain visible regardless
of support, starting with selecting Muse and then reminding users to disconnect
it from other applications; detect API capability rather
than browser names. Firefox and Safari currently do not implement Web Bluetooth.
Reference: [MDN compatibility](https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth#browser_compatibility).

Within Settings → Mi cuenta, action buttons share a 9rem width sized for Cambiar
contraseña. The joined name Save action uses the same width. All these actions shrink
together to at most 42vw on narrow screens so the name input remains usable.

The account name input uses compact .78rem text with a 16px floor for mobile
input usability. Password action rows align at the top like invitation actions,
with a 10px gap and no extra paragraph margin pushing the action down.

Category choices form a joined row: only the first and last buttons have rounded
outer corners; all inner corners remain square. Login/registration and information
pages use the shared outlined Cerrar header action. Password recovery uses Cerrar to dismiss the entry modal and return home.

Login, registration and password recovery share a native ModalFrame over the
unauthenticated home. Close, Escape and backdrop dismiss the entire entry flow
when idle, returning focus to Comenzar. Mode switches remain inside the modal;
recovery Close also returns home. Error notifications stack above the form and
return focus without discarding its fields. About/legal links remain on the home only; auth dialogs contain no information links. Short viewports scroll within the dialog.

Professional entry uses two tilted, overlapping profile cards: a blue individual
card behind a white group card, with strong avatar symbols and small abstract
profile lines. It echoes the player’s card composition while distinguishing
profile management, within the same clinical-blue illustration frame.

Auth dialogs include the same centered player/professional link as the home,
with only 4px separation below the form. Switching workspace closes the modal
and reveals the corresponding home, updating login intent.

Both player and professional entry illustrations share the small blue four-point
star accent at the lower left of their card composition.

Authenticated home utilities use compact transparent outlined buttons with 8px
corners. The featured game keeps a 20px gap between its content/Play action and
artwork. Tu sesión de hoy has no whole-session action; each exercise replaces its
arrow with a check when a non-practice result exists for that exercise on the
current local calendar day. No completion is inferred from aggregate counters.

The daily game list is vertically centered in the space below its heading when
the card stretches on wider screens. Fine separators frame both ends and divide
the rows; compact layouts keep natural content height. The streak flame is filled
with primary color only when a non-practice game was completed today; otherwise
it remains an outline.


Mi cuenta includes a separate account-deletion section. Its enabled action has a
pale surface and readable muted text, with normal keyboard focus and hit area.
The confirmation uses the shared compact, nearly square dialog: icon and heading
on one row, exact typed phrase, identity confirmation, explicit irreversible scope.
Paid subscribers first see a Stripe-management action; trials/invitations proceed
to confirmation. Closing or Escape restores focus without starting deletion.
Acceptance signs out; durable server cleanup continues independently of the tab.
Cerrar sesión appears only in Settings and uses a white surface with primary-blue
text and icon, following the surface token in contrast themes.

All Mi cuenta action rows align buttons with the top of their text block, including
Rehacer prueba and Borrar cuenta; multiline descriptions do not vertically center
the button lower than the section heading.

Trial access copy distinguishes first use (“Probar gratis 7 días”) from remaining-time
recovery (“Seguir prueba gratuita”), based on the server-confirmed offer. An expired
trial is not offered again; recovery preserves its original expiry. In account deletion,
keep a short retention notice, add space before the confirmation fields and highlight the
required phrase “ELIMINAR MI CUENTA” in the primary color.
