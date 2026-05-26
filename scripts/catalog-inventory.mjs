#!/usr/bin/env node
/**
 * Export catalog inventory: paintings, counts by author/category, dedup helpers.
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogDir = path.join(root, 'public', 'catalog');
const authorsDir = path.join(catalogDir, 'authors');
const outDir = path.join(root, 'scripts', 'data');

async function main() {
  const index = JSON.parse(await readFile(path.join(catalogDir, 'index.json'), 'utf8'));
  const paintings = [];
  const byAuthor = {};
  const byCategory = {};
  const titles = new Set();

  for (const category of index.categories) {
    byCategory[category.id] = { label: category.label, authors: 0, paintings: 0 };
    for (const authorId of category.authors) {
      const file = path.join(authorsDir, `${authorId}.json`);
      const author = JSON.parse(await readFile(file, 'utf8'));
      const count = author.paintings.length;
      byAuthor[authorId] = {
        name: author.name,
        category: category.id,
        paintings: count,
      };
      byCategory[category.id].authors += 1;
      byCategory[category.id].paintings += count;
      for (const painting of author.paintings) {
        paintings.push({
          id: painting.id,
          title: painting.title,
          year: painting.year,
          author: authorId,
          authorName: author.name,
          category: category.id,
        });
        titles.add(`${authorId}:${painting.title.toLowerCase()}`);
      }
    }
  }

  await mkdir(outDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const jsonPath = path.join(outDir, `catalog-inventory-${stamp}.json`);
  const summary = {
    generated: new Date().toISOString(),
    totals: {
      categories: index.categories.length,
      authors: Object.keys(byAuthor).length,
      paintings: paintings.length,
    },
    byCategory,
    byAuthor,
    paintings,
  };
  await writeFile(jsonPath, JSON.stringify(summary, null, 2) + '\n');

  console.log(`Inventory: ${summary.totals.paintings} obras, ${summary.totals.authors} autores`);
  console.log(`Written: ${path.relative(root, jsonPath)}`);
  for (const [id, data] of Object.entries(byCategory)) {
    console.log(`  ${id}: ${data.paintings} obras, ${data.authors} autores`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
