import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decideAdaptation} from '../src/services/adaptivePolicy.ts';
import {encodeRoundResult,readRoundResult} from '../src/services/roundResult.ts';
import {reduceProgressOperation} from '../src/services/progressData.ts';
import {getInitialProfile} from '../src/services/storageService.ts';
import type {ExerciseResult} from '../src/types/index.ts';
import type {RoundTransition} from '../src/services/roundAdaptation.ts';
import {levelTimeline} from '../src/services/levelStatistics.ts';
function decision(at:number,eligible=true,locked=false){
 const vector=Array(40).fill(0);vector[1]=1;vector[8]=(at-1)/9;vector[9]=eligible?1:0;vector[13]=Number(eligible);
 return decideAdaptation({vector,level:at,eligible},{baseLevel:at,mode:'normal',locked});
}
function fixture(){
 const first=decision(5),last=decision(first.nextLevel,false);
 const transitions:RoundTransition[]=[{round:'a',boundary:'question',decision:first,nextStarted:true},{round:'b',boundary:'question',decision:last,nextStarted:false}];
 const result:ExerciseResult={id:'mixed',exerciseId:'language-naming',domain:'language',date:'2026-10-04T12:00:00Z',durationSeconds:30,
  accuracy:25,score:0,correctAnswers:1,totalQuestions:4,feedbackMessage:'',level:5,configVersion:1,evidenceSessionId:'trace',roundAdaptation:encodeRoundResult(transitions,5)};
 const profile=getInitialProfile();profile.gameLevels={'language-naming':{level:5,evidence:[],qualifyingRuns:1}};
 return {result,profile,transitions};
}
test('mixed result preserves counts, omits false single level and applies final held level after a prior change',()=>{
 const {result,profile}=fixture();
 const reduced=reduceProgressOperation({profile,history:[]},{id:'result:mixed',kind:'result',result});
 assert.equal(reduced.data.profile.gameLevels?.['language-naming']?.level,4);
 assert.equal(reduced.data.profile.gameLevels?.['language-naming']?.qualifyingRuns,0);
 assert.equal(reduced.result?.level,undefined);assert.equal(reduced.result?.totalQuestions,4);
 assert.equal(readRoundResult(reduced.result?.roundAdaptation)?.application,'applied');
 assert.equal(levelTimeline(reduced.data.history,'language-naming').length,0);
 const retry=reduceProgressOperation(reduced.data,{id:'result:mixed',kind:'result',result});
 assert.equal(retry.data.profile.totalSessions,1);assert.equal(retry.data.profile.gameLevels?.['language-naming']?.level,4);
 assert.equal(result.level,5);assert.equal(profile.gameLevels?.['language-naming']?.level,5);
});
test('concurrent profile changes, assigned sessions, manual starts and practice retain authoritative levels',()=>{
 for(const variant of ['concurrent','assignment','manual','practice']){
  const {profile,result}=fixture();
  if(variant==='concurrent')profile.gameLevels!['language-naming']!.level=7;
  if(variant==='assignment')result.assignmentId='assigned';
  if(variant==='practice')result.practice=true;
  if(variant==='manual'){const summary=readRoundResult(result.roundAdaptation)!;summary.baseLevel=6;result.roundAdaptation=JSON.stringify(summary);}
  const before=profile.gameLevels?.['language-naming']?.level;
  const reduced=reduceProgressOperation({profile,history:[]},{id:'result:mixed',kind:'result',result});
  assert.equal(reduced.data.profile.gameLevels?.['language-naming']?.level,before);
  assert.equal(readRoundResult(reduced.result?.roundAdaptation)?.application,variant==='concurrent'?'stale':'blocked');
 }
});
test('malformed chains, dual adaptations, missing links and forged final inference cannot enter result history',()=>{
 const {transitions,result,profile}=fixture();
 assert.throws(()=>encodeRoundResult([{...transitions[0],nextStarted:false},transitions[1]],5));
 const summary=readRoundResult(result.roundAdaptation)!;
 for(const change of [{levels:[5,1]}, {finalDecision:{...summary.finalDecision,nextLevel:10}}, {levels:[]}, {levels:Array(101).fill(5)}]){
  assert.equal(readRoundResult(JSON.stringify({...summary,...change})),null);
 }
 for(const altered of [{...result,adaptation:JSON.stringify(transitions[0].decision)},{...result,evidenceSessionId:undefined},{...result,roundAdaptation:'{}'}]){
  assert.throws(()=>reduceProgressOperation({profile,history:[]},{id:'bad',kind:'result',result:altered}),/invalid-round-result/);
 }
});
test('protected fixed-level rounds retain one truthful level and never apply a learned change',()=>{
 const {profile,result}=fixture();const d=decision(5,true,true);
 result.roundAdaptation=encodeRoundResult([{round:'a',boundary:'question',decision:d,nextStarted:false}],5);
 const reduced=reduceProgressOperation({profile,history:[]},{id:'result:mixed',kind:'result',result});
 assert.equal(reduced.result?.level,5);assert.equal(readRoundResult(reduced.result?.roundAdaptation)?.application,'blocked');
});
