import {performance} from 'node:perf_hooks';
import {policyLogits} from '../../src/services/adaptivePolicy.ts';
import vectors from '../../vendor/adaptation/parity.json' with {type:'json'};
const times=[];
for(let i=0;i<10000;i++){
  const before=performance.now();policyLogits(vectors[i%vectors.length].observation);
  times.push(performance.now()-before);
}
times.sort((a,b)=>a-b);
const metrics={scope:'local CPU inference only; not BLE/network/end-to-end latency',samples:times.length,
  p50Ms:times[Math.floor(times.length*.5)],p95Ms:times[Math.floor(times.length*.95)],p99Ms:times[Math.floor(times.length*.99)],maxMs:times.at(-1)};
console.log(JSON.stringify(metrics,null,2));
if(metrics.p99Ms>=1000) process.exitCode=1;
