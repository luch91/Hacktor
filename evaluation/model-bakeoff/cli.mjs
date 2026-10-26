import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { assertFreeCatalog, loadFixture, runCandidate, BakeoffError } from './runner.mjs';

const args = process.argv.slice(2);
function arg(name) {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
}

if (!args.includes('--live-free')) {
  process.stderr.write('No network call made. Use --live-free with a verified free model. Paid calls are disabled.\n');
  process.exitCode = 2;
} else {
  const provider = arg('--provider');
  const model = arg('--model');
  const upstream = arg('--upstream');
  const task = arg('--task') ?? 'card';
  const key = provider === 'openrouter' ? process.env.OPENROUTER_API_KEY :
    provider === 'together' ? process.env.TOGETHER_API_KEY : undefined;
  try {
    if (!['card', 'slate'].includes(task)) throw new BakeoffError('invalid_task', 'Task must be card or slate.');
    const outputCap = arg('--max-output') ? Number(arg('--max-output')) : task === 'slate' ? 6000 : 900;
    if (!Number.isSafeInteger(outputCap) || outputCap < 1 || outputCap > (task === 'slate' ? 6000 : 2000)) {
      throw new BakeoffError('invalid_output_cap', 'Free output cap exceeds the bounded screen.');
    }
    const fixture = await loadFixture(resolve(arg('--fixture') ?? 'evaluation/model-bakeoff/fixtures/offline-civic.json'), arg('--brief-id'));
    await assertFreeCatalog({ provider, model, apiKey: key, upstream });
    const result = await runCandidate({ provider, model, apiKey: key, fixture, task, upstream,
      maxOutputTokens: outputCap, timeoutMs: task === 'slate' ? 120000 : 45000 });
    const outputDir = resolve('evaluation/model-bakeoff/output');
    await mkdir(outputDir, { recursive: true });
    const file = resolve(outputDir, `${provider}-${Date.now()}.json`);
    await writeFile(file, JSON.stringify({ fixture_id: fixture.id, ...result }, null, 2)
      .replaceAll(String.fromCodePoint(0x2014), '\\u2014') + '\n');
    process.stdout.write(JSON.stringify({ status: 'accepted', model, routed_provider: result.routed_provider,
      generation_id: result.generation_id, usage: result.usage, latency_ms: result.latency_ms, output_file: file }) + '\n');
  } catch (error) {
    process.stderr.write(JSON.stringify({ status: 'failed', code: error.code ?? 'unexpected_error',
      http_status: error.status ?? null }) + '\n');
    process.exitCode = 1;
  }
}
