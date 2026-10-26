import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { findForbiddenCharacters } from '../../scripts/check-no-emdash.mjs';

const created: string[] = [];

afterEach(async () => {
  await Promise.all(created.splice(0).map((path) => rm(path, { force: true, recursive: true })));
});

describe('U+2014 enforcement', () => {
  it('passes clean generated text', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hacktor-clean-'));
    created.push(directory);
    await writeFile(join(directory, 'export.md'), 'A build-ready idea with explicit evidence.');
    await expect(findForbiddenCharacters(directory)).resolves.toEqual([]);
  });

  it('reports the file and line for forbidden generated text', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hacktor-forbidden-'));
    created.push(directory);
    const forbidden = String.fromCodePoint(0x2014);
    await writeFile(join(directory, 'export.md'), `Allowed line\nBlocked${forbidden}line`);
    await expect(findForbiddenCharacters(directory)).resolves.toEqual(['export.md:2']);
  });
});
