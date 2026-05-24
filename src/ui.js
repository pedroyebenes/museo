import * as THREE from 'three';

const MAX_VIEW_DISTANCE = 4.0;
const FOCUS_INTERVAL_MS = 120;

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
      el.classList.add('toast');
      el.classList.remove('hidden');
      flashTimer = setTimeout(() => {
        flashTimer = null;
        el.classList.remove('toast');
        if (baseText) el.textContent = baseText;
      }, ms);
    },
    hide() {
      el?.classList.add('hidden');
    },
  };
}

export function createTransitionOverlay() {
  const el = document.getElementById('room-transition');
  const labelEl = document.getElementById('transition-label');
  const barEl = document.getElementById('transition-bar');

  function show({ kind, author, category }) {
    if (!el) return;
    if (kind === 'hub') {
      labelEl.textContent = 'Regresando al hall principal…';
    } else if (kind === 'category') {
      labelEl.textContent = `Entrando en ${category.label}…`;
    } else {
      labelEl.textContent = `Entrando en la sala de ${author.name}…`;
    }
    barEl.style.width = kind === 'author' ? '0%' : '100%';
    el.classList.remove('hidden');
  }

  function setProgress(loaded, total) {
    if (!barEl || total <= 0) return;
    const pct = Math.round((loaded / total) * 100);
    barEl.style.width = `${pct}%`;
  }

  function hide() {
    el?.classList.add('hidden');
    if (barEl) barEl.style.width = '0%';
  }

  return { show, setProgress, hide };
}

export function createFocusTracker({ camera, getInteractables, overlay }) {
  const raycaster = new THREE.Raycaster();
  raycaster.far = MAX_VIEW_DISTANCE;
  const center = new THREE.Vector2(0, 0);
  let lastCheck = 0;
  let lastCamPos = new THREE.Vector3();
  let lastCamRot = new THREE.Euler();

  function shouldUpdate(now) {
    if (now - lastCheck >= FOCUS_INTERVAL_MS) return true;
    const pos = camera.position;
    const rot = camera.rotation;
    return (
      pos.distanceToSquared(lastCamPos) > 0.0025 ||
      Math.abs(rot.y - lastCamRot.y) > 0.008 ||
      Math.abs(rot.x - lastCamRot.x) > 0.008
    );
  }

  function update(now = performance.now()) {
    if (!shouldUpdate(now)) return;
    lastCheck = now;
    lastCamPos.copy(camera.position);
    lastCamRot.copy(camera.rotation);

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
