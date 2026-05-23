import * as THREE from 'three';

const TARGET_LONG_SIDE = 2.0; // meters
const FRAME_THICKNESS = 0.06;
const FRAME_DEPTH = 0.08;
const LABEL_HEIGHT = 0.18;
const LABEL_WIDTH = 1.2;

const loader = new THREE.TextureLoader();
loader.crossOrigin = 'anonymous';

export async function loadPaintingData(url = '/paintings.json') {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No pude cargar ${url}: ${res.status}`);
  return await res.json();
}

// Adds painting meshes and per-painting spotlights as children of `container`
// (so a single container.remove() + traverse(dispose) cleans everything up).
// Returns the list of painting Group objects for the raycaster.
export async function placePaintings(container, slots, paintings) {
  const interactables = [];

  await Promise.all(
    paintings.map(async (data, i) => {
      const slot = slots[i];
      if (!slot) return;
      try {
        const texture = await loader.loadAsync(data.url);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;

        const group = buildPaintingMesh(texture, data);
        group.position.copy(slot.position);
        group.rotation.y = slot.rotationY;
        group.userData.painting = data;

        const spot = makeSpotlight(slot);
        container.add(spot);
        container.add(spot.target);

        container.add(group);
        interactables.push(group);
      } catch (err) {
        console.error(`No pude cargar el cuadro "${data.title}":`, err);
      }
    }),
  );

  return interactables;
}

function buildPaintingMesh(texture, data) {
  const img = texture.image;
  const aspect = img.width / img.height;
  let w, h;
  if (aspect >= 1) {
    w = TARGET_LONG_SIDE;
    h = TARGET_LONG_SIDE / aspect;
  } else {
    h = TARGET_LONG_SIDE;
    w = TARGET_LONG_SIDE * aspect;
  }

  const group = new THREE.Group();

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(
      w + FRAME_THICKNESS * 2,
      h + FRAME_THICKNESS * 2,
      FRAME_DEPTH,
    ),
    new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.6,
      metalness: 0.1,
    }),
  );
  frame.position.z = -FRAME_DEPTH / 2;
  group.add(frame);

  const canvas = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.95,
      metalness: 0.0,
    }),
  );
  canvas.position.z = 0.001;
  canvas.userData.painting = data;
  group.add(canvas);

  const label = buildLabel(data);
  label.position.set(0, -h / 2 - LABEL_HEIGHT - 0.04, 0.002);
  group.add(label);

  group.userData.painting = data;
  return group;
}

function buildLabel(data) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = Math.round(512 * (LABEL_HEIGHT / LABEL_WIDTH));
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, c.width - 4, c.height - 4);

  ctx.fillStyle = '#f0e8d6';
  ctx.font = '600 36px -apple-system, "Segoe UI", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(ellipsize(ctx, data.title, c.width - 32), 16, c.height * 0.35);

  ctx.fillStyle = '#bbb';
  ctx.font = '400 26px -apple-system, "Segoe UI", sans-serif';
  ctx.fillText(
    ellipsize(ctx, `${data.author} · ${data.year}`, c.width - 32),
    16,
    c.height * 0.72,
  );

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(LABEL_WIDTH, LABEL_HEIGHT),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
}

function ellipsize(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  const ell = '…';
  let lo = 0,
    hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (ctx.measureText(text.slice(0, mid) + ell).width <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, lo) + ell;
}

function makeSpotlight(slot) {
  const spot = new THREE.SpotLight(0xfff1d8, 8, 9, Math.PI / 5, 0.5, 1.4);
  spot.position.copy(slot.position);
  spot.position.y = 3.6;
  spot.position.add(slot.normal.clone().multiplyScalar(0.7));

  const target = new THREE.Object3D();
  target.position.copy(slot.position);
  spot.target = target;
  return spot;
}
