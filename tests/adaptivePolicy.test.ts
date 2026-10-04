import {test} from 'node:test';
import assert from 'node:assert/strict';
import vectors from '../vendor/adaptation/parity.json' with {type:'json'};
import {policyLogits,decideAdaptation,readAdaptationDecision} from '../src/services/adaptivePolicy.ts';
import {adaptDifficulty,EXERCISE_IDS} from '../src/services/difficulty.ts';
import model from '../src/services/adaptivePolicyModel.json' with {type:'json'};
import {MUSE_CHANNELS,MUSE_BANDS} from '../src/services/museFeatures.ts';
import {getInitialProfile} from '../src/services/storageService.ts';
import type {ExerciseResult} from '../src/types/index.ts';
import { reduceProgressOperation } from '../src/services/progressData.ts';
function input(level=5,error=0) {
  const vector=Array(40).fill(0);vector[1]=1;vector[8]=(level-1)/9;vector[9]=error;vector[13]=1;
  return {vector,level,eligible:true};
}
test('browser actor reproduces independent PyTorch logits and actions on 200 reference vectors',()=>{
  assert.deepEqual(model.games,EXERCISE_IDS);assert.deepEqual(model.channels,MUSE_CHANNELS);assert.deepEqual(model.bands,MUSE_BANDS);
  for(const reference of vectors) {
    const logits=policyLogits(reference.observation);
    logits.forEach((value,i)=>assert.ok(Math.abs(value-reference.logits[i])<1e-4));
    assert.equal(logits.indexOf(Math.max(...logits))-1,reference.action);
  }
});
test('learned policy produces both directions, bounds levels, and preserves locked/manual/non-normal sessions',()=>{
  const up=decideAdaptation(input(5,0),{locked:false,mode:'normal',baseLevel:5});
  const down=decideAdaptation(input(5,1),{locked:false,mode:'normal',baseLevel:5});
  assert.equal(up.action,1);assert.equal(down.action,-1);
  for(const level of [1,10]) for(const error of [0,1]) {
    const decision=decideAdaptation(input(level,error),{locked:false,mode:'normal',baseLevel:level});
    assert.ok(decision.nextLevel>=1 && decision.nextLevel<=10);
  }
  for(const context of [{locked:true,mode:'normal',baseLevel:5},{locked:false,mode:'placement',baseLevel:5},{locked:false,mode:'normal',baseLevel:4}]) {
    assert.equal(decideAdaptation(input(),context).action,0);
  }
  assert.equal(decideAdaptation({...input(),eligible:false},{locked:false,mode:'normal',baseLevel:5}).reason,'insufficient-evidence');
});
test('stored decisions are verified and never replace concurrent or assigned levels',()=>{
  const decision=decideAdaptation(input(5,1),{locked:false,mode:'normal',baseLevel:5});
  const profile=getInitialProfile();profile.gameLevels={'language-naming':{level:5,evidence:[]}};
  const result={exerciseId:'language-naming',level:5,configVersion:1,totalQuestions:4,adaptation:JSON.stringify(decision)} as ExerciseResult;
  assert.ok(readAdaptationDecision(result.adaptation));
  adaptDifficulty(profile,result);assert.equal(profile.gameLevels['language-naming']!.level,4);
  adaptDifficulty(profile,result);assert.equal(profile.gameLevels['language-naming']!.level,4);
  profile.gameLevels['language-naming']!.level=5;
  adaptDifficulty(profile,{...result,assignmentId:'assigned'});assert.equal(profile.gameLevels['language-naming']!.level,5);
  assert.equal(readAdaptationDecision(JSON.stringify({...decision,nextLevel:10})),null);
  assert.equal(readAdaptationDecision(JSON.stringify({...decision,observation:[NaN]})),null);
});
test('an old result keeps its applied audit in the immutable archive even outside the recent 60',()=>{
  const profile=getInitialProfile();profile.gameLevels={'language-naming':{level:5,evidence:[]}};
  const decision=decideAdaptation(input(5,1),{locked:false,mode:'normal',baseLevel:5});
  const result={id:'old',exerciseId:'language-naming',domain:'language',date:'2025-01-01T12:00:00Z',level:5,configVersion:1,
    totalQuestions:4,correctAnswers:0,accuracy:0,durationSeconds:30,score:0,feedbackMessage:'',adaptation:JSON.stringify(decision)} as ExerciseResult;
  const history=Array.from({length:60},(_,i)=>({...result,id:`new-${i}`,date:'2026-01-01T12:00:00Z'}));
  const reduced=reduceProgressOperation({profile,history},{id:'result:old',kind:'result',result});
  assert.equal(reduced.data.history.some(r=>r.id==='old'),false);
  assert.equal(readAdaptationDecision(reduced.result?.adaptation)?.application,'applied');
  assert.equal(reduced.data.profile.gameLevels?.['language-naming']?.level,4);
});
