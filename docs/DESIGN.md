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
Contrast themes override surfaces and ink. Preserve stimulus colors and existing
historical chart series: they carry identity beyond decoration. Use explicit text,
icons and borders for selection and answer feedback, not color alone.

Manrope is the interface family with a system sans-serif fallback. Headings have
compact line height and moderate weight, body copy comfortable line spacing.
Keep type in rem so normal, large (118%) and very large (135%) settings work.
Controls target 48 px or more, primary actions 54–56 px. Do not disable browser zoom.

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
header illustrations and achievement assets remain available in their supporting
roles; hiding companions never hides question stimuli.

The game-object recipe below remains authoritative. Preserve answer keys, object
identities, full silhouettes and atlas mappings during all interface work.

## Navigation and home

The player workspace has persistent **bottom navigation**: Hoy, Juegos, optionally
Para ti, Actividad and Mi cuenta. Reuse `TabletTabs`, its ARIA relationships and
keyboard navigation, through the existing Header portal. Keep generous bottom
content clearance and safe-area spacing so the final action remains reachable.
The header contains the brand, labelled Muse connection, sound, settings and
visible sign-out. Mi cuenta also offers sign-out and access management.

Hoy keeps copy minimal: a greeting and actual streak, “Para hoy” with the featured
game title and “Jugar”, a “Tu sesión” list containing game names only, and icon-led
area shortcuts. Do not repeat greetings with an eyebrow or supporting slogan,
repeat area labels under every game, or add descriptions under area shortcuts.
Use short concrete labels: “Empezar sesión”, “Explorar”, “Ver todos”. The displayed session queue is passed to
the start callback; starting it must not silently choose a different sequence.
Do not add fake map progress, completion counts or placeholders for patient data.

Juegos presents the eight real exercises with area filters, recognizable art and
an explicit instruction entry action. Preserve paging when necessary for viewport
height and text size. Activity and achievements reuse the existing read-only
statistics, archive pagination and cumulative milestone logic. Secondary tabs
remain within their section; they must not be confused with the primary navigation.

## Public entry and institutional funding

The unauthenticated app home introduces NeuroIA before asking for credentials. It has
one short headline (“Juega a tu ritmo”), one sentence about the games, a primary
**Iniciar sesión** action. The centered “Financiación IGAPE” link sits directly
below it and opens the shared native dialog with the complete funding notice.
Center this home’s hero vertically in the space between header and footer, allowing
the page to grow and scroll on short viewports or with enlarged text. The sign-in
button matches the subtitle column width, capped at 430 px; its funding link is
centered underneath. This vertical centering applies only to the unauthenticated
home, not the credential forms or signed-in workspace. Avoid repeated
authentication actions, promotional eyebrows, illustration captions and explanatory
card grids. Do not show a subscription pitch or the full funding image inline; longer product
explanations remain accessible through Sobre NeuroIA. Registration and sign-in are
inline pages with labelled fields, Google access, recovery and a clear way back.
Personal/professional intent survives authentication. Existing verification,
recent-authentication and account ownership requirements remain unchanged.

Registration remains available within the sign-in page. Purchases are available
after authentication and remain server-confirmed. Access choice is a page, with subscription, the existing trial
and invitation redemption. “Mi acceso” is available before assessment and within
Mi cuenta, using the existing subscription service. Never imply payment has
completed based only on a browser return URL.

`ProjectFunding` displays the **entire unchanged owner-supplied IGAPE image** on
the unauthenticated home’s IGAPE dialog and in Sobre NeuroIA. Do not crop or recolor its institutional
logos. Preserve aspect ratio, offer the original-size image, and include a selectable
HTML transcript for narrow screens and assistive technology. The supplied AI project
subtitle is attribution, not a claim of a currently available adaptive AI feature.
Asset provenance is in [the institutional asset guide](assets/images/institutional/README.md).
This implementation does not certify grant-publicity compliance.

## Interest onboarding and initial play

Ask one question at a time: desired areas, then optional interaction preference.
Present labelled choices, selected state and an explicit skip. Avoid collecting a
diagnosis. Only selected areas enter initial assessment; tap preference excludes
continuous tracking. Untested games remain accessible with their default level.

New assessment ladders have **at most two stages per game**, starting at 1 and
ending at 4 when successful. These numbers are internal during play: use “A tu ritmo”,
not a numeric exam announcement. Stop a failed ladder, retaining prior passed
evidence. Existing saved higher-stage ladders remain readable and can finish;
ordinary adaptation still supports levels 1–10. This is a conservative starting
recommendation, not a validated measurement of cognitive ability.

A wrong Simon input ends its assessment attempt immediately; ordinary practice
retains replay. The parent waits for durable evidence before advancing. Trial
buttons say “Continuar”, not “Ver resultados”. Initial trials do not enter the
ordinary results archive or count as completed exercises. Reassessment preserves
unselected levels and existing history.

## Game instructions, play and feedback

Each game starts with a full instruction page: supporting illustration, title,
short instruction, optional listen control, ordinary-play level control and one
primary **Empezar a jugar** action. Keep the back action separate. Landscape uses
two columns; portrait stacks a compact illustration above the instruction. Help
reuses that page, preserves answers and pauses the existing game clock.

Active play has utilities/time above the task, a clear stimulus and response area,
and reachable assistance/back/next controls. Use the shared GameSession and
ExerciseWrapper; do not fork navigation, timers or results. Boards may reflow and
pages may scroll. Keep complete motor hit areas inside their measured arenas.

- Search: retain the exact target and all matching objects.
- Naming and words: distinguish stimulus, choices and next action.
- Simon: preserve the sequence and distinct tile colors/labels.
- Pairs: start face down, flip on touch or keyboard; an optional preview is a
  counted hint with an early-end control. Matching and mismatching are visible.
- Categorization: preserve group identity and clear selected/answer states.
- Targets/tracking: preserve pointer contact, keyboard interaction and arena bounds.

Short correct-answer reinforcement appears as a non-blocking status bubble with
text, an icon and a dismiss button. It never takes focus or demands another click.
Its timer uses the shared pausable clock. Completion remains a real result page
with the existing save/daily-plan callbacks; no extra success modal blocks trials.

## Responsive and accessible behavior

**Portrait and landscape are both supported.** Do not render an orientation gate,
automatically request fullscreen or lock orientation. Fullscreen is only an explicit
optional control. Rotation must preserve the active game and answers. Narrow pages
stack their major regions; do not merely shrink desktop text or game targets.
Allow scrolling on short landscape phones and when text is enlarged.

Use native buttons, visible focus, descriptive input labels, live status regions
and keyboard-operable tabs. Respect reduced motion. Use `ModalFrame` for transient
settings, About, Muse and account dialogs: focus containment, Escape, close button,
scroll handling and focus return remain required. Long institutional copy must be
selectable and scrollable. Sound and narration remain independent preferences.

Professional workspace, proposals, participant activity, recovery and verification
share these tokens, controls and typography. Retain functional distinctions: free
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

The decorative mascot/header/badge family retains its own paper-style references;
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
