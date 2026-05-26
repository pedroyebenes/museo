#!/usr/bin/env node
/**
 * Issue #32: expand catalog to 1000 paintings (~700 new western canonical works).
 * Loads batch data from scripts/data/issue-32-*.json
 */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commonsUrl, validateImageUrl } from './commons-url.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const authorsDir = path.join(root, 'public', 'catalog', 'authors');
const dataDir = path.join(root, 'scripts', 'data');

const DATA_FILES = [
  'issue-32-paintings.json',
  'issue-32-neoclasicismo.json',
  'issue-32-impresionismo.json',
  'issue-32-catalog.json',
  'issue-32-topup.json',
];

function p(id, filename, title, year, description, width, height) {
  return {
    id,
    url: filename.startsWith('http') ? filename : commonsUrl(decodeURIComponent(filename)),
    title,
    year,
    description,
    dimensions: { width, height },
  };
}

function fromEntry(entry) {
  return p(
    entry.id,
    entry.filename,
    entry.title,
    entry.year,
    entry.description,
    entry.width,
    entry.height,
  );
}

async function loadBatches() {
  const additions = {};
  const newAuthors = {};
  const indexInsertions = {};
  let newCategory = null;

  for (const file of DATA_FILES) {
    const filePath = path.join(dataDir, file);
    let batch;
    try {
      batch = JSON.parse(await readFile(filePath, 'utf8'));
    } catch {
      console.warn(`Skip missing data file: ${file}`);
      continue;
    }

    for (const [slug, paintings] of Object.entries(batch.additions || {})) {
      if (!additions[slug]) additions[slug] = [];
      additions[slug].push(...paintings.map(fromEntry));
    }

    for (const [slug, data] of Object.entries(batch.newAuthors || {})) {
      if (newAuthors[slug]) {
        throw new Error(`Duplicate new author across batches: ${slug} (${file})`);
      }
      newAuthors[slug] = {
        meta: data.meta,
        paintings: data.paintings.map(fromEntry),
      };
    }

    for (const [categoryId, slugs] of Object.entries(batch.indexInsertions || {})) {
      if (!indexInsertions[categoryId]) indexInsertions[categoryId] = [];
      for (const slug of slugs) {
        if (!indexInsertions[categoryId].includes(slug)) indexInsertions[categoryId].push(slug);
      }
    }

    if (batch.newCategory) newCategory = batch.newCategory;
  }

  return { additions, newAuthors, indexInsertions, newCategory };
}

async function main() {
  const skipValidate = process.argv.includes('--skip-validate');
  const dryRun = process.argv.includes('--dry-run');
  const batchArg = process.argv.find((a) => a.startsWith('--batch='));
  const batchLimit = batchArg ? Number(batchArg.split('=')[1]) : 0;

  const { additions, newAuthors, indexInsertions, newCategory } = await loadBatches();

  const existingIds = new Set();
  for (const file of await readdir(authorsDir)) {
    if (!file.endsWith('.json')) continue;
    const author = JSON.parse(await readFile(path.join(authorsDir, file), 'utf8'));
    for (const painting of author.paintings || []) existingIds.add(painting.id);
  }

  const failures = [];
  const toApply = [];

  async function checkPainting(painting, authorSlug) {
    if (existingIds.has(painting.id)) {
      console.log(`SKIP existing id: ${painting.id}`);
      return;
    }
    if (!skipValidate) {
      const { ok, status, type } = await validateImageUrl(painting.url);
      if (!ok) {
        failures.push({ authorSlug, id: painting.id, url: painting.url, status, type });
        return;
      }
      console.log(`OK ${painting.id}`);
    }
    toApply.push({ authorSlug, painting });
    if (batchLimit > 0 && toApply.length >= batchLimit) return 'STOP';
  }

  outer: for (const [slug, paintings] of Object.entries(newAuthors)) {
    for (const painting of paintings.paintings) {
      if ((await checkPainting(painting, slug)) === 'STOP') break outer;
    }
  }
  if (toApply.length < batchLimit || batchLimit === 0) {
    outer2: for (const [slug, paintings] of Object.entries(additions)) {
      for (const painting of paintings) {
        if (batchLimit > 0 && toApply.length >= batchLimit) break outer2;
        await checkPainting(painting, slug);
      }
    }
  }

  if (failures.length) {
    console.error('\nURL failures:');
    for (const f of failures) console.error(JSON.stringify(f));
    process.exit(1);
  }

  console.log(`\nReady to add ${toApply.length} paintings`);

  if (dryRun) return;

  const byAuthor = new Map();
  for (const { authorSlug, painting } of toApply) {
    if (!byAuthor.has(authorSlug)) byAuthor.set(authorSlug, []);
    byAuthor.get(authorSlug).push(painting);
  }

  for (const [slug, paintings] of byAuthor) {
    if (newAuthors[slug]) {
      const author = { ...newAuthors[slug].meta, paintings };
      await writeFile(path.join(authorsDir, `${slug}.json`), JSON.stringify(author, null, 2) + '\n');
      console.log(`Created ${slug} (${paintings.length})`);
      continue;
    }
    const file = path.join(authorsDir, `${slug}.json`);
    const author = JSON.parse(await readFile(file, 'utf8'));
    author.paintings.push(...paintings);
    await writeFile(file, JSON.stringify(author, null, 2) + '\n');
    console.log(`Updated ${slug} (+${paintings.length})`);
  }

  const indexPath = path.join(root, 'public', 'catalog', 'index.json');
  const index = JSON.parse(await readFile(indexPath, 'utf8'));

  if (newCategory && !index.categories.some((c) => c.id === newCategory.id)) {
    const japIdx = index.categories.findIndex((c) => c.id === 'arte-japones');
    const insertAt = japIdx >= 0 ? japIdx : index.categories.length;
    index.categories.splice(insertAt, 0, {
      ...newCategory,
      authors: [],
    });
    console.log(`Added category: ${newCategory.id}`);
  }

  for (const [categoryId, slugs] of Object.entries(indexInsertions)) {
    const category = index.categories.find((c) => c.id === categoryId);
    if (!category) throw new Error(`Missing category: ${categoryId}`);
    for (const slug of slugs) {
      if (newAuthors[slug] && !category.authors.includes(slug)) category.authors.push(slug);
    }
  }

  await writeFile(indexPath, JSON.stringify(index, null, 2) + '\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
