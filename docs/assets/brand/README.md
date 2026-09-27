# NeuroIA brand mark

## Source

The owner supplied [supplied-mark.png](supplied-mark.png) on 2026-09-27: a mint
organic branching mark with real alpha transparency. This unmodified 277 × 441
PNG is the canonical source. Its opaque fill is approximately #85b8ae. No image
generator, prompt, tracing or recoloring was used. The previous two-leaf sprout
has been replaced throughout the interface; companion artwork is unchanged.

## Runtime variants

Paths below are repository-relative. The SVG files are layouts containing the
exact source PNG as a base64 data URI, not vector redraws. Embedding makes each
file self-contained, including when the README loads its wordmark as an image.

- `public/brand/neuroia-mark.svg`: 80 × 80 viewBox; the source is centered in a
  50 × 80 image box at x=15, y=0 with `preserveAspectRatio="xMidYMid meet"`.
  Transparency, tall proportions and original pixels are preserved.
- `public/brand/neuroia-logo.svg`: 300 × 80 viewBox; the same mark and the existing
  NeuroIA wordmark at x=90, y=54, using DM Sans/system fallback, size 42.
- `public/brand/neuroia-favicon.svg`: same mark on an 80 × 80 #edf5f3 tile with
  18px rounded corners, for light/dark tab visibility.

Existing consumers keep their Vite-base-aware asset URLs: login, shared header,
professional header, loading, access recovery and memory-card backs. The README
uses the updated wordmark and small mark. Decorative companion visibility does
not hide the brand. Check the logo at 16/32/40px as well as larger displays.

## Installation icons

`public/brand/icon-192.png`, `icon-512.png` and `apple-touch-icon.png` (180px)
are Chromium rasterizations at device scale factor 1. To reproduce, render a
square HTML canvas with solid #edf5f3 background, centered `neuroia-mark.svg` at
70% of both dimensions, and take a viewport-sized PNG screenshot after image
load. The symbol stays within the Android maskable safe zone. No AI or new
artwork is involved in these exports.

The favicon, Apple icon and manifest icon URLs use `?v=2` to refresh prior cached
artwork. Manifest URLs remain relative and HTML asset references retain Vite base
rewriting for root and repository deployments. Verify physical-device icon refresh
and installation as part of the existing Android/iPad release checklist.
