import { readFile } from 'node:fs/promises';

const environment = process.argv[2];
if (environment !== 'staging' && environment !== 'production') {
  throw new Error('Expected staging or production environment');
}

const placeholder = environment === 'staging' ? '11111111-1111-1111-1111-111111111111' : '22222222-2222-2222-2222-222222222222';
const configs = [
  'apps/web/wrangler.jsonc',
  'workers/ai-consumer/wrangler.jsonc',
  'workers/ingestion/wrangler.jsonc',
];

for (const config of configs) {
  const content = await readFile(config, 'utf8');
  if (content.includes(placeholder)) {
    throw new Error(`${config} still contains the ${environment} D1 placeholder`);
  }
}

console.log(`${environment} configuration has no placeholder D1 identifier.`);
