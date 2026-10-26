import { readFile, writeFile } from 'node:fs/promises';

const forbidden = String.fromCodePoint(0x2014);
const paths = process.argv.slice(2);

if (paths.length === 0) {
  throw new Error('Provide at least one generated text path');
}

for (const path of paths) {
  const source = await readFile(path, 'utf8');
  const normalized = source
    .replaceAll(forbidden, '-')
    .split(/\r?\n/u)
    .map((line) => line.trimEnd())
    .join('\n');
  await writeFile(path, normalized.endsWith('\n') ? normalized : `${normalized}\n`);
}

console.log(`Normalized ${paths.length} generated text file(s).`);
