import { resolve } from 'node:path';
import { listTextFiles, readUtf8 } from './file-walk.mjs';

const patterns = [
  ['private key', ['BEGIN ', 'PRIVATE KEY'].join('')],
  ['GitHub token', ['gh', 'p_'].join('')],
  ['OpenAI key', ['sk', '-proj-'].join('')],
  ['AWS access key', ['AK', 'IA'].join('')],
];

const root = resolve('.');
const findings = [];

for (const file of await listTextFiles(root)) {
  if (file.relative === 'scripts/check-secrets.mjs') continue;
  const content = await readUtf8(file.absolute);
  for (const [label, marker] of patterns) {
    if (content.includes(marker)) findings.push(`${file.relative}: possible ${label}`);
  }
}

if (findings.length > 0) {
  console.error(findings.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Secret scan passed.');
}
