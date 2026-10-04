import {decideAdaptation,type AdaptationDecision} from './adaptivePolicy.ts';
import {createAdaptationObservation} from './adaptationObservation.ts';
import {gameConfig,type GameMode} from './difficulty.ts';
import type {EvidenceEvent} from './sessionEvidence.ts';

export type RoundBoundary='question'|'search-board'|'memory-sequence'|'memory-board'|'target'|'contact-release';
export const ROUND_BOUNDARIES:Readonly<Record<string,RoundBoundary>>=Object.freeze({'visual-scanning':'search-board','language-naming':'question','word-completion':'question',categorization:'question','memory-path':'memory-sequence','memory-pairs':'memory-board','motor-target':'target','motor-tracking':'contact-release'});
export interface RoundTransition {round:string;boundary:RoundBoundary;decision:AdaptationDecision;nextStarted:boolean}
/** Controller for the experimental between-round integration. A decision never
 * mutates an active config: only explicitly beginning the next round adopts it.
 * This is local session state, not a confirmed cloud-level write. */
export function createRoundAdaptation(options:{exerciseId:string;level:number;mode:GameMode;locked:boolean;manualLevel?:boolean;now?:()=>number}){
 if(!Object.hasOwn(ROUND_BOUNDARIES,options.exerciseId))throw Error('invalid-round-exercise');
 const now=options.now??(()=>performance.now());
 const observation=createAdaptationObservation(options.exerciseId);
 observation.beginLevel(options.level);
 let current=gameConfig(options.level,options.mode);
 const plannedRounds=current.rounds,plannedTargets=current.targets,plannedContactSeconds=current.contactSeconds;
 let active:string|null=null,openOpportunity:string|null=null,closed=false;
 let pending:RoundTransition|null=null;
 const transitions:RoundTransition[]=[];
 const seen=new Set<string>();
 const configFor=(level:number)=>Object.freeze({...gameConfig(level,options.mode),rounds:plannedRounds,targets:plannedTargets,contactSeconds:plannedContactSeconds});
 return {
  begin(round:string){
   if(closed||active!==null||!round||round.length>128||seen.has(round))throw Error('invalid-round-start');
   if(pending){
    current=configFor(pending.decision.nextLevel);
    if(pending.decision.nextLevel!==pending.decision.fromLevel)observation.beginLevel(current.level);
    pending.nextStarted=true;pending=null;
   }
   seen.add(round);active=round;openOpportunity=null;return current;
  },
  observe(event:EvidenceEvent){
   if(closed||active===null)throw Error('no-active-round');
   if((event.kind==='start'||event.kind==='stimulus')&&event.level!==current.level)throw Error('round-level-mismatch');
   if(event.kind==='start')return; // Initial level is owned by this session controller.
   if(event.kind==='stimulus'){
    if(openOpportunity!==null)throw Error('unclosed-round-opportunity');
    openOpportunity=event.stimulus;
   }
   if(['response','selection','cancel','hint'].includes(event.kind)){
    if(!('stimulus' in event)||event.stimulus!==openOpportunity)throw Error('round-opportunity-mismatch');
   }
   if(event.kind==='cancel'||event.kind==='response'&&event.final)openOpportunity=null;
   if(event.kind==='finish'||event.kind==='abandon')throw Error('terminal-event-requires-close');
   observation.add(event);
  },
  complete(round:string,boundary:RoundBoundary,activeMs:number){
   if(closed)throw Error('closed-round-controller');
   if(pending?.round===round){if(pending.boundary!==boundary)throw Error('conflicting-round-boundary');return structuredClone(pending);}
   if(active!==round||openOpportunity||!Number.isFinite(activeMs)||activeMs<0)throw Error('round-not-ready');
   if(boundary!==ROUND_BOUNDARIES[options.exerciseId])throw Error('invalid-round-boundary');
   const decision=decideAdaptation(observation.snapshot(activeMs),{locked:options.locked,mode:options.mode,baseLevel:current.level,manualLevel:options.manualLevel},now);
   pending={round,boundary,decision,nextStarted:false};transitions.push(pending);active=null;
   return structuredClone(pending);
  },
  snapshot:()=>({config:current,activeRound:active,transitions:structuredClone(transitions)}),
  close(){closed=true;active=null;pending=null;},
 };
}
