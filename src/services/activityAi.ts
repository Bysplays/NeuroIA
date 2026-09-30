import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { validAiNarrative, type AiAnalysis, type InsightFilters } from './activityInsights';

const serviceUrl = import.meta.env.VITE_BILLING_API_URL?.replace(/\/$/, '');
async function request<T>(path: string, body: object, signal: AbortSignal): Promise<T> {
  const account = auth.currentUser;
  if (!serviceUrl || !account) throw Error('La ayuda con IA no está disponible ahora.');
  const identity = new AbortController();
  const unsubscribe = onAuthStateChanged(auth, next => { if (next?.uid !== account.uid) identity.abort(); });
  const combined = AbortSignal.any([signal, identity.signal, AbortSignal.timeout(40000)]);
  try {
    const token = await account.getIdToken();
    combined.throwIfAborted();
    const response = await fetch(`${serviceUrl}${path}`, { method: 'POST', signal: combined,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const value = await response.json();
    combined.throwIfAborted();
    if (auth.currentUser?.uid !== account.uid) throw new DOMException('Account changed', 'AbortError');
    if (!response.ok) throw Error(typeof value.error === 'string' ? value.error : 'No hemos podido preparar el análisis.');
    return value;
  } finally { unsubscribe(); }
}
export const activityAi = {
  async dailyRecommendations(targetUid: string, timeZone: string, signal: AbortSignal) {
    const result = await request<AiAnalysis>('/ai/recommendations', { targetUid, timeZone, consent: 'activity-summary-v1' }, signal);
    if (!result.insights || !result.provenance || !validAiNarrative(result.narrative, result.insights)) throw Error('No hemos podido comprobar las recomendaciones de hoy.');
    return result;
  },
  status(signal: AbortSignal) { return request<{ available: boolean; model?: string }>('/ai/status', {}, signal); },
  async generate(targetUid: string, filters: InsightFilters, mode: 'recommendations' | 'report', signal: AbortSignal) {
    const result = await request<AiAnalysis>('/ai/analyze', { targetUid, filters, mode, consent: 'activity-summary-v1' }, signal);
    if (!result.insights || !result.provenance || !validAiNarrative(result.narrative, result.insights)) throw Error('No hemos podido comprobar la respuesta de IA.');
    return result;
  },
};
