#!/usr/bin/env node
/** Validate filenames; writes progress and failures incrementally. */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(root, 'scripts', 'data', 'issue-32-catalog.json');
const progressPath = path.join(root, 'scripts', 'data', 'issue-32-validate-progress.json');
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const UA = 'MuseoCatalog/1.0';

const items = [];
for (const [author, list] of Object.entries(catalog.additions)) {
  for (const p of list) items.push({ author, id: p.id, filename: p.filename });
}
for (const [author, data] of Object.entries(catalog.newAuthors)) {
  for (const p of data.paintings) items.push({ author, id: p.id, filename: p.filename });
}

let progress = { checked: 0, ok: [], failures: [] };
try {
  progress = JSON.parse(await readFile(progressPath, 'utf8'));
} catch {}

const checkedIds = new Set(progress.ok.map((x) => x.id).concat(progress.failures.map((x) => x.id)));

async function exists(filename) {
  const title = 'File:' + decodeURIComponent(filename).replace(/ /g, '_');
  for (let i = 0; i < 5; i++) {
    const url =
      'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=' +
      encodeURIComponent(title);
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    const text = await res.text();
    if (!text.startsWith('{')) {
      await new Promise((r) => setTimeout(r, 6000 * (i + 1)));
      continue;
    }
    const page = Object.values(JSON.parse(text).query.pages)[0];
    return page.missing === undefined;
  }
  return false;
}

for (const item of items) {
  if (checkedIds.has(item.id)) continue;
  await new Promise((r) => setTimeout(r, 2500));
  const ok = await exists(item.filename);
  if (ok) progress.ok.push(item);
  else progress.failures.push(item);
  progress.checked++;
  await writeFile(progressPath, JSON.stringify(progress, null, 2) + '\n');
  process.stdout.write(`\r${progress.ok.length} ok, ${progress.failures.length} fail / ${items.length}`);
}

console.log('\ndone');
if (progress.failures.length) process.exit(1);
