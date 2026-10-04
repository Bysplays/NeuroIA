import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createReportLifecycle,validReportEvent,type ReportEvent} from '../src/services/reportLifecycle.ts';
test('report lifecycle records ordered wall durations and only acknowledges a download request',()=>{
  const events:ReportEvent[]=[];let now=100;
  const recorder=createReportLifecycle({attemptId:'fixture',source:'ai',now:()=>now,wall:()=> '2026-10-04T12:00:00.000Z',sink:e=>events.push(e)});
  now=600;recorder.emit('ai-ready');now=800;recorder.emit('pdf-ready');recorder.emit('download-requested');recorder.emit('cancelled');
  assert.deepEqual(events.map(e=>e.phase),['started','ai-ready','pdf-ready','download-requested']);
  assert.deepEqual(events.map(e=>e.elapsedMs),[0,500,700,700]);assert.ok(events.every(validReportEvent));
});
test('template failures, cancellation and account teardown cannot manufacture completion',()=>{
  const events:ReportEvent[]=[];
  const recorder=createReportLifecycle({attemptId:'template',source:'template',sink:e=>events.push(e)});
  assert.throws(()=>recorder.emit('download-requested'),/transition/);
  assert.throws(()=>recorder.emit('ai-ready'),/transition/);
  recorder.emit('failed');recorder.emit('cancelled');assert.equal(events.length,2);
  assert.doesNotThrow(()=>createReportLifecycle({attemptId:'closed',source:'ai',sink:()=>{throw Error('closed-session');}}).emit('cancelled'));
  assert.equal(validReportEvent({...events[0],draft:'private'}),false);
  assert.equal(validReportEvent({...events[0],elapsedMs:-1}),false);
});
