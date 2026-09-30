import { buildActivityInsights, validAiNarrative, validInsightFilters } from '../../src/services/activityInsights.ts';
import { activityMessages, PROMPT_VERSION, RESPONSE_FORMAT, ZERO_DATA_RETENTION } from '../openrouter/prompts.mjs';

const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const idPattern = /^[A-Za-z0-9_-]{1,128}$/;
const apiKey = env => (env.OPENROUTER_API_KEY || env.OPENROUTER_API || '').trim();
export function aiStatus(env) {
  const available = env.AI_ENABLED === 'true' && Boolean(apiKey(env)) && typeof env.OPENROUTER_MODEL === 'string' && env.OPENROUTER_MODEL.trim().length > 0;
  return { available, ...(available ? { model: env.OPENROUTER_MODEL } : {}) };
}
export async function authorizeAnalysis(actor, target, db, confirmedAccess) {
  if (!idPattern.test(actor) || !idPattern.test(target)) fail(400, 'Cuenta no válida.');
  const deleting = await db.runTransaction(tx => tx.get(`accountDeletions/${actor}`), 4, true);
  if (deleting) fail(409, 'La cuenta se está eliminando.');
  const access = await confirmedAccess(target, db);
  if (!access.active || (actor !== target && (access.kind !== 'invitation' || access.professionalId !== actor || !access.seatId))) {
    fail(403, 'No tienes acceso activo a esta actividad.');
  }
}
export async function reserveGeneration(actor, env, db, now = Date.now()) {
  const configured = Number(env.AI_DAILY_LIMIT || 10);
  const limit = Number.isInteger(configured) && configured >= 1 && configured <= 50 ? configured : 10;
  await db.runTransaction(async tx => {
    const path = `users/${actor}/aiUsage/daily`;
    const previous = await tx.get(path);
    const day = new Date(now).toISOString().slice(0, 10);
    const count = previous?.day === day ? previous.count : 0;
    if (previous?.lastRequestAt > now - 30000) fail(429, 'Espera medio minuto antes de generar otro análisis.');
    if (!Number.isInteger(count) || count < 0 || count >= limit) fail(429, 'Has alcanzado el límite diario de análisis. Puedes seguir usando el resumen y la plantilla sin IA.');
    tx.set(path, { day, count: count + 1, lastRequestAt: now }, false);
  });
}
async function boundedJson(response) {
  if (!response.body) fail(502, 'La IA no ha devuelto una respuesta válida.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0, text = '';
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 65536) { await reader.cancel(); fail(502, 'La respuesta de IA es demasiado larga.'); }
      text += decoder.decode(chunk.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch (error) {
    if (error.status) throw error;
    fail(502, 'La IA no ha devuelto una respuesta válida.');
  } finally { reader.releaseLock(); }
}
export async function generateAnalysis(actor, input, env, db, confirmedAccess, signal, fetcher = fetch) {
  if (!aiStatus(env).available) fail(503, 'La ayuda con IA no está disponible ahora. Puedes usar las sugerencias y la plantilla sin IA.');
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length !== 4
    || input.consent !== 'activity-summary-v1' || !['recommendations', 'report'].includes(input.mode)
    || typeof input.targetUid !== 'string' || !validInsightFilters(input.filters)) fail(400, 'Revisa la selección y confirma el envío del resumen de actividad.');
  await authorizeAnalysis(actor, input.targetUid, db, confirmedAccess);
  const source = await db.readActivity(input.targetUid);
  const insights = buildActivityInsights(source.history, source.levels, input.filters, { partial: source.partial, tapsOnly: source.tapsOnly });
  insights.limitations.push('La IA consulta como máximo las 400 partidas más recientes del archivo y los registros recientes conservados en el perfil. Solo incluye datos ya sincronizados.');
  if (!insights.count) fail(422, 'No hay partidas válidas guardadas en esta selección. Revisa los filtros o espera a que se sincronicen.');
  signal?.throwIfAborted();
  // Recheck after reading, before any disclosure and before charging the quota.
  await authorizeAnalysis(actor, input.targetUid, db, confirmedAccess);
  await reserveGeneration(actor, env, db);
  const abort = AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(25000)]);
  const endpoint = env.OPENROUTER_REGION === 'eu' ? 'https://eu.openrouter.ai/api/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
  let result;
  try {
    const response = await fetcher(endpoint, { method: 'POST', signal: abort, headers: {
      Authorization: `Bearer ${apiKey(env)}`, 'Content-Type': 'application/json',
      'HTTP-Referer': new URL(env.APP_URL).origin, 'X-OpenRouter-Title': 'NeuroIA',
    }, body: JSON.stringify({ model: env.OPENROUTER_MODEL, stream: false, temperature: 0.2, reasoning: { enabled: false },
      max_tokens: input.mode === 'report' ? 2200 : 1400,
      provider: { require_parameters: true, data_collection: 'deny', zdr: ZERO_DATA_RETENTION, allow_fallbacks: false,
        ...(env.OPENROUTER_PROVIDER ? { only: [env.OPENROUTER_PROVIDER] } : {}) },
      messages: activityMessages(insights, input.mode),
      response_format: RESPONSE_FORMAT,
    }) });
    if (!response.ok) {
      await response.body?.cancel();
      if (response.status === 429) fail(429, 'El proveedor de IA ha alcanzado su límite temporal de uso. Inténtalo más tarde; puedes seguir usando la plantilla sin IA.');
      if (response.status === 404) fail(503, 'El modelo configurado no está disponible con los ajustes actuales del proveedor. Puedes usar la plantilla sin IA.');
      fail(503, 'El servicio de IA no está disponible ahora. Puedes reintentarlo más tarde o usar la plantilla sin IA.');
    }
    result = await boundedJson(response);
  } catch (error) {
    if (error.status) throw error;
    fail(503, 'El análisis se ha interrumpido o ha tardado demasiado. Puedes volver a intentarlo.');
  }
  let narrative;
  try {
    if (result.error || result.choices?.[0]?.finish_reason !== 'stop') throw Error();
    narrative = JSON.parse(result.choices[0].message.content);
  } catch { fail(502, 'No se ha podido comprobar el borrador de IA. Usa la plantilla o vuelve a intentarlo.'); }
  if (!validAiNarrative(narrative, insights)) fail(502, 'El borrador no cumple el formato o las referencias requeridas. Usa la plantilla o vuelve a intentarlo.');
  signal?.throwIfAborted();
  // Revocation, expiry and deletion during generation must not release a late result.
  await authorizeAnalysis(actor, input.targetUid, db, confirmedAccess);
  const snapshotHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(insights)))), b => b.toString(16).padStart(2, '0')).join('');
  return { narrative, insights, provenance: { generatedAt: new Date().toISOString(), model: typeof result.model === 'string' ? result.model : env.OPENROUTER_MODEL,
    promptVersion: PROMPT_VERSION, snapshotHash, mode: input.mode } };
}
