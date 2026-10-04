import {createLiveRoundSession,LIVE_ROUND_GAMES} from './liveRoundSession.ts';
import {createSessionEvidence} from './sessionEvidence.ts';

/** External recording lifecycle. Readiness means start events are queued before
 * React mounts the input surface; subscriptions do not depend on React state. */
export function createSessionRecording(options:Parameters<typeof createLiveRoundSession>[0]&{enabled:boolean;adaptive:boolean}) {
 const rounds=options.enabled&&options.adaptive&&LIVE_ROUND_GAMES.has(options.exerciseId)?createLiveRoundSession(options):undefined;
 const evidence=rounds?.evidence??(options.enabled?createSessionEvidence({sessionId:options.id,exerciseId:options.exerciseId,activeNow:options.activeNow,sink:options.sink}):undefined);
 let ready=!evidence;
 const listeners=new Set<()=>void>();
 return {evidence,rounds,isReady:()=>ready,
  subscribeReady:(listener:()=>void)=>{listeners.add(listener);return ()=>{listeners.delete(listener);};},
  start:()=>{
   if(ready)return;
   if(rounds)rounds.start();else evidence?.start(options.level,options.mode,options.locked);
   ready=true;listeners.forEach(listener=>listener());
  },
 };
}
