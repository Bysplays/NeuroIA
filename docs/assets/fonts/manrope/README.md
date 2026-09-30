# Report typography

Manrope Regular (400) and Bold (700) are local static TTF instances of the Manrope
variable font published at https://github.com/google/fonts/tree/main/ofl/manrope.
Source: `Manrope[wght].ttf`, fetched 2026-09-30. The SIL Open Font License is in
[OFL.txt](OFL.txt). Static instances were produced with fontTools
`instantiateVariableFont(font, {'wght': 400/700})`, without altering glyph artwork.

Runtime: `public/fonts/manrope/Manrope-Regular.ttf` and `Manrope-Bold.ttf`.
The PDF renderer embeds these fonts to preserve Spanish accents and selectable
text. They are fetched only when generating a report; existing interface font
loading is unchanged. The PDF logo uses the supplied `public/brand/neuroia-logo.svg`.
