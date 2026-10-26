import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const ignoredDirectories = new Set([
  '.git',
  '.npm-cache',
  '.pnpm-store-copy',
  '.types',
  '.wrangler',
  '.wrangler-config',
  'coverage',
  'dist',
  'node_modules',
  'playwright-report',
  'test-results',
  'worker-dist',
]);

const textExtensions = new Set([
  '',
  '.css',
  '.csv',
  '.html',
  '.js',
  '.json',
  '.jsonc',
  '.jsx',
  '.md',
  '.mjs',
  '.sql',
  '.svg',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
]);

export async function listTextFiles(root) {
  const results = [];

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(absolute);
      } else if (entry.isFile() && textExtensions.has(extname(entry.name).toLowerCase())) {
        results.push({ absolute, relative: relative(root, absolute).replaceAll('\\', '/') });
      }
    }
  }

  await visit(root);
  return results;
}

export async function readUtf8(path) {
  return readFile(path, 'utf8');
}
