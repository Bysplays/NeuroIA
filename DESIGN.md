# NeuroIA design guide

NeuroIA should feel like the same welcoming place from the home screen through
the last exercise. The visual direction is **cute paper**: pale surfaces, generous
rounded sections, friendly illustrated companions, and clear, unhurried actions.
Changing colors alone does not establish this style; composition, imagery,
typography, and interaction states must work together.

This is a living guide to the current product direction. Read [AGENTS.md](AGENTS.md)
for implementation, verification, and maintenance practices. Keep this guide in
English; the application speaks Spanish.

## Purpose and tone

Support people practicing cognitive and motor skills, including people recovering
from stroke. Make the next action easy to understand without making the interface
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
  See `public/images/headers/README.md` for prompts and provenance.
- `public/images/achievement-badges.png` and `achievement-badges-extended.png`:
  the collectible illustration family.
- `public/images/paper-play-tokens.png`: the smiling paper target and companion
  used in the two motor games.
- `public/images/organization-objects.png`: a shared 8 × 10 true-alpha atlas
  for Organization stimuli, preserving object identities and original map order.
- `public/images/game-objects-0.png` through `game-objects-2.png`: recognizable
  objects and action symbols for game stimuli.
- `public/brand/neuroia-mark.svg` and `neuroia-logo.svg`: the brand identity.

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
settings and relative units for text. Do not force a smaller fixed font simply to
make a layout fit.

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

The daily-session panel is the main entry point. Keep its text, companions, and
start action in a deliberate responsive grid. Illustrations must not overlap the
copy or squeeze the button, particularly on mobile.

“Cada día suma” gives the streak more weight than minutes and achievements. In
its horizontal layout, the main content takes approximately 70% of the width;
the secondary values form a narrower column aligned to the right, with a subtle
vertical separator. Do not restore the flame icon. The compact stacked layout
can place the secondary values below the streak.

The therapist entry belongs in the top navigation. Do not add back the duplicate
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
- Results use one pastel surface with the exercise illustration beside a short
  completion heading. Show correct answers, accuracy, and time in an unboxed
  definition list separated from the heading/actions by quiet horizontal rules.
  Give only one action a filled button: return home for a standalone exercise,
  continue for a daily plan, or finish the last plan exercise. Review and repeat
  remain text actions below it; home navigation remains available above. Avoid
  nested cards, a separate feedback banner, repeated return buttons, and medical
  efficacy claims. Do not bring back points as the visible reward system.

Avoid forced viewport-height layouts that clip controls. Some games may need
vertical scrolling on smaller screens. Do not hide overflow to conceal broken
layout. Keep mobile play areas usable without letting an oversized introduction
push the task unnecessarily far down the page.

### Achievements

The collection is a separate view reached through “Logros”, with a clear way
back. It currently has 20 distinct achievements, each with its own illustration,
condition, progress, and earned state. Use real cumulative activity; inactivity
does not revoke earned milestones.

Pending badges may be muted but remain recognizable and inspectable. Show how
to earn a badge in its detail dialog. Keep existing illustrations when extending
the set; a different drawing technique is a style regression even with the same
palette. Extend collections using a cohesive sheet when practical.

### Dialogs

Use the shared native-dialog frame. Keep one title, concise supporting content,
one obvious primary action, and a clear close affordance. Center the dialog in
the viewport; align its inner content independently. Avoid redundant wrappers,
competing width rules, oversized icons, and unexplained gaps above or below
content. Long content must scroll without losing access to dismissal.

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
   tool, reference asset, and grid layout in an adjacent Markdown file.
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

Use comfortable touch targets, generally at least 44–48 px for controls, with
larger areas where the exercise requires them. Preserve keyboard operation,
visible focus, meaningful accessible names, and dialog focus return. Keep labels
outside decorative images when possible.

Narration uses Spanish from Spain (`es-ES`) with a calm, conversational tone.
Prefer natural/enhanced Spain voices and recognize accented voice names. Do not
select a Latin American voice merely because it appears first. Keep pitch natural,
preserve the user’s pace setting, and offer a short voice preview in accessibility
settings. Browser speech quality still depends on the installed voices.

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
