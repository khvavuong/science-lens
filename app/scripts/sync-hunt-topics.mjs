import { copyFile, readFile } from 'node:fs/promises';

const source = new URL('../../server/src/hunt-topics.json', import.meta.url);
const target = new URL('../src/lib/hunt-topics.json', import.meta.url);
if (process.argv.includes('--check')) {
  const [original, copy] = await Promise.all([readFile(source, 'utf8'), readFile(target, 'utf8')]);
  if (original.replace(/\r\n/g, '\n') !== copy.replace(/\r\n/g, '\n')) {
    throw new Error('Danh mục Săn đồ vật chưa đồng bộ. Chạy node scripts/sync-hunt-topics.mjs.');
  }
} else {
  await copyFile(source, target);
}
