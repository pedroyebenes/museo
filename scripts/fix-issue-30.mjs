import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commonsUrl } from './commons-url.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const authorsDir = path.join(root, 'public', 'catalog', 'authors');
const dryRun = process.argv.includes('--dry-run');
const skipLive = process.argv.includes('--skip-live');

/** Paintings whose Commons filename changed or was wrong. */
const URL_BY_ID = new Map([
  [
    'alberto-durero-autorretrato-con-pelliza',
    commonsUrl('Albrecht Dürer - 1500 self-portrait (High resolution and detail).jpg'),
  ],
  [
    'gauguin-vision-sermon',
    commonsUrl(
      'Paul Gauguin - Vision of the Sermon (Jacob Wrestling with the Angel) - NG 1643 - National Galleries of Scotland.jpg',
    ),
  ],
  [
    'sargent-hijas-boitt',
    commonsUrl(
      'The Daughters of Edward Darley Boit, John Singer Sargent, 1882 (unfree frame crop).jpg',
    ),
  ],
  [
    'katsushika-hokusai-viento-del-sur-cielo-claro',
    commonsUrl('Red Fuji southern wind clear morning.jpg'),
  ],
  [
    'rafael-la-belle-jardiniere',
    commonsUrl(
      "La Vierge à l'Enfant avec le petit saint Jean Baptiste - Raphaël - Musée du Louvre Peintures INV 602 ; MR 433.jpg",
    ),
  ],
  ['william-blake-the-ancient-of-days', commonsUrl('William Blake - The Ancient of Days.jpg')],
]);

/** Verified width × height in centimetres (horizontal × vertical). */
const DIMENSIONS_BY_ID = new Map([
  ['leonardo-dama-ermellino', { width: 40.3, height: 54.8 }],
  ['leonardo-san-juan-bautista', { width: 57, height: 69 }],
  ['sargent-hijas-boitt', { width: 222.5, height: 222.5 }],
  ['monet-mujer-sombrilla', { width: 81, height: 100 }],
  ['monet-catedral-rouen', { width: 65, height: 100.1 }],
  ['monet-boulevard-capucines', { width: 60, height: 80 }],
  ['monet-campo-amapolas', { width: 65, height: 50 }],
  ['rembrandt-ronda-noche', { width: 437, height: 363 }],
  ['rembrandt-autorretrato', { width: 112, height: 145 }],
  ['rembrandt-sindicos', { width: 279, height: 192 }],
  ['seurat-domingo-grande-jatte', { width: 308, height: 207 }],
  ['seurat-circo', { width: 150, height: 185 }],
  ['goya-tres-de-mayo', { width: 345, height: 266 }],
  ['goya-dos-mayo', { width: 347, height: 268 }],
  ['vermeer-perla', { width: 39, height: 44.5 }],
  ['munch-madonna', { width: 70, height: 90 }],
  ['munch-ansiedad', { width: 74, height: 94 }],
  ['degas-clase-ballet', { width: 75, height: 85 }],
  ['vangogh-girasoles', { width: 73, height: 92 }],
  ['van-gogh-autorretrato', { width: 54, height: 65 }],
  ['van-gogh-dormitorio', { width: 90, height: 72 }],
  ['botticelli-nacimiento-venus', { width: 279, height: 173 }],
  ['bruegel-torre-babel', { width: 155, height: 114 }],
  ['cezanne-jugadores-cartas', { width: 81, height: 65 }],
  ['cezanne-banistas', { width: 251, height: 211 }],
  ['cezanne-mont-sainte-victoire', { width: 81, height: 65 }],
  ['gauguin-arearea', { width: 94, height: 75 }],
  ['renoir-remando', { width: 172, height: 129 }],
  ['friedrich-wanderer', { width: 74.8, height: 94.8 }],
  ['friedrich-contemplando-luna', { width: 43.8, height: 34.5 }],
  ['watteau-comediantes', { width: 108, height: 89 }],
  ['morisot-cuna', { width: 46, height: 56 }],
  ['pissarro-bulevar-montmartre', { width: 81, height: 65 }],
  ['caravaggio-vocacion-mateo', { width: 322, height: 340 }],
  ['caravaggio-david-goliat', { width: 101, height: 125 }],
  ['el-greco-vista-toledo', { width: 109, height: 121 }],
  ['courbet-olas', { width: 90, height: 66 }],
  ['lautrec-moulin-rouge', { width: 141, height: 123 }],
  ['fragonard-columpio', { width: 64, height: 81 }],
  ['constable-valle-dedham', { width: 145, height: 120 }],
  ['constable-salisbury', { width: 189, height: 151 }],
  ['sargent-carnacion', { width: 154, height: 174 }],
  ['redon-ciclope', { width: 51, height: 64 }],
  ['veronese-familia-dario', { width: 455, height: 236 }],
  ['rogier-retrato-dama', { width: 27, height: 37 }],
  ['cole-expulsion-eden', { width: 122, height: 91 }],
  ['blake-nebuchadnezzar', { width: 62, height: 45 }],
  ['homer-viento-favorable', { width: 97, height: 61 }],
  ['homer-campana', { width: 72, height: 117 }],
]);

function filenameFromUploadUrl(url) {
  const m = url.match(/upload\.wikimedia\.org\/wikipedia\/commons\/[^/]+\/[^/]+\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

function normalizeUploadUrl(url) {
  const filename = filenameFromUploadUrl(url);
  if (!filename) return url;
  return commonsUrl(filename);
}

function shouldSwapDimensions(catalog, pixels) {
  const { width: cw, height: ch } = catalog;
  const { width: pw, height: ph } = pixels;
  if (!(cw > 0 && ch > 0 && pw > 0 && ph > 0)) return false;

  if (Math.abs(cw - ch) < 0.01 && Math.abs(pw - ph) < 0.01) return false;

  const catalogPortrait = cw < ch;
  const pixelPortrait = pw < ph;
  const ratioMatch = (a, b) => Math.abs(a - b) < 0.025;

  // Catalog portrait + landscape JPEG: dimensions already match a rotated file.
  if (catalogPortrait && !pixelPortrait && ratioMatch(cw / ch, ph / pw)) {
    return false;
  }

  // Catalog landscape + portrait JPEG with matching sides → width/height swapped in JSON.
  if (!catalogPortrait && pixelPortrait && ratioMatch(cw / ch, ph / pw)) {
    return true;
  }

  const catalogAr = cw / ch;
  const pixelAr = pw / ph;
  return (
    Math.abs(catalogAr - 1 / pixelAr) + 0.05 < Math.abs(catalogAr - pixelAr) &&
    Math.abs(catalogAr - 1 / pixelAr) < 0.08
  );
}

async function fetchImageSizes(urls) {
  const unique = [...new Set(urls)];
  const byFilename = new Map();
  const batchSize = 40;

  for (let i = 0; i < unique.length; i += batchSize) {
    const batch = unique.slice(i, i + batchSize);
    const titles = batch
      .map((url) => {
        const name = filenameFromUploadUrl(url);
        return name ? `File:${name.replace(/ /g, '_')}` : null;
      })
      .filter(Boolean)
      .join('|');
    if (!titles) continue;

    const api =
      'https://commons.wikimedia.org/w/api.php?' +
      new URLSearchParams({
        action: 'query',
        titles,
        prop: 'imageinfo',
        iiprop: 'url|size',
        format: 'json',
      });

    const res = await fetch(api, { headers: { 'User-Agent': 'MuseoCatalogValidator/1.0' } });
    if (!res.ok) throw new Error(`Wikimedia API ${res.status}`);
    const data = await res.json();
    for (const page of Object.values(data.query?.pages ?? {})) {
      const info = page.imageinfo?.[0];
      if (!info?.url) continue;
      const decoded = filenameFromUploadUrl(info.url);
      if (decoded) byFilename.set(decoded, { width: info.width, height: info.height });
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return byFilename;
}

const urlChanges = [];
const dimensionChanges = [];

for (const file of await readdir(authorsDir)) {
  if (!file.endsWith('.json')) continue;
  const filePath = path.join(authorsDir, file);
  const author = JSON.parse(await readFile(filePath, 'utf8'));
  let touched = false;

  for (const painting of author.paintings ?? []) {
    const replacement = URL_BY_ID.get(painting.id);
    const nextUrl = replacement ?? normalizeUploadUrl(painting.url);
    if (nextUrl !== painting.url) {
      urlChanges.push({ id: painting.id, from: painting.url, to: nextUrl });
      painting.url = nextUrl;
      touched = true;
    }

    const dimFix = DIMENSIONS_BY_ID.get(painting.id);
    if (dimFix) {
      const { width, height } = painting.dimensions ?? {};
      if (width !== dimFix.width || height !== dimFix.height) {
        dimensionChanges.push({ id: painting.id, from: { width, height }, to: dimFix });
        painting.dimensions = dimFix;
        touched = true;
      }
    }
  }

  if (touched && !dryRun) {
    await writeFile(filePath, `${JSON.stringify(author, null, 2)}\n`, 'utf8');
  }
}

console.log(`URL changes: ${urlChanges.length}`);
for (const c of urlChanges) console.log(`  ${c.id}`);

console.log(`Dimension fixes: ${dimensionChanges.length}`);
for (const c of dimensionChanges) console.log(`  ${c.id}`, c.from, '->', c.to);

if (!skipLive) {
  const paintings = [];
  for (const file of await readdir(authorsDir)) {
    if (!file.endsWith('.json')) continue;
    const author = JSON.parse(await readFile(path.join(authorsDir, file), 'utf8'));
    for (const painting of author.paintings ?? []) {
      if (!DIMENSIONS_BY_ID.has(painting.id)) paintings.push(painting);
    }
  }

  console.log(`\nAuto-checking dimensions for ${paintings.length} remaining paintings...`);
  const sizes = await fetchImageSizes(paintings.map((p) => p.url));
  const autoDimChanges = [];

  for (const file of await readdir(authorsDir)) {
    if (!file.endsWith('.json')) continue;
    const filePath = path.join(authorsDir, file);
    const author = JSON.parse(await readFile(filePath, 'utf8'));
    let touched = false;

    for (const painting of author.paintings ?? []) {
      if (DIMENSIONS_BY_ID.has(painting.id)) continue;
      const name = filenameFromUploadUrl(painting.url);
      const pixels = name ? sizes.get(name) : null;
      if (!pixels) continue;

      const { width, height } = painting.dimensions ?? {};
      if (!(width > 0 && height > 0)) continue;
      if (!shouldSwapDimensions({ width, height }, pixels)) continue;

      const swapped = { width: height, height: width };
      autoDimChanges.push({ id: painting.id, from: { width, height }, to: swapped, pixels });
      painting.dimensions = swapped;
      touched = true;
    }

    if (touched && !dryRun) {
      await writeFile(filePath, `${JSON.stringify(author, null, 2)}\n`, 'utf8');
    }
  }

  console.log(`Auto-swapped dimensions: ${autoDimChanges.length}`);
  for (const c of autoDimChanges) {
    console.log(`  ${c.id}`, c.from, '->', c.to);
  }
}

if (dryRun) console.log('\n(dry run — no files written)');
