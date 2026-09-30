import { readFile, writeFile, rename } from 'node:fs/promises';
import { parseEnv } from 'node:util';

const root = new URL('../../', import.meta.url);
export async function localAiConfig(source = new URL('.env', root)) {
  const values = parseEnv(await readFile(source, 'utf8'));
  const key = (values.OPENROUTER_API_KEY || values.OPENROUTER_API || '').trim();
  const model = values.OPENROUTER_MODEL?.trim();
  if (!key || !model) throw Error('Completa OPENROUTER_API y OPENROUTER_MODEL en .env.');
  return { OPENROUTER_API_KEY: key, OPENROUTER_MODEL: model, AI_ENABLED: 'true',
    ...Object.fromEntries(['OPENROUTER_PROVIDER', 'OPENROUTER_REGION', 'AI_DAILY_LIMIT'].filter(k => values[k]).map(k => [k, values[k]])) };
}

export async function configureLocalWorker(source = new URL('.env', root), path = new URL('../cloudflare/.dev.vars', import.meta.url)) {
  const config = await localAiConfig(source);
  let previous = '';
  try { previous = await readFile(path, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const start = '# BEGIN NEUROIA OPENROUTER';
  const end = '# END NEUROIA OPENROUTER';
  const block = [start, ...Object.entries(config).map(([key, value]) => {
    if (/[\r\n'"\\]/.test(value)) throw Error('Invalid local AI binding');
    return `${key}='${value}'`;
  }), end].join('\n');
  // Preserve existing service-account/billing bindings byte-for-byte, including
  // multiline quoting. Only replace our explicitly delimited configuration.
  const pattern = /# BEGIN NEUROIA OPENROUTER\n[\s\S]*?# END NEUROIA OPENROUTER/;
  const contents = pattern.test(previous) ? previous.replace(pattern, () => block) : `${previous.trimEnd()}\n${block}\n`;
  const temporary = new URL(`${path.href}.tmp`);
  await writeFile(temporary, contents, { mode: 0o600 });
  await rename(temporary, path);
}
