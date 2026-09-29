# Clinical-blue interface concepts

## Status and review

This board records the three proposals. **A — Calma editorial is selected**;
[DESIGN.md](DESIGN.md) governs its implementation. The owner requested
multiple Figma-style concepts before changing the application, then refined the
brief toward the simplicity of Kit, Ahead and Brilliant and a clinical-blue
palette. That explicit palette update supersedes the earlier request to retain
all existing colors for this exploration. It does not change the non-medical
product positioning in [CONTENT.md](CONTENT.md).

The independent review board lives at `design/concepts/index.html`, served by the
existing Vite dev server at `/design/concepts/`. It is a coded design canvas, not
a Figma document. It is not imported by the production entry and has no Firebase,
payment, account or progress integration. The protected Ahead archive is untouched.
All people, activity and results in the concept are labelled sample data.

Use the direction selector, screen selector and orientation controls to compare
the same screen in three directions. “Comparar las tres” shows parallel artboards;
“Abrir a tamaño real” opens an unscaled responsive prototype. The review artboards
are 1180 × 820 and 820 × 1180 CSS pixels, rendered in real isolated iframes rather
than stretching a screenshot. Example direct URLs:

- `/design/concepts/?frame&direction=calma&screen=home`
- `/design/concepts/?frame&direction=jardin&screen=home`
- `/design/concepts/?frame&direction=estudio&screen=onboarding`

The owner selected A — Calma editorial for the real application. B and C remain
review artifacts only. The board is not a substitute for implementation verification.

## References inspected in Mobbin

| Reference | Observed pattern | Application to the concepts |
| --- | --- | --- |
| [Kit home](https://mobbin.com/screens/856cdd7d-789a-4b27-b75f-779f4d36d326) | Large open areas, one dominant value, small persistent bottom navigation | Strong hierarchy and restrained navigation; omit Kit's collage decoration |
| [Kit activity](https://mobbin.com/screens/0cd032eb-9b84-4bcb-8286-2f9b3a506eeb) | One status headline, flat task row, quiet supporting content | Short headings, divided lists and clear state labels |
| [Ahead journey](https://mobbin.com/screens/bb650f80-dbb9-4af0-bb02-aa0e1b7743f3) | Numbered activity nodes, a character beside the current point, persistent bottom navigation | A continuous path, one companion and one active bubble; responsive node positions |
| [Brilliant home](https://mobbin.com/screens/8ad69ea6-81ed-4197-863d-ccba9f524a8f) | Prominent current lesson, a short next-step panel and one large start action | A single featured activity, concrete action label and compact next choices |
| [Headspace discovery](https://mobbin.com/screens/9fb74046-d5b5-4af9-9204-78cacdd67661) | Labelled category shortcuts, featured collection and grouped programs | A predictable game library with labelled area filters |

The actual returned images were inspected. No Mobbin screenshots, third-party
characters or brand assets are bundled in the prototype. Existing NeuroIA raster
illustrations and the original brand mark are reused. New decorative card motifs
are code-native shapes, not replacements for actual game stimuli. Object previews
reuse `GameObject` and its approved atlas mappings.

## Three directions

### A — Calma editorial

Manrope, balanced whitespace, 24 px surfaces, a focused daily activity and a
compact divided list. A pair of abstract blue cards illustrates the main action;
mascots are secondary rather than the home focal point. Bottom navigation stays
consistent across orientations. Recommended as the simplest starting point for
the broad player audience, selected by the owner; physical-device and user validation remain required.

### B — Jardín de juego

DM Sans, 32 px surfaces and a visible route linking three activities. Only the
current node has a bubble and companion. The route runs across landscape tablets
and down portrait tablets. The other nodes remain explicit playable choices,
not unexplained locked content. This direction gives progression more visual
weight and takes more space than A.

### C — Estudio

Inter, 16 px surfaces, flat divided groups and a navigation rail above 1000 px.
Portrait tablets use bottom navigation. The featured activity and following
choices form a regular grid. This direction emphasizes predictable navigation and
frequent use, with less decoration and a stronger professional-workspace fit.

## Shared foundations

| Role | Proposed value |
| --- | --- |
| Background | `#F3F8FB` |
| Surface | `#FFFFFF` |
| Pale blue | `#DCECF7` |
| Supporting blue | `#B8D8EC` |
| Action blue | `#276A93` |
| Ink | `#173B55` |
| Secondary text | `#566F81` |

Color does not carry status alone. Selection uses checks, borders and native
input state. Lucide icons retain a consistent line weight and familiar meaning.
Navigation includes words; Muse has an explicit label on tablet. The wordmark
uses a quieter lowercase typographic treatment and the existing mark, with a blue
preview tint. No new production logo asset has been approved.

Primary actions are 52–56 px high, secondary and icon controls at least 48 px.
Body copy is generally 16–18 px, with smaller supporting labels. Main headings
scale between 34–48 px in tablet layouts. The prototype's large-text control is an
exploration; production must preserve all existing text sizes and contrast modes.

Portrait has deliberate layout changes: the home stacks its panels, the journey
changes direction, instructions place a compact illustration above the content,
interest onboarding becomes a single question column, account entry becomes a
single form, and pair cards switch to two columns. Content remains scrollable in
short viewports. No orientation gate or fullscreen request exists in the concept.

## Prototype coverage and limits

Thirteen review surfaces are available in each direction: home, game library,
game instructions, active game, reinforcement/result, interests, input comfort,
activity, achievements, settings, presentation, account entry and professional
overview. The library opens all eight instruction screens and corresponding
illustrative board layouts.

Navigation, category filters, interest choices, comfort selection, back actions,
pause, card reveal, period switching and appearance switches are interactive.
They use ephemeral local React state only. Login submits to a sample next screen,
never a server. Payment, device connection, narration and level selection explain
their intended destination in an explicit concept notice. These are not completed
integrations. Example game clicks do not evaluate answers or save results.

Concept verification covers 117 screen/direction/viewport combinations at
1180 × 820, 820 × 1180 and 390 × 844, checking headings, horizontal overflow and
runtime errors. Representative actual screenshots were inspected in both tablet
orientations. Browser interaction checks cover the eight game entries, onboarding
selection/back navigation, keyboard activation of the journey bubble, large text
and hiding companions. Network inspection found only local assets and Google
Fonts requests. Production build and strict lint pass; the existing production
chunk-size warning remains tracked in TODO. These checks concern the prototype,
not a completed production migration or a full accessibility audit.

## Implementation scope after direction selection

The redesign is integral; do not stop at the home page. The implementation must
cover the following existing flows and their empty, loading, error and disabled
states, retaining actual data and services:

1. Shared shell, navigation, brand, typography, iconography and responsive tokens.
2. Presentation, Google/email entry, registration, verification, recovery, access,
   trial/payment entry, invitation redemption and connection recovery.
3. Interest/comfort onboarding, selected assessment, feedback, completion and
   reassessment, including durable saves and cross-device conflict handling.
4. Player home, daily plan, all eight games and area filters, proposed sessions.
5. All eight instruction screens, actual play boards, help, pause, early exit,
   feedback, results and level-up; preserve answer keys and difficulty contracts.
6. Activity filters, charts, history, levels, achievements and individual exercise
   analytics; missing data must remain distinct from measured values.
7. Settings, account details, accessibility, subscription, logout, product notice,
   optional Muse connection and live/saved EEG/PPG presentation.
8. Professional people/seats, invitations, proposal lists, composer, review,
   cancellation and session/participant analytics.

Use the existing components/services rather than shipping the concept as a second
application. Preserve the current approved content, assets, authentication,
entitlements, persistence and game contracts. Proposed wording changes must be
reviewed against the client backlog. Institutional IGAPE copy/assets remain a
separate supplied-material dependency; the concept does not invent official marks.

Verify the implemented result on real screenshots and touch/keyboard paths in
both tablet orientations, plus narrow-phone and short-window fallbacks. Test large
text, contrast, reduced motion, hidden companions, save recovery and restored
sessions. Follow the full applicable repository checks before merge; concept
checks do not prove the production redesign is finished.
