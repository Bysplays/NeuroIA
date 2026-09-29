# Muse 2 Web Bluetooth

The application adapter in `src/services/museAdapter.ts` and packet decoders in
`src/services/museSignal.ts` adapt the BLE protocol and command framing from
[Respiire/MuseJS](https://github.com/Respiire/MuseJS), commit
`cb9e1d3038d0efb4fd10f41b0c9814c37b1bfd78`, reviewed on 2026-09-29.
Copyright (c) 2022 Respiire Health Systems, MIT. The complete license ships in
[public/licenses/MuseJS.txt](../../public/licenses/MuseJS.txt) and is linked in About.
No Muse commercial SDK code is included.

The adaptation uses typed event listeners instead of polling circular buffers,
awaits notification setup sequentially, propagates connection errors, handles
cancellation/late GATT completion, and disposes listeners and the GATT connection.
The service filter is 0xFE8D; commands h/p50/s/d start EEG + PPG. Subscriptions are
four EEG channels (0003–0006), infrared PPG (0010) and battery telemetry (000b).
No motion, AUX, red or ambient PPG subscriptions are installed. The p50 hardware
preset itself may produce other sensor data; the app neither subscribes nor saves it.

EEG packets contain a big-endian 16-bit counter and twelve packed 12-bit samples,
converted with `(ADC - 2048) * 0.48828125` µV. PPG packets contain a counter and six
unsigned 24-bit samples. Battery uses the telemetry word at byte 2 divided by 512.
Only correctly sized packets are decoded, respecting DataView offsets.

See [integration guide](../../docs/eeg/README.md) for signal summaries, recording,
platform limits and remaining hardware acceptance. This is an independent
integration, not an official Muse SDK or an endorsement.
