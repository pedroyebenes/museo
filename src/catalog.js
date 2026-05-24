function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeSearch(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function plural(count, singular, pluralText) {
  return `${count} ${count === 1 ? singular : pluralText}`;
}

export function createCatalog({
  catalog,
  onGoToCategory,
  onGoToRoom,
  onGoToPainting,
  onClose,
}) {
  const panel = document.getElementById('catalog-panel');
  const searchInput = document.getElementById('catalog-search');
  const listEl = document.getElementById('catalog-list');
  const detailEl = document.getElementById('catalog-detail');
  const closeBtn = document.getElementById('catalog-close');

  const {
    categories,
    categoriesById,
    authorsById,
    authorsByCategory,
    paintingsByAuthor,
  } = catalog;

  let open = false;
  let view = 'categories';
  let selectedCategoryId = null;
  let selectedAuthorId = null;
  let query = '';

  function authorPaintings(authorId) {
    return paintingsByAuthor[authorId] || [];
  }

  function renderCategories() {
    view = 'categories';
    selectedCategoryId = null;
    selectedAuthorId = null;
    detailEl.classList.add('hidden');
    listEl.classList.remove('hidden');

    listEl.innerHTML = categories
      .map((category) => {
        const count = (authorsByCategory[category.id] || []).length;
        return `
          <button type="button" class="catalog-row" data-category-id="${escapeHtml(category.id)}">
            <span class="catalog-row-title">${escapeHtml(category.label)}</span>
            <span class="catalog-row-meta">${escapeHtml(plural(count, 'autor', 'autores'))}</span>
          </button>
        `;
      })
      .join('');

    bindCategoryRows(listEl);
  }

  function renderCategoryDetail(categoryId) {
    const category = categoriesById[categoryId];
    if (!category) return;

    view = 'category-detail';
    selectedCategoryId = categoryId;
    selectedAuthorId = null;
    listEl.classList.add('hidden');
    detailEl.classList.remove('hidden');

    const authors = authorsByCategory[categoryId] || [];
    const description = category.description
      ? `<p class="catalog-detail-description">${escapeHtml(category.description)}</p>`
      : '';
    const authorsHtml = authors
      .map((author) => renderAuthorRow(author, { showCategory: false }))
      .join('');

    detailEl.innerHTML = `
      <button type="button" class="catalog-back" id="catalog-back">← Categorías</button>
      <header class="catalog-detail-header">
        <h2>${escapeHtml(category.label)}</h2>
        ${description}
      </header>
      <button type="button" class="catalog-go-room" id="catalog-go-category">Entrar en la sala</button>
      <h3 class="catalog-paintings-heading">Autores</h3>
      <div class="catalog-section">${authorsHtml}</div>
    `;

    detailEl.querySelector('#catalog-back').addEventListener('click', () => {
      clearQuery();
      renderCategories();
    });
    detailEl.querySelector('#catalog-go-category').addEventListener('click', () => {
      goToCategory(categoryId);
    });
    bindAuthorRows(detailEl);
  }

  function renderAuthorDetail(authorId) {
    const author = authorsById[authorId];
    if (!author) return;

    const category = categoriesById[author.category];
    view = 'author-detail';
    selectedCategoryId = author.category;
    selectedAuthorId = authorId;
    listEl.classList.add('hidden');
    detailEl.classList.remove('hidden');

    const paintings = authorPaintings(authorId);
    const originLine = author.origin
      ? `<p class="catalog-detail-origin">${escapeHtml(author.origin)}</p>`
      : '';
    const bio = author.bio
      ? `<p class="catalog-detail-bio">${escapeHtml(author.bio)}</p>`
      : '';
    const paintingsHtml = paintings
      .map((painting) => renderPaintingRow(author, painting))
      .join('');

    detailEl.innerHTML = `
      <button type="button" class="catalog-back" id="catalog-back">← ${escapeHtml(category?.label || 'Categoría')}</button>
      <header class="catalog-detail-header">
        <h2>${escapeHtml(author.name)}</h2>
        ${author.years ? `<p class="catalog-detail-years">${escapeHtml(author.years)}</p>` : ''}
        ${originLine}
        ${bio}
      </header>
      <button type="button" class="catalog-go-room" id="catalog-go-room">Entrar en la sala</button>
      <h3 class="catalog-paintings-heading">Cuadros</h3>
      <div class="catalog-paintings">${paintingsHtml}</div>
    `;

    detailEl.querySelector('#catalog-back').addEventListener('click', () => {
      clearQuery();
      renderCategoryDetail(author.category);
    });
    detailEl.querySelector('#catalog-go-room').addEventListener('click', () => {
      goToRoom(authorId);
    });
    bindPaintingRows(detailEl);
  }

  function renderSearchResults() {
    view = 'search';
    selectedCategoryId = null;
    selectedAuthorId = null;
    detailEl.classList.add('hidden');
    listEl.classList.remove('hidden');

    const matchedCategories = categories.filter(matchesCategory);
    const matchedAuthors = Object.values(authorsById).filter(matchesAuthor);
    const matchedPaintings = Object.values(paintingsByAuthor)
      .flat()
      .filter(matchesPainting);

    const sections = [
      renderSearchSection(
        'Categorías',
        matchedCategories.map(renderCategorySearchRow),
      ),
      renderSearchSection(
        'Autores',
        matchedAuthors.map((author) => renderAuthorRow(author)),
      ),
      renderSearchSection(
        'Cuadros',
        matchedPaintings.map((painting) =>
          renderPaintingRow(authorsById[painting.authorId], painting, {
            showAuthor: true,
          }),
        ),
      ),
    ].filter(Boolean);

    listEl.innerHTML =
      sections.join('') ||
      '<p class="catalog-empty">No hay resultados para la búsqueda.</p>';

    bindCategoryRows(listEl);
    bindAuthorRows(listEl);
    bindPaintingRows(listEl);
  }

  function renderSearchSection(title, rows) {
    if (!rows.length) return '';
    return `
      <h3 class="catalog-section-heading">${escapeHtml(title)}</h3>
      <div class="catalog-section">${rows.join('')}</div>
    `;
  }

  function renderCategorySearchRow(category) {
    const count = (authorsByCategory[category.id] || []).length;
    const meta = [plural(count, 'autor', 'autores'), category.description]
      .filter(Boolean)
      .join(' · ');
    return `
      <button type="button" class="catalog-row" data-category-id="${escapeHtml(category.id)}">
        <span class="catalog-row-title">${escapeHtml(category.label)}</span>
        <span class="catalog-row-meta">${escapeHtml(meta)}</span>
      </button>
    `;
  }

  function renderAuthorRow(author, { showCategory = true } = {}) {
    const paintings = authorPaintings(author.id);
    const category = categoriesById[author.category];
    const meta = [
      showCategory ? category?.label : '',
      author.years,
      plural(paintings.length, 'obra', 'obras'),
    ]
      .filter(Boolean)
      .join(' · ');
    return `
      <button type="button" class="catalog-row" data-author-id="${escapeHtml(author.id)}">
        <span class="catalog-row-title">${escapeHtml(author.name)}</span>
        <span class="catalog-row-meta">${escapeHtml(meta)}</span>
      </button>
    `;
  }

  function renderPaintingRow(author, painting, { showAuthor = false } = {}) {
    const meta = showAuthor
      ? `${author?.name || painting.author} · ${painting.year}`
      : String(painting.year);
    return `
      <button type="button" class="catalog-painting-row" data-author-id="${escapeHtml(painting.authorId)}" data-painting-id="${escapeHtml(painting.id)}">
        <span class="catalog-painting-title">${escapeHtml(painting.title)}</span>
        <span class="catalog-painting-year">${escapeHtml(meta)}</span>
      </button>
    `;
  }

  function matchesCategory(category) {
    return searchable([
      category.id,
      category.label,
      category.description,
    ]).includes(query);
  }

  function matchesAuthor(author) {
    const category = categoriesById[author.category];
    return searchable([
      author.name,
      author.fullName,
      author.origin,
      author.years,
      author.bio,
      category?.label,
    ]).includes(query);
  }

  function matchesPainting(painting) {
    const author = authorsById[painting.authorId];
    const category = categoriesById[painting.categoryId];
    return searchable([
      painting.title,
      painting.year,
      painting.description,
      author?.name,
      category?.label,
    ]).includes(query);
  }

  function searchable(parts) {
    return normalizeSearch(parts.filter(Boolean).join(' '));
  }

  function bindCategoryRows(root) {
    root.querySelectorAll('[data-category-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        clearQuery();
        renderCategoryDetail(btn.dataset.categoryId);
      });
    });
  }

  function bindAuthorRows(root) {
    root.querySelectorAll('[data-author-id]:not([data-painting-id])').forEach((btn) => {
      btn.addEventListener('click', () => {
        clearQuery();
        renderAuthorDetail(btn.dataset.authorId);
      });
    });
  }

  function bindPaintingRows(root) {
    root.querySelectorAll('[data-painting-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        goToPainting(btn.dataset.authorId, btn.dataset.paintingId);
      });
    });
  }

  function clearQuery() {
    query = '';
    searchInput.value = '';
  }

  function goToCategory(categoryId) {
    if (!categoriesById[categoryId]) return;
    close();
    onGoToCategory(categoryId);
  }

  function goToRoom(authorId) {
    if (!authorsById[authorId]) return;
    close();
    onGoToRoom(authorId);
  }

  function goToPainting(authorId, paintingId) {
    if (!authorsById[authorId]) return;
    close();
    onGoToPainting(authorId, paintingId);
  }

  function openCatalog() {
    if (open) return;
    open = true;
    clearQuery();
    panel.classList.remove('hidden');
    document.body.classList.add('catalog-open');
    renderCategories();
    searchInput.focus();
  }

  function close() {
    if (!open) return;
    open = false;
    panel.classList.add('hidden');
    document.body.classList.remove('catalog-open');
    view = 'categories';
    selectedCategoryId = null;
    selectedAuthorId = null;
    onClose?.();
  }

  function toggle() {
    if (open) close();
    else openCatalog();
  }

  function isOpen() {
    return open;
  }

  searchInput.addEventListener('input', () => {
    query = normalizeSearch(searchInput.value.trim());
    if (query) {
      renderSearchResults();
    } else if (view === 'category-detail' && selectedCategoryId) {
      renderCategoryDetail(selectedCategoryId);
    } else if (view === 'author-detail' && selectedAuthorId) {
      renderAuthorDetail(selectedAuthorId);
    } else {
      renderCategories();
    }
  });

  closeBtn.addEventListener('click', close);

  panel.addEventListener('click', (e) => {
    if (e.target === panel) close();
  });

  return { open: openCatalog, close, toggle, isOpen };
}
