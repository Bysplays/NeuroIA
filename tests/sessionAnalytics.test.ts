import test from 'node:test';
import assert from 'node:assert/strict';
import { sessionAnalytics } from '../src/services/sessionAnalytics.ts';
import { assignmentResult, type AssignedSession } from '../src/services/assignedSessions.ts';
import type { ExerciseResult } from '../src/types/index.ts';
const session: AssignedSession = { id:'s', professionalId:'o', seatId:'seat', patientId:'p', professionalName:'Owner', title:'Test', note:'', createdAt:1, configVersion:1, status:'completed', completedCount:2, resultIds:['assigned-s-0','assigned-s-1'], steps:[{exerciseId:'memory-pairs',level:1},{exerciseId:'memory-pairs',level:1}] };
const base: ExerciseResult = { id:'x',exerciseId:'memory-pairs',domain:'memory',level:1,configVersion:1,date:'2026-09-29',accuracy:100,correctAnswers:1,totalQuestions:1,durationSeconds:30,score:0,feedbackMessage:'' };
test('session metrics keep repeated games separate, deduplicate and weight answers',()=>{
  const a=assignmentResult(session,0,base), b=assignmentResult(session,1,{...base,correctAnswers:2,totalQuestions:3,durationSeconds:90});
  const data=sessionAnalytics(session,[a,a,b]);
  assert.equal(data.available,2);assert.equal(data.accuracy,75);assert.equal(data.seconds,120);assert.equal(data.missing,0);
});
test('missing, unconfirmed or other-seat results are not fabricated as zero performance',()=>{
  const a=assignmentResult(session,0,base);
  for(const patch of [{assignmentSeatId:'other'},{assignmentId:'other'},{assignmentOwnerId:'other'},{practice:true},{level:2}]) {
    const data=sessionAnalytics(session,[{...a,...patch}]);
    assert.equal(data.available,0);assert.equal(data.accuracy,null);assert.equal(data.seconds,null);assert.equal(data.missing,2);
  }
  assert.equal(sessionAnalytics({...session,completedCount:0,resultIds:[]},[a]).available,0);
  assert.equal(sessionAnalytics(session,[a]).missing,1);
});
