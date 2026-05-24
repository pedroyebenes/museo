import { buildAuthorRoom } from './museum.js';
import { buildHub } from './hub.js';
import { placePaintings } from './paintings.js';

export function createRoomManager({
  scene,
  camera,
  controls,
  paintingsByAuthor,
  authorOrder,
  authorsData = {},
  onRoomChanged,
}) {
  let currentRoom = null;
  let currentKind = null; // 'hub' | 'author'
  let currentAuthorIndex = null;
  let interactables = [];
  let transitioning = false;
  let triggerCooldown = 0;

  async function loadHub(spawnKey = 'initial') {
    if (transitioning) return;
    transitioning = true;
    try {
      const room = buildHub(scene, authorOrder);
      swapRoom(room, []);
      currentKind = 'hub';
      const previousAuthor = currentAuthorIndex;
      currentAuthorIndex = null;
      placeAtSpawn(spawnKey, room);
      announce({ kind: 'hub', author: null });
    } finally {
      transitioning = false;
    }
  }

  async function loadAuthor(authorIndex, spawnKey = 'fromHub') {
    if (transitioning) return;
    transitioning = true;
    try {
      const author = authorOrder[authorIndex];
      const paintings = paintingsByAuthor[author];
      const room = buildAuthorRoom(scene, {
        author,
        paintingCount: paintings.length,
        bio: authorsData[author] || null,
      });
      const newInteractables = await placePaintings(
        room.group,
        room.slots,
        paintings,
      );
      swapRoom(room, newInteractables);
      currentKind = 'author';
      currentAuthorIndex = authorIndex;
      placeAtSpawn(spawnKey, room);
      announce({
        kind: 'author',
        author,
        authorIndex,
        paintingCount: paintings.length,
      });
    } finally {
      transitioning = false;
    }
  }

  function swapRoom(room, newInteractables) {
    if (currentRoom) disposeRoom(currentRoom);
    currentRoom = room;
    interactables = newInteractables;
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

  function disposeRoom(room) {
    scene.remove(room.group);
    room.group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];
        for (const m of mats) {
          if (m.userData && m.userData.shared) continue;
          if (m.map && !(m.map.userData && m.map.userData.shared)) {
            m.map.dispose();
          }
          m.dispose();
        }
      }
    });
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

  return {
    loadHub,
    loadAuthor,
    update,
    getInteractables,
  };
}
