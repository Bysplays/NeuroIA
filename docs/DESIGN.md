# NeuroIA design guide

NeuroIA should feel like the same welcoming place from the home screen through
the last exercise. The default visual direction is **Default**: a pale ivory-to-aqua background,
translucent mint surfaces, dark blue ink, white activity cards and a solid teal
streak panel. **Cozy** is the secondary, colorful paper style with illustrated
companions. Both use generous rounded sections and clear, unhurried actions.
Changing colors alone does not establish this style; composition, imagery,
typography, and interaction states must work together.

This is a living guide to the current product direction. Read [AGENTS.md](../AGENTS.md)
for implementation, verification, and maintenance practices. Keep this guide in
English; the application speaks Spanish.

Game stimuli use the approved semi-realistic drawn style described under
[Game-object illustration recipe](#game-object-illustration-recipe). Decorative
companions, header scenes and achievement artwork retain their established identities.

## Purpose and tone

Present NeuroIA as entertainment, training and serious play, following the supplied
copy in [CONTENT.md](CONTENT.md). Describe practice and in-game activity without
disease, rehabilitation or medical efficacy positioning. Make the next action easy to understand without making the interface
feel like a clinical report or an exam. Warmth must not obscure a task or make
recognition harder.

Use short Spanish sentences and familiar verbs: “Mira”, “Toca”, “Elige”, “Volver”.
Offer encouragement without judging the person, introducing competition, or
promising recovery. Prefer specific instructions over decorative slogans inside
a game. Show real progress and useful feedback.

## Visual anchors

Use the actual home screen and these repository assets as the visual references:

- `public/images/wellness-companions.png`: the turquoise pear and lavender pebble
  companions; reference for character proportions, expression, and paper texture.
- `public/images/headers/`: individual scenes for eight active exercise headers and
  results, home, catalog, achievements, therapist view, and the fatigue dialog.
  See `docs/assets/images/headers/README.md` for prompts and provenance.
- `public/images/achievement-badges.png` and `achievement-badges-extended.png`:
  the collectible illustration family.
- `public/images/objects/illustrated/motor-tokens.png`: the textured target and
  companion discs used in the two motor games; the original paper sheet is retained as a reference.
- `public/images/objects/towel.png` and `table.png`: approved style anchors for game objects.
- `public/images/objects/illustrated/sheet-0.png` through `sheet-4.png`: 80 drawn
  objects shared by the games. `src/services/illustratedArtwork.json` keeps their identity mapping;
  measured bounds preserve complete silhouettes. Table, towel and soup are standalone images.
- The earlier organization/game-object atlases remain available for legacy symbols and provenance.
- `public/brand/neuroia-mark.svg` and `neuroia-logo.svg`: the owner's mint
  organic branching mark, preserving the supplied transparent PNG and its tall
  proportions inside SVG layouts. The wordmark retains the existing typography.
  This brand symbol is distinct from the raster companions. See
  `docs/assets/brand/README.md` for source and variants. The browser favicon uses
  `neuroia-favicon.svg`, the same mark on a pale rounded tile. Installation icons
  use the same source with a solid pale backing and safe margins.
  The repository README uses the updated wordmark and existing login companions.

The mascots have soft organic bodies, imperfect dark ink features, small limbs,
and visible paper grain. Keep the same characters across screens. Avoid neon
halos, glass panels, glossy 3D, heavy shadows, generic emoji artwork, and thin
vector redraws of the approved paper illustrations. Simple interface controls may
use restrained line icons; game stimuli should follow the semi-realistic drawn recipe below; companions remain in the paper family.

## Color and typography

Reuse the CSS tokens in `src/interface.css`. The standard palette is:

| Role | Token | Standard value |
| --- | --- | --- |
| Page background | `--color-bg` | `#e8f2f3` |
| White surface | `--color-surface` | `#ffffff` |
| Primary ink | `--color-text-main` / `--panel-ink` | `#17343b` |
| Secondary text | `--color-text-muted` | `#486068` |
| Primary action | `--color-action-bg` | `#075569` |
| Blue paper | `--panel-blue` | `#c5e3eb` |
| Pink paper | `--panel-pink` | `#edcde7` |
| Lilac paper | `--panel-lilac` | `#d3cfee` |
| Sage paper | `--panel-sage` | `#d4ebcb` |
| Peach paper | `--panel-peach` | `#f0ddc6` |

Accessibility themes override tokens. Do not scatter copies of these hex values
through components or assume a pastel surface will remain pastel in every mode.
Keep essential text legible and success/error feedback distinguishable by more
than color. Game colors that convey a clue must remain identifiable.

Use DM Sans with the existing system fallback. Headings use moderate weight and
compact line height; body copy has room to breathe. Use the existing font-size
settings and relative units for text. Apply the selected scale at the document
root so rem-based text responds throughout the interface (normal 100%, large
118%, very large 135%); changing the body font size alone is insufficient. Do not force a smaller fixed font simply to
make a layout fit.

The token table above describes Cozy. Default overrides surface and accent tokens
on the body; legacy accessibility contrast modes retain priority. Style choices
use miniature layouts in their own palettes, independent of the active style.

## Composition and spacing

Build a few clear sections, each with one purpose. Use flat pale panels, roughly
24–32 px corner radii for large sections, smaller rounded cards, and pill-shaped
navigation or primary actions. White is a supporting surface, not a mandatory
full-width shell around every game.

Use the established spacing rhythm: 8–12 px within small controls, 16–24 px between
related elements, and 24–32 px between larger sections. Treat these as starting
points rather than reasons to override content or accessibility needs.

Align content to shared edges. Use equal vertical padding in buttons. Avoid
floating, uneven rows, oversized empty panels, and arbitrary centered content
inside a layout whose surrounding text is left aligned. Balance illustration
size against the importance of the text and action.

## Screen patterns

### Tablet layout

Landscape tablets are the primary target. Center short screens vertically in the
space remaining below their toolbar. Use content-aware layouts and pagination,
not a scaled canvas or clipped overflow. Keep scrolling available for very large
text, short windows, long notes and dialog forms. Native dialogs retain their
scrolling and focus behavior. Game boards adapt to available height while
keeping touch targets, stimuli and feedback visible.

Use rounded, labelled tabs with equal widths and heights within each bar, an explicit active state and arrow-key navigation. Allow labels to wrap on narrow screens.
Place primary player tabs inside the shared header, between the brand and utilities; on narrow screens use a second header row. Embedded player activity tabs (Resumen y filtros, Gráficas, Historial and Logros when available) sit below their content at the bottom of the activity view; standalone professional activity tabs sit above the content. Other secondary section tabs remain above their content. Center short panels vertically in the remaining space below and allow long content to grow without overlapping navigation.

The first row of each player tab starts at the same vertical position, approximately 20% down the viewport (with at least 16px clearance below the header): the Hoy greeting, game filters, proposed-session heading and Estadísticas heading. Use a shared 52px minimum row height and let wrapped text grow. In Juegos, omit the result-count caption and leave 40px between the area filters and game cards. Keep the Hoy greeting directly above its cards. In the daily card, position the main claim at 40% of the available vertical space between the session label and start action, leaving more room below than above. Embedded statistics content begins 18px below its heading, matching Hoy; keep activity tabs at the bottom without vertically centering the content away from its heading. Choose from 15 short, cheerful, greeting-card-style Spanish subtitles randomly on dashboard mount and keep it stable during updates and tab changes. Keep the wording upbeat and literal; avoid double meanings, references to failure or inadequacy, pressure and claims of cognitive improvement. Keep the greeting on the left and its welcome subtitle on the right, inset 16–32px from the card edges; omit the date.

Home has Hoy, Juegos, optional Para ti and Estadísticas; settings has Apariencia (text size followed vertically by visual style)
and Tu cuenta; activity has Resumen y filtros, Gráficas and Historial;
the professional panel has Personas and Asientos. Collections use previous/next
controls and page counts instead of an unbounded page.

The fullscreen control is the rightmost action in the top toolbar at entry,
in workspaces and during play. Attempt
fullscreen once on the first explicit game Start gesture, requesting landscape
when supported. Rejection never blocks play; retain a manual retry and exit,
respect Escape, and do not re-enter automatically after the user exits. Installed
standalone apps need no redundant fullscreen request. Physical-device browser
restrictions remain a release check.

### Home

Default home exercise cards use a fine 1px pale teal border to separate their
white surfaces from the background. Keep the stronger hover and keyboard focus
feedback; Cozy and legacy contrast themes retain their own treatment.

The daily-session panel is the main entry point. Keep its text, companions, and
start action in a deliberate responsive grid. Illustrations must not overlap the
copy or squeeze the button, particularly on mobile.

The session heading reads “Juega. Practica” followed by “Progresa a tu ritmo”.
Omit supporting session paragraphs. The button reads “Completa tu sesión de hoy”
until the daily plan is complete, then “Haz otra sesión adicional”.

“Cada día suma” matches the session panel's height when side by side. Center its
title, streak number and day label on separate lines. Let the number-and-label
block fill and vertically center within the space between the heading and footer.
Place encouragement, minutes
and the achievements link below a separator. On narrow screens the cards stack
and size naturally to their content. Do not restore the flame icon.

Professional owners enter a separate free workspace through the professional
login; do not add the retained clinical therapist view to personal navigation.
Do not add back the duplicate
“Acompañamos tu progreso” card at the bottom. “Estadísticas” uses the available
width. The home links to achievements rather than displaying the badge collection.

### All games

The Juegos tab opens the game catalog. Show the eight individual games in
paginated cards with distinctive illustrations, titles and start actions. The
embedded compact layout omits descriptions to keep controls in the viewport.
Area colors help scanning: blue for attention, pink for language, lilac for
memory, sage for organization, and peach for coordination.

Category filters have equal dimensions and centered contents, aligned in a
regular grid: six columns on landscape tablets and desktop, three on narrow
mobile. They wrap cleanly, retain an explicit selected state, and update
the result count. Do not add back the “¿Prefieres que te guiemos?” promo card.
The daily-plan entry remains on the home. Daily action sequencing is retired;
Organization offers classification only. The memory beacon sequence remains.
Historical daily-sequencing results retain their original names and chart colors;
the activity filter labels that game “(retirado)” when its records are present.


### Games

The game is part of the home experience, not a separate clinical application.
Use `GameSession` for full-viewport instructions before mounting a game, with
a scene specific to that exercise, a listen action and a start action.
`ExerciseWrapper` keeps task clues and consistent completion/review actions. Each game keeps its own scene on completion. Header scenes alternate
solo companions and shared activities; do not repeat the original walking pair
across screens. Keep decoration separate from the actual exercise clues.

Menu headings use their own scene, with restrained artwork in the professional
view (omitted from printing). Keep the full illustration visible using contain,
including on narrow phones. White-backed scenes blend into standard pastel panels
with multiply; contrast themes display the artwork on a softly rounded white
paper backing so dark ink limbs stay visible. The Organization scenes use a
shared true-alpha sheet and remain transparent in every theme, with normal
blending. Never crop limbs to hide a backdrop.

- Place written instructions, return, listen and daily-plan position in the
  full-viewport introduction. This fills the available app viewport; Start also attempts browser fullscreen.
- During play, show a question-mark help button on the left and elapsed active
  time on the right. Help reopens instructions and pauses scheduled activity
  without resetting answers. Keep essential task clues, not the instruction hero.
  The clock counts up; existing minimum result durations remain unchanged.
- Build the play area from purposeful pastel sections. For object naming and
  categorization, separate the stimulus panel from answer cards on desktop and
  stack them on mobile. Keep answer-card alignment consistent.
- Render objects through the shared artwork mapping. The target example and the
  matching board objects must use exactly the same illustration.
- Keep memory tiles distinct at rest and clearly highlighted during a demo.
  Hidden cards must not reveal their object through text or accessible names.
- Use the illustrated paper target and companion for motor games. Their visible
  boundary should agree with the hit area. Keep the entire token inside the arena
  on phones as well as desktop, and show contact feedback without neon effects.
- Completion uses at least the dynamic viewport height with symmetric vertical
  padding and a centered result panel. Tall content grows and scrolls without
  clipping controls; completion resets the previous game scroll position.
- Results use one pastel surface with the exercise illustration beside a short
  completion heading. Show correct answers, accuracy, and time in an unboxed
  definition list separated from the heading/actions by quiet horizontal rules.
  Give only one action a filled button: return home for a standalone exercise,
  continue for a daily plan, or finish the last plan exercise. Repeat remains a text action on the left; the primary return/continue action sits on the right for tablet use.
  Omit the answer-review action and dialog; home navigation remains available above. Avoid
  nested cards, a separate feedback banner, repeated return buttons, and medical
  efficacy claims. Do not bring back points as the visible reward system.

Avoid forced viewport-height layouts that clip controls. Some games may need
vertical scrolling on smaller screens. Do not hide overflow to conceal broken
layout. Keep mobile play areas usable without letting an oversized introduction
push the task unnecessarily far down the page.

### Achievements

The collection is a separate view reached through “Logros”, with a clear way
back. Keep the illustration beside the heading and the count bar below it, spanning
the full header width on desktop and mobile. Its count pill doubles as a progress bar: the subtle fill covers exactly the
earned-to-total ratio, with readable text and accessible current/max values.
It currently has 20 distinct achievements, each with its own illustration,
condition, progress, and earned state. Use real cumulative activity; inactivity
does not revoke earned milestones.

Pending badges may be muted but remain recognizable and inspectable. Show how
to earn a badge in its detail dialog. Keep existing illustrations when extending
the set; a different drawing technique is a style regression even with the same
palette. Extend collections using a cohesive sheet when practical.

### Dialogs

Use the shared native-dialog frame. Keep one title, concise supporting content,
one obvious primary action, and a clear close affordance. Mandatory account entry and orientation dialogs are exceptions: Escape and backdrop cannot dismiss them; account entry offers logout. Center the dialog in
the viewport; align its inner content independently. Avoid redundant wrappers,
competing width rules, oversized icons, and unexplained gaps above or below
content. Long content must scroll without losing access to dismissal.

Rest-break tips are an informational bulleted list with short headings and
secondary text, without colored tiles, borders or button-like backgrounds.
Reserve filled surfaces for the actual pause/resume and return actions.

### Preferences

Settings use one neutral surface, a compact sticky blue-paper header and a clear
close button. Start with a labeled name input and “Guardar” action; trim names,
reject blank values and limit them to 200 characters. This edits the NeuroIA
profile, not the Google account. Show text size and page style, followed by subscription status. Text size uses three segmented
choices; show “Default” first and “Cozy” second. Default uses the supplied
September 23 reference: soft
translucent surfaces and teal accents. Preserve all real activity data, approved
copy and navigation rather than copying placeholder or empty reference cards.
Both styles offer the home companion illustration and its responsive layout.
An “Amigos del bienestar” switch below the style choices controls the decorative
illustration family throughout home, login, catalog, instructions, results, rest,
professional view and achievement artwork. It works independently of the palette,
defaults to on and collapses unused art space when off. Keep only 8px of section
padding below the switch so it sits close to the following divider. Without illustrations, achievements use a circle with a check when earned and
a dashed empty circle when pending, including the detail dialog. Names and
progress remain visible. It never hides exercise stimuli or alters game content.
Cozy retains the existing paper palette. Represent Cozy with a miniature home layout: blue hero with text and button shapes,
pink side panel and five pastel activity tiles. Use literal Cozy
colors inside the miniature so it remains recognizable in legacy contrast themes.
Do not use mascots or a letter sample for the style preview. Keep the explicit selected check. Preserve stored contrast,
hand-position and speech preferences for compatibility, but do not expose their
controls here. Voice attribution lives in “Sobre NeuroIA”. The subscription section reads real
account access, shows invitation/trial/monthly status and uses Stripe checkout or
the customer portal only when billing is enabled. Show the plan type and its end date on separate lines, without a redundant
subscription heading or status badge. Trials can subscribe via a pill-shaped “Mejorar” action; keep it disabled while
Stripe is unavailable, without a coming-soon notice. Invited accounts show only
“Abandonar”, with a confirmation explaining loss of access and the professional
link while preserving progress. Invitation and paid access are mutually exclusive. Paid accounts show a pill-shaped
“Gestionar” in the same position as “Abandonar” and “Mejorar”, beside the plan
details. Paid plans append “. Renovación automática” to the end-date paragraph
only when Stripe-derived `autoRenew` is explicitly true. Omit that suffix for
unknown renewal state; retain the end date. A still-active plan with renewal
disabled shows “No se renovará” and “Reactivar suscripción” instead of “Gestionar”.
This opens the customer portal, where the customer confirms renewal.
Stripe manages renewal; do not present a toggle or a local renewal setting. Do not show a subscription management banner above the workspace.
Cancellation and any available plan changes are confirmed in Stripe; do
not invent prices, upgrade plans or successful cancellation. Changes apply
immediately through the existing settings service. Apply appearance attributes
before browser paint so the selected control and the page update together, without
a frame in the previous theme or text size. Keep locally edited settings stable
through background saves for the rest of the session. Dismiss using the header
close button; omit the redundant “Listo” action. Place “Cerrar sesión” at the
bottom of settings, separated by a fine rule; omit it from the main header. Place
“Sobre NeuroIA” and “Aviso legal” to its right in the same footer row. Allow the
links to wrap within their right-hand group on narrow screens. Keep 22px of section
spacing on both sides of the footer divider, without a trailing paragraph margin.
Content scrolls with the close button accessible, including large text and short
landscape screens. Do not reduce text to make controls fit.

### Professional workspace

Use the same brand, palette and pill controls as the personal app. The dashboard
is free and opens without a personal subscription or trial modal. Lead with
“Espacio profesional” and “Comprar un asiento”. Omit the owner name, introductory
subtitle and seats subtitle. Show honest empty states
for both linked people and seats. Keep paid participant seats distinct from the
free professional account. One monthly subscription funds one participant.
Place purchase and the shared settings icon in the top header. Reuse player
settings without its subscription section; name and appearance are account-wide.
Logout and information links live in the settings footer.

Linked people also have a “Sesiones” action. The proposal view uses the same
workspace cards and quiet controls. A native dialog collects a title, optional
message and up to eight game/level rows with explicit up/down/remove controls.
“Revisar sesión” shows the exact sequence before “Compartir sesión”. Published
proposals show status and completed/total counts; cancellation requires confirmation.
An empty Para ti inbox says “Aún no tienes sesiones propuestas.” after server confirmation, inside the same tinted, rounded notice surface used for connection messages. Keep a Refrescar action visible with a filled action-color hover distinct from the panel. Loading and connection errors remain separate from confirmed empty results.

In the Para ti tab, the participant home identifies the proposing
professional and offers start/resume.
Game introductions show the fixed level and sequence position. A compact toolbar
provides pause and return; unfinished games restart after leaving, completed steps
persist. Confirmation of the saved result enables the next exercise. Repeat and
manual level selection are hidden for proposals. Keep these controls independent
of the daily-plan styles; use the `proposal-` action/heading classes.

People show their supplied name and an action to open the existing activity charts
and table in read-only mode. Use “Volver al panel” and identify whose activity is
being shown. Seat headings pair a numbered badge using the shared section-icon surface and
rounded shape with the participant name or “Sin asignar” in regular weight.
Omit the hash sign and separator. Keep the badge in its own left column, vertically
centered beside the name and subscription details. Align the real
pending/active/inactive subscription state, paid-through date and confirmed renewal
together beneath the name in the right column. Allow natural
wrapping on narrow screens. Show a selectable/copyable code only when paid and unoccupied.
New codes use the short `NIA-XXXX-XX` format for easy copying or typing.
After assignment show the participant, not the code. Pending purchases can be
resumed or canceled; subscription management uses the Stripe portal. Each renewing
seat offers “Cancelar suscripción”, opening Stripe confirmation for that seat.
Paid seats with scheduled cancellation show “No se renovará” and a “Reactivar
suscripción” action that opens the professional customer portal for confirmation.
Expired seats do not offer reactivation. If validity cannot
be confirmed, hide codes and disable activity with a retry notice; do not label
unknown access as an expired subscription. Never imply
that a return from Checkout proves payment or invent prices, people or results.

The retained therapist component is not the professional dashboard and remains
unwired for clinical writes. There are no diagnosis, notes or prescribed activities
in this workspace. Access and purchase contracts are in [PROFESSIONALS.md](PROFESSIONALS.md).

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

## Interaction and accessibility

Do not display the former left-edge visual guide or its settings control. It has
been removed from the product; existing saved preferences must not restore it.

Use comfortable touch targets, generally at least 44–48 px for controls, with
larger areas where the exercise requires them. Preserve keyboard operation,
visible focus, meaningful accessible names, and dialog focus return. Keep labels
outside decorative images when possible.

Narration uses Spanish from Spain (`es-ES`) with a clear, natural, conversational delivery and moderate expression.
Use a Spain accent with audible distinction between s and z/soft c; an es-ES
label or generation prompt alone does not establish that pronunciation. Avoid breathy, intimate or sensual
voice qualities; a slow pace must not turn into an affected or whispered reading.
Prefer natural/enhanced Spain voices and recognize accented voice names. Do not
select a Latin American voice merely because it appears first. Keep pitch natural,
preserve the user’s pace setting, and keep the existing prerecorded and browser speech playback. Voice preview and
pace controls are currently hidden from settings. Browser speech quality still depends on the installed voices. Recorded narration uses Alejandro Castellanos with
Eleven v3 and Spanish explicitly selected. Generate recognition words in short
lists, as in the accepted pronunciation sample; isolated v2 requests produced
unacceptable pronunciation. Validate each new clip before adoption. The local
`public/audio/elevenlabs-v3/` collection supplies available narration; missing or
unplayable files fall back to browser speech. Audio effects and narration remain
independent. Playback rate follows the voice setting without shifting pitch.
Show a quiet ElevenLabs attribution in “Sobre NeuroIA”. The recordings
retain their free-plan non-commercial license.

Motion and sound should reassure, not startle. Reuse the gentle tap sound and
separate sound-effect and narrator preferences. Respect reduced-motion settings;
remove decorative pulsing without silently removing motion that defines a game.
Never rely on color alone for success, error, selection, or contact feedback.

## Keeping the design guide alive

Update the affected section when a product decision changes, a new screen or
visual family is introduced, or a responsive/interaction pattern becomes shared.
Include the reason when it will help future contributors avoid a regression.
Update asset references after renames and remove superseded guidance instead of
keeping contradictory versions. Implementation and command changes belong in
AGENTS.md; visual changes belong here, with links where both are involved.

Use this review before finishing a visual change:

- Does it look like the home, including composition and artwork, not just colors?
- Is the main action clear, with secondary information given less weight?
- Are spacing, text, and artwork balanced on phone, tablet, and desktop?
- Are the exercise clues and interaction states still correct and recognizable?
- Do the documentation and actual implementation now describe the same product?

### Entry and landscape requirement

Use the same centered brand mark, “Preparando tu espacio…” and restrained loading
dots while restoring authentication, checking access, loading lazy code and reading
initial progress. This transient loader uses fixed text and artwork dimensions so
restoring the account's text-size preference cannot shift it; the rest of the UI
continues to respect that preference. Respect reduced motion. Do not mount login until authentication
resolves as signed out, or onboarding until a successful access read confirms no
active entitlement. Failed initial access reads show retry/logout recovery, not a
purchase modal. Background access refreshes keep the mounted workspace visible.

Center the login card vertically in the viewport with balanced flexible space
above and below; keep the brand at the top. On short screens let the page scroll
without clipping controls. A soft curved edge with a subtle paper-layer echo
separates the illustration and action panels, rather than a straight vertical cut.
Use a decorative inline SVG colored with the existing surface token.

The initial screen has a blue paper illustration panel and one heading,
“Jugar también puede ser una forma de entrenar”, beside the “Continuar con Google” action. Use
`public/images/headers/login-transparent.png`, a true-alpha cutout derived from
the home scene, without blend modes or an opaque image backing. Keep only one
short note explaining account-linked progress. The “¿Eres un profesional?” text action beside the information links switches to a
professional introduction: copy and access actions on the left, the existing
clipboard companion (`public/images/headers/therapist.png`) on lilac paper on the
right. Mirror only the curved separator, not the illustration. On narrow screens,
professional copy comes before the image. “Volver al acceso personal” restores the
personal entry. Focus the heading after either switch and disable switching while
sign-in is pending. The professional panel keeps the audience label,
heading and Google/email actions; omit supporting paragraphs and availability notices.
Professional sign-in opens the free professional workspace; personal sign-in
keeps the existing account access flow even if a professional profile exists.
Restored sessions reuse the selected login for that account on this device.
Omit the profile selector and change-profile actions. To enter the other workspace,
sign out and use the corresponding login. Both profiles keep their saved data.
Quiet “Sobre NeuroIA” and “Aviso
legal” links below the card open the supplied product information in the shared
dialog; signed-in users find these links in the settings footer. Keep long copy
scrollable, selectable and readable in all themes. Omit introductory paragraphs,
secondary headings and account badges. Show pending
and recoverable error states without replacing the screen. A closed popup does
not prove intentional cancellation: use neutral copy and suggest an external
browser if an embedded browser closes the window automatically. Cloud saving is tied to the signed-in account; show an actionable notice only when saving remains pending or fails. The
settings footer offers “Cerrar sesión”; signing out preserves cloud progress and pending account-local work. Existing
unscoped demo data is never silently assigned to the first person who signs in.

All interactive views require a landscape viewport. In portrait, a blocking
shared native dialog asks the user to rotate the device or widen the window.
It cannot be dismissed with Escape or the backdrop. Its optional fullscreen
action attempts the browser's landscape lock and explains rejection inline.
Physical rotation cannot be guaranteed by a website. Preserve mounted game state,
pause the game clock, and stop narration while the portrait gate is visible.
Allow vertical scrolling in landscape, including short phones and large text;
do not rotate the DOM or shrink the application to fit a fixed-height canvas.

### Email and password entry

Keep Google and “Continuar con correo” as matching full-width pill buttons, each
with its own icon. Email opens a compact shared native dialog with a tinted
header, mail icon, title, short introduction and close button. Reveal one form at
a time: sign-in, account creation or password recovery. Keep
visible labels, password-manager autocomplete, native email validation and Enter
submission. Registration repeats the password; explain verification before creating
the account. Clear passwords when switching forms or workspace. Disable all
competing actions during requests; errors and confirmations stay in the same panel.
Forms scroll on short landscape screens without hiding actions. Returning from a
form restores focus to the email button; switching forms focuses its heading.
Escape and the backdrop dismiss the dialog when no request is pending. Temporarily
hide it in portrait so the orientation gate remains on top, preserving form state.

Before either workspace, unverified password accounts see “Verifica tu correo”,
their address in a compact centered card with a tinted mail-icon header. Use a
filled pill for “Enviar correo” and plain, non-underlined text for rechecking and
logout. Space the recheck action equally between the send button and footer divider;
keep logout small and muted in the footer. Keep 44px minimum hit areas. Do not claim an email was sent until
Firebase confirms. Recovery uses neutral wording for unknown addresses. Verification
and reset happen on Firebase's hosted action pages; users return to the app afterward.
Settings contain “Acceso a tu cuenta” in both workspaces, with the account email,
“Añadir contraseña” for Google-only accounts or a change-password email action.
Keep these controls inside the existing settings dialog. Match the other settings
sections: shared heading and divider, muted address, compact action alongside the
heading when space permits, and an inline form using the same input styling.
“Cambiar contraseña” uses the filled pill button shared with subscription actions,
without an explanatory sentence below it. Adding a password preserves
the current account and Google access; a recent-login error offers a separate,
explicit Google confirmation button.

### Cloud progress

Before entering the workspace, load the account's cloud progress. Failed access
shows a concise recovery screen with retry and logout; never show fabricated zero
progress as a fallback. When the cloud profile does not exist but local completed
activity does, show its exercise count, identify the source and target account,
and offer “Importar mi progreso” or “Empezar sin importar”. Do not silently upload
another person's old browser profile or clinical notes. This import screen can
scroll on short landscape phones and uses the existing action styles.

Do not display a session-owner strip or a routine saving/saved banner above the
workspace. Successful synchronization stays silent. Show a textual pending notice
with a retry action only when changes cannot be saved; advise keeping the page
open. Preserve this recovery notice during exercise results.

### Mandatory account onboarding

After sign-in and before progress or exercises, show a shared native modal with
a blue-paper heading and curved paper-layer edge matching the login screen.
Use the home heading weight, 32 px outer corners and pill-shaped actions.
The invitation input uses a soft page-colored fill and 16 px corners without
a visible outline at rest. Its keyboard focus has one inset 2 px ring; avoid
the global detached focus ring here. High contrast retains a visible boundary.
Below the heading, keep two unboxed sections on one neutral surface, subscription
and invitation, separated by a fine rule. Omit illustrations, icons, eyebrow text and routine
footer reassurance here: prioritize a compact heading and short option descriptions.
Keep one filled subscription action. Directly underneath, show “Empezar prueba gratuita de 7 días” as a plain
underlined text button without a fill, border or pill. Underline “Usar mi código”
as well so both text actions are visibly clickable before hover. The trial is not a separate card. Show no invented price: Stripe displays
the configured amount before purchase. Trials have no card or automatic charge.
Explain that invitations provide free access and link the account to the named
professional; do not expose the reusable bootstrap code in public interface copy.

The modal cannot be dismissed but always offers logout. Focus its heading first
so short viewports start at the explanation, not at the code input. Sections use
two columns on desktop and tablets, with shared heading, description and action
rows so the subscription button and invitation input align even when copy wraps.
Use one column on narrow screens. Content scrolls inside the dialog. Portrait rotation takes
priority; avoid stacking onboarding over the orientation dialog.

Expired trials cannot be restarted. Keep purchase and invitation actions visible
when access expires. Do not show a general server-error banner in this modal.
Omit the subscription coming-soon notice. Show invalid-code copy as “El código no es válido”,
centered below “Usar mi código” in muted rose text without a background. Always reserve a
single-line error slot, including when empty, so validation never resizes the modal.
Longer messages scroll within that slot. Keep other invitation validation in that slot, and display payment confirmation and
automatic recovery states; do not expose a technical “Comprobar acceso” action.
Never imply that returning from Stripe proves payment. The active
subscription offers a customer-portal action. Technical setup and remaining
production prerequisites are documented in `docs/ONBOARDING.md`.

### Activity statistics

Estadísticas in the header groups activity statistics and Logros as secondary tabs. Do not duplicate this navigation with a header statistics icon. Keep the
category radar at the upper left, showing completion counts rather than ability.
Two daily charts use distinct, consistent colors and solid lines for every exercise: mean accuracy and mean
seconds per question (session duration divided by question count, then averaged
per day). This is not reaction-time measurement. Missing days are not zeroes.
Area, exercise and inclusive local-date filters apply to the data series and table.
Each chart also has a horizontal dashed reference for the unfiltered historical
mean of all sessions, labeled Media histórica global. Reserve dashed strokes for
these references. Opening Gráficas loads all archive pages; show loading/retry
until coverage is complete and withhold the reference while history is partial.
Time averages use seconds per question and exclude zero-question results.
Show timestamp, correct/total answers, accuracy, duration and seconds per question
in a horizontally scrollable, paginated table. Start with recent account history;
explicitly offer more archived records and disclose partial coverage. Preserve
empty/error/retry states and use real activity only.

Place the category radar beside the filter panel in Resumen y filtros, the two
daily charts side by side in Gráficas and the full-width history in Historial. Cozy uses blue paper for the radar, sage for filters,
lilac for accuracy and peach for speed, with white controls and history. Default
retains neutral surfaces. Use shared theme tokens so live style changes apply
immediately and legacy contrast modes retain priority. Omit the activity-summary text card. Activity filters sit
in a padded panel with a separate heading and reset action; use two columns on
desktop and tablet and one on narrow screens. Stack the radar and filters on
narrow screens. Use controls at least 48px high, equally sized rounded fields and outlined pill
buttons for navigation, reset, pagination and archive loading. Keep page
gutters and a bounded content width. The history has a count badge, a softly
tinted table header, right-aligned metrics and separate date/time lines (hours
and minutes). Historical records with only a date show that day without a time;
do not invent a completion hour. Omit the device-local-time caption. Group
pagination and archive loading in a padded footer with comfortable touch buttons.

The Nivel statistics tab shows current per-game base levels as numbered colored
progress bars, an eight-axis radar with the matching numbers and a dated timeline
selected by game. Use three equal-width cards stretched to the same row height in both player and professional views. Keep bars and charts side by side on landscape tablets; stack
on phones and allow overflow for enlarged text. Timeline points are recorded
played levels, including manual/professional selections, not reconstructed past
base levels. Load the archive for this tab too; disclose partial coverage and
exclude missing levels and placement/practice records. Missing current levels
read Sin asignar, never an invented level.

After a new completed result raises a base level, show a centered celebration
with the static achievements friend, ¡HAS SUBIDO DE NIVEL!, the new level, game
name and Continuar. The card enters with a brief zoom/bounce; the friend itself
stays static. Respect hidden companions and reduced motion. Use ModalFrame for
focus, Escape and scroll locking; backdrop clicks do not dismiss it. Do not replay
celebrations on initial load, result retries or reassessment.

Mi cuenta in settings offers Rehacer prueba with the short caption
“Reajusta tus niveles sin borrar tus partidas.” Place its colored primary button
on the right, matching Añadir contraseña / Cambiar contraseña. These actions
reuse the compact Abandonar subscription button sizing (44px minimum height,
8px × 16px padding and .72rem text). Keep text on the
left; on narrow screens wrap the button below while retaining right alignment. Reuse the eight-game
onboarding, then show Guardar niveles. Explain that completed activity and earned
milestones remain. Keep the draft in memory until accepted; cancellation or reload
leaves existing levels untouched. Saving replaces all base levels together and
clears their qualifying runs. Preserve the original onboarding record.

### Guided game placement and difficulty

Naming, word completion and classification share an 82-object illustrated pool.
Use common objects in early levels and progressively more demanding vocabulary,
similar distractors and up to four options later. Classification avoids broad,
overlapping groups. Memory pairs introduce similar-category objects; visual search
uses similar-color distractors. A successful timed performance raises the next
base level (one perfect game under a minute, or two consecutive games of the same
type above 90% and under three minutes each, capped at 10). Other game types do not
break that run. Repeat reopens instructions at the updated base level.


After player access and cloud loading, unassessed accounts see one calm companion
panel with progress, one instruction, optional listening and a primary Empezar.
Empezar launches a randomly selected unfinished game. After each assessment turn, randomly
choose another unfinished game, avoiding immediate repeats while alternatives remain.
Keep the next level and last passed evidence separately for each game. Each
game tries levels 1, 4, 7 and 10 in sequence, advancing only after a perfect completed
stage (use correct/total counts rather than rounded accuracy). A failed or skipped
stage ends that game at its last passed level; with none passed, use level 1.
Objects come randomly from the existing level-appropriate pools. Move directly
between stages and games without automatic instruction/result screens. Help,
settings and landscape pauses remain available. The bottom actions stay ← Volver
and Omitir →. Skipping before passing anything is marked unmeasured; after a pass,
retain that successful evidence. Returning preserves the pending stage of each game; reloading restarts unfinished
games at level 1, while completed games remain saved. Pause keeps the current stage.

Place Escuchar at the right of the prepared-game count on welcome and completion,
above the progress bar. Keep a stable panel width, 24–32px card padding and
20–24px spacing between content groups, with a balanced illustration column.
Wait for the completed trial in the parent progress snapshot before advancing;
show only a brief preparing status during that wait. Never infer missing evidence.
Do not describe placement as a diagnosis or ability score. Professional entry
has no placement flow.

Show all eight starting levels at completion, then “Ir a mis juegos”. Settings remain accessible; logout is available inside Settings without a
duplicate button on the placement screen. Respect hidden companions, large text and contrast.
Ordinary instructions start at the recommended level and offer a compact minus/plus control for levels 1–10; the chosen level
stays fixed during play and is shown in the game bar and result. Repeats start at the updated base. Help
and portrait continue pausing the existing clock. Tracking offers holding Space as
a keyboard alternative and follows the same timed promotion rule. See SDD for scoring and
provisional calibration limits.

Game instructions reuse the full onboarding layout: placement screen, toolbar, card, artwork, content, copy and actions. Keep the same card width, spacing and typography. The toolbar carries the NeuroIA wordmark and utilities; center the card between it and a bottom-left text action ← Volver and session progress at bottom right, in the placement skip position. Omit the Instrucciones label, repeated difficulty caption and recommended suffix; retain only the title and a short instruction. Do not add a parallel set of instruction-card styles. Settings/fullscreen remain in the toolbar and Empezar is the primary action. They continue the placement layout: illustration on the left,
content on the right, a top row inset 16px from the card’s upper edge, with a compact level control on the left and Escuchar on the right (the level is read-only once started or professionally assigned), followed by
the title/instructions and a full-width start or resume action. Use the shared
surface palette, 24–32px padding and 20–24px spacing between content groups.

Classification centers the object above its name/listen row and category choices.
Leave 72px between the object/name group and category options, and 12px before the next action; keep 16px between image
and caption. Omit the category question and option icons. Center the object name
on the image axis. Center the complete group in
the available play space with a 16px downward optical offset, keeping footer
controls fixed and image size adapted to short viewports.
Categories fill a single joined row with white surfaces, a 4px gap and straight
inner edges; only outer corners are rounded. Keep centered category labels and color feedback with accessible answer labels, without extra success copy. Reserve the next-action space and make its button span the full combined width of the category options.

All games, during placement and ordinary sessions, share a viewport header with time on the left, the exercise title
centered, and fullscreen/settings on the right. Center the image with its name
below, followed by categories. Keep ← Volver and Omitir → at the bottom edges
during placement. Place listening and manual help centered on the same bottom row as Volver, with the current level at the right (beside Omitir during placement). On narrow phones, wrap assistance immediately above navigation without extra spacing. Settings pauses placement;
closing settings leaves the existing Retomar action.

Tracking keeps its progress bar and moving arena between the shared header and
footer. Its footer Escuchar reads the tracking instruction; resize the arena to
the remaining height without changing movement bounds, contact detection or timing.

Active games use the same 1120px maximum outer width as instructions, with 24px lateral gutters (16px on narrow screens) and 16px vertical padding. Header, play area and footer align to these shared inner edges.

Memory sequence reserves its live-message space before starting, so observation, turn and retry feedback never moves the start/replay button. It places its full-width start/replay action below the two-column tile grid; omit the idle prompt and retain live observation/turn feedback. Visual scanning has no enclosing colored board surface; each cell retains its own surface. Its heading names the target in bold without a duplicate target image.

Object naming uses a transparent play area with a centered image above a joined row of text-only answer buttons, matching classification. Its next-action button spans the full answer-row width, up to 780px. Remove semantic/phonetic hints and answer-revealing audio; the shared Escuchar reads only the instruction. Preserve answer feedback, question order and result scoring; new naming results record zero hints.

Word completion follows the same transparent vertical layout: image, incomplete word, joined text-only letter options and reserved next action. The next-action button spans the full width of the letter options (including their 780px maximum). Remove hint/reveal controls and check/cross feedback icons while preserving selection colors, spoken feedback and drag/touch input. Its shared Escuchar reads instructions; new results retain hintsUsed as zero.

Home, game instructions and active games share the same sound-effects toggle in their upper-right tools. Its state stays synchronized while navigating; instruction narration remains independent.

Word-completion MESA uses the dedicated transparent table illustration (`images/objects/table.png`), never the logs sprite. Standalone stimulus provenance lives beside atlas documentation under `docs/assets/images/objects/`.

Memory pairs keeps the same title, statistics row and board geometry during preview and play. Only the replay control changes to a green countdown while cards are visible; its label reserves the same width. Pressing the countdown preserves the existing early-start action.

Statistics filters use a compact heading and secondary reset action, aligned area/exercise fields, and a separate paired date range. Keep native selects/date inputs, visible labels and 48px minimum control heights. Reset is disabled when no filters are active.

Memory-pair grids always use complete, equally sized rows. Tablets and desktop use two rows with one column per pair (4 cards: 2×2; 6: 3×2; up to 12: 6×2). Narrow screens use a divisor of the card count to preserve full rows and usable targets. Preview and hidden cards share these columns.

Toalla uses the dedicated transparent towel stimulus in classification and memory pairs (`images/objects/towel.png`); the soap dispenser must only represent soap.

### Connection recovery

Access and initial progress failures share ConnectionRecovery: the existing login
shell, NeuroIA wordmark, fullscreen control, rest friend on a tinted panel and a
short Vamos a reconectar heading. Keep the colored Reintentar conexión action
prominent and Cerrar sesión as a secondary text action. Reuse appearance tokens,
hidden-companion behavior and narrow-screen stacking. Permission failures use
account-access wording instead of claiming a network fault. Pending-save notices
remain distinct from an initial-load failure; never replace inaccessible progress
with an empty profile.

Assessment turns contain one naming/completion/classification question, one beacon
sequence, one scanning board, one pair board or one short tracking interval.
Toca la diana is the exception: complete its full level-specific target sequence
(5, 8, 11 and 14 targets at levels 1, 4, 7 and 10) before switching games.
Normal game lengths are unchanged.

Professional session lists, individual-session analytics and standalone activity
share the overview’s icon-led title, heading size, content width and top alignment.
A separate control row contains the labelled back action, participant identity and
any create/refresh action; session status sits below the participant name. Long
titles and names wrap without pushing controls outside the page. On narrow screens,
the primary creation action wraps onto a full-width row. Standalone professional
activity places its section tabs above the cards, like the professional overview;
the player's embedded activity keeps its bottom tabs. Short panels stay below their
controls without vertical centering. Keep chart cards side by side on landscape
tablets and stack them on phones. Session list and breakdown cards use the same
section icon and heading treatment as Personas and Asientos. The session composer
uses the shared native dialog with a tinted icon/header, compact close control,
compact paired metadata fields, a game count and a flat list separated by fine rules.
Each row has a number, game and level selectors, then inline up/down/delete icons.
Use quiet native selectors with a consistent chevron and hover/focus surface. On
narrow phones, wrap level and actions onto a second line without creating cards.
Keep Añadir juego as a compact text action, and use a full-width primary
review/share action. Long drafts scroll within the dialog; preserve Escape, focus
return, validation and the review-before-sharing step.

The professional session index is a paginated flat list (five rows) with creation date,
name and actions, in that order. Session names use regular font weight. Center date and action headings over their content.
Use labelled icon buttons: a chart to open analytics, a pencil to edit unstarted sessions, and a bin to request cancellation
(with confirmation; existing results remain). The chart opens a session-specific dashboard with
status, confirmed completion, answer-weighted accuracy, accumulated exercise time
and an ordered game breakdown. Show prescribed levels, recorded answers and
duration per game; keep missing/pending results distinct from zero performance.
Use equal-width summary cards, shared surfaces, compact back navigation and
responsive stacking. The accompanying message belongs in the detail, not the list.

The professional header purchase action matches the 48px navigation controls, with
compact text and padding. Editing reuses the prefilled session composer and review
step; disable the pencil after starting, completion or cancellation.

Professional overview and session pages start below their navigation with the
normal section gap; do not vertically center their main content or tab panels.
Session and seat lists keep equal outer top/bottom insets by omitting extra bottom padding
on the last row. Short lists leave remaining viewport space below the content.

The professional overview uses labelled icon tabs, a small briefcase heading,
section icons and restrained person avatars. Person rows keep real names and
textual access status, with compact, accessible session-list and analytics icon
actions on the right. Disable those actions when the seat is inactive. Retain
clear wording for billing actions; do not replace consequential payment labels
with unexplained icons.
