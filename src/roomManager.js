import { buildMuseum } from './museum.js';
import { placePaintings } from './paintings.js';

export function createRoomManager({
  scene,
  camera,
  controls,
  paintingsByAuthor,
  authorOrder,
  onRoomChanged,
}) {
  let currentIndex = -1;
  let currentRoom = null;
  let interactables = [];
  let transitioning = false;
  // Cooldown so the player doesn't re-trigger the door they just came through
  let triggerCooldown = 0;

  async function loadRoom(index, spawnKind = 'initial') {
    if (transitioning) return;
    transitioning = true;
    try {
      const author = authorOrder[index];
      const paintings = paintingsByAuthor[author];

      const room = buildMuseum(scene, {
        paintingCount: paintings.length,
        author,
        hasPrev: index > 0,
        hasNext: index < authorOrder.length - 1,
        prevLabel: index > 0 ? authorOrder[index - 1] : null,
        nextLabel: index < authorOrder.length - 1 ? authorOrder[index + 1] : null,
      });

      const newInteractables = await placePaintings(
        room.group,
        room.slots,
        paintings,
      );

      // Now atomically swap: dispose old, attach new
      if (currentRoom) disposeRoom(currentRoom);

      currentRoom = room;
      currentIndex = index;
      interactables = newInteractables;

      controls.setSegments(room.segments);
      controls.setPose(room.spawn[spawnKind] || room.spawn.initial);
      triggerCooldown = 0.4; // seconds — avoid immediate re-trigger

      if (onRoomChanged) {
        onRoomChanged({
          index,
          total: authorOrder.length,
          author,
          paintingCount: paintings.length,
        });
      }
    } finally {
      transitioning = false;
    }
  }

  function disposeRoom(room) {
    scene.remove(room.group);
    room.group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const materials = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];
        for (const m of materials) {
          if (m.map) m.map.dispose();
          if (m.alphaMap) m.alphaMap.dispose();
          if (m.normalMap) m.normalMap.dispose();
          if (m.emissiveMap) m.emissiveMap.dispose();
          m.dispose();
        }
      }
      if (obj.isLight && obj.shadow) {
        obj.shadow.map?.dispose?.();
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
        const dest =
          t.direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (dest < 0 || dest >= authorOrder.length) return;
        const spawnKind = t.direction === 'next' ? 'fromPrev' : 'fromNext';
        loadRoom(dest, spawnKind);
        return;
      }
    }
  }

  function getInteractables() {
    return interactables;
  }

  return { loadRoom, update, getInteractables };
}
