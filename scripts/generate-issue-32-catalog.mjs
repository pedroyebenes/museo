#!/usr/bin/env node
/**
 * Assemble issue #32 catalog JSON from modular data files.
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADDITIONS } from './data/issue-32-part-a.mjs';
import { NEW_SIMBOLISMO } from './data/issue-32-part-b.mjs';
import { NEW_MODERNO_1 } from './data/issue-32-part-c1.mjs';
import { NEW_MODERNO_2 } from './data/issue-32-part-c2.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(root, 'scripts', 'data', 'issue-32-catalog.json');

const newAuthors = {
  ...NEW_SIMBOLISMO,
  ...NEW_MODERNO_1,
  ...NEW_MODERNO_2,
};

const simbolismoSlugs = Object.keys(NEW_SIMBOLISMO);
const modernoSlugs = [...Object.keys(NEW_MODERNO_1), ...Object.keys(NEW_MODERNO_2)];

const catalog = {
  additions: ADDITIONS,
  newAuthors,
  indexInsertions: {
    'simbolismo-modernismo-naif': simbolismoSlugs,
    'arte-moderno-siglo-xx': modernoSlugs,
  },
  newCategory: {
    id: 'arte-moderno-siglo-xx',
    label: 'Arte moderno del siglo XX',
    description: 'Vanguardias, cubismo, surrealismo y modernidad americana.',
  },
};

function countPaintings() {
  let n = 0;
  for (const list of Object.values(ADDITIONS)) n += list.length;
  for (const author of Object.values(newAuthors)) n += author.paintings.length;
  return n;
}

await writeFile(outPath, JSON.stringify(catalog, null, 2) + '\n');

const additionsCount = Object.values(ADDITIONS).reduce((s, a) => s + a.length, 0);
console.log(`Issue #32 catalog: ${countPaintings()} paintings`);
console.log(`  additions: ${additionsCount}`);
console.log(`  new simbolismo: ${simbolismoSlugs.length} authors, ${simbolismoSlugs.reduce((s, k) => s + newAuthors[k].paintings.length, 0)} paintings`);
console.log(`  new moderno: ${modernoSlugs.length} authors, ${modernoSlugs.reduce((s, k) => s + newAuthors[k].paintings.length, 0)} paintings`);
console.log(`Written: ${path.relative(root, outPath)}`);
