# Header illustrations

Asset paths in this guide refer to `public/images/headers/` unless a repository-relative path is given.

Generated with the built-in `image_gen` tool on 2026-09-14. Reference: `public/images/wellness-companions.png` (character identity and paper style). Each file is a separate square scene, not a sprite sheet; no grid or crop coordinates. Full original canvas retained. These are decorative, never answer stimuli. Organization now renders the true-alpha shared `public/images/headers/organization.png` sheet; see `organization.md` for its final prompt, references and layout. Its old individual PNGs remain provenance references only.

## Generation prompts

Each initial prompt is the common prefix + scene below + common suffix.

Prefix:

Use case: illustration-story. Asset type: decorative header illustration for the Spanish NeuroIA app. The attached image is a STYLE AND CHARACTER IDENTITY REFERENCE only. Create a NEW single scene, not a sheet. Match its handmade cut-paper and grainy gouache texture, imperfect dark teal ink faces and thin limbs, turquoise pear-shaped tall companion with long U nose, lavender pebble small companion with tiny curved nose. Preserve recognizable character proportions. Scene: 

Suffix:

 Composition: centered complete scene on a square canvas with 10% clear safe margins, large readable character, restrained simple props. Real transparent background (alpha), no opaque backdrop, no text, no labels, no watermark, no frame. No glossy 3D, no neon, no vector substitution. Props are decorative and must not form an exercise answer.

### visual-scanning.png

Only the turquoise pear companion kneeling, looking through a large magnifying glass at a few abstract paper dots.

### language-naming.png

Only the lavender pebble companion holding an open picture book, with one empty speech bubble overhead.

### word-completion.png

Only the turquoise pear companion assembling three chunky paper alphabet blocks, with abstract ink strokes instead of legible letters.

### memory-path.png

Only the lavender pebble companion pointing along a gently curved trail of four pastel paper stepping stones.

### memory-pairs.png

Only the turquoise pear companion sitting at two pairs of paper cards, turning one over; simple abstract shapes on the cards.

### daily-sequencing.png

Only the lavender pebble companion arranging three blank picture cards in a neat row on a low table.

### categorization.png

Only the turquoise pear companion sorting pastel round and square paper shapes into two little baskets.

### motor-target.png

Only the lavender pebble companion reaching out to gently touch the center of a large upright peach paper target.

### motor-tracking.png

Only the turquoise pear companion reaching toward a small lavender paper butterfly with a short curved dotted flight trail.

### home.png

The turquoise pear companion seated beside a small potted sprout, watering it with a tiny watering can. The lavender pebble watches the sprout seated on the other side. Neither is walking.

### catalog.png

The lavender pebble companion opening a little box containing colorful paper play shapes, the turquoise pear peeking curiously over the box from behind. Neither is walking.

### achievements.png

Only the lavender pebble companion proudly holding a small paper star rosette with ribbons, a few tiny confetti scraps nearby.

### therapist.png

Also reused, unchanged, on the right of the professional login introduction.
Render through `HeaderIllustration`, with multiply on the lilac panel and the
shared white backing in contrast modes. No new generation or crop was needed.

Only the turquoise pear companion sitting on a simple stool, thoughtfully holding a clipboard with abstract strokes, with a small plant beside the stool. No medical symbols or uniform.

### rest.png

Only the lavender pebble companion reclining on a soft sage cushion, eyes gently closed, a tiny cup beside it.

## Background correction

The initial outputs for visual-scanning, word-completion, memory-pairs, daily-sequencing, categorization, motor-target, home, therapist, rest had baked checkerboards. Those variants were rejected and edited with the built-in tool using their generated illustration as the edit target and this exact prompt:

Edit only the background of the supplied illustration. Preserve the character, props, pose, proportions, colors and paper texture exactly. REMOVE the entire gray checkerboard pattern and any background wrinkles. Replace with a perfectly flat pure white (#FFFFFF) background. White empty corners and white around all limbs and props. No checkerboard, no grid, no paper background texture, no gray, no shadow. Keep the full scene and square canvas.

The corrected white-backed outputs use CSS multiply on standard pastel surfaces. The other five files retain generated alpha. Contrast modes give all scenes a rounded white backing and normal blending for visible ink details. No CSS crop; use object-fit contain. High-resolution generator originals remain outside the repository; deployed copies are resized to 512px with macOS sips, preserving alpha where present.
