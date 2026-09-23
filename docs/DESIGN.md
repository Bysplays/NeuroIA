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
- `public/images/headers/`: individual scenes for all nine exercise headers and
  results, home, catalog, achievements, therapist view, and the fatigue dialog.
  See `docs/assets/images/headers/README.md` for prompts and provenance.
- `public/images/achievement-badges.png` and `achievement-badges-extended.png`:
  the collectible illustration family.
- `public/images/paper-play-tokens.png`: the smiling paper target and companion
  used in the two motor games.
- `public/images/organization-objects.png`: a shared 8 × 10 true-alpha atlas
  for Organization stimuli, preserving object identities and original map order.
- `public/images/game-objects-0.png` through `game-objects-2.png`: recognizable
  objects and action symbols for game stimuli.
- `public/brand/neuroia-mark.svg` and `neuroia-logo.svg`: a soft turquoise/lilac
  paper-leaf sprout with dark ink veins, echoing the plant in the home illustration.
  This compact vector brand symbol is distinct from the raster mascots. See
  `docs/assets/brand/README.md` for construction and usage. The browser favicon uses
  `neuroia-favicon.svg`, the same mark on a pale rounded tile for tab contrast.
  The repository README uses a centered wordmark, restrained badges and the
  existing transparent login companions, with practical management links below.

The mascots have soft organic bodies, imperfect dark ink features, small limbs,
and visible paper grain. Keep the same characters across screens. Avoid neon
halos, glass panels, glossy 3D, heavy shadows, generic emoji artwork, and thin
vector redraws of the approved paper illustrations. Simple interface controls may
use restrained line icons; important game artwork should use the paper family.

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

The therapist entry belongs in the top navigation once professional access is
authorized. It is currently unavailable while roles and care links are pending.
Do not add back the duplicate
“Acompañamos tu progreso” card at the bottom. “Tu recorrido” uses the available
width. The home links to achievements rather than displaying the badge collection.

### All games

“Ver ejercicios” opens the game catalog. Show the nine individual games directly,
with a distinctive illustration, brief description, and start action for each.
Area colors help scanning: blue for attention, pink for language, lilac for
memory, sage for organization, and peach for coordination.

Category filters have equal dimensions and centered contents, aligned in a
regular grid: currently six columns on desktop, three on tablet, and two on
narrow mobile. They wrap cleanly, retain an explicit selected state, and update
the result count. Do not add back the “¿Prefieres que te guiemos?” promo card.
The daily-plan entry remains on the home.

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
  full-viewport introduction. This fills the app without forcing browser fullscreen.
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
- Show sequence order as compact paper-style “Paso 1”, “Paso 2”, “Paso 3”
  labels in the card corner; never cover an action illustration with a giant
  numeral, glass circle, blur or neon glow. Show correctness explicitly. Decoration must not suggest an
  answer or interfere with selecting, dragging, or reviewing a step.
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
canceled or unknown renewal state without replacement copy; retain the end date.
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

### Therapist view

Maintain the same brand and soft surfaces with a more restrained hierarchy.
Prioritize real patient context, prescribed areas, guidance, notes, domain
performance, and session history. Preserve editing and print behavior. Clinical
labels belong here when useful; do not transplant the professional dashboard's
density into patient games.

## Illustration workflow

1. Inspect the existing asset that establishes the style. Use it as a visual
   reference rather than describing a vaguely similar mascot from memory.
2. For paper characters and objects, generate matching raster artwork. Extend
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
short note explaining account-linked progress. Quiet “Sobre NeuroIA” and “Aviso
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

A chart icon beside sound and settings opens the account activity view. Keep the
category radar at the upper left, showing completion counts rather than ability.
Two daily charts use one consistent color per exercise: mean accuracy and mean
seconds per question (session duration divided by question count, then averaged
per day). This is not reaction-time measurement. Missing days are not zeroes.
Area, exercise and inclusive local-date filters apply to all charts and the table.
Show timestamp, correct/total answers, accuracy, duration and seconds per question
in a horizontally scrollable, paginated table. Start with recent account history;
explicitly offer more archived records and disclose partial coverage. Preserve
empty/error/retry states and use real activity only.

Place the category radar beside the filter panel, then the two daily charts and
the full-width history. Omit the activity-summary text card. Activity filters sit
in a padded panel with a separate heading and reset action; use two columns on
desktop and tablet and one on narrow screens. Stack the radar and filters on
narrow screens. Use controls at least 48px high, equally sized rounded fields and outlined pill
buttons for navigation, reset, pagination and archive loading. Keep page
gutters and a bounded content width. The history has a count badge, a softly
tinted table header, right-aligned metrics and separate date/time lines (hours
and minutes). Historical records with only a date show that day without a time;
do not invent a completion hour. Omit the device-local-time caption. Group
pagination and archive loading in a padded footer with comfortable touch buttons.
