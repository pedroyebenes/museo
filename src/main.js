import { createScene } from './scene.js';
import { loadPaintingData } from './paintings.js';
import { createControls } from './controls.js';
import { createInfoOverlay, createFocusTracker, createRoomHUD } from './ui.js';
import { createRoomManager } from './roomManager.js';

async function boot() {
  const loading = document.getElementById('loading');
  const welcome = document.getElementById('welcome');

  const { scene, camera, renderer } = createScene();

  let paintings = [];
  let authorsData = {};
  try {
    const [pj, aj] = await Promise.all([
      loadPaintingData(),
      fetch('/authors.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
    ]);
    paintings = pj;
    authorsData = aj || {};
  } catch (err) {
    loading.textContent = 'Error cargando paintings.json';
    console.error(err);
    return;
  }

  const paintingsByAuthor = {};
  const authorOrder = [];
  for (const p of paintings) {
    if (!paintingsByAuthor[p.author]) {
      paintingsByAuthor[p.author] = [];
      authorOrder.push(p.author);
    }
    paintingsByAuthor[p.author].push(p);
  }

  const overlay = createInfoOverlay();
  const hud = createRoomHUD();

  const {
    update: updateControls,
    isActive: controlsActive,
    setSegments,
    setPose,
    lockOnClick,
  } = createControls({
    camera,
    renderer,
    onLock: () => {
      welcome.classList.add('hidden');
      document.body.classList.add('playing');
    },
    onUnlock: () => {
      welcome.classList.remove('hidden');
      document.body.classList.remove('playing');
      overlay.hide();
    },
    onToggleInfo: () => {
      const suppressed = overlay.toggleSuppressed();
      hud.flash(
        suppressed ? 'Información del cuadro: oculta' : 'Información del cuadro: visible',
      );
    },
  });

  const roomManager = createRoomManager({
    scene,
    camera,
    controls: { setSegments, setPose },
    paintingsByAuthor,
    authorOrder,
    authorsData,
    onRoomChanged: (info) => {
      overlay.hide();
      if (info.kind === 'hub') {
        hud.set(`Hall principal — ${info.total} salas`);
      } else {
        hud.set(`${info.author} (${info.paintingCount} obras)`);
      }
    },
  });

  await roomManager.loadHub('initial');

  const focus = createFocusTracker({
    camera,
    overlay,
    getInteractables: () => roomManager.getInteractables(),
  });

  loading.classList.add('hidden');
  welcome.addEventListener('click', lockOnClick);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyH') {
      const suppressed = overlay.toggleSuppressed();
      hud.flash(
        suppressed ? 'Información del cuadro: oculta' : 'Información del cuadro: visible',
      );
    }
  });

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    updateControls(dt);
    roomManager.update(dt);
    if (controlsActive()) focus.update();

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

boot();
