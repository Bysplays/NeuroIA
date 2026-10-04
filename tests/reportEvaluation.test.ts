import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reviewTemplate,summarizeReportEvaluation} from '../scripts/evaluation/report-evaluation.mjs';
import {buildActivityInsights,basicNarrative,type InsightFilters} from '../src/services/activityInsights.ts';
import type {ExerciseResult,UserProfile} from '../src/types/index.ts';
const insights=buildActivityInsights([],undefined,{from:'',to:'',domain:'',exercise:'',timeZone:'UTC'});
const record={caseId:'case',criteria:['Respeta el alcance.'],status:200,providerCalls:1,analysis:{insights,narrative:basicNarrative(insights)}};
const review=()=>({...reviewTemplate(record),reviewerCode:'r1',reviewedAt:'2026-10-04T10:00:00Z',factuality:true,spanishClarity:true,usefulness:true,scopeAndLimitations:true,
  criteria:[{criterion:'Respeta el alcance.',passed:true}],manualPreparationSeconds:1200,assistedPreparationSeconds:600,synthesisUnitsTotal:10,synthesisUnitsAcceptedWithoutEdit:7});
test('schema-only results and empty evaluations cannot imply factuality or acceptance',()=>{
  const summary=summarizeReportEvaluation([record]);
  assert.equal(summary.outcomes[0].schemaValid,true);assert.equal(summary.allCasesAccepted,false);
  assert.equal(summary.targets.overSeventyPercentAutomation,null);
  assert.equal(summarizeReportEvaluation([]).allCasesAccepted,false);
});
test('KPI inequalities and paired denominators follow the memory exactly',()=>{
  const summary=summarizeReportEvaluation([record],[review()]);
  assert.deepEqual(summary.targets,{underTenMinutes:false,atLeastHalfReduction:true,overSeventyPercentAutomation:false});
  assert.equal(summary.allCasesAccepted,true);
  const missing={...review(),manualPreparationSeconds:null,synthesisUnitsTotal:0};
  assert.equal(summarizeReportEvaluation([record],[missing]).measurements.preparationReduction,null);
  assert.equal(summarizeReportEvaluation([record],[missing]).measurements.acceptedSynthesisFraction,null);
});
test('reviews must match exact artifacts and cannot be duplicated or borrowed',()=>{
  assert.throws(()=>summarizeReportEvaluation([{...record,status:500}],[review()]),/stale-review/);
  assert.throws(()=>summarizeReportEvaluation([record],[review(),review()]),/duplicate-review/);
  assert.throws(()=>summarizeReportEvaluation([record],[{...review(),caseId:'other'}]),/unknown-review/);
  const changed={...review(),criteria:[{criterion:'Otro',passed:true}]};
  assert.equal(summarizeReportEvaluation([record],[changed]).outcomes[0].reviewed,false);
});
test('empty-case rejection is only accepted when no provider was called',()=>{
  const empty={caseId:'empty',criteria:[],expectedStatus:422,status:422,providerCalls:0};
  assert.equal(summarizeReportEvaluation([empty]).allCasesAccepted,true);
  assert.equal(summarizeReportEvaluation([{...empty,providerCalls:1}]).allCasesAccepted,false);
});

test('failed transport and rejected human factuality never count as accepted reports',()=>{
  assert.equal(summarizeReportEvaluation([{...record,status:500}]).outcomes[0].schemaValid,false);
  assert.equal(summarizeReportEvaluation([record],[{...review(),factuality:false}]).allCasesAccepted,false);
});

test('versioned report cases exercise their claimed distinctions in the real reducer',async()=>{
  const {REPORT_CASES}=await import('../scripts/evaluation/report-cases.mjs');
  const data=new Map(REPORT_CASES.map((c: {id:string;history:ExerciseResult[];levels:UserProfile['gameLevels'];filters:InsightFilters;partial:boolean})=>[c.id,buildActivityInsights(c.history,c.levels,c.filters,{partial:c.partial,now:Date.parse('2026-10-04T12:00:00Z')})]));
  assert.equal(data.get('empty')!.count,0);
  assert.equal(data.get('filtered-partial')!.count,3);
  assert.equal(data.get('invalid-and-retired')!.count,1);
  assert.equal(data.get('invalid-and-retired')!.excluded,2);
  assert.ok(data.get('same-level-faster')!.facts.some(f=>f.id==='speed:visual-scanning'));
  assert.ok(!data.get('different-levels')!.facts.some(f=>f.id.startsWith('speed:')));
  for(const id of ['assigned','unknown-hints'])assert.ok(!data.get(id)!.suggestions.some(s=>s.id.startsWith('challenge:')));
  assert.equal(data.get('legacy-date')!.firstDay,'2026-01-01');
});

test('broad claims remain visible for review even when their three references pass schema',()=>{
  const broad={...record,analysis:{insights,narrative:{...basicNarrative(insights),observations:[{text:'El resto de los juegos no aparece en esta selección.',evidence:['game:language-naming','game:word-completion','game:memory-path']}]}}};
  const outcome=summarizeReportEvaluation([broad]).outcomes[0];
  assert.equal(outcome.schemaValid,true);assert.equal(outcome.reviewFlags.length,1);assert.equal(outcome.accepted,false);
});
