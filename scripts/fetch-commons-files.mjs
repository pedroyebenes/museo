#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(root, 'scripts', 'data', 'commons-files-by-artist.json');
const UA = 'MuseoCatalog/1.0 (issue-32)';

const ARTISTS = [
  ['Edvard Munch', 'edvard-munch'],
  ['Odilon Redon', 'odilon-redon'],
  ['Gustav Klimt', 'gustav-klimt'],
  ['Henri Rousseau', 'henri-rousseau'],
  ['Aubrey Beardsley', 'aubrey-beardsley'],
  ['Gustave Moreau', 'gustave-moreau'],
  ['Ferdinand Hodler', 'ferdinand-hodler'],
  ['Alphonse Mucha', 'alphonse-mucha'],
  ['Pablo Picasso', 'pablo-picasso'],
  ['Henri Matisse', 'henri-matisse'],
  ['Georges Braque', 'georges-braque'],
  ['Salvador Dalí', 'salvador-dali'],
  ['René Magritte', 'rene-magritte'],
  ['Joan Miró', 'joan-miro'],
  ['Wassily Kandinsky', 'wassily-kandinsky'],
  ['Piet Mondrian', 'piet-mondrian'],
  ['Amedeo Modigliani', 'amedeo-modigliani'],
  ['Marc Chagall', 'marc-chagall'],
  ['Edward Hopper', 'edward-hopper'],
  ['Georgia O\'Keeffe', 'georgia-o-keeffe'],
  ['Kazimir Malevich', 'kasimir-malevich'],
  ['Frida Kahlo', 'frida-kahlo'],
  ['Andrew Wyeth', 'andrew-wyeth'],
  ['Grant Wood', 'grant-wood'],
];

let out = {};
try {
  out = JSON.parse(await readFile(outPath, 'utf8'));
} catch {}

async function searchFiles(query, limit = 50) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const url =
      'https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search' +
      '&srnamespace=6&srlimit=' + limit + '&srsearch=' + encodeURIComponent(query);
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    const text = await res.text();
    if (!text.startsWith('{')) {
      await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
      continue;
    }
    const json = JSON.parse(text);
    return (json.query?.search ?? []).map((s) => s.title.replace(/^File:/, '').replace(/ /g, '_'));
  }
  throw new Error('rate limited: ' + query);
}

function score(name) {
  if (/Google_Art_Project/i.test(name)) return 3;
  if (/Google_Cultural_Institute/i.test(name)) return 2;
  if (/\.(jpg|jpeg|png)$/i.test(name)) return 1;
  return 0;
}

for (const [name, slug] of ARTISTS) {
  if (out[slug]?.length) {
    console.log(`skip ${slug} (${out[slug].length})`);
    continue;
  }
  await new Promise((r) => setTimeout(r, 4000));
  let files = await searchFiles(`${name} Google Art Project`, 50);
  files = [...new Set(files)].sort((a, b) => score(b) - score(a) || a.localeCompare(b));
  out[slug] = files;
  await writeFile(outPath, JSON.stringify(out, null, 2) + '\n');
  console.log(`${slug}: ${files.length}`);
}

console.log('done');
