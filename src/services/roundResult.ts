import {readAdaptationDecision,decisionMatchesExercise,type AdaptationDecision} from './adaptivePolicy.ts';
import type {RoundTransition} from './roundAdaptation.ts';
import type {ExerciseResult} from '../types/index.ts';

export interface RoundResult {
  version:1;
  baseLevel:number;
  levels:number[];
  finalDecision:AdaptationDecision;
  application:AdaptationDecision['application'];
}
const level=(value:unknown):value is number=>Number.isInteger(value)&&Number(value)>=1&&Number(value)<=10;
/** Compact result metadata; full intermediate observations remain in the event
 * archive. This is self-reported activity, not a scientific attestation. */
export function readRoundResult(encoded?:string):RoundResult|null {
  if(typeof encoded!=='string'||encoded.length>14000)return null;
  try {
    const value:RoundResult=JSON.parse(encoded);
    if(!value||Object.keys(value).sort().join()!==['version','baseLevel','levels','finalDecision','application'].sort().join()
      ||value.version!==1||!level(value.baseLevel)||!Array.isArray(value.levels)||!value.levels.length||value.levels.length>100
      ||value.levels.some((n,i)=>!level(n)||i>0&&Math.abs(n-value.levels[i-1])>1)
      ||!['pending','applied','stale','blocked'].includes(value.application))return null;
    const decision=readAdaptationDecision(JSON.stringify(value.finalDecision));
    if(!decision||decision.application!=='pending'||decision.fromLevel!==value.levels.at(-1))return null;
    if(['professional','non-normal','manual-level'].includes(decision.reason)&&value.levels.some(n=>n!==value.levels[0]))return null;
    return value;
  } catch {return null;}
}
export function encodeRoundResult(transitions:RoundTransition[],baseLevel:number):string {
  if(!transitions.length||transitions.some((item,i)=>item.nextStarted!==(i<transitions.length-1)
    ||!readAdaptationDecision(JSON.stringify(item.decision))||item.decision.application!=='pending'
    ||i>0&&item.decision.fromLevel!==transitions[i-1].decision.nextLevel))throw Error('incomplete-round-result');
  const encoded=JSON.stringify({version:1,baseLevel,levels:transitions.map(item=>item.decision.fromLevel),
    finalDecision:transitions.at(-1)!.decision,application:'pending'});
  if(!readRoundResult(encoded))throw Error('invalid-round-result');
  return encoded;
}
/** Never describe mixed play as a single achieved level or feed its totals into
 * the legacy fixed-level promotion rule. */
export function normalizeRoundResult(result:ExerciseResult):RoundResult|undefined {
  if(result.roundAdaptation===undefined)return;
  const summary=readRoundResult(result.roundAdaptation);
  if(!summary||!decisionMatchesExercise(summary.finalDecision,result.exerciseId)||result.adaptation!==undefined||!result.evidenceSessionId||result.configVersion!==1)throw Error('invalid-round-result');
  const mixed=summary.levels.some(n=>n!==summary.levels[0]);
  if(mixed)delete result.level;
  else result.level=summary.levels[0];
  return summary;
}
