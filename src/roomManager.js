import { buildAuthorRoom } from './museum.js';
import { buildHub } from './hub.js';
import { placePaintings } from './paintings.js';

export function createRoomManager({
  scene,
  camera,
  controls,
  renderer,
  paintingsByAuthor,
  authorOrder,
  authorsData = {},
  onRoomChanged,
  onTransitionStart,
  onTransitionProgress,
  onTransitionEnd,
}) {
  let currentRoom = null;
  let currentKind = null;
  let currentAuthorIndex = null;
  let interactables = [];
  let transitioning = false;
  let triggerCooldown = 0;

  const hubCache = { room: null, interactables: [] };
  const authorCache = new Map();

  async function loadHub(spawnKey = 'initial') {
    if (transitioning) return;
    transitioning = true;
    onTransitionStart?.({ kind: 'hub', author: null });
    try {
      if (!hubCache.room) {
        hubCache.room = buildHub(scene, authorOrder);
        hubCache.interactables = [];
      }
      swapRoom(hubCache.room, hubCache.interactables);
      currentKind = 'hub';
      currentAuthorIndex = null;
      placeAtSpawn(spawnKey, hubCache.room);
      announce({ kind: 'hub', author: null });
    } finally {
      transitioning = false;
      onTransitionEnd?.();
    }
  }

  async function loadAuthor(authorIndex, spawnKey = 'fromHub') {
    if (transitioning) return;
    transitioning = true;
    const author = authorOrder[authorIndex];
    const paintings = paintingsByAuthor[author];
    onTransitionStart?.({ kind: 'author', author, paintingCount: paintings.length });
    try {
      let cached = authorCache.get(author);
      if (!cached) {
        const room = buildAuthorRoom(scene, {
          author,
          paintings,
          bio: authorsData[author] || null,
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
        authorCache.set(author, cached);
      }
      swapRoom(cached.room, cached.interactables);
      currentKind = 'author';
      currentAuthorIndex = authorIndex;
      placeAtSpawn(spawnKey, cached.room);
      announce({
        kind: 'author',
        author,
        authorIndex,
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
      onRoomChanged({ ...info, total: authorOrder.length });
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
    if (destination.kind === 'author') {
      loadAuthor(destination.authorIndex, 'fromHub');
    } else if (destination.kind === 'hub') {
      const key =
        currentAuthorIndex != null
          ? `fromAuthor${currentAuthorIndex}`
          : 'initial';
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
    loadAuthor,
    update,
    getInteractables,
    isTransitioning,
  };
}
