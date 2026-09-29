import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMuseAdapter, encodeMuseCommand, MUSE_SERVICE, type MuseCharacteristic, type MuseDevice } from '../src/services/museAdapter.ts';
import { createMuseSignal, createMusePpgSignal, decodeMusePacket, decodeMusePpgPacket } from '../src/services/museSignal.ts';

function eegPacket(index: number, samples = Array.from({ length: 12 }, (_, i) => 2048 + (i % 2 ? 20 : -20))) {
  const bytes = new Uint8Array(24); const view = new DataView(bytes.buffer, 2, 20); // nonzero offset
  view.setUint16(0, index);
  for (let i = 0; i < 12; i += 2) {
    const offset = 2 + i / 2 * 3;
    view.setUint8(offset, samples[i] >> 4); view.setUint8(offset + 1, ((samples[i] & 15) << 4) | samples[i + 1] >> 8); view.setUint8(offset + 2, samples[i + 1] & 255);
  }
  return view;
}
function ppgPacket(index: number) {
  const view = new DataView(new ArrayBuffer(20)); view.setUint16(0, index);
  for (let i = 0; i < 6; i++) {
    const value = 100000 + (i % 2 ? 1000 : -1000), offset = 2 + i * 3;
    view.setUint8(offset, value >> 16); view.setUint8(offset + 1, value >> 8 & 255); view.setUint8(offset + 2, value & 255);
  }
  return view;
}
test('Muse decoders respect byte offsets, lengths, units and command framing', () => {
  assert.deepEqual(decodeMusePacket(eegPacket(65535))?.samples.slice(0, 2), [-9.765625, 9.765625]);
  assert.equal(decodeMusePacket(eegPacket(65535))?.index, 65535);
  assert.equal(decodeMusePacket(new DataView(new ArrayBuffer(19))), undefined);
  assert.deepEqual(decodeMusePpgPacket(ppgPacket(2))?.samples.slice(0, 2), [99000, 101000]);
  assert.deepEqual([...encodeMuseCommand('p50')], [4,112,53,48,10]);
});
test('EEG requires four aligned channels, rejects gaps/flatlines and handles counter wrap', () => {
  const values: [number,string][] = [];
  const signal = createMuseSignal((v,q) => values.push([v,q]));
  for (let i = 0; i < 22; i++) for (const channel of [2,0,3,1]) signal.push(channel, eegPacket((65530 + i) % 65536), i * 47 + 1);
  assert.deepEqual(values, [[9.765625, 'good']]);
  for (let channel = 0; channel < 4; channel++) signal.push(channel, eegPacket(18), 1100);
  assert.equal(values.at(-1)?.[1], 'poor');
  values.length = 0;
  const flat = createMuseSignal((v,q) => values.push([v,q]));
  for (let i = 0; i < 22; i++) for (let channel = 0; channel < 4; channel++) flat.push(channel, eegPacket(i, Array(12).fill(2048)), i * 47 + 1);
  assert.deepEqual(values, [[0,'poor']]);
});
test('PPG summarizes infrared amplitude, ignores duplicate packets and invalidates losses', () => {
  const values: [number,string][] = []; const signal=createMusePpgSignal((v,q)=>values.push([v,q]));
  for(let i=0;i<11;i++) { signal.push(ppgPacket(i),i*94+1); signal.push(ppgPacket(i),i*94+2); }
  assert.deepEqual(values,[[1,'good']]);
  signal.push(ppgPacket(12),1200);assert.equal(values.at(-1)?.[1],'poor');
});
class Characteristic extends EventTarget implements MuseCharacteristic {
  value?: DataView;
  commands: string[] = [];
  started = false;
  async startNotifications() { this.started = true; }
  async writeValue(bytes: Uint8Array) { this.commands.push(new TextDecoder().decode(bytes.subarray(1))); }
  emit(value: DataView) { this.value=value; this.dispatchEvent(new Event('characteristicvaluechanged')); }
}
function fixture() {
  const chars = new Map<string, Characteristic>();
  let closes=0, opens=0;
  const device: MuseDevice = new EventTarget();
  device.gatt={connected:false,async connect(){opens++;this.connected=true;},disconnect(){closes++;this.connected=false;},async getPrimaryService(service){assert.equal(service,MUSE_SERVICE);return {async getCharacteristic(id){const c=new Characteristic();chars.set(id.slice(4,8),c);return c;}};}};
  return {device,chars,opens:()=>opens,closes:()=>closes};
}
test('adapter requests synchronously, subscribes only EEG/IR PPG/battery and cleans up on abort', async () => {
  const f=fixture();let requested=false;const samples:number[]=[];const batteries:number[]=[];
  const adapter=createMuseAdapter(()=>({requestDevice(options){requested=true;assert.deepEqual(options,{filters:[{services:[MUSE_SERVICE]}]});return Promise.resolve(f.device);}}));
  const controller=new AbortController();const pending=adapter.connect({sample:v=>samples.push(v),battery:v=>batteries.push(v),disconnected(){}},controller.signal);
  assert.equal(requested,true);await pending;
  assert.deepEqual([...f.chars.keys()],['0001','0003','0004','0005','0006','0010','000b']);
  assert.deepEqual(f.chars.get('0001')!.commands,['h\n','p50\n','s\n','d\n']);
  const battery=new DataView(new ArrayBuffer(10));battery.setUint16(2,75*512);f.chars.get('000b')!.emit(battery);assert.deepEqual(batteries,[75]);
  controller.abort();f.chars.get('000b')!.emit(battery);assert.deepEqual(batteries,[75]);assert.ok(f.closes()>0);
});
test('canceling the device chooser never opens GATT on a late selected device', async () => {
  const f=fixture();let choose!:(device:MuseDevice)=>void;
  const adapter=createMuseAdapter(()=>({requestDevice:()=>new Promise(resolve=>{choose=resolve;})}));
  const controller=new AbortController();const pending=adapter.connect({sample(){},disconnected(){}},controller.signal);
  controller.abort();await assert.rejects(pending,{name:'AbortError'});choose(f.device);await new Promise(resolve=>setTimeout(resolve,0));assert.equal(f.opens(),0);
});
test('permission rejection and notification failure remain retryable', async () => {
  const f=fixture();let fail=true;
  const adapter=createMuseAdapter(()=>({requestDevice:async()=>{if(fail)throw new DOMException('denied','NotFoundError');return f.device;}}));
  await assert.rejects(adapter.connect({sample(){},disconnected(){}},new AbortController().signal));
  fail=false;const connection=await adapter.connect({sample(){},disconnected(){}},new AbortController().signal);connection.disconnect();assert.ok(f.closes()>0);
});
test('abort during GATT setup closes late connections without touching a subsequent connection', async () => {
  const f=fixture(); let opened!:()=>void;
  f.device.gatt!.connect=()=>new Promise<void>(resolve=>{opened=()=>{f.device.gatt!.connected=true;resolve();};});
  const adapter=createMuseAdapter(()=>({requestDevice:async()=>f.device}));
  const controller=new AbortController();const old=adapter.connect({sample(){},disconnected(){}},controller.signal);
  await new Promise(resolve=>setTimeout(resolve,0));controller.abort();await assert.rejects(old);
  await assert.rejects(adapter.connect({sample(){},disconnected(){}},new AbortController().signal),/busy/);
  opened();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(f.device.gatt!.connected,false);
  f.device.gatt!.connect=async()=>{f.device.gatt!.connected=true;};
  const next=await adapter.connect({sample(){},disconnected(){}},new AbortController().signal);
  assert.equal(f.device.gatt!.connected,true);next.disconnect();
});
test('unexpected transport loss reports disconnection and disposes notification listeners', async () => {
  const f=fixture();let lost=0;let battery=0;
  const adapter=createMuseAdapter(()=>({requestDevice:async()=>f.device}));
  await adapter.connect({sample(){},battery(){battery++;},disconnected(){lost++;}},new AbortController().signal);
  f.device.dispatchEvent(new Event('gattserverdisconnected'));
  f.chars.get('000b')!.emit(new DataView(new ArrayBuffer(10)));
  assert.equal(lost,1);assert.equal(battery,0);
});
test('notification setup failure closes GATT and permits a clean retry', async () => {
  const f=fixture();const service=f.device.gatt!.getPrimaryService;
  f.device.gatt!.getPrimaryService=async()=>({getCharacteristic:async()=>{throw Error('notification unavailable');}});
  const adapter=createMuseAdapter(()=>({requestDevice:async()=>f.device}));
  await assert.rejects(adapter.connect({sample(){},disconnected(){}},new AbortController().signal),/notification unavailable/);
  assert.equal(f.device.gatt!.connected,false);f.device.gatt!.getPrimaryService=service;
  const next=await adapter.connect({sample(){},disconnected(){}},new AbortController().signal);next.disconnect();
});
