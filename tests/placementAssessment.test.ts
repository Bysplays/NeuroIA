import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceAssessment, ASSESSMENT_LEVELS, validAssessmentLevel, nextAssessmentGame } from '../src/services/placementAssessment.ts';
import { applyPlacement, EXERCISE_IDS, hasPlacement, placementLevel, gameConfig } from '../src/services/difficulty.ts';
import { getInitialProfile } from '../src/services/storageService.ts';
import { shuffle } from '../src/services/gameObjectPool.ts';
import type { ExerciseResult } from '../src/types/index.ts';
const result = (correctAnswers=3, totalQuestions=3): ExerciseResult => ({ id:'trial', exerciseId:'word-completion', domain:'language', date:'2026-09-28', accuracy:Math.round(correctAnswers / totalQuestions * 100), correctAnswers,totalQuestions, durationSeconds:20, score:0, feedbackMessage:'' });
test('new assessment stops after two stages and retains conservative evidence on failure', () => {
  assert.deepEqual(ASSESSMENT_LEVELS,[1,4,7,10]); // Saved legacy stages remain valid.
  const first = advanceAssessment(1, undefined, result());
  assert.equal(first.next,4);
  assert.equal(advanceAssessment(4,first.best,result()).finished?.assessedLevel,4);
  assert.equal(advanceAssessment(4,first.best,result(0)).finished?.assessedLevel,1);
  assert.equal(advanceAssessment(4,first.best).finished?.assessedLevel,1);
  for (const level of [7,10] as const) assert.equal(advanceAssessment(level,undefined,result()).finished?.assessedLevel,level);
  assert.equal(advanceAssessment(1).finished?.skipped,true);
  assert.ok(advanceAssessment(1,undefined,result(199,200)).finished);
  assert.ok(advanceAssessment(1,undefined,result(0,0)).finished);
});
test('interleaving avoids consecutive games and preserves each game stage order', () => {
  const pending = new Map(EXERCISE_IDS.map(id => [id,0]));
  const played = new Map(EXERCISE_IDS.map(id => [id,[] as number[]]));
  let previous;
  for(let turn=0;pending.size;turn++) {
    const available=[...pending.keys()];
    const id=nextAssessmentGame(available,previous,()=> (turn*.317)%1)!;
    if(available.length>1) assert.notEqual(id,previous);
    const stage=pending.get(id)!;
    played.get(id)!.push(ASSESSMENT_LEVELS[stage]);
    if(stage===3) pending.delete(id); else pending.set(id,stage+1);
    previous=id;
  }
  for(const levels of played.values()) assert.deepEqual(levels,[1,4,7,10]);
  assert.equal(nextAssessmentGame([]),undefined);
});
test('assessment keeps single questions but uses the full target sequence at each level', () => {
  for(const level of ASSESSMENT_LEVELS) {
    assert.equal(gameConfig(level,'placement').rounds,1);
    assert.equal(gameConfig(level,'placement').targets,gameConfig(level).targets);
    assert.equal(gameConfig(level,'placement').targets,level+4);
    assert.ok(gameConfig(level).rounds>=3);
  }
});
test('new ladder evidence assigns its measured level while legacy placement remains compatible', () => {
  const profile=getInitialProfile();
  const trial={accuracy:100,questions:3,hints:0,skipped:false,assessedLevel:10 as const};
  for (const id of EXERCISE_IDS) applyPlacement(profile,id,trial);
  assert.ok(hasPlacement(profile));
  for (const id of EXERCISE_IDS) assert.equal(profile.gameLevels![id]!.level,10);
  assert.equal(profile.totalSessions,0);
  assert.equal(placementLevel({accuracy:100,questions:3,hints:0,skipped:false}),4);
  for(const level of [0,2,6,11,'5']) assert.equal(validAssessmentLevel(level),false);
});
test('random game order contains every active game exactly once', () => {
  const reordered=shuffle(EXERCISE_IDS,()=>0);
  assert.deepEqual([...reordered].sort(), [...EXERCISE_IDS].sort());
  assert.notDeepEqual(reordered,EXERCISE_IDS);
});
