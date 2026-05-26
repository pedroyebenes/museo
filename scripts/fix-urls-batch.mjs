#!/usr/bin/env node
/**
 * fix-urls-batch.mjs — Batch fix Google Art Project URLs in catalog
 *
 * Usage:
 *   node scripts/fix-urls-batch.mjs              # analyze and fix all files
 *   node scripts/fix-urls-batch.mjs --dry-run    # show what would be fixed without applying
 *   node scripts/fix-urls-batch.mjs --validate   # only validate existing URLs
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const authorsDir = path.join(root, 'public', 'catalog', 'authors');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const validateOnly = args.includes('--validate');

// URL validation with exponential backoff for rate limiting
async function validateUrl(url, attempt = 0) {
  const delays = [1000, 3000, 8000, 15000];
  const maxAttempts = 4;

  if (attempt > 0) {
    const delay = delays[Math.min(attempt - 1, delays.length - 1)];
    await new Promise(r => setTimeout(r, delay));
  }

  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });

    if (res.status === 429 && attempt < maxAttempts) {
      return validateUrl(url, attempt + 1);
    }

    const type = res.headers.get('content-type') || '';
    return {
      ok: res.ok && type.startsWith('image/'),
      status: res.status,
      type,
    };
  } catch (err) {
    if (attempt < maxAttempts) {
      return validateUrl(url, attempt + 1);
    }
    return { ok: false, status: 0, type: err.message };
  }
}

// Generate alternative URL candidates by removing Google Art Project suffix
function generateUrlCandidates(originalUrl) {
  if (!originalUrl.includes('Google_Art_Project')) {
    return [];
  }

  const candidates = [];

  // Remove "-Google_Art_Project" entirely
  const withoutSuffix = originalUrl.replace(/-Google_Art_Project/, '');
  candidates.push(withoutSuffix);

  // Try replacing underscores with dashes in the part before Google_Art_Project
  const parts = originalUrl.split('/');
  const filename = parts[parts.length - 1];
  const baseFilename = filename.replace(/_Google_Art_Project/, '-Google_Art_Project').replace(/-Google_Art_Project.*/, '');

  // Generate variations
  const variations = [
    withoutSuffix,
    originalUrl.replace('Google_Art_Project.jpg', '01.jpg'),
    originalUrl.replace('Google_Art_Project.jpg', 'A.jpg'),
  ];

  // For known major works, try specific patterns
  if (filename.includes('Night_Watch')) {
    candidates.push('https://upload.wikimedia.org/wikipedia/commons/5/5a/The_Night_Watch_-_HD.jpg');
  }
  if (filename.includes('Starry_Night')) {
    candidates.push('https://upload.wikimedia.org/wikipedia/commons/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg');
  }

  return candidates.filter((c, i, a) => a.indexOf(c) === i);
}

// Load all paintings from author files
async function loadPaintings() {
  const files = (await readdir(authorsDir)).filter(f => f.endsWith('.json'));
  const data = [];

  for (const file of files) {
    const authorId = file.replace(/\.json$/, '');
    const filePath = path.join(authorsDir, file);
    const author = JSON.parse(await readFile(filePath, 'utf8'));

    for (let i = 0; i < (author.paintings || []).length; i++) {
      const painting = author.paintings[i];
      if (painting.url && painting.url.includes('Google_Art_Project')) {
        data.push({
          authorId,
          authorName: author.name,
          authorFile: filePath,
          paintingIndex: i,
          paintingId: painting.id,
          paintingTitle: painting.title,
          originalUrl: painting.url,
          candidates: generateUrlCandidates(painting.url),
        });
      }
    }
  }

  return data;
}

// Find best replacement URL
async function findBestUrl(item) {
  if (!item.candidates.length) {
    return null;
  }

  for (const candidate of item.candidates) {
    if (candidate === item.originalUrl) continue;

    const result = await validateUrl(candidate);
    if (result.ok) {
      return candidate;
    }
  }

  return null;
}

// Group paintings by author file
function groupByAuthor(paintings) {
  const groups = {};
  for (const painting of paintings) {
    if (!groups[painting.authorFile]) {
      groups[painting.authorFile] = [];
    }
    groups[painting.authorFile].push(painting);
  }
  return groups;
}

// Apply fixes to an author file
async function fixAuthorFile(filePath, paintings) {
  const author = JSON.parse(await readFile(filePath, 'utf8'));

  let changed = 0;
  for (const painting of paintings) {
    const newUrl = await findBestUrl(painting);
    if (newUrl && newUrl !== painting.originalUrl) {
      author.paintings[painting.paintingIndex].url = newUrl;
      changed++;
    }
  }

  if (changed > 0 && !dryRun) {
    await writeFile(filePath, JSON.stringify(author, null, 2) + '\n');
  }

  return changed;
}

// Main execution
async function main() {
  console.log('Loading paintings with Google Art Project URLs...\n');

  const paintings = await loadPaintings();
  console.log(`Found ${paintings.length} paintings needing fixes.\n`);

  if (paintings.length === 0) {
    console.log('No Google Art Project URLs found. All good!');
    return;
  }

  const grouped = groupByAuthor(paintings);
  const authorFiles = Object.keys(grouped);

  let totalFixed = 0;
  const report = [];

  for (const filePath of authorFiles) {
    const authorPaintings = grouped[filePath];
    const authorId = authorPaintings[0].authorId;
    const authorName = authorPaintings[0].authorName;

    console.log(`\nProcessing ${authorName} (${authorId}) — ${authorPaintings.length} paintings...`);

    const fixed = await fixAuthorFile(filePath, authorPaintings);
    totalFixed += fixed;

    if (fixed > 0) {
      report.push(`✓ ${authorName}: ${fixed}/${authorPaintings.length} fixed`);
      console.log(`  Fixed: ${fixed}/${authorPaintings.length}`);
    } else {
      report.push(`✗ ${authorName}: 0/${authorPaintings.length} fixed`);
      console.log(`  No valid alternatives found`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\nSummary: ${totalFixed}/${paintings.length} paintings fixed`);

  if (dryRun) {
    console.log('(dry-run: no files were modified)');
  }

  console.log('\nDetailed report:');
  report.forEach(line => console.log('  ' + line));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
