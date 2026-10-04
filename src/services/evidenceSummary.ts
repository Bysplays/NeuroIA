import {readAdaptationDecision,type AdaptationDecision} from './adaptivePolicy.ts';
import {createAdaptationObservation} from './adaptationObservation.ts';
import { readEvidenceChunk, type EvidenceChunk, type EvidenceEvent } from './sessionEvidence.ts';

/** Server pages may arrive out of order or be repeated. Never accept a terminal
 * event as proof of completion without its contiguous, internally consistent log.
 * An unfinished prefix is useful evidence, but never a completed session.
 */
export function summarizeEvidence(chunks: EvidenceChunk[]) {
  const issues = new Set<string>();
  const ordered = new Map<number, EvidenceEvent>();
  const identity = chunks[0];
  for (const chunk of chunks) {
    if (chunk.sessionId !== identity.sessionId || chunk.exerciseId !== identity.exerciseId) issues.add('mixed-identities');
    const events = readEvidenceChunk(chunk);
    if (!events.length) issues.add('malformed-chunk');
    for (const event of events) {
      const previous = ordered.get(event.sequence);
      if (previous && JSON.stringify(previous) !== JSON.stringify(event)) issues.add('conflicting-event');
      ordered.set(event.sequence, event);
    }
  }
  const observation=createAdaptationObservation(identity?.exerciseId??'');
  const rounds:{round:string;level:number;decision:AdaptationDecision|null;nextStarted:boolean}[]=[];
  let activeRound:typeof rounds[number]|null=null;
  let initial:{level:number;mode:string;locked:boolean}|null=null;
  const events = [...ordered.values()].sort((a,b) => a.sequence-b.sequence);
  let stimulus: {id:string; since:number} | undefined;
  let lastMs = 0, terminal: EvidenceEvent | undefined;
  let responseCount = 0, errors = 0, hints = 0, selections = 0, latencyMs = 0;
  let trackingMs = 0, contactMs = 0, lastTrackingEnd = 0;
  let currentLevel=1,levelSinceMs=0;
  const levels=new Map<number,{responseCount:number;errors:number;hints:number;selections:number;latencyMs:number;trackingMs:number;contactMs:number}>();
  const measuredLevel=()=>{
    let row=levels.get(currentLevel);
    if(!row){row={responseCount:0,errors:0,hints:0,selections:0,latencyMs:0,trackingMs:0,contactMs:0};levels.set(currentLevel,row);}
    return row;
  };
  for (const [index,event] of events.entries()) {
    if (event.sequence !== index) issues.add('missing-events');
    if (event.activeMs < lastMs) issues.add('reversed-active-time');
    if (terminal) issues.add('events-after-terminal');
    if (index === 0 && event.kind !== 'start') issues.add('missing-start');
    lastMs = event.activeMs;
    switch (event.kind) {
      case 'start': if (index !== 0) issues.add('duplicate-start'); currentLevel=event.level;levelSinceMs=event.activeMs;initial=event;break;
      case 'round-start': {
        const previous=rounds.at(-1);
        if(stimulus||activeRound||rounds.some(round=>round.round===event.round))issues.add('invalid-round-start');
        if(event.level!==(previous?.decision?.nextLevel??initial?.level))issues.add('round-level-mismatch');
        if(previous){if(!previous.decision)issues.add('missing-round-decision');previous.nextStarted=true;}
        activeRound={round:event.round,level:event.level,decision:null,nextStarted:false};rounds.push(activeRound);
        if(currentLevel!==event.level){currentLevel=event.level;levelSinceMs=event.activeMs;}
        break;
      }
      case 'round-decision': {
        const decision=readAdaptationDecision(event.decision),observed=observation.snapshot(event.activeMs);
        if(stimulus||!activeRound||activeRound.round!==event.round||!decision||decision.fromLevel!==currentLevel)issues.add('invalid-round-decision');
        if(decision){
          if(decision.observation.some((value,i)=>Math.abs(value-observed.vector[i])>1e-6))issues.add('round-observation-mismatch');
          if(decision.reason==='policy'&&(!observed.eligible||initial?.locked||initial?.mode!=='normal'))issues.add('protected-round-decision');
          if(decision.reason==='insufficient-evidence'&&observed.eligible)issues.add('round-eligibility-mismatch');
        }
        if(activeRound)activeRound.decision=decision;activeRound=null;break;
      }
      case 'stimulus':
        if (stimulus) issues.add('unclosed-stimulus');
        if(rounds.length&&(!activeRound||event.level!==activeRound.level))issues.add('unrecorded-round-level');
        if(event.level!==currentLevel){currentLevel=event.level;levelSinceMs=event.activeMs;}
        stimulus = {id:event.stimulus,since:event.activeMs}; break;
      case 'selection': case 'response':
        if (!stimulus || stimulus.id !== event.stimulus || event.latencyMs !== event.activeMs-stimulus.since) issues.add('invalid-response-link');
        if (event.kind === 'selection') {selections++;measuredLevel().selections++;}
        else { responseCount++; errors += Number(!event.correct); latencyMs += event.latencyMs;
          const row=measuredLevel();row.responseCount++;row.errors+=Number(!event.correct);row.latencyMs+=event.latencyMs; }
        stimulus = event.kind === 'response' && event.final ? undefined : {id:event.stimulus,since:event.activeMs};
        break;
      case 'hint': case 'cancel':
        if (stimulus?.id !== event.stimulus) issues.add('invalid-stimulus-link');
        if (event.kind === 'hint') {hints++;measuredLevel().hints++;}
        else stimulus = undefined;
        break;
      case 'tracking':
        // Rounded interval boundaries can differ by 1 ms, never by an entire window.
        if (event.activeMs-event.durationMs < lastTrackingEnd-1) issues.add('overlapping-tracking');
        if(event.activeMs-event.durationMs<levelSinceMs-1)issues.add('tracking-crosses-level-boundary');
        lastTrackingEnd = event.activeMs;
        trackingMs += event.durationMs; contactMs += event.contactMs;
        measuredLevel().trackingMs+=event.durationMs;measuredLevel().contactMs+=event.contactMs;break;
      case 'finish': case 'abandon': if(event.kind==='finish'&&activeRound)issues.add('unfinished-round');terminal = event; break;
    }
    observation.add(event);
  }
  if (!events.length) issues.add('missing-start');
  const valid = issues.size === 0;
  return {
    sessionId:identity?.sessionId, exerciseId:identity?.exerciseId,
    status: !valid ? 'invalid' as const : terminal?.kind === 'finish' ? 'completed' as const : terminal?.kind === 'abandon' ? 'abandoned' as const : 'unfinished' as const,
    issues:[...issues],
    resultId:valid && terminal?.kind === 'finish' ? terminal.resultId : undefined,
    // Invalid evidence contributes no apparently authoritative KPI numerator.
    metrics:valid ? {responseCount,errors,hints,selections,meanResponseMs:responseCount ? latencyMs/responseCount : null,
      activeMs:lastMs,trackingMs,contactMs} : null,
    rounds:valid?rounds:null,
    levelMeasurements:valid?[...levels].sort(([a],[b])=>a-b).map(([level,{latencyMs:total,...measurements}])=>({level,
      measurements:{...measurements,meanResponseMs:measurements.responseCount?total/measurements.responseCount:null}})):null,
    events,
  };
}
