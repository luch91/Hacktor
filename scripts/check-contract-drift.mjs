import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const expected = {
  'api/openapi.yaml': '2fd394530368845f3958d15f9bac68c0b58f0e2c4c2295b08fe8cffa3aa1480f',
  'database/migrations/0001_init.sql':
    '28775088fe886bb7183c7424dc56fc0a54ece4be447a4f301b12bfd5cbb9d200',
  'schemas/idea-card.v1.schema.json':
    'd3ba4fb60c2fd4d205c606bc72ace8debd149c2c049a8935a6a6b4c070d706a7',
};

let failed = false;
for (const [path, hash] of Object.entries(expected)) {
  const actual = createHash('sha256').update(await readFile(path)).digest('hex');
  if (actual !== hash) {
    failed = true;
    console.error(`${path} changed without updating the reviewed contract lock`);
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log('Contract drift check passed.');
}
