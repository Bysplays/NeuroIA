import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { configureLocalWorker, localAiConfig } from './local-config.mjs';
import { parseEnv } from 'node:util';

test('local config maps alias, excludes unrelated values and preserves existing multiline secrets', async () => {
  const directory = await mkdtemp(`${tmpdir()}/neuroia-ai-config-`);
  const source = pathToFileURL(`${directory}/.env`), target = pathToFileURL(`${directory}/.dev.vars`);
  try {
    await writeFile(source, 'OPENROUTER_API=test-key\nOPENROUTER_MODEL=fixture/model\nOPENROUTER_ZDR=false\nOPENROUTER_OUTPUT_MODE=json_object\nUNRELATED=keep-private\n');
    const original = '# Existing binding\nFIREBASE_SERVICE_ACCOUNT=\'{"private_key":"line1\\nline2"}\'\nMULTILINE="first\nsecond"\n';
    await writeFile(target, original);
    await configureLocalWorker(source, target);
    const first = await readFile(target, 'utf8');
    assert.ok(first.startsWith(original));
    assert.equal(parseEnv(first).OPENROUTER_API_KEY, 'test-key');
    assert.equal(parseEnv(first).AI_ENABLED, 'true');
    assert.equal(parseEnv(first).OPENROUTER_ZDR, undefined);
    assert.equal(parseEnv(first).OPENROUTER_OUTPUT_MODE, undefined);
    assert.equal(parseEnv(first).UNRELATED, undefined);
    assert.equal((await stat(target)).mode & 0o777, 0o600);
    await configureLocalWorker(source, target);
    assert.equal(await readFile(target, 'utf8'), first);
    await writeFile(source, 'OPENROUTER_API_KEY=canonical\nOPENROUTER_API=alias\nOPENROUTER_MODEL=fixture/model\n');
    assert.equal((await localAiConfig(source)).OPENROUTER_API_KEY, 'canonical');
    await writeFile(source, 'OPENROUTER_API=test-key\n');
    await assert.rejects(localAiConfig(source));
  } finally { await rm(directory, { recursive: true }); }
});
