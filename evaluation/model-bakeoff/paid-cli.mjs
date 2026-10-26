import { resolve } from 'node:path';
import { executePaid } from './paid.mjs';
import { loadFixture } from './runner.mjs';

const args = process.argv.slice(2);
const value = (name) => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };

try {
  const fixture = await loadFixture(resolve('evaluation/model-bakeoff/fixtures/pilot-briefs.json'), value('--brief-id'));
  const result = await executePaid({ candidateKey: value('--candidate'), fixture,
    task: value('--task'), key: process.env.OPENROUTER_API_KEY,
    dbPath: resolve('evaluation/model-bakeoff/output/pilot-ledger.sqlite'),
    authorized: args.includes('--authorized-pilot') });
  process.stdout.write(JSON.stringify(result) + '\n');
} catch (error) {
  process.stderr.write(JSON.stringify({ status: 'stopped', code: error.code ?? 'unexpected_error' }) + '\n');
  process.exitCode = 1;
}
