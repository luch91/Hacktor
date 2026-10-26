import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listTextFiles, readUtf8 } from './file-walk.mjs';

const forbidden = String.fromCodePoint(0x2014);

export async function findForbiddenCharacters(root) {
  const violations = [];
  for (const file of await listTextFiles(root)) {
    const content = await readUtf8(file.absolute);
    const lines = content.split(/\r?\n/u);
    lines.forEach((line, index) => {
      if (line.includes(forbidden)) violations.push(`${file.relative}:${index + 1}`);
    });
  }
  return violations;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const root = resolve(process.argv[2] ?? '.');
  const violations = await findForbiddenCharacters(root);
  if (violations.length > 0) {
    console.error(`Forbidden U+2014 found in:\n${violations.join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log('Typography check passed: no U+2014 found.');
  }
}
