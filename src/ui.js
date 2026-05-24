import * as THREE from 'three';

const MAX_VIEW_DISTANCE = 4.0;

export function createInfoOverlay() {
  const panel = document.getElementById('info-panel');
  const titleEl = document.getElementById('info-title');
  const authorEl = document.getElementById('info-author');
  const descEl = document.getElementById('info-description');

  let current = null;
  let suppressed = false;

  function show(data) {
    if (suppressed) return;
    if (current && current.id === data.id) return;
    current = data;
    titleEl.textContent = data.title;
    authorEl.textContent = `${data.author} · ${data.year}`;
    descEl.textContent = data.description;
    panel.classList.remove('hidden');
  }

  function hide() {
    if (!current) return;
    current = null;
    panel.classList.add('hidden');
  }

  function toggleSuppressed() {
    suppressed = !suppressed;
    if (suppressed) hide();
    return suppressed;
  }

  function isSuppressed() {
    return suppressed;
  }

  return { show, hide, toggleSuppressed, isSuppressed };
}

export function createRoomHUD() {
  const el = document.getElementById('room-hud');
  let baseText = '';
  let flashTimer = null;
  return {
    set(text) {
      baseText = text;
      if (flashTimer || !el) {
        // A flash is currently showing — let it run; the base text will
        // be restored when it ends.
        if (!flashTimer && el) {
          el.textContent = text;
          el.classList.remove('hidden');
        }
        return;
      }
      el.textContent = text;
      el.classList.remove('hidden');
    },
    flash(text, ms = 1400) {
      if (!el) return;
      if (flashTimer) clearTimeout(flashTimer);
      el.textContent = text;
      el.classList.remove('hidden');
      flashTimer = setTimeout(() => {
        flashTimer = null;
        if (baseText) el.textContent = baseText;
      }, ms);
    },
    hide() {
      el?.classList.add('hidden');
    },
  };
}

export function createFocusTracker({ camera, getInteractables, overlay }) {
  const raycaster = new THREE.Raycaster();
  raycaster.far = MAX_VIEW_DISTANCE;
  const center = new THREE.Vector2(0, 0);

  function update() {
    const interactables = getInteractables();
    if (!interactables || interactables.length === 0) {
      overlay.hide();
      return;
    }
    raycaster.setFromCamera(center, camera);
    const hits = raycaster.intersectObjects(interactables, true);
    if (hits.length > 0) {
      const obj = findPainting(hits[0].object);
      if (obj) {
        overlay.show(obj.userData.painting);
        return;
      }
    }
    overlay.hide();
  }

  return { update };
}

function findPainting(node) {
  let n = node;
  while (n) {
    if (n.userData && n.userData.painting) return n;
    n = n.parent;
  }
  return null;
}
