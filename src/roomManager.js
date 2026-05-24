import { buildAuthorRoom } from './museum.js';
import { buildHub } from './hub.js';
import { placePaintings } from './paintings.js';

export function createRoomManager({
  scene,
  camera,
  controls,
  renderer,
  catalog,
  onRoomChanged,
  onTransitionStart,
  onTransitionProgress,
  onTransitionEnd,
}) {
  let currentRoom = null;
  let currentKind = null;
  let currentCategoryId = null;
  let currentAuthorId = null;
  let interactables = [];
  let transitioning = false;
  let triggerCooldown = 0;

  const hubCache = { room: null, interactables: [] };
  const categoryCache = new Map();
  const authorCache = new Map();

  async function loadHub(spawnKey = 'initial') {
    if (transitioning) return;
    transitioning = true;
    onTransitionStart?.({ kind: 'hub', author: null });
    try {
      if (!hubCache.room) {
        hubCache.room = buildHub(scene, {
          id: 'hub',
          title: 'Hall principal',
          items: catalog.categories.map((category) => ({
            id: category.id,
            label: category.label,
            destination: { kind: 'category', categoryId: category.id },
          })),
        });
        scene.remove(hubCache.room.group);
        hubCache.interactables = [];
      }
      swapRoom(hubCache.room, hubCache.interactables);
      currentKind = 'hub';
      currentCategoryId = null;
      currentAuthorId = null;
      placeAtSpawn(spawnKey, hubCache.room);
      announce({ kind: 'hub', author: null });
    } finally {
      transitioning = false;
      onTransitionEnd?.();
    }
  }

  async function loadCategory(categoryId, spawnKey = 'initial') {
    if (transitioning) return;
    const category = catalog.categoriesById[categoryId];
    if (!category) return;
    const authors = catalog.authorsByCategory[categoryId] || [];

    transitioning = true;
    onTransitionStart?.({ kind: 'category', category, authorCount: authors.length });
    try {
      let cached = categoryCache.get(categoryId);
      if (!cached) {
        const room = buildHub(scene, {
          id: `category:${categoryId}`,
          title: category.label,
          items: [
            {
              id: 'hub',
              label: 'Hall principal',
              arrow: '←',
              destination: { kind: 'hub' },
            },
            ...authors.map((author) => ({
              id: author.id,
              label: author.name,
              destination: { kind: 'author', authorId: author.id },
            })),
          ],
        });
        scene.remove(room.group);
        cached = { room, interactables: [] };
        categoryCache.set(categoryId, cached);
      }
      swapRoom(cached.room, cached.interactables);
      currentKind = 'category';
      currentCategoryId = categoryId;
      currentAuthorId = null;
      placeAtSpawn(spawnKey, cached.room);
      announce({
        kind: 'category',
        category,
        authorCount: authors.length,
      });
    } finally {
      transitioning = false;
      onTransitionEnd?.();
    }
  }

  function resolveAuthorSpawnKey(options) {
    if (typeof options === 'string') return options;
    if (options?.paintingId) return `atPainting:${options.paintingId}`;
    return 'fromCategory';
  }

  async function loadAuthor(authorId, options = {}) {
    if (transitioning) return;
    const author = catalog.authorsById[authorId];
    if (!author) return;

    transitioning = true;
    const spawnKey = resolveAuthorSpawnKey(options);
    const category = catalog.categoriesById[author.category];
    const paintings = catalog.paintingsByAuthor[author.id] || [];
    onTransitionStart?.({ kind: 'author', author, paintingCount: paintings.length });
    try {
      let cached = authorCache.get(author.id);
      if (!cached) {
        const room = buildAuthorRoom(scene, {
          author: author.name,
          authorId: author.id,
          categoryId: author.category,
          categoryLabel: category?.label || 'Categoría',
          paintings,
          bio: author,
        });
        scene.remove(room.group);
        const newInteractables = await placePaintings(
          room.group,
          room.slots,
          paintings,
          {
            renderer,
            onProgress: (loaded, total) => {
              onTransitionProgress?.({ loaded, total, author });
            },
          },
        );
        cached = { room, interactables: newInteractables };
        authorCache.set(author.id, cached);
      }
      swapRoom(cached.room, cached.interactables);
      currentKind = 'author';
      currentCategoryId = author.category;
      currentAuthorId = author.id;
      placeAtSpawn(spawnKey, cached.room);
      announce({
        kind: 'author',
        author,
        paintingCount: paintings.length,
      });
    } finally {
      transitioning = false;
      onTransitionEnd?.();
    }
  }

  function swapRoom(room, newInteractables) {
    if (currentRoom?.group) {
      scene.remove(currentRoom.group);
    }
    currentRoom = room;
    interactables = newInteractables;
    scene.add(room.group);
    controls.setSegments(room.segments);
    triggerCooldown = 0.5;
  }

  function placeAtSpawn(spawnKey, room) {
    const pose = room.spawn[spawnKey] || room.spawn.initial;
    controls.setPose(pose);
  }

  function announce(info) {
    if (onRoomChanged) {
      onRoomChanged({ ...info, total: catalog.categories.length });
    }
  }

  function update(dt) {
    if (triggerCooldown > 0) {
      triggerCooldown -= dt;
      return;
    }
    if (!currentRoom || transitioning) return;
    const pos = camera.position;
    for (const t of currentRoom.triggers) {
      if (
        pos.x >= t.minX &&
        pos.x <= t.maxX &&
        pos.z >= t.minZ &&
        pos.z <= t.maxZ
      ) {
        handleDestination(t.destination);
        return;
      }
    }
  }

  function handleDestination(destination) {
    if (!destination) return;
    if (destination.kind === 'category') {
      const spawnKey =
        currentKind === 'author' && currentAuthorId
          ? `from:${currentAuthorId}`
          : 'from:hub';
      loadCategory(destination.categoryId, spawnKey);
    } else if (destination.kind === 'author') {
      loadAuthor(destination.authorId, 'fromCategory');
    } else if (destination.kind === 'hub') {
      const key = currentCategoryId ? `from:${currentCategoryId}` : 'initial';
      loadHub(key);
    }
  }

  function getInteractables() {
    return interactables;
  }

  function isTransitioning() {
    return transitioning;
  }

  return {
    loadHub,
    loadCategory,
    loadAuthor,
    update,
    getInteractables,
    isTransitioning,
  };
}
