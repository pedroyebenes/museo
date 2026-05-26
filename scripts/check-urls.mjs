#!/usr/bin/env node
/**
 * check-urls.mjs — HEAD-check every painting URL in the catalog.
 *
 * Usage:
 *   node scripts/check-urls.mjs              # check all authors
 *   node scripts/check-urls.mjs van-gogh     # check one author by id
 *   node scripts/check-urls.mjs --concurrency 3  # parallel requests (default: 2)
 *
 * Exits 0 if all URLs are reachable, 1 if any fail.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const authorsDir = path.join(root, 'public', 'catalog', 'authors');

const args = process.argv.slice(2);
const concurrencyFlag = args.indexOf('--concurrency');
const CONCURRENCY = concurrencyFlag !== -1 ? parseInt(args[concurrencyFlag + 1], 10) : 2;
const authorFilter = args.filter((a) => !a.startsWith('--') && !/^\d+$/.test(a));

const RETRY_DELAYS = [0, 3000, 8000, 15000];
const BETWEEN_REQUESTS_MS = 1200;

async function headUrl(url) {
  for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
    if (RETRY_DELAYS[attempt]) await sleep(RETRY_DELAYS[attempt]);
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });
      if (res.status === 429) continue;
      const type = res.headers.get('content-type') || '';
      return {
        ok: res.ok && type.startsWith('image/'),
        status: res.status,
        type,
      };
    } catch (err) {
      if (attempt === RETRY_DELAYS.length - 1) return { ok: false, status: 0, type: err.message };
    }
  }
  return { ok: false, status: 429, type: 'rate-limited' };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function loadPaintings() {
  const files = (await readdir(authorsDir)).filter((f) => f.endsWith('.json'));
  const paintings = [];
  for (const file of files) {
    const authorId = file.replace(/\.json$/, '');
    if (authorFilter.length && !authorFilter.includes(authorId)) continue;
    const author = JSON.parse(await readFile(path.join(authorsDir, file), 'utf8'));
    for (const painting of author.paintings || []) {
      paintings.push({ authorId, authorName: author.name, ...painting });
    }
  }
  return paintings;
}

async function runPool(tasks, concurrency) {
  const results = [];
  let i = 0;

  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
      await sleep(BETWEEN_REQUESTS_MS);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

async function main() {
  const paintings = await loadPaintings();
  if (!paintings.length) {
    console.error('No paintings found (check --author filter or catalog path).');
    process.exit(1);
  }

  console.log(`Checking ${paintings.length} URLs (concurrency: ${CONCURRENCY})…\n`);

  let checked = 0;
  const broken = [];

  const tasks = paintings.map((p) => async () => {
    const result = await headUrl(p.url);
    checked++;
    const pct = ((checked / paintings.length) * 100).toFixed(0);
    if (result.ok) {
      process.stdout.write(`\r[${pct}%] ${checked}/${paintings.length} checked…`);
    } else {
      process.stdout.write('\n');
      console.error(`  FAIL [${result.status}] ${p.authorId} / ${p.id} — ${p.url}`);
      broken.push({ authorId: p.authorId, authorName: p.authorName, paintingId: p.id, title: p.title, url: p.url, status: result.status });
    }
    return result;
  });

  await runPool(tasks, CONCURRENCY);

  process.stdout.write('\n\n');
  console.log(`Done. ${checked - broken.length}/${checked} OK, ${broken.length} broken.`);

  if (broken.length) {
    console.log('\nBroken URLs:');
    for (const b of broken) {
      console.log(`  [${b.status}] ${b.authorName} / "${b.title}"`);
      console.log(`         ${b.url}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
