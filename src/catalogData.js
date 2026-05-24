const DEFAULT_INDEX_URL = '/catalog/index.json';

export async function loadCatalogData(indexUrl = DEFAULT_INDEX_URL) {
  const index = await fetchJson(indexUrl);
  const categories = normalizeCategories(index.categories);
  const categoryIds = new Set(categories.map((category) => category.id));
  const orderedAuthorIds = categories.flatMap((category) => category.authorIds);

  const rawAuthors = await Promise.all(
    orderedAuthorIds.map((authorId) =>
      fetchJson(`/catalog/authors/${authorId}.json`),
    ),
  );
  const authors = [];

  const categoriesById = Object.fromEntries(
    categories.map((category) => [category.id, category]),
  );
  const authorsById = {};
  const authorsByCategory = Object.fromEntries(
    categories.map((category) => [category.id, []]),
  );
  const paintingsByAuthor = {};
  const paintingsById = {};

  rawAuthors.forEach((rawAuthor, index) => {
    const expectedId = orderedAuthorIds[index];
    if (rawAuthor.id !== expectedId) {
      throw new Error(
        `El autor ${expectedId} declara id "${rawAuthor.id}" en su JSON.`,
      );
    }
    if (!categoryIds.has(rawAuthor.category)) {
      throw new Error(
        `El autor ${rawAuthor.id} usa una categoría desconocida: ${rawAuthor.category}.`,
      );
    }

    const paintings = normalizePaintings(rawAuthor);
    const author = {
      ...rawAuthor,
      categoryId: rawAuthor.category,
      paintings,
    };
    authors.push(author);
    authorsById[author.id] = author;
    authorsByCategory[author.category].push(author);
    paintingsByAuthor[author.id] = paintings;

    for (const painting of paintings) {
      paintingsById[painting.id] = painting;
    }
  });

  return {
    categories,
    categoriesById,
    authors,
    authorsById,
    authorsByCategory,
    paintingsByAuthor,
    paintingsById,
  };
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No pude cargar ${url}: ${res.status}`);
  return await res.json();
}

function normalizeCategories(rawCategories) {
  if (!Array.isArray(rawCategories)) {
    throw new Error('catalog/index.json debe contener un array "categories".');
  }

  const seenCategories = new Set();
  const seenAuthors = new Set();
  return rawCategories.map((category) => {
    if (!category.id || !category.label) {
      throw new Error('Cada categoría necesita "id" y "label".');
    }
    if (seenCategories.has(category.id)) {
      throw new Error(`Categoría duplicada: ${category.id}`);
    }
    seenCategories.add(category.id);

    const authorIds = Array.isArray(category.authors) ? category.authors : [];
    for (const authorId of authorIds) {
      if (seenAuthors.has(authorId)) {
        throw new Error(`Autor duplicado en catalog/index.json: ${authorId}`);
      }
      seenAuthors.add(authorId);
    }

    return {
      id: category.id,
      label: category.label,
      description: category.description || '',
      authorIds,
    };
  });
}

function normalizePaintings(author) {
  if (!Array.isArray(author.paintings)) {
    throw new Error(`El autor ${author.id} debe tener un array "paintings".`);
  }

  return author.paintings.map((painting) => ({
    ...painting,
    author: author.name,
    authorId: author.id,
    categoryId: author.category,
  }));
}
