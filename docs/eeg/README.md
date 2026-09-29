# EEG integration handoff

The target is **Muse 2**. The application now installs an independent Web Bluetooth
adapter based on the owner-selected [Respiire/MuseJS](https://github.com/Respiire/MuseJS).
No official SDK is required for this path. See [source/license](../../vendor/muse/README.md).
The owner confirms real Muse 2 connection, EEG/PPG, battery, reconnection and
saved charts. This is owner-reported hardware acceptance, separate from the
automated and browser-fixture checks.

## Signals and platforms

Only four EEG channels, infrared PPG and battery telemetry are consumed. EEG shows
one-second AC RMS averaged across four aligned channels (µV). PPG shows one-second
infrared AC RMS in thousands of ADC units (kADC). These summarize amplitude, not
mental effort, attention, heart rate or oxygen saturation. Raw samples are transient
and are never added to the account cache/outbox. Missing, clipped, flat, malformed
or incomplete windows produce gaps. This is basic integrity checking, **not**
validated electrode contact or movement-artifact classification.

During play, two compact horizontal traces show EEG/PPG and the arithmetic mean of
valid active-second summaries for that game. Means exclude pauses and gaps and are
computed before chart decimation. Detailed analytics show separate labelled plots
and tables with active timestamps. The traces are amplitude trends, not raw 256 Hz
EEG / 64 Hz PPG waveforms. Battery percentage appears only in the Bluetooth dialog;
it is reset on disconnect and is not saved with results.

[Chrome's Web Bluetooth guide](https://developer.chrome.com/docs/capabilities/bluetooth)
requires a secure context and an explicit permission gesture. Target Chrome on
Android, macOS and Windows for hardware acceptance. Other browsers must expose
Web Bluetooth; unsupported browsers display guidance. PWA installation alone does
not add support. Do not promise iPad/Safari support from this integration; a separate
supported Bluetooth browser or native bridge would require its own validation.

## Adapter contract

Implement `EegAdapter` from `src/services/eegService.ts` and install it once with
`eegService.install(adapter)` in the application bootstrap. Do not install demo
adapters in production. Determine SDK/browser compatibility before implementing
`supported()`; do not infer support solely from `navigator.bluetooth` or an old
mention of a device model.

- `id` identifies the adapter/version; metric `id`, Spanish `label`, `unit`, `min`
  and `max` must describe one documented signal summary or SDK-derived indicator. Do not derive a
  percentage of mental effort from raw electrical samples or rename signal quality
  as attention. The adapter must produce values in the declared units.
- `connect(events, signal)` is called directly by the Connect button. Request
  browser device permission before any asynchronous preparation that would lose
  the user gesture. Resolve with a **connection-scoped** `disconnect()` handle.
- Honor AbortSignal during permission/connection, remove all notifications and
  listeners on abort/disconnect, and dispose any late-opened connection. One
  canceled attempt must not close a newer connection.
- Send `sample(value, 'good' | 'poor')`. Only finite, in-range good samples count.
  Send `disconnected()` on transport loss. Reconnection is an explicit Connect
  action. Signal older than three seconds is unavailable, never zero.
- Disconnect/sign-out invalidates callbacks. No device IDs, pairing permissions,
  preference or samples are stored globally between account sessions.

Record the tested Muse 2 firmware/version and browser/OS combinations. Any future
attention or heart-rate metric needs its own specified algorithm and validation;
the current adapter provides amplitude only.

## Recording and access

The connection dialog explains saving and professional visibility and offers
“Guardar las gráficas con cada partida” (on initially). Turning it off before
connecting gives live-only display. A later disconnect keeps already recorded
points; new connections record only with their selected saving choice. Recording
is per completed exercise, including each assigned-session step, never a daily
plan aggregate. Abandoned games have no result or saved EEG. Placement/practice
never attaches EEG to progress. Repeating resets both buffers.

The GameSession active clock samples at most once per second. Instructions,
settings, the device dialog, portrait, background tabs and explicit pauses suspend
capture. Samples use active-play seconds. Bad/stale/disconnected periods are gaps.
A recording locks its first metric; a different metric later in the same game is
not spliced into that scale.

`ExerciseResult.eeg` and `ExerciseResult.ppg` are independent optional series: adapter, metric, and JSON-encoded
`[activeSeconds, valueOrNull]` points. At 120 samples, pairwise reduction halves
the series and doubles the interval, preserving its duration and missing-signal
gaps. The cap is 120 points, 24 hours and 6000 characters per series (two series per result). This is a
bounded visualization, not a raw EEG recording or a precision research export.
Sparse individual points may be lost on downsampling. No derived diagnostic claim
or EEG-based difficulty adjustment is implemented.

The existing account-scoped ProgressSync outbox and result transaction save EEG
with its result and permanent receipt. It is included in the latest-60 cache and
immutable result archive. Retention is the same as the exercise result; dedicated
EEG deletion/retention management is not implemented. Existing owner/active-linked
professional read rules apply; there is no separate permission grant. Readers
validate every decoded point and show no data for malformed/absent series.
Firestore rules constrain metadata and encoded size, not the JSON's contents;
self-reported values are not authenticated device evidence.

The EEG/PPG Firestore rules are published to `ceoaberto-neuroia` (2026-09-29),
with the active release verified against `vendor/firebase/firestore.rules` after
29 demo-emulator adapter/rules/Worker tests passed. Frontend delivery uses the
main-branch Pages workflow; the owner has confirmed the core physical-device flow.
Old results remain readable without EEG.
Players and professionals open a per-exercise detail from Statistics > Historial;
professional assigned-session analytics also link each confirmed step to that view.

## Hardware acceptance scope

The owner confirms real connection, EEG/PPG, battery, reconnection and saved charts,
as well as installation and fullscreen on the tested devices. Exact OS/browser and
firmware versions were not supplied; this does not establish support for every
Android/iPad/browser combination. Keep contact/artifact classification, raw-signal
research export, heart-rate/attention inference and untested platform support outside
the confirmed feature set. Account/data deletion and retention controls remain open.
