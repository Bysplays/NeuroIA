import type { EegAdapter } from './eegService.ts';
import { createMuseSignal, createMusePpgSignal, MUSE_AMPLITUDE, MUSE_PPG } from './museSignal.ts';

// Adapted from Respiire/MuseJS (MIT). See vendor/muse/README.md and public/licenses/MuseJS.txt.
export const MUSE_SERVICE = 0xfe8d;
const uuid = (suffix: string) => `273e${suffix}-4c4d-454d-96be-f03bac821358`;
export interface MuseCharacteristic extends EventTarget {
  value?: DataView;
  startNotifications(): Promise<unknown>;
  writeValue(value: Uint8Array<ArrayBuffer>): Promise<void>;
}
export interface MuseDevice extends EventTarget {
  gatt?: {
    connected: boolean;
    connect(): Promise<unknown>;
    disconnect(): void;
    getPrimaryService(uuid: number): Promise<{ getCharacteristic(uuid: string): Promise<MuseCharacteristic> }>;
  };
}
export interface MuseBluetooth {
  requestDevice(options: { filters: { services: number[] }[] }): Promise<MuseDevice>;
}
const browserBluetooth = () => typeof navigator !== 'undefined' && globalThis.isSecureContext
  ? (navigator as Navigator & { bluetooth?: MuseBluetooth }).bluetooth : undefined;

export function encodeMuseCommand(command: string) {
  const bytes = new TextEncoder().encode(`X${command}\n`);
  bytes[0] = bytes.length - 1;
  return bytes;
}

export function createMuseAdapter(getBluetooth: () => MuseBluetooth | undefined = browserBluetooth): EegAdapter {
  // A canceled in-flight GATT open must settle before the same device can be reused.
  const busy = new WeakSet<MuseDevice>();
  return {
    id: 'muse2-webbluetooth-v1', metric: MUSE_AMPLITUDE, ppgMetric: MUSE_PPG,
    supported: () => typeof getBluetooth()?.requestDevice === 'function',
    async connect(events, signal) {
      const bluetooth = getBluetooth();
      if (!bluetooth || signal.aborted) throw new DOMException('Bluetooth unavailable', 'AbortError');
      let device: MuseDevice | undefined;
      let owned = false, stopped = false, setupDone = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const listeners: [EventTarget, string, EventListener][] = [];
      let rejectStopped!: (reason: unknown) => void;
      const cancelled = new Promise<never>((_, reject) => { rejectStopped = reject; });
      const cleanup = () => {
        stopped = true;
        clearTimeout(timer);
        signal.removeEventListener('abort', abort);
        for (const [target, type, listener] of listeners.splice(0)) target.removeEventListener(type, listener);
        if (owned && device) {
          device.gatt?.disconnect();
          if (setupDone) { busy.delete(device); owned = false; }
        }
      };
      const abort = () => { cleanup(); rejectStopped(new DOMException('Connection canceled', 'AbortError')); };
      const check = () => { if (stopped || signal.aborted) throw new DOMException('Connection canceled', 'AbortError'); };
      const listen = (target: EventTarget, type: string, listener: EventListener) => {
        target.addEventListener(type, listener); listeners.push([target, type, listener]);
      };
      signal.addEventListener('abort', abort, { once: true });
      // requestDevice runs before any await, preserving the explicit click gesture.
      const setup = async () => {
        try {
          device = await bluetooth.requestDevice({ filters: [{ services: [MUSE_SERVICE] }] });
          check();
          if (!device.gatt || busy.has(device)) throw new Error('Device is busy or has no GATT server');
          busy.add(device); owned = true;
          timer = setTimeout(() => { cleanup(); rejectStopped(new Error('Bluetooth connection timed out')); }, 15000);
          listen(device, 'gattserverdisconnected', () => { cleanup(); rejectStopped(new Error('Device disconnected')); events.disconnected(); });
          await device.gatt.connect(); check();
          const service = await device.gatt.getPrimaryService(MUSE_SERVICE); check();
          const control = await service.getCharacteristic(uuid('0001')); check();
          await control.startNotifications(); check();
          const processor = createMuseSignal((value, quality) => { if (!stopped) events.sample(value, quality); });
          for (let channel = 0; channel < 4; channel++) {
            const characteristic = await service.getCharacteristic(uuid(`000${channel + 3}`)); check();
            listen(characteristic, 'characteristicvaluechanged', () => {
              if (!stopped && characteristic.value) processor.push(channel, characteristic.value, Date.now());
            });
            await characteristic.startNotifications(); check();
          }
          const ppg = await service.getCharacteristic(uuid('0010')); check();
          const ppgProcessor = createMusePpgSignal((value, quality) => { if (!stopped) events.ppg?.(value, quality); });
          listen(ppg, 'characteristicvaluechanged', () => {
            if (!stopped && ppg.value) ppgProcessor.push(ppg.value, Date.now());
          });
          await ppg.startNotifications(); check();
          const battery = await service.getCharacteristic(uuid('000b')); check();
          listen(battery, 'characteristicvaluechanged', () => {
            if (!stopped && battery.value && battery.value.byteLength >= 4) events.battery?.(battery.value.getUint16(2) / 512);
          });
          await battery.startNotifications(); check();
          for (const command of ['h', 'p50', 's', 'd']) {
            await control.writeValue(encodeMuseCommand(command)); check();
          }
          clearTimeout(timer);
          return { disconnect: cleanup };
        } finally {
          setupDone = true;
          if (stopped) cleanup();
        }
      };
      try { return await Promise.race([setup(), cancelled]); }
      catch (error) { cleanup(); throw error; }
    },
  };
}
