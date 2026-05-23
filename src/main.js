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
  try {
    paintings = await loadPaintingData();
  } catch (err) {
    loading.textContent = 'Error cargando paintings.json';
    console.error(err);
    return;
  }

  // Group paintings by author, preserving first-appearance order from the JSON.
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
    controls,
    update: updateControls,
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
  });

  const roomManager = createRoomManager({
    scene,
    camera,
    controls: { setSegments, setPose },
    paintingsByAuthor,
    authorOrder,
    onRoomChanged: ({ index, total, author }) => {
      hud.set(`Sala ${index + 1} / ${total} — ${author}`);
      overlay.hide();
    },
  });

  await roomManager.loadRoom(0, 'initial');

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

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    updateControls(dt);
    roomManager.update(dt);
    if (controls.isLocked) focus.update();

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

boot();
