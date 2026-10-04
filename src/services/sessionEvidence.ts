import { validMuseFeatureFrame, type MuseFeatureFrame } from './museFeatures.ts';

export type EvidenceEvent = {
  sequence: number;
  activeMs: number;
  at: string;
} & (
  | { kind: 'start'; level: number; configVersion: number; mode: 'normal' | 'placement' | 'practice'; locked: boolean }
  | { kind: 'stimulus'; stimulus: string; level: number }
  | { kind: 'response'; stimulus: string; correct: boolean; latencyMs: number; final: boolean }
  | { kind: 'selection'; stimulus: string; latencyMs: number }
  | { kind: 'cancel'; stimulus: string }
  | { kind: 'tracking'; durationMs: number; contactMs: number }
  | { kind: 'hint'; stimulus: string }
  | { kind: 'eeg'; frame: MuseFeatureFrame }
  | { kind: 'finish'; resultId: string }
  | { kind: 'abandon'; reason: 'back' | 'skip' | 'leave' }
);
export interface EvidenceChunk {
  version: 1;
  sessionId: string;
  exerciseId: string;
  firstSequence: number;
  count: number;
  events: string;
}
const identifier = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9:_-]{1,128}$/.test(value);
const levelValid = (level: number) => Number.isInteger(level) && level >= 1 && level <= 10;
const boundedMs = (n: number) => Number.isInteger(n) && n >= 0 && n <= 86400000;
export function readEvidenceChunk(chunk: EvidenceChunk): EvidenceEvent[] {
  if (!chunk || chunk.version !== 1 || !identifier(chunk.sessionId) || !identifier(chunk.exerciseId)
    || !Number.isInteger(chunk.firstSequence) || chunk.firstSequence < 0
    || !Number.isInteger(chunk.count) || chunk.count < 1 || chunk.count > 8
    || typeof chunk.events !== 'string' || chunk.events.length > 24000) return [];
  try {
    const events: EvidenceEvent[] = JSON.parse(chunk.events);
    if (!Array.isArray(events) || events.length !== chunk.count) return [];
    let previousMs = -1;
    for (const [index, event] of events.entries()) {
      if (!event || event.sequence !== chunk.firstSequence + index || !boundedMs(event.activeMs)
        || event.activeMs < previousMs || typeof event.at !== 'string'
        || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(event.at) || !Number.isFinite(Date.parse(event.at))
        || new Date(event.at).toISOString() !== event.at) return [];
      previousMs = event.activeMs;
      let keys: string[];
      switch (event.kind) {
        case 'start':
          if (!levelValid(event.level) || event.configVersion !== 1 || !['normal','placement','practice'].includes(event.mode) || typeof event.locked !== 'boolean') return [];
          keys = ['level','configVersion','mode','locked']; break;
        case 'stimulus':
          if (!identifier(event.stimulus) || !levelValid(event.level)) return [];
          keys = ['stimulus','level']; break;
        case 'response':
          if (!identifier(event.stimulus) || typeof event.correct !== 'boolean' || typeof event.final !== 'boolean' || !boundedMs(event.latencyMs) || event.latencyMs > event.activeMs) return [];
          keys = ['stimulus','correct','latencyMs','final']; break;
        case 'hint': if (!identifier(event.stimulus)) return []; keys = ['stimulus']; break;
        case 'cancel': if (!identifier(event.stimulus)) return []; keys = ['stimulus']; break;
        case 'selection':
          if (!identifier(event.stimulus) || !boundedMs(event.latencyMs) || event.latencyMs > event.activeMs) return [];
          keys = ['stimulus','latencyMs']; break;
        case 'tracking':
          if (!boundedMs(event.durationMs) || event.durationMs === 0 || event.durationMs > event.activeMs
            || !boundedMs(event.contactMs) || event.contactMs > event.durationMs) return [];
          keys = ['durationMs','contactMs']; break;
        case 'eeg': if (!validMuseFeatureFrame(event.frame)) return []; keys = ['frame']; break;
        case 'finish': if (!identifier(event.resultId)) return []; keys = ['resultId']; break;
        case 'abandon': if (!['back','skip','leave'].includes(event.reason)) return []; keys = ['reason']; break;
        default: return [];
      }
      if (Object.keys(event).some(key => !['sequence','activeMs','at','kind',...keys].includes(key))) return [];
    }
    return events;
  } catch { return []; }
}
type Payload = EvidenceEvent extends infer T ? T extends EvidenceEvent ? Omit<T,'sequence'|'activeMs'|'at'> : never : never;

/** Pure active-clock recorder. Sink must durably enqueue before returning.
 * Chunk identity is stable across retries; failed flushes retain their pending data.
 * A missing terminal event is unfinished/unknown, never an inferred completion.
 */
export function createSessionEvidence(options: {
  sessionId: string; exerciseId: string; activeNow: () => number; wallNow?: () => Date;
  sink: (chunk: EvidenceChunk) => void;
}) {
  if (!identifier(options.sessionId) || !identifier(options.exerciseId)) throw Error('invalid-evidence-identity');
  const wallNow = options.wallNow ?? (() => new Date());
  let next = 0, pending: EvidenceEvent[] = [], started = false, closed = false;
  let stimulus: { id: string; since: number } | undefined;
  let trackingMs = 0, contactMs = 0;
  const now = () => Math.round(options.activeNow());
  const flush = () => {
    while (pending.length) {
      const batch = pending.slice(0, 8);
      const chunk: EvidenceChunk = { version: 1, sessionId: options.sessionId, exerciseId: options.exerciseId,
        firstSequence: batch[0].sequence, count: batch.length, events: JSON.stringify(batch) };
      if (readEvidenceChunk(chunk).length !== batch.length) throw Error('invalid-session-evidence');
      options.sink(chunk);
      pending = pending.slice(batch.length);
    }
  };
  const emit = (payload: Payload) => {
    if (closed) return;
    if (pending.length >= 8) flush();
    const event = { ...payload, sequence: next, activeMs: now(), at: wallNow().toISOString() } as EvidenceEvent;
    // Fail at creation, never silently discard a malformed event during export.
    if (!readEvidenceChunk({version:1,sessionId:options.sessionId,exerciseId:options.exerciseId,firstSequence:next,count:1,events:JSON.stringify([event])}).length) throw Error('invalid-session-evidence');
    pending.push(event); next++;
  };
  const flushTracking = () => {
    if (Math.round(trackingMs) > 0) {
      emit({kind:'tracking',durationMs:Math.round(trackingMs),contactMs:Math.round(contactMs)});
      trackingMs = 0; contactMs = 0;
    }
  };
  return {
    id: options.sessionId,
    start(level: number, mode: 'normal'|'placement'|'practice', locked: boolean) {
      if (started || closed) return;
      emit({kind:'start',level,configVersion:1,mode,locked}); started = true; flush();
    },
    present(id: string, level: number) {
      if (!started || closed || stimulus?.id === id) return;
      if (stimulus) emit({kind:'cancel',stimulus:stimulus.id});
      emit({kind:'stimulus',stimulus:id,level}); stimulus = {id, since:now()};
    },
    respond(correct: boolean, final = true) {
      if (!started || closed || !stimulus) return;
      emit({kind:'response',stimulus:stimulus.id,correct,final,latencyMs:now()-stimulus.since});
      // Subsequent actions measure latency from the prior action, not from the first render.
      stimulus = final ? undefined : {...stimulus,since:now()};
    },
    hint() { if (stimulus && !closed) emit({kind:'hint',stimulus:stimulus.id}); },
    cancel() {
      if (stimulus && !closed) { emit({kind:'cancel',stimulus:stimulus.id}); stimulus = undefined; }
    },
    select() {
      if (!stimulus || closed) return;
      emit({kind:'selection',stimulus:stimulus.id,latencyMs:now()-stimulus.since});
      stimulus = {...stimulus,since:now()};
    },
    track(deltaMs: number, contact: boolean) {
      if (!started || closed) return;
      if (!Number.isFinite(deltaMs) || deltaMs < 0 || typeof contact !== 'boolean') throw Error('invalid-tracking-sample');
      trackingMs += deltaMs; if (contact) contactMs += deltaMs;
      if (trackingMs >= 1000) { flushTracking(); flush(); }
    },
    eeg(frame: MuseFeatureFrame) { if (started && !closed) emit({kind:'eeg',frame:structuredClone(frame)}); },
    finish(resultId: string) {
      if (!started) return;
      if (!closed) { flushTracking(); emit({kind:'finish',resultId}); closed = true; stimulus = undefined; }
      flush();
    },
    abandon(reason: 'back'|'skip'|'leave') {
      if (!started) return;
      if (!closed) { flushTracking(); emit({kind:'abandon',reason}); closed = true; stimulus = undefined; }
      flush();
    },
    flush,
  };
}
