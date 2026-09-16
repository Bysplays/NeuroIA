# Organization object atlas

Generated with the built-in `image_gen` tool, 2026-09-14. A single sheet combines the objects from `game-objects-0.png` and `game-objects-1.png`. The first assembly had a baked checkerboard and was rejected; the final extraction has verified alpha. Original object identities and row-major order are retained; answer keys are unchanged. The transparent option in `GameObject` is enabled only by the two Organization games.

Layout: 8 columns × 10 rows, 80 objects in row-major order. Rows 1–5 correspond to original sheet 0; rows 6–10 correspond to sheet 1. Existing `gameArtwork.json` cell IDs select the exact same objects. The generated positions drift slightly from a regular grid, so `src/services/organizationArtwork.json` records measured alpha bounding boxes (pixel coordinates on the unchanged 1122 × 1402 source). The renderer adds one pixel of edge padding and contains the crop inside the existing square hit-independent illustration area. Do not replace these measured crops with uniform cell cuts: those clip objects and reveal neighboring strokes.

## Assembly prompt

Background extraction and sprite-sheet assembly. Input images 1 and 2 are the exact artwork to preserve. Input 3 is an example of genuine alpha transparency only. Create ONE PNG atlas with exactly 8 columns and 10 equal square rows: the 40 cells of input 1 occupy rows 1-5 unchanged in their original order; the 40 cells of input 2 occupy rows 6-10 unchanged in their original order. Preserve EVERY object's identity, colors, grainy cut-paper texture and full silhouette. Remove only the white cell backgrounds and thin grid lines. Keep white interior parts of objects opaque (socks, shirt, tooth, bread, plate, book etc). Make empty space around objects genuinely transparent like input 3. Transparent PNG cutouts, no drawn checkerboard. No new drawings, no objects moved between cells, no labels or numbers. Exact 8:10 aspect ratio, centered objects within 80% of each cell. 80 objects total.

## Final extraction prompt

Extract all 80 illustrated objects from image 1 onto a truly transparent PNG background, like the actual transparent cutouts in image 2. Image 2 is only an alpha transparency reference; do not copy its characters. Keep the exact 8 columns by 10 rows layout and each object's identity, position, color, paper texture and internal white details. The gray checkerboard must be removed, not redrawn. No backdrop. Transparent background. No grid lines. No new objects. 8:10 aspect ratio.
