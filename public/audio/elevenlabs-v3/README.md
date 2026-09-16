# NeuroIA — approved Eleven v3 voice direction

The user approved `approved-words.mp3`, reading Taza, Zapato, Tijeras, Cepillo,
Bicicleta and Girasol together. That approval supersedes the v2 pronunciation
trials; it is not a listening review of every newly generated file.

- Provider: ElevenLabs (https://elevenlabs.io).
- Voice: Alejandro Castellanos (`WWVK6dYMrl0ZHnHT7cRj`).
- Model: Eleven v3; language override: Spanish (`es`); stability: 0.5.
- The website creates two generations per submission. This collection saves
  generation 1. v3 does not expose the v2 speed/similarity/style controls.
- Free-plan recordings for non-commercial evaluation with attribution. Do not
  use in a commercial release without appropriately licensed new recordings.
- The shared narrator now uses available clips, with browser speech fallback for
  pending or unplayable files. Attribution appears in accessibility settings.

`texts.json` is the full speech inventory. `blocks.json` maps generation requests
to clips. `manifest.json` lists available and pending individual recordings.
The collection contains audio files and metadata only; no preview page is shipped.
The indexer also regenerates `src/services/speechRecordings.json`, the compact
runtime lookup. Regenerate it whenever the audio inventory changes.

Words are generated in short lists using ordinary spelling and punctuation,
matching the approved sample's context. Original MP3 lists remain intact.
`scripts/index_elevenlabs_v3.py` validates decoded audio and extracts individual
WAV clips only if the detected pause count agrees exactly with the expected word
count. Crops retain leading/trailing padding; speech is not time-stretched.
Ambiguous lists are reported in `segmentationIssues` instead of assigning
potentially incorrect clips. Timing and file checks do not validate pronunciation;
listen to the new words and phonetic hints before final adoption.

To continue, compare `blocks.json` against saved MP3 files, use the visible
ElevenLabs browser with the settings above, and generate only missing blocks.
Confirm the displayed voice after changing models: ElevenLabs can select a
different default voice. Stop on quota restrictions and inspect History before
retrying an uncertain submission. Never save authentication data in this folder.
Run the index script after a batch using Python with NumPy and soundfile installed.
Rejected prototype collections have been removed from the repository. Do not merge or deploy this collection without
an explicit request.

## Current generation status

Generation stopped when ElevenLabs showed 6 credits and an upgrade screen for
the next 57-character UI request. 279 of 370 inventory clips are available; 91
feedback clips remain in `pending.json`. All instructions, vocabulary words and
hints are present. `generation-status.json` records the stop. No subscription
upgrade was made. Resume only after credits become available, skipping existing
blocks. Refresh pending.json and this status when continuing.

Four final downloads initially contained only 0.313 seconds of audio. The complete
recordings were recovered from History without regenerating them. For subsequent
batches, wait for finished playback/download availability and reject implausibly
short sentences before marking a file available. The indexer now checks this.
