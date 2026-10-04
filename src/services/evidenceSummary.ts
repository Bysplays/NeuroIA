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
  const events = [...ordered.values()].sort((a,b) => a.sequence-b.sequence);
  let stimulus: {id:string; since:number} | undefined;
  let lastMs = 0, terminal: EvidenceEvent | undefined;
  let responseCount = 0, errors = 0, hints = 0, selections = 0, latencyMs = 0;
  let trackingMs = 0, contactMs = 0, lastTrackingEnd = 0;
  for (const [index,event] of events.entries()) {
    if (event.sequence !== index) issues.add('missing-events');
    if (event.activeMs < lastMs) issues.add('reversed-active-time');
    if (terminal) issues.add('events-after-terminal');
    if (index === 0 && event.kind !== 'start') issues.add('missing-start');
    lastMs = event.activeMs;
    switch (event.kind) {
      case 'start': if (index !== 0) issues.add('duplicate-start'); break;
      case 'stimulus':
        if (stimulus) issues.add('unclosed-stimulus');
        stimulus = {id:event.stimulus,since:event.activeMs}; break;
      case 'selection': case 'response':
        if (!stimulus || stimulus.id !== event.stimulus || event.latencyMs !== event.activeMs-stimulus.since) issues.add('invalid-response-link');
        if (event.kind === 'selection') selections++;
        else { responseCount++; errors += Number(!event.correct); latencyMs += event.latencyMs; }
        stimulus = event.kind === 'response' && event.final ? undefined : {id:event.stimulus,since:event.activeMs};
        break;
      case 'hint': case 'cancel':
        if (stimulus?.id !== event.stimulus) issues.add('invalid-stimulus-link');
        if (event.kind === 'hint') hints++;
        else stimulus = undefined;
        break;
      case 'tracking':
        // Rounded interval boundaries can differ by 1 ms, never by an entire window.
        if (event.activeMs-event.durationMs < lastTrackingEnd-1) issues.add('overlapping-tracking');
        lastTrackingEnd = event.activeMs;
        trackingMs += event.durationMs; contactMs += event.contactMs; break;
      case 'finish': case 'abandon': terminal = event; break;
    }
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
    events,
  };
}
