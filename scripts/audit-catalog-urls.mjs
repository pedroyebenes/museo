import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const authorsDir = path.join(root, 'public', 'catalog', 'authors');

function hashPrefix(filename) {
  const normalized = filename.replace(/ /g, '_');
  const md5 = crypto.createHash('md5').update(normalized).digest('hex');
  return `${md5[0]}/${md5.slice(0, 2)}`;
}

function filenameFromUploadUrl(url) {
  const m = url.match(/upload\.wikimedia\.org\/wikipedia\/commons\/([^/]+\/[^/]+)\/(.+)$/);
  if (!m) return null;
  return { prefix: m[1], name: decodeURIComponent(m[2]) };
}

const hashMismatches = [];
const encodingOnly = [];

for (const file of await readdir(authorsDir)) {
  if (!file.endsWith('.json')) continue;
  const author = JSON.parse(await readFile(path.join(authorsDir, file), 'utf8'));
  for (const painting of author.paintings || []) {
    const parsed = filenameFromUploadUrl(painting.url);
    if (!parsed) continue;
    const expectedPrefix = hashPrefix(parsed.name);
    const encoded = encodeURIComponent(parsed.name.replace(/ /g, '_')).replace(/%2F/g, '/');
    const expectedUrl = `https://upload.wikimedia.org/wikipedia/commons/${expectedPrefix}/${encoded}`;
    if (parsed.prefix !== expectedPrefix) {
      hashMismatches.push({ id: painting.id, author: author.id, url: painting.url, expectedUrl });
    } else if (painting.url !== expectedUrl) {
      encodingOnly.push({ id: painting.id, url: painting.url, expectedUrl });
    }
  }
}

console.log(`Hash prefix mismatches (broken): ${hashMismatches.length}`);
for (const h of hashMismatches) console.log(JSON.stringify(h));

console.log(`\nEncoding-only differences (likely OK): ${encodingOnly.length}`);
