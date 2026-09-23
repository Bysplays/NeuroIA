# NeuroIA brand mark

Asset paths in this guide refer to `public/brand/` unless a repository-relative path is given.

`public/brand/neuroia-mark.svg` is the compact icon; `public/brand/neuroia-logo.svg` adds the NeuroIA wordmark.
The mark is an abstract sprout with two organic paper-like leaves, turquoise and
lilac, with restrained layered edges and dark ink veins. It echoes the plant in
`public/images/headers/home.png` and the app's paper palette. It is a vector brand
symbol, not a replacement illustration of the raster companions.

Authored directly as SVG paths on 2026-09-16, extending the existing vector brand
assets. No generated raster or external font file is embedded. The wordmark uses
DM Sans with the app's system fallback. Both files share the same leaf geometry.
Keep the 80 × 80 viewBox and clear outer margins; test at 32–40 px and favicon size.
The icon is used by the login, app header, favicon and memory-card backs. Consumer
asset URLs retain the Vite base path. Do not add a medical cross, efficacy claim,
neon outline, or a thin vector copy of the companion mascots.

`public/brand/neuroia-favicon.svg` reuses the exact current mark on a pale rounded tile so its
ink remains readable on light and dark browser tabs. The dedicated filename
refreshes the previous favicon URL; Vite rewrites it for the Pages base path.
The repository README reuses the wordmark and existing transparent login scene;
no new mascot artwork or external font dependency is introduced.
