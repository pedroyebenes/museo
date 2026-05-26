#!/usr/bin/env node
/**
 * generate-url-report.mjs — Generate CSV report of paintings needing URL fixes
 * Output can be used to manually curate replacements
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const authorsDir = path.join(root, 'public', 'catalog', 'authors');

async function generateReport() {
  const files = (await readdir(authorsDir)).filter(f => f.endsWith('.json'));
  const rows = [];

  // Header
  rows.push('author_id,author_name,painting_id,painting_title,year,broken_url');

  for (const file of files) {
    const authorId = file.replace(/\.json$/, '');
    const filePath = path.join(authorsDir, file);
    const author = JSON.parse(await readFile(filePath, 'utf8'));

    for (const painting of author.paintings || []) {
      if (painting.url && painting.url.includes('Google_Art_Project')) {
        // Escape CSV fields
        const escape = (s) => `"${String(s).replace(/"/g, '""')}"`;

        rows.push([
          authorId,
          author.name,
          painting.id,
          painting.title,
          painting.year,
          painting.url,
        ].map(escape).join(','));
      }
    }
  }

  const report = rows.join('\n');
  const outputPath = path.join(root, 'url-fixes-needed.csv');
  await writeFile(outputPath, report);

  console.log(`Generated report: ${outputPath}`);
  console.log(`Total paintings needing fixes: ${rows.length - 1}`);
  console.log('\nTo create a mapping:');
  console.log('1. Open the CSV in a spreadsheet');
  console.log('2. For each painting, search on Wikimedia Commons');
  console.log('3. Find the direct upload.wikimedia.org URL');
  console.log('4. Save a JSON mapping file');
}

generateReport().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
