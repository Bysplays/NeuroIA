import type { EvidenceEvent } from './sessionEvidence.ts';
import { MUSE_BANDS, MUSE_CHANNELS } from './museFeatures.ts';
import { EXERCISE_IDS } from './difficulty.ts';

const clamp=(n:number,min=-1,max=1)=>Math.max(min,Math.min(max,n));
const mean=(values:number[])=>values.reduce((sum,n)=>sum+n,0)/values.length;

/** Bounded recent evidence only. Spectrum changes are measurements relative to
 * the first five consecutive valid windows, not attention/fatigue indicators.
 */
export function createAdaptationObservation(exerciseId:string) {
  let level=1, hints=0, trackingMs=0, contactMs=0;
  const responses:{latency:number;error:number}[]=[];
  const firstLatencies:number[]=[];
  const channels=MUSE_CHANNELS.map(()=>({baseline:[] as number[][],recent:[] as number[][],at:-Infinity}));
  return {
    add(event:EvidenceEvent) {
      if (event.kind==='start') level=event.level;
      if (event.kind==='hint') hints++;
      if (event.kind==='response') {
        if (firstLatencies.length<3 && event.latencyMs>0) firstLatencies.push(event.latencyMs);
        responses.push({latency:event.latencyMs,error:Number(!event.correct)});
        if (responses.length>20) responses.shift();
      }
      if (event.kind==='tracking') {trackingMs+=event.durationMs;contactMs+=event.contactMs;}
      if (event.kind==='eeg') event.frame.channels.forEach((frame,i)=>{
        const state=channels[i];
        if (event.activeMs-state.at>3000) {state.recent=[];if(state.baseline.length<5) state.baseline=[];}
        state.at=event.activeMs;
        if (frame.quality!=='valid' || !frame.power) {state.recent=[];if(state.baseline.length<5) state.baseline=[];return;}
        const total=MUSE_BANDS.reduce((sum,band)=>sum+frame.power![band],0);
        if (total<=0) {state.recent=[];return;}
        const relative=MUSE_BANDS.map(band=>frame.power![band]/total);
        if (state.baseline.length<5) state.baseline.push(relative);
        else {state.recent.push(relative);if(state.recent.length>5) state.recent.shift();}
      });
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
      const masks=channels.map(channel=>channel.baseline.length===5 && channel.recent.length===5 && activeMs-channel.at<=3000);
      channels.forEach((channel,i)=>{
        for(let band=0;band<5;band++) vector.push(masks[i] ? clamp(mean(channel.recent.map(frame=>frame[band]))-mean(channel.baseline.map(frame=>frame[band]))) : 0);
      });
      vector.push(...masks.map(Number));
      return {vector,level,eligible:responseMask || trackingMs>=3000};
    },
  };
}
