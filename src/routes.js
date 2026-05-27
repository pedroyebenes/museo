const CATEGORY_PARAM = 'categoria';
const AUTHOR_PARAM = 'sala';

export function resolveRoomRoute(catalog, locationLike = window.location) {
  const params = collectRouteParams(locationLike);
  const authorId =
    params.get(AUTHOR_PARAM) || params.get('room') || params.get('author');
  const categoryId = params.get(CATEGORY_PARAM) || params.get('category');

  if (authorId && catalog.authorsById[authorId]) {
    return { kind: 'author', authorId };
  }

  if (categoryId && catalog.categoriesById[categoryId]) {
    return { kind: 'category', categoryId };
  }

  return { kind: 'hub' };
}

export function routeFromRoomInfo(info) {
  if (info.kind === 'author' && info.author?.id) {
    return { kind: 'author', authorId: info.author.id };
  }

  if (info.kind === 'category' && info.category?.id) {
    return { kind: 'category', categoryId: info.category.id };
  }

  return { kind: 'hub' };
}

export function buildRoomUrl(route, locationLike = window.location) {
  const url = new URL(locationLike.href);
  url.search = '';
  url.hash = '';

  if (route.kind === 'author') {
    url.searchParams.set(AUTHOR_PARAM, route.authorId);
  } else if (route.kind === 'category') {
    url.searchParams.set(CATEGORY_PARAM, route.categoryId);
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

function collectRouteParams(locationLike) {
  const params = new URLSearchParams(locationLike.search);
  const hashParams = parseHashParams(locationLike.hash);

  for (const [key, value] of hashParams) {
    if (!params.has(key)) params.set(key, value);
  }

  return params;
}

function parseHashParams(hash) {
  const cleanHash = String(hash || '').replace(/^#\/?/, '').replace(/^\?/, '');
  if (!cleanHash.includes('=')) return new URLSearchParams();
  return new URLSearchParams(cleanHash);
}
