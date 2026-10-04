import { summarizeEvidence } from './evidenceSummary.ts';
import type { EvidenceChunk } from './sessionEvidence.ts';
import type { ExerciseResult } from '../types/index.ts';
import { readAdaptationDecision } from './adaptivePolicy.ts';

/** Export measurements, not identity or clinical narrative. Fresh ordinal attempt
 * references deliberately omit UID, session/result IDs, wall timestamps, free
 * text, mistakes, notes and raw EEG. Counts describe only the loaded archive.
 */
export function buildEvidenceExport(chunks: EvidenceChunk[], results: ExerciseResult[], complete: boolean) {
  const groups = new Map<string,EvidenceChunk[]>();
  let malformedDocuments = 0;
  for (const chunk of chunks) {
    if (!chunk || typeof chunk.sessionId !== 'string' || !/^[a-zA-Z0-9:_-]{1,128}$/.test(chunk.sessionId)) {
      malformedDocuments++; continue;
    }
    const group=groups.get(chunk.sessionId) ?? []; group.push(chunk); groups.set(chunk.sessionId,group);
  }
  const resultGroups = new Map<string,ExerciseResult[]>();
  for (const result of results) {
    const group=resultGroups.get(result.id) ?? []; group.push(result); resultGroups.set(result.id,group);
  }
  const attempts=[...groups.values()].map((group,index) => {
    const summary=summarizeEvidence(group);
    const saved=summary.resultId ? resultGroups.get(summary.resultId) ?? [] : [];
    const linked=saved.length>0 && saved.every(result => result.evidenceSessionId===summary.sessionId && result.exerciseId===summary.exerciseId)
      && new Set(saved.map(result=>JSON.stringify(result))).size===1;
    const start=summary.events.find(event=>event.kind==='start');
    // Do not echo unvalidated archive exercise names or arbitrary record fields.
    const allowed=['visual-scanning','language-naming','word-completion','memory-path','memory-pairs','categorization','motor-target','motor-tracking'];
    return {attempt:index+1,exercise:allowed.includes(summary.exerciseId ?? '') ? summary.exerciseId : null,
      mode:start?.mode ?? null, level:start?.level ?? null,
      status:summary.status, issues:summary.issues, measurements:summary.metrics,
      resultSaved:summary.status==='completed' ? linked : null,
      adaptation:linked ? readAdaptationDecision(saved[0].adaptation) : null,
      eegWindows:summary.status==='invalid' ? null : summary.events.filter(event=>event.kind==='eeg').map(event=>({activeMs:event.activeMs,channels:event.frame.channels})),
    };
  });
  const completed=attempts.filter(attempt=>attempt.status==='completed');
  const normalCompleted=completed.filter(attempt=>attempt.mode==='normal');
  return {version:1,coverage:{complete,documents:chunks.length,malformedDocuments,attempts:attempts.length},attempts,
    counts:{completed:completed.length,normalCompleted:normalCompleted.length,registeredNormalCompleted:normalCompleted.filter(attempt=>attempt.resultSaved).length,
      abandoned:attempts.filter(attempt=>attempt.status==='abandoned').length,
      unfinished:attempts.filter(attempt=>attempt.status==='unfinished').length,
      invalid:attempts.filter(attempt=>attempt.status==='invalid').length},
    limitations:[
      'Datos declarados por el cliente; no son una certificación clínica ni del dispositivo.',
      'Los intentos sin evento final no se consideran completados. Pueden faltar inicios nunca sincronizados.',
      'Estos recuentos no demuestran por sí solos el KPI de registro del piloto; requieren conciliación con su registro independiente.',
      'La adherencia requiere un calendario previsto; no se infiere de la racha ni del número de partidas.',
      'La lectura paginada no es una instantánea atómica: los registros que lleguen durante la descarga pueden requerir una nueva exportación.',
      ...(!complete ? ['Archivo parcial: termina la paginación antes de comparar resultados del periodo.'] : []),
    ],
  };
}
