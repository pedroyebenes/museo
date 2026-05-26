#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = path.join(root, 'scripts', 'data', 'issue-32-catalog.json');
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const UA = 'MuseoCatalog/1.0';

/** @type {{ author: string, id: string, filename: string }[]} */
const items = [];
for (const [author, list] of Object.entries(catalog.additions)) {
  for (const p of list) items.push({ author, id: p.id, filename: p.filename });
}
for (const [author, data] of Object.entries(catalog.newAuthors)) {
  for (const p of data.paintings) items.push({ author, id: p.id, filename: p.filename });
}

const failures = [];
const BATCH = 20;

async function checkBatch(batch) {
  const titles = batch
    .map((x) => 'File:' + decodeURIComponent(x.filename).replace(/ /g, '_'))
    .map((t) => encodeURIComponent(t).replace(/%20/g, '_'))
    .join('|');
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=' +
    titles;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const json = JSON.parse(await res.text());
  const pages = json.query?.pages ?? {};
  const found = new Set();
  for (const page of Object.values(pages)) {
    if (page.missing !== undefined) continue;
    const fn = page.title.replace(/^File:/, '').replace(/ /g, '_');
    found.add(fn);
  }
  for (const item of batch) {
    const fn = decodeURIComponent(item.filename).replace(/ /g, '_');
    if (!found.has(fn)) failures.push(item);
  }
}

for (let i = 0; i < items.length; i += BATCH) {
  await checkBatch(items.slice(i, i + BATCH));
  await new Promise((r) => setTimeout(r, 1500));
  process.stdout.write(`\r${Math.min(i + BATCH, items.length)}/${items.length}`);
}

console.log(`\nFailures: ${failures.length}`);
if (failures.length) {
  await writeFile(
    path.join(root, 'scripts', 'data', 'issue-32-url-failures.json'),
    JSON.stringify(failures, null, 2) + '\n',
  );
  for (const f of failures) console.log(`${f.id}: ${f.filename}`);
  process.exit(1);
}
