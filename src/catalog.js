function escapeHtml(text) {
  return String(text)
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

export function createCatalog({
  authorOrder,
  paintingsByAuthor,
  authorsData,
  onGoToRoom,
  onGoToPainting,
  onClose,
}) {
  const panel = document.getElementById('catalog-panel');
  const searchInput = document.getElementById('catalog-search');
  const listEl = document.getElementById('catalog-list');
  const detailEl = document.getElementById('catalog-detail');
  const closeBtn = document.getElementById('catalog-close');

  let open = false;
  let view = 'authors';
  let selectedAuthor = null;
  let query = '';

  function authorMeta(author) {
    const bio = authorsData[author] || {};
    const paintings = paintingsByAuthor[author] || [];
    return { bio, paintings, count: paintings.length };
  }

  function matchesAuthor(author) {
    if (!query) return true;
    const { bio } = authorMeta(author);
    const haystack = normalizeSearch(
      [author, bio.fullName, bio.origin, bio.years].filter(Boolean).join(' '),
    );
    return haystack.includes(query);
  }

  function renderAuthors() {
    view = 'authors';
    selectedAuthor = null;
    detailEl.classList.add('hidden');
    listEl.classList.remove('hidden');
    searchInput.parentElement.classList.remove('hidden');

    const filtered = authorOrder.filter(matchesAuthor);
    if (filtered.length === 0) {
      listEl.innerHTML =
        '<p class="catalog-empty">No hay autores que coincidan con la búsqueda.</p>';
      return;
    }

    listEl.innerHTML = filtered
      .map((author) => {
        const { bio, count } = authorMeta(author);
        const sub = [bio.years, `${count} obra${count === 1 ? '' : 's'}`]
          .filter(Boolean)
          .join(' · ');
        return `
          <button type="button" class="catalog-row" data-author="${escapeHtml(author)}">
            <span class="catalog-row-title">${escapeHtml(author)}</span>
            <span class="catalog-row-meta">${escapeHtml(sub)}</span>
          </button>
        `;
      })
      .join('');

    listEl.querySelectorAll('.catalog-row').forEach((btn) => {
      btn.addEventListener('click', () => showAuthorDetail(btn.dataset.author));
    });
  }

  function renderAuthorDetail(author) {
    view = 'author-detail';
    selectedAuthor = author;
    listEl.classList.add('hidden');
    detailEl.classList.remove('hidden');
    searchInput.parentElement.classList.add('hidden');

    const { bio, paintings } = authorMeta(author);
    const originLine = bio.origin
      ? `<p class="catalog-detail-origin">${escapeHtml(bio.origin)}</p>`
      : '';

    const paintingsHtml = paintings
      .map(
        (p) => `
        <button type="button" class="catalog-painting-row" data-painting-id="${escapeHtml(p.id)}">
          <span class="catalog-painting-title">${escapeHtml(p.title)}</span>
          <span class="catalog-painting-year">${escapeHtml(String(p.year))}</span>
        </button>
      `,
      )
      .join('');

    detailEl.innerHTML = `
      <button type="button" class="catalog-back" id="catalog-back">← Autores</button>
      <header class="catalog-detail-header">
        <h2>${escapeHtml(author)}</h2>
        ${bio.years ? `<p class="catalog-detail-years">${escapeHtml(bio.years)}</p>` : ''}
        ${originLine}
      </header>
      <button type="button" class="catalog-go-room" id="catalog-go-room">Entrar en la sala</button>
      <h3 class="catalog-paintings-heading">Cuadros</h3>
      <div class="catalog-paintings">${paintingsHtml}</div>
    `;

    detailEl.querySelector('#catalog-back').addEventListener('click', renderAuthors);
    detailEl.querySelector('#catalog-go-room').addEventListener('click', () => {
      goToRoom(author);
    });
    detailEl.querySelectorAll('.catalog-painting-row').forEach((btn) => {
      btn.addEventListener('click', () => {
        goToPainting(author, btn.dataset.paintingId);
      });
    });
  }

  function showAuthorDetail(author) {
    renderAuthorDetail(author);
  }

  function authorIndex(author) {
    return authorOrder.indexOf(author);
  }

  function goToRoom(author) {
    const idx = authorIndex(author);
    if (idx < 0) return;
    close();
    onGoToRoom(idx);
  }

  function goToPainting(author, paintingId) {
    const idx = authorIndex(author);
    if (idx < 0) return;
    close();
    onGoToPainting(idx, paintingId);
  }

  function openCatalog() {
    if (open) return;
    open = true;
    query = searchInput.value.trim();
    query = normalizeSearch(query);
    panel.classList.remove('hidden');
    document.body.classList.add('catalog-open');
    renderAuthors();
    searchInput.focus();
  }

  function close() {
    if (!open) return;
    open = false;
    panel.classList.add('hidden');
    document.body.classList.remove('catalog-open');
    view = 'authors';
    selectedAuthor = null;
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
    if (view === 'authors') renderAuthors();
  });

  closeBtn.addEventListener('click', close);

  panel.addEventListener('click', (e) => {
    if (e.target === panel) close();
  });

  return { open: openCatalog, close, toggle, isOpen };
}
