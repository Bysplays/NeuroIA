import {createHash} from 'node:crypto';
import {validAiNarrative} from '../../src/services/activityInsights.ts';
export const REPORT_EVALUATION_VERSION = 'report-evaluation-v1';
export const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

// A passed schema is not a passed factuality review. Every generated report needs
// human adjudication against its exact source, including unreferenced summary text.
export function reviewTemplate(record) {
  return {caseId:record.caseId,recordHash:hash(record),reviewerCode:null,reviewedAt:null,
    factuality:null,spanishClarity:null,usefulness:null,scopeAndLimitations:null,
    criteria:record.criteria.map(criterion=>({criterion,passed:null})),
    notes:'',manualPreparationSeconds:null,assistedPreparationSeconds:null,
    synthesisUnitsTotal:null,synthesisUnitsAcceptedWithoutEdit:null};
}
export function summarizeReportEvaluation(records,reviews=[]) {
  const byCase=new Map();
  for(const review of reviews) {
    if(byCase.has(review.caseId)) throw Error('duplicate-review');
    byCase.set(review.caseId,review);
  }
  if(new Set(records.map(record=>record.caseId)).size!==records.length)throw Error('duplicate-case');
  if(reviews.some(review=>!records.some(record=>record.caseId===review.caseId)))throw Error('unknown-review');
  const outcomes=records.map(record=>{
    const schemaValid=record.status===200 && !!record.analysis && validAiNarrative(record.analysis.narrative,record.analysis.insights);
    const expectedRejection=record.expectedStatus!==undefined && record.status===record.expectedStatus && !record.analysis && record.providerCalls===0;
    const review=byCase.get(record.caseId);
    if(review && review.recordHash!==hash(record))throw Error('stale-review');
    const reviewed=!!review && typeof review.reviewerCode==='string' && /^[A-Za-z0-9_-]{1,64}$/.test(review.reviewerCode)
      && typeof review.reviewedAt==='string' && /^\d{4}-\d{2}-\d{2}T/.test(review.reviewedAt) && Number.isFinite(Date.parse(review.reviewedAt))
      && ['factuality','spanishClarity','usefulness','scopeAndLimitations'].every(key=>typeof review[key]==='boolean')
      && Array.isArray(review.criteria) && review.criteria.length===record.criteria.length
      && review.criteria.every((item,i)=>item.criterion===record.criteria[i] && typeof item.passed==='boolean');
    const approved=reviewed && ['factuality','spanishClarity','usefulness','scopeAndLimitations'].every(key=>review[key]) && review.criteria.every(item=>item.passed);
    const paired=reviewed && Number.isFinite(review.manualPreparationSeconds) && review.manualPreparationSeconds>0
      && Number.isFinite(review.assistedPreparationSeconds) && review.assistedPreparationSeconds>0;
    const units=reviewed && Number.isSafeInteger(review.synthesisUnitsTotal) && review.synthesisUnitsTotal>0
      && Number.isSafeInteger(review.synthesisUnitsAcceptedWithoutEdit) && review.synthesisUnitsAcceptedWithoutEdit>=0
      && review.synthesisUnitsAcceptedWithoutEdit<=review.synthesisUnitsTotal;
    const reviewFlags=schemaValid?record.analysis.narrative.observations.flatMap((item,index)=>
      /(?:resto|otros|demás).{0,14}juegos/i.test(item.text)?[{observation:index+1,reason:'Broad game claim: manually verify that cited facts support its entire scope.'}]:[]):[];
    return {caseId:record.caseId,schemaValid,expectedRejection,reviewed,approved,reviewFlags,
      accepted:record.expectedStatus!==undefined?expectedRejection:schemaValid&&approved,
      paired:paired&&schemaValid?{manual:review.manualPreparationSeconds,assisted:review.assistedPreparationSeconds}:null,
      units:units&&schemaValid?{total:review.synthesisUnitsTotal,accepted:review.synthesisUnitsAcceptedWithoutEdit}:null};
  });
  const generated=outcomes.filter(row=>row.schemaValid);
  const paired=generated.flatMap(row=>row.paired?[row.paired]:[]);
  const units=generated.flatMap(row=>row.units?[row.units]:[]);
  const sum=(rows,key)=>rows.reduce((n,row)=>n+row[key],0);
  const meanAssisted=paired.length?sum(paired,'assisted')/paired.length:null;
  const reduction=paired.length?1-sum(paired,'assisted')/sum(paired,'manual'):null;
  const automation=units.length?sum(units,'accepted')/sum(units,'total'):null;
  return {version:REPORT_EVALUATION_VERSION,outcomes,
    coverage:{cases:records.length,generated:generated.length,reviewed:generated.filter(row=>row.reviewed).length,pairedTimings:paired.length,unitReviews:units.length},
    allCasesAccepted:records.length>0&&outcomes.every(row=>row.accepted),
    measurements:{meanAssistedPreparationSeconds:meanAssisted,preparationReduction:reduction,acceptedSynthesisFraction:automation},
    targets:{underTenMinutes:meanAssisted===null?null:meanAssisted<600,atLeastHalfReduction:reduction===null?null:reduction>=0.5,overSeventyPercentAutomation:automation===null?null:automation>0.7},
    limitations:['Synthetic cases do not establish pilot KPIs or TRL 7.','Generation time excludes PDF creation, download and professional preparation.','Human review is required; schema conformance does not establish factuality.','Measurements report available reviewed pairs/units only; inspect coverage before interpreting targets.']};
}
