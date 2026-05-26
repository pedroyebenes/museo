#!/usr/bin/env node
/** Validate issue-32 catalog filenames against Wikimedia Commons. */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commonsUrl, validateImageUrl } from './commons-url.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(root, 'scripts', 'data', 'issue-32-catalog.json');

const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const failures = [];
let checked = 0;

async function check(painting, author) {
  const url = commonsUrl(decodeURIComponent(painting.filename));
  const { ok, status, type } = await validateImageUrl(url, 2000);
  checked++;
  if (!ok) failures.push({ author, id: painting.id, filename: painting.filename, status, type });
  else process.stdout.write('.');
}

for (const [author, list] of Object.entries(catalog.additions)) {
  for (const painting of list) await check(painting, author);
}
for (const [author, data] of Object.entries(catalog.newAuthors)) {
  for (const painting of data.paintings) await check(painting, author);
}

console.log(`\nChecked ${checked}, failures: ${failures.length}`);
if (failures.length) {
  await writeFile(
    path.join(root, 'scripts', 'data', 'issue-32-url-failures.json'),
    JSON.stringify(failures, null, 2) + '\n',
  );
  for (const f of failures) console.log(JSON.stringify(f));
  process.exit(1);
}
