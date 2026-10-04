import type { EvidenceEvent } from './sessionEvidence.ts';
import { createMuseBaseline } from './museBaseline.ts';
import { EXERCISE_IDS, validLevel } from './difficulty.ts';

const clamp=(n:number,min=-1,max=1)=>Math.max(min,Math.min(max,n));
const mean=(values:number[])=>values.reduce((sum,n)=>sum+n,0)/values.length;

/** Bounded recent evidence only. Spectrum changes are measurements relative to
 * the first five consecutive valid windows, not attention/fatigue indicators.
 */
export function createAdaptationObservation(exerciseId:string) {
  let level=1, hints=0, trackingMs=0, contactMs=0;
  const responses:{latency:number;error:number}[]=[];
  const firstLatencies:number[]=[];
  const eeg=createMuseBaseline();
  const beginLevel=(nextLevel:number)=>{
      if(!validLevel(nextLevel))throw Error('invalid-observation-level');
      level=nextLevel;hints=0;trackingMs=0;contactMs=0;responses.length=0;firstLatencies.length=0;
      // EEG baseline belongs to the session; changing task level does not create
      // a fictitious new physiological baseline.
  };
  return {
    beginLevel,
    add(event:EvidenceEvent) {
      if (event.kind==='start') level=event.level;
      if (event.kind==='round-start'&&event.level!==level)beginLevel(event.level);
      if (event.kind==='hint') hints++;
      if (event.kind==='response') {
        if (firstLatencies.length<3 && event.latencyMs>0) firstLatencies.push(event.latencyMs);
        responses.push({latency:event.latencyMs,error:Number(!event.correct)});
        if (responses.length>20) responses.shift();
      }
      if (event.kind==='tracking') {trackingMs+=event.durationMs;contactMs+=event.contactMs;}
      if (event.kind==='eeg') eeg.add(event.frame,event.activeMs);
    },
    snapshot(activeMs:number) {
      const recent=responses.slice(-4), previous=responses.slice(-8,-4);
      const responseMask=responses.length>=3;
      const baseline=firstLatencies.length===3 ? mean(firstLatencies) : 0;
      const latency=recent.length ? mean(recent.map(r=>r.latency)) : 0;
      const vector=EXERCISE_IDS.map(id=>Number(id===exerciseId));
      vector.push((level-1)/9,responseMask ? mean(recent.map(r=>r.error)) : 0,
        responseMask && previous.length ? mean(recent.map(r=>r.error))-mean(previous.map(r=>r.error)) : 0,
        responseMask && baseline>0 && latency>0 ? clamp(Math.log2(latency/baseline)/2) : 0,
        responseMask ? clamp(hints/responses.length,0,1) : 0,Number(responseMask),
        trackingMs>=3000 ? contactMs/trackingMs : 0,Number(trackingMs>=3000));
      const channels=eeg.snapshot(activeMs);
      channels.forEach(channel=>vector.push(...(channel.deltas ?? [0,0,0,0,0])));
      vector.push(...channels.map(channel=>Number(channel.deltas!==null)));
      return {vector,level,eligible:responseMask || trackingMs>=3000};
    },
  };
}
