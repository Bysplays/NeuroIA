// Explicit, paid smoke check. Synthetic records only; no Firebase access or writes.
import { writeFile } from 'node:fs/promises';
import { localAiConfig } from './local-config.mjs';
import { generateAnalysis } from '../cloudflare/ai.mjs';

try {
  const env = { ...await localAiConfig(), APP_URL: 'http://localhost:5173' };
  const history = Array.from({ length: 6 }, (_, i) => ({ id: `synthetic-${i}`, exerciseId: 'visual-scanning', domain: 'attention',
    date: new Date(Date.now() - (6 - i) * 86400000).toISOString(), correctAnswers: 10, totalQuestions: 10,
    durationSeconds: i < 3 ? 90 : 80, level: 3, configVersion: 1, hintsUsed: 0 }));
  const outputs = [];
  for (const mode of ['recommendations', 'report']) {
    const db = { runTransaction: async callback => callback({ get: async () => null, set() {} }),
      readActivity: async () => ({ history, levels: { 'visual-scanning': { level: 3, evidence: [] } }, partial: true }) };
    const started = Date.now();
    const analysis = await generateAnalysis('synthetic', { targetUid: 'synthetic', mode, consent: 'activity-summary-v1',
      filters: { from: '', to: '', domain: '', exercise: '', timeZone: 'Europe/Madrid' } }, env, db,
    async () => ({ active: true, kind: 'trial' }), new AbortController().signal);
    outputs.push(analysis);
    console.log(`${mode}: OK (${Date.now() - started} ms), formato y referencias válidos.`);
  }
  await writeFile('/tmp/neuroia-openrouter-synthetic.json', JSON.stringify(outputs, null, 2), { mode: 0o600 });
  console.log('Borradores ficticios para revisión: /tmp/neuroia-openrouter-synthetic.json');
} catch (error) {
  console.error(error.status ? `Prueba interrumpida (${error.status}): ${error.message}` : 'No se ha podido ejecutar la prueba. Revisa .env y la conectividad.');
  process.exitCode = 1;
}
