import {createRoundAdaptation,ROUND_BOUNDARIES} from './roundAdaptation.ts';
import {createSessionEvidence,type EvidenceChunk} from './sessionEvidence.ts';
import {encodeRoundResult} from './roundResult.ts';
import type {GameMode} from './difficulty.ts';

/** Games opt in only when their next-content handlers use the returned config. */
export const LIVE_ROUND_GAMES=new Set(['language-naming','word-completion','categorization','visual-scanning','motor-target','memory-path','memory-pairs','motor-tracking']);
export function createLiveRoundSession(options:{id:string;exerciseId:string;level:number;baseLevel:number;mode:GameMode;locked:boolean;manual:boolean;activeNow:()=>number;sink:(chunk:EvidenceChunk)=>void}) {
 const controller=createRoundAdaptation({exerciseId:options.exerciseId,level:options.level,mode:options.mode,locked:options.locked,manualLevel:options.manual});
 let started=false,closed=false,index=0,finished:{id:string;encoded:string}|undefined;
 const round=()=>`round-${index}`;
 const evidence=createSessionEvidence({sessionId:options.id,exerciseId:options.exerciseId,activeNow:options.activeNow,sink:options.sink,onEvent:event=>{
  if(event.kind==='finish'||event.kind==='abandon'){controller.close();closed=true;return;}
  if(!['start','round-start','round-decision'].includes(event.kind))controller.observe(event);
 }});
 const completeRound=()=>{
  if(!started||closed)throw Error('round-session-not-active');
  evidence.prepareRoundDecision();
  const transition=controller.complete(round(),ROUND_BOUNDARIES[options.exerciseId],Math.round(options.activeNow()));
  evidence.roundDecision(round(),transition.boundary,transition.decision);
 };
 return {
  evidence,
  config:()=>controller.snapshot().config,
  levels:()=>controller.snapshot().transitions.map(item=>item.decision.fromLevel),
  start(){
   if(started)return;
   controller.begin(round());started=true;
   evidence.start(options.level,options.mode,options.locked);evidence.roundStart(round(),options.level);
  },
  next(){
   if(!started||closed)throw Error('round-session-not-active');
   // Preserve the bounded result audit even for unlimited release gestures.
   // The final open round keeps collecting evidence and its current config.
   if(options.exerciseId==='motor-tracking' && index>=99)return controller.snapshot().config;
   completeRound();index++;
   const config=controller.begin(round());evidence.roundStart(round(),config.level);return config;
  },
  finish(resultId:string){
   if(finished){if(finished.id!==resultId)throw Error('conflicting-round-result');return finished.encoded;}
   completeRound();
   const encoded=encodeRoundResult(controller.snapshot().transitions,options.baseLevel);
   evidence.finish(resultId);finished={id:resultId,encoded};return encoded;
  },
 };
}
