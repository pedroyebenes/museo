import { createScene } from './scene.js';
import { loadCatalogData } from './catalogData.js';
import { initMaterialRenderer } from './proceduralTextureUtils.js';
import { buildNeutralEnvMap } from './materials.js';
import { createControls } from './controls.js';
import {
  createInfoOverlay,
  createFocusTracker,
  createRoomHUD,
  createTransitionOverlay,
  createReportDialog,
} from './ui.js';
import { createRoomManager } from './roomManager.js';
import { createCatalog } from './catalog.js';
import { canOpenReport, buildReportContext } from './report.js';

async function boot() {
  const loading = document.getElementById('loading');
  const welcome = document.getElementById('welcome');

  const { scene, camera, renderer } = createScene();
  initMaterialRenderer(renderer);
  scene.environment = buildNeutralEnvMap(renderer);

  if (
    window.matchMedia('(pointer: coarse)').matches ||
    navigator.maxTouchPoints > 0
  ) {
    document.body.classList.add('is-touch');
  }

  let catalogData = null;
  try {
    catalogData = await loadCatalogData();
  } catch (err) {
    loading.textContent = 'Error cargando el catálogo';
    console.error(err);
    return;
  }

  const overlay = createInfoOverlay({ onReport: () => requestReport() });
  const hud = createRoomHUD();
  const transition = createTransitionOverlay();
  const reportDialog = createReportDialog();

  let catalog = null;
  let roomManager;

  function reportAvailable() {
    return canOpenReport({
      playing: document.body.classList.contains('playing'),
      catalogOpen: catalog?.isOpen() ?? false,
      overlay,
      roomManager,
    });
  }

  function requestReport() {
    if (!document.body.classList.contains('playing')) return;
    if (catalog?.isOpen()) return;

    const context = buildReportContext({
      overlay,
      roomManager,
      catalogData,
    });

    if (!context) {
      hud.flash('Enfoca un cuadro o entra en una sala de autor para reportar');
      return;
    }

    openReport(context);
  }

  const {
    update: updateControls,
    isActive: controlsActive,
    setSegments,
    setPose,
    lockOnClick,
    suspend: suspendControls,
    resume: resumeControls,
    unlock: unlockControls,
    setReportAvailable,
  } = createControls({
    camera,
    renderer,
    onLock: () => {
      welcome.classList.add('hidden');
      document.body.classList.add('playing');
      document.getElementById('catalog-btn')?.classList.remove('hidden');
    },
    onUnlock: () => {
      if (catalog?.isOpen()) return;
      const reportModal = document.getElementById('report-modal');
      if (reportModal && !reportModal.classList.contains('hidden')) return;
      welcome.classList.remove('hidden');
      document.body.classList.remove('playing');
      document.getElementById('catalog-btn')?.classList.add('hidden');
      overlay.hide();
    },
    onToggleInfo: () => {
      const suppressed = overlay.toggleSuppressed();
      hud.flash(
        suppressed ? 'Información del cuadro: oculta' : 'Información del cuadro: visible',
      );
    },
    onReport: () => requestReport(),
  });

  roomManager = createRoomManager({
    scene,
    camera,
    renderer,
    controls: { setSegments, setPose },
    catalog: catalogData,
    onRoomChanged: (info) => {
      overlay.hide();
      if (info.kind === 'hub') {
        hud.set(`Hall principal — ${info.total} categorías`);
      } else if (info.kind === 'category') {
        hud.set(`${info.category.label} — ${info.authorCount} autores`);
      } else {
        hud.set(`${info.author.name} (${info.paintingCount} obras)`);
      }
    },
    onTransitionStart: (info) => transition.show(info),
    onTransitionProgress: ({ loaded, total }) => transition.setProgress(loaded, total),
    onTransitionEnd: () => transition.hide(),
  });

  await roomManager.loadHub('initial');

  catalog = createCatalog({
    catalog: catalogData,
    onGoToCategory: (categoryId) => roomManager.loadCategory(categoryId),
    onGoToRoom: (authorId) => roomManager.loadAuthor(authorId),
    onGoToPainting: (authorId, paintingId) =>
      roomManager.loadAuthor(authorId, { paintingId }),
    onClose: () => resumeAfterCatalog(),
  });

  const catalogBtn = document.getElementById('catalog-btn');

  function openCatalog() {
    if (!document.body.classList.contains('playing')) return;
    overlay.hide();
    suspendControls();
    unlockControls();
    catalog.open();
  }

  function resumeAfterCatalog() {
    resumeControls();
    if (!controlsActive()) lockOnClick();
  }

  function resumeAfterReport() {
    resumeControls();
    if (controlsActive()) return;

    const isTouch =
      document.body.classList.contains('is-touch')
      || window.matchMedia('(pointer: coarse)').matches
      || navigator.maxTouchPoints > 0;

    if (isTouch && !catalog?.isOpen()) {
      lockOnClick();
      return;
    }

    welcome.classList.remove('hidden');
    document.body.classList.remove('playing');
    document.getElementById('catalog-btn')?.classList.add('hidden');
    lockOnClick();
  }

  function openReport(context) {
    if (!document.body.classList.contains('playing')) return;
    if (catalog?.isOpen()) return;

    const reportContext =
      context
      ?? buildReportContext({
        overlay,
        roomManager,
        catalogData,
      });

    if (!reportContext) return;

    hud.flash(reportContext.description, 1800);
    overlay.hide();
    suspendControls();
    unlockControls();
    reportDialog.open({ ...reportContext, onClose: resumeAfterReport });
  }

  catalogBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    openCatalog();
  });

  const focus = createFocusTracker({
    camera,
    overlay,
    getInteractables: () => roomManager.getInteractables(),
  });

  loading.classList.add('hidden');
  welcome.addEventListener('click', lockOnClick);
  document.getElementById('enter-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    lockOnClick();
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  window.addEventListener('keydown', (e) => {
    if (
      e.code === 'KeyM'
      && document.body.classList.contains('playing')
      && !catalog.isOpen()
    ) {
      e.preventDefault();
      openCatalog();
      return;
    }
    if (e.code === 'Escape' && catalog?.isOpen()) {
      catalog.close();
      return;
    }
    if (e.code === 'KeyH') {
      const suppressed = overlay.toggleSuppressed();
      hud.flash(
        suppressed ? 'Información del cuadro: oculta' : 'Información del cuadro: visible',
      );
    }
    if (e.code === 'KeyR') {
      requestReport();
    }
  });

  let last = performance.now();
  let rafId = null;
  let visible = document.visibilityState !== 'hidden';

  document.addEventListener('visibilitychange', () => {
    visible = document.visibilityState !== 'hidden';
    if (visible && rafId === null) {
      last = performance.now();
      rafId = requestAnimationFrame(loop);
    }
  });

  function loop(now) {
    if (!visible) {
      rafId = null;
      return;
    }
    rafId = requestAnimationFrame(loop);

    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    updateControls(dt);
    roomManager.update(dt);
    if (controlsActive()) {
      focus.update(now);
      setReportAvailable(reportAvailable());
    }

    renderer.render(scene, camera);
  }
  rafId = requestAnimationFrame(loop);
}

boot();
