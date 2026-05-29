import * as THREE from 'three';
import { formatPaintingDimensions } from './paintings.js';

const MAX_VIEW_DISTANCE = 4.0;
const FOCUS_INTERVAL_MS = 120;

export function createInfoOverlay({ favorites, onFavoriteChange, onReport } = {}) {
  const panel = document.getElementById('info-panel');
  const titleEl = document.getElementById('info-title');
  const authorEl = document.getElementById('info-author');
  const sizeEl = document.getElementById('info-size');
  const descEl = document.getElementById('info-description');
  const itemsEl = document.getElementById('info-items');
  const favoriteBtn = document.getElementById('info-favorite');
  const reportBtn = document.getElementById('info-report');

  let current = null;
  let suppressed = false;

  reportBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    onReport?.();
  });
  reportBtn?.addEventListener('pointerdown', (e) => e.stopPropagation());
  favoriteBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!current?.id) return;
    const active = favorites?.toggle(current.id) ?? false;
    updateFavoriteButton();
    onFavoriteChange?.(active, current);
  });
  favoriteBtn?.addEventListener('pointerdown', (e) => e.stopPropagation());

  function show(data) {
    if (suppressed) return;
    if (current && current.id === data.id) return;
    current = data;
    titleEl.textContent = data.title;

    const subtitle = data.subtitle ?? (data.author && data.year ? `${data.author} · ${data.year}` : null);
    authorEl.textContent = subtitle ?? '';
    authorEl.style.display = subtitle ? '' : 'none';

    const size = formatPaintingDimensions(data);
    const sizeText = [size, data.imageBroken ? '(imagen no disponible)' : null]
      .filter(Boolean)
      .join('  ');
    sizeEl.textContent = sizeText;
    sizeEl.style.display = sizeText ? '' : 'none';

    descEl.textContent = data.description ?? '';
    descEl.style.display = data.description ? '' : 'none';

    if (itemsEl) {
      if (data.items && data.items.length > 0) {
        itemsEl.innerHTML = '';
        for (const item of data.items) {
          const li = document.createElement('li');
          li.textContent = item;
          itemsEl.appendChild(li);
        }
        itemsEl.classList.remove('hidden');
      } else {
        itemsEl.classList.add('hidden');
      }
    }

    panel.classList.remove('hidden');
    updateFavoriteButton();
    favoriteBtn?.classList.remove('hidden');
    reportBtn?.classList.remove('hidden');
  }

  function hide() {
    if (!current) return;
    current = null;
    authorEl.style.display = '';
    sizeEl.style.display = '';
    descEl.style.display = '';
    if (itemsEl) itemsEl.classList.add('hidden');
    favoriteBtn?.classList.add('hidden');
    reportBtn?.classList.add('hidden');
    panel.classList.add('hidden');
  }

  function updateFavoriteButton() {
    if (!favoriteBtn || !current?.id) return;
    const active = favorites?.has(current.id) ?? false;
    favoriteBtn.classList.toggle('active', active);
    favoriteBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
    favoriteBtn.setAttribute(
      'aria-label',
      active ? 'Quitar de favoritos' : 'Añadir a favoritos',
    );
  }

  function toggleSuppressed() {
    suppressed = !suppressed;
    if (suppressed) hide();
    return suppressed;
  }

  function isSuppressed() {
    return suppressed;
  }

  function getCurrent() {
    return current;
  }

  return { show, hide, toggleSuppressed, isSuppressed, getCurrent, refresh: updateFavoriteButton };
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
    // Author rooms load textures (real progress); hub/category rooms load nothing, so
    // show an indeterminate pulse instead of a static full bar that never moves.
    if (kind === 'author') {
      barEl.classList.remove('indeterminate');
      barEl.style.width = '0%';
    } else {
      barEl.classList.add('indeterminate');
      barEl.style.width = '';
    }
    el.classList.remove('hidden');
  }

  function setProgress(loaded, total) {
    if (!barEl || total <= 0) return;
    barEl.classList.remove('indeterminate');
    const pct = Math.round((loaded / total) * 100);
    barEl.style.width = `${pct}%`;
  }

  function hide() {
    el?.classList.add('hidden');
    if (barEl) {
      barEl.classList.remove('indeterminate');
      barEl.style.width = '0%';
    }
  }

  return { show, setProgress, hide };
}

const FRAME_EMISSIVE_BASE = 0.08;
const FRAME_EMISSIVE_FOCUS = 0.45;

export function createFocusTracker({ camera, getInteractables, overlay }) {
  const raycaster = new THREE.Raycaster();
  raycaster.far = MAX_VIEW_DISTANCE;
  const center = new THREE.Vector2(0, 0);
  let lastCheck = 0;
  let lastCamPos = new THREE.Vector3();
  let lastCamRot = new THREE.Euler();
  let highlighted = null;

  function setHighlight(group) {
    if (highlighted === group) return;
    if (highlighted?.userData?.frameMaterial) {
      highlighted.userData.frameMaterial.emissiveIntensity = FRAME_EMISSIVE_BASE;
    }
    highlighted = group;
    if (group?.userData?.frameMaterial) {
      group.userData.frameMaterial.emissiveIntensity = FRAME_EMISSIVE_FOCUS;
    }
  }

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
      setHighlight(null);
      return;
    }
    raycaster.setFromCamera(center, camera);
    const hits = raycaster.intersectObjects(interactables, true);
    if (hits.length > 0) {
      const obj = findInteractable(hits[0].object);
      if (obj) {
        overlay.show(obj.userData.door ?? obj.userData.painting);
        setHighlight(obj.userData.painting ? obj : null);
        return;
      }
    }
    overlay.hide();
    setHighlight(null);
  }

  return { update };
}

// Returns the topmost ancestor flagged as interactable (the painting/door group),
// not the inner mesh that was hit — so callers get the whole group (and its
// userData.frameMaterial) rather than a leaf canvas/frame mesh.
function findInteractable(node) {
  let n = node;
  let found = null;
  while (n) {
    if (n.userData && (n.userData.painting || n.userData.door)) found = n;
    n = n.parent;
  }
  return found;
}

export function createReportDialog() {
  const modal = document.getElementById('report-modal');
  const descEl = document.getElementById('report-description');
  const confirmBtn = document.getElementById('report-confirm');
  const cancelBtn = document.getElementById('report-cancel');

  let pendingUrl = null;
  let onDismiss = null;

  function open({ issueTitle, issueBody, description, onClose }) {
    const params = new URLSearchParams({ title: issueTitle, body: issueBody, labels: 'bug' });
    pendingUrl = `https://github.com/pedroyebenes/museo/issues/new?${params}`;
    onDismiss = onClose;
    descEl.textContent = description;
    document.body.classList.add('report-open');
    modal.classList.remove('hidden');
    confirmBtn.focus();
  }

  function close() {
    modal.classList.add('hidden');
    document.body.classList.remove('report-open');
    pendingUrl = null;
    const cb = onDismiss;
    onDismiss = null;
    cb?.();
  }

  confirmBtn.addEventListener('click', () => {
    if (pendingUrl) window.open(pendingUrl, '_blank', 'noopener,noreferrer');
    close();
  });

  cancelBtn.addEventListener('click', close);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && !modal.classList.contains('hidden')) {
      e.stopPropagation();
      close();
    }
  });

  return { open, close };
}
