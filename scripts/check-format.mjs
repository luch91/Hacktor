import { extname, resolve } from 'node:path';
import { listTextFiles, readUtf8 } from './file-walk.mjs';

const root = resolve('.');
const findings = [];

for (const file of await listTextFiles(root)) {
  const content = await readUtf8(file.absolute);
  if (content.length > 0 && !content.endsWith('\n')) {
    findings.push(`${file.relative}: missing final newline`);
  }
  content.split(/\r?\n/u).forEach((line, index) => {
    if (/\s+$/u.test(line)) findings.push(`${file.relative}:${index + 1}: trailing whitespace`);
  });
  if (extname(file.relative) === '.json') {
    try {
      JSON.parse(content);
    } catch (error) {
      findings.push(`${file.relative}: invalid JSON: ${String(error)}`);
    }
  }
}

if (findings.length > 0) {
  console.error(findings.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Format check passed.');
}
