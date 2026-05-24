import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogDir = path.join(root, 'public', 'catalog');
const authorsDir = path.join(catalogDir, 'authors');

const errors = [];
const categoryIds = new Set();
const indexedAuthors = new Set();
const paintingIds = new Set();

const index = await readJson(path.join(catalogDir, 'index.json'));
const categories = Array.isArray(index.categories) ? index.categories : null;

if (!categories) {
  fail('public/catalog/index.json debe contener un array "categories".');
} else {
  for (const category of categories) {
    validateCategory(category);
  }
}

if (categories) {
  for (const category of categories) {
    if (!Array.isArray(category.authors)) continue;
    for (const authorId of category.authors) {
      await validateAuthorFile(authorId, category.id);
    }
  }
}

await validateNoOrphanAuthorFiles();

if (errors.length > 0) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}

console.log(
  `catalog OK: ${categoryIds.size} categorías, ${indexedAuthors.size} autores, ${paintingIds.size} obras`,
);

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (err) {
    fail(`${relative(file)} no es JSON válido o no existe: ${err.message}`);
    return {};
  }
}

function validateCategory(category) {
  if (!isNonEmptyString(category.id)) {
    fail('Cada categoría necesita un "id" no vacío.');
    return;
  }
  if (!isNonEmptyString(category.label)) {
    fail(`La categoría ${category.id} necesita un "label" no vacío.`);
  }
  if (categoryIds.has(category.id)) {
    fail(`Categoría duplicada en index.json: ${category.id}`);
  }
  categoryIds.add(category.id);
  if (!Array.isArray(category.authors)) {
    fail(`La categoría ${category.id} debe tener un array "authors".`);
    return;
  }
  for (const authorId of category.authors) {
    if (!isNonEmptyString(authorId)) {
      fail(`La categoría ${category.id} contiene un id de autor inválido.`);
      continue;
    }
    if (indexedAuthors.has(authorId)) {
      fail(`Autor duplicado en index.json: ${authorId}`);
    }
    indexedAuthors.add(authorId);
  }
}

async function validateAuthorFile(authorId, categoryId) {
  const file = path.join(authorsDir, `${authorId}.json`);
  const author = await readJson(file);

  if (author.id !== authorId) {
    fail(`${relative(file)} declara id "${author.id}" pero se esperaba "${authorId}".`);
  }
  if (!isNonEmptyString(author.name)) {
    fail(`${relative(file)} necesita "name".`);
  }
  if (!categoryIds.has(author.category)) {
    fail(`${relative(file)} usa una categoría desconocida: ${author.category}.`);
  }
  if (author.category !== categoryId) {
    fail(
      `${relative(file)} pertenece a "${author.category}" pero está listado en "${categoryId}".`,
    );
  }
  if (!Array.isArray(author.paintings) || author.paintings.length === 0) {
    fail(`${relative(file)} necesita un array "paintings" con al menos una obra.`);
    return;
  }

  for (const painting of author.paintings) {
    validatePainting(painting, file);
  }
}

function validatePainting(painting, file) {
  const label = `${relative(file)}:${painting.id || '(sin id)'}`;
  if (!isNonEmptyString(painting.id)) {
    fail(`${label} necesita "id".`);
  } else if (paintingIds.has(painting.id)) {
    fail(`Obra duplicada: ${painting.id}`);
  } else {
    paintingIds.add(painting.id);
  }
  if ('author' in painting) {
    fail(`${label} no debe declarar "author"; lo inyecta el cargador desde el archivo del autor.`);
  }
  if (!isNonEmptyString(painting.url) || !painting.url.startsWith('https://')) {
    fail(`${label} necesita una "url" HTTPS.`);
  }
  if (!isNonEmptyString(painting.title)) {
    fail(`${label} necesita "title".`);
  }
  if (!Number.isFinite(painting.year)) {
    fail(`${label} necesita "year" numérico.`);
  }
  if (!isNonEmptyString(painting.description)) {
    fail(`${label} necesita "description".`);
  }
  if (
    !painting.dimensions ||
    !Number.isFinite(painting.dimensions.width) ||
    !Number.isFinite(painting.dimensions.height) ||
    painting.dimensions.width <= 0 ||
    painting.dimensions.height <= 0
  ) {
    fail(`${label} necesita dimensions.width y dimensions.height en centímetros.`);
  }
}

async function validateNoOrphanAuthorFiles() {
  let files = [];
  try {
    files = await readdir(authorsDir);
  } catch (err) {
    fail(`No se puede leer ${relative(authorsDir)}: ${err.message}`);
    return;
  }

  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const authorId = file.replace(/\.json$/, '');
    if (!indexedAuthors.has(authorId)) {
      fail(`Archivo de autor no referenciado en index.json: ${file}`);
    }
  }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function relative(file) {
  return path.relative(root, file);
}

function fail(message) {
  errors.push(message);
}
