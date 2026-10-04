import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMuseBaseline} from '../src/services/museBaseline.ts';
import {museFeatureFrame} from '../src/services/museFeatures.ts';
import {createEegService,type EegAdapter} from '../src/services/eegService.ts';
const wave=(hz:number)=>Array.from({length:256},(_,i)=>20*Math.sin(2*Math.PI*hz*i/256));
const frame=(seq:number,hz=10)=>museFeatureFrame(seq,[wave(hz),wave(6),undefined,wave(35)]);
test('channel reference needs consecutive usable windows and gaps restart incomplete calibration',()=>{
  const baseline=createMuseBaseline();for(let i=0;i<4;i++)baseline.add(frame(i),i*1000);
  baseline.add(frame(4),8000);assert.equal(baseline.snapshot(8000)[0].baselineWindows,1);
  const silent=frame(5);silent.channels[0].power={delta:0,theta:0,alpha:0,beta:0,gamma:0};
  baseline.add(silent,9000);assert.equal(baseline.snapshot(9000)[0].baselineWindows,0);
});
test('relative changes preserve independent channels and expire instead of showing zeros as measurements',()=>{
  const baseline=createMuseBaseline();for(let i=0;i<10;i++)baseline.add(frame(i,i<5?10:20),i*1000);
  const snapshot=baseline.snapshot(9000);
  assert.ok(snapshot[0].deltas![2]<-.9);assert.ok(snapshot[0].deltas![3]>.9);
  assert.deepEqual(snapshot[1].deltas,[0,0,0,0,0]);assert.equal(snapshot[2].deltas,null);
  assert.equal(baseline.snapshot(13000)[0].deltas,null);
});
test('connection-scoped baseline clears on disconnect and ignores obsolete adapter callbacks',async()=>{
  const service=createEegService();let events!:Parameters<EegAdapter['connect']>[0];
  service.install({id:'fixture',metric:{id:'rms',label:'RMS',unit:'µV',min:0,max:999},supported:()=>true,
    async connect(next){events=next;return {disconnect(){}};}});
  await service.connect(true);for(let i=0;i<10;i++)events.channels!(frame(i,i<5?10:20));
  assert.ok(service.getBaseline()[0].deltas);
  service.disconnect();events.channels!(frame(11));
  assert.equal(service.getBaseline()[0].baselineWindows,0);
  await service.connect(true);assert.equal(service.getBaseline()[0].deltas,null);
});
