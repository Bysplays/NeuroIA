import {MUSE_BANDS,MUSE_CHANNELS,type MuseFeatureFrame} from './museFeatures.ts';
const mean=(values:number[])=>values.reduce((sum,n)=>sum+n,0)/values.length;
/** Five initial valid windows versus five later windows, independently per
 * electrode. Relative band-power differences are measurements, not mental states.
 */
export function createMuseBaseline() {
  const channels=MUSE_CHANNELS.map(()=>({baseline:[] as number[][],recent:[] as number[][],at:-Infinity}));
  return {
    add(frame:MuseFeatureFrame,at:number) {
      frame.channels.forEach((channel,i)=>{
        const state=channels[i];
        if(at-state.at>3000){state.recent=[];if(state.baseline.length<5)state.baseline=[];}
        state.at=at;
        if(channel.quality!=='valid'||!channel.power){state.recent=[];if(state.baseline.length<5)state.baseline=[];return;}
        const total=MUSE_BANDS.reduce((sum,band)=>sum+channel.power![band],0);
        if(total<=0){state.recent=[];if(state.baseline.length<5)state.baseline=[];return;}
        const relative=MUSE_BANDS.map(band=>channel.power![band]/total);
        if(state.baseline.length<5)state.baseline.push(relative);
        else {state.recent.push(relative);if(state.recent.length>5)state.recent.shift();}
      });
    },
    snapshot(at:number) {
      return channels.map((state,i)=>({channel:MUSE_CHANNELS[i],baselineWindows:state.baseline.length,
        deltas:state.baseline.length===5 && state.recent.length===5 && at-state.at<=3000
          ? MUSE_BANDS.map((_,band)=>Math.max(-1,Math.min(1,mean(state.recent.map(frame=>frame[band]))-mean(state.baseline.map(frame=>frame[band]))))) : null}));
    },
  };
}
