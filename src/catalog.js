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
  favorites,
  onGoToCategory,
  onGoToRoom,
  onGoToPainting,
  onClose,
}) {
  const panel = document.getElementById('catalog-panel');
  const searchInput = document.getElementById('catalog-search');
  const favoritesFilterBtn = document.getElementById('catalog-favorites-filter');
  const listEl = document.getElementById('catalog-list');
  const detailEl = document.getElementById('catalog-detail');
  const closeBtn = document.getElementById('catalog-close');
  const statusEl = document.getElementById('catalog-status');
  const openerBtn = document.getElementById('catalog-btn');

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
  let favoriteOnly = false;

  const unsubscribeFavorites = favorites?.subscribe(() => renderCurrentView());

  function authorPaintings(authorId) {
    return paintingsByAuthor[authorId] || [];
  }

  function announce(text) {
    if (statusEl) statusEl.textContent = text;
  }

  // Keep keyboard focus inside the dialog while it is open (it is aria-modal).
  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const focusables = [...panel.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )].filter((el) => !el.disabled && el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
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
    announce(`Catálogo: ${plural(categories.length, 'categoría', 'categorías')}`);
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
    bindFavoriteButtons(detailEl);
    announce(`${category.label}: ${plural(authors.length, 'autor', 'autores')}`);
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
    bindFavoriteButtons(detailEl);
    announce(`Sala de ${author.name}: ${plural(paintings.length, 'obra', 'obras')}`);
  }

  function renderSearchResults() {
    view = 'search';
    selectedCategoryId = null;
    selectedAuthorId = null;
    detailEl.classList.add('hidden');
    listEl.classList.remove('hidden');

    const matchedCategories = favoriteOnly ? [] : categories.filter(matchesCategory);
    const matchedAuthors = favoriteOnly ? [] : Object.values(authorsById).filter(matchesAuthor);
    const matchedPaintings = Object.values(paintingsByAuthor)
      .flat()
      .filter((painting) => !favoriteOnly || favorites?.has(painting.id))
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
    bindFavoriteButtons(listEl);

    const totalMatches =
      matchedCategories.length + matchedAuthors.length + matchedPaintings.length;
    announce(`Resultados de búsqueda: ${totalMatches}`);
  }

  function renderFavorites() {
    view = 'favorites';
    selectedCategoryId = null;
    selectedAuthorId = null;
    detailEl.classList.add('hidden');
    listEl.classList.remove('hidden');

    const favoritePaintings = Object.values(paintingsByAuthor)
      .flat()
      .filter((painting) => favorites?.has(painting.id))
      .filter((painting) => !query || matchesPainting(painting));

    listEl.innerHTML = favoritePaintings.length
      ? renderSearchSection(
          'Cuadros favoritos',
          favoritePaintings.map((painting) =>
            renderPaintingRow(authorsById[painting.authorId], painting, {
              showAuthor: true,
            }),
          ),
        )
      : '<p class="catalog-empty">No hay cuadros favoritos.</p>';

    bindPaintingRows(listEl);
    bindFavoriteButtons(listEl);
    announce(`${plural(favoritePaintings.length, 'cuadro favorito', 'cuadros favoritos')}`);
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
    const favorite = favorites?.has(painting.id) ?? false;
    return `
      <div class="catalog-painting-entry">
        <button type="button" class="catalog-painting-row" data-author-id="${escapeHtml(painting.authorId)}" data-painting-id="${escapeHtml(painting.id)}">
          <span class="catalog-painting-title">${escapeHtml(painting.title)}</span>
          <span class="catalog-painting-year">${escapeHtml(meta)}</span>
        </button>
        <button type="button" class="catalog-favorite-btn${favorite ? ' active' : ''}" data-favorite-painting-id="${escapeHtml(painting.id)}" aria-pressed="${favorite ? 'true' : 'false'}" aria-label="${favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}">
          ${favorite ? '★' : '☆'}
        </button>
      </div>
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

  function bindFavoriteButtons(root) {
    root.querySelectorAll('[data-favorite-painting-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        favorites?.toggle(btn.dataset.favoritePaintingId);
        renderCurrentView();
      });
    });
  }

  function renderCurrentView() {
    updateFavoritesFilterButton();
    if (favoriteOnly) {
      renderFavorites();
      return;
    }
    if (query) {
      renderSearchResults();
    } else if (view === 'category-detail' && selectedCategoryId) {
      renderCategoryDetail(selectedCategoryId);
    } else if (view === 'author-detail' && selectedAuthorId) {
      renderAuthorDetail(selectedAuthorId);
    } else {
      renderCategories();
    }
  }

  function updateFavoritesFilterButton() {
    if (!favoritesFilterBtn) return;
    favoritesFilterBtn.classList.toggle('active', favoriteOnly);
    favoritesFilterBtn.setAttribute('aria-pressed', favoriteOnly ? 'true' : 'false');
    const count = favorites?.all().size ?? 0;
    const labelEl = favoritesFilterBtn.querySelector('.catalog-favorites-label');
    if (labelEl) labelEl.textContent = count ? `Favoritos (${count})` : 'Favoritos';
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
    favoriteOnly = false;
    updateFavoritesFilterButton();
    panel.classList.remove('hidden');
    document.body.classList.add('catalog-open');
    panel.addEventListener('keydown', trapFocus);
    renderCategories();
    searchInput.focus();
  }

  function close() {
    if (!open) return;
    open = false;
    panel.classList.add('hidden');
    panel.removeEventListener('keydown', trapFocus);
    document.body.classList.remove('catalog-open');
    view = 'categories';
    selectedCategoryId = null;
    selectedAuthorId = null;
    // Return focus to the control that opened the dialog (no-op if it is hidden).
    if (openerBtn?.offsetParent !== null) openerBtn?.focus();
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
    renderCurrentView();
  });

  favoritesFilterBtn?.addEventListener('click', () => {
    favoriteOnly = !favoriteOnly;
    renderCurrentView();
  });

  closeBtn.addEventListener('click', close);

  panel.addEventListener('click', (e) => {
    if (e.target === panel) close();
  });

  return { open: openCatalog, close, toggle, isOpen, dispose: unsubscribeFavorites };
}
