import * as THREE from 'three';

const CM_TO_M = 0.01;
const FRAME_THICKNESS = 0.06;
const FRAME_DEPTH = 0.08;
const LABEL_HEIGHT = 0.18;
const LABEL_WIDTH = 1.2;
const FALLBACK_LONG_SIDE = 2.0;

export const PAINTING_LAYOUT = {
  labelHeight: LABEL_HEIGHT,
  labelGap: 0.04,
  frameThickness: FRAME_THICKNESS,
  floorClearance: 0.15,
  ceilingClearance: 0.4,
  wallPadding: 1.5,
  paintingGap: 0.8,
  eyeHeight: 1.6,
};

function labelBelowExtent() {
  return (
    PAINTING_LAYOUT.labelHeight +
    PAINTING_LAYOUT.labelGap +
    PAINTING_LAYOUT.labelHeight / 2
  );
}

// Centers the canvas at eye level when it fits; otherwise hangs from the floor.
export function computePaintingCenterY(canvasHeight) {
  const { frameThickness, floorClearance, eyeHeight } = PAINTING_LAYOUT;
  const labelBelow = labelBelowExtent();
  const bottomIfCentered = eyeHeight - canvasHeight / 2 - labelBelow;
  if (bottomIfCentered >= floorClearance) {
    return eyeHeight;
  }
  return floorClearance + canvasHeight / 2 + frameThickness + labelBelow;
}

export function getPaintingDimensionsMeters(data) {
  const { width, height } = data.dimensions ?? {};
  if (width > 0 && height > 0) {
    return { w: width * CM_TO_M, h: height * CM_TO_M };
  }
  return null;
}

export function getPaintingLayoutExtents(data) {
  const dims = getPaintingDimensionsMeters(data) ?? {
    w: FALLBACK_LONG_SIDE,
    h: FALLBACK_LONG_SIDE,
  };
  const labelBelow = labelBelowExtent();
  return {
    width: dims.w + FRAME_THICKNESS * 2,
    height: dims.h + FRAME_THICKNESS * 2 + labelBelow,
    canvasH: dims.h,
  };
}

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
  const { w, h } = getPaintingSize(data, texture);

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

function getPaintingSize(data, texture) {
  const { width, height } = data.dimensions ?? {};
  if (width > 0 && height > 0) {
    return { w: width * CM_TO_M, h: height * CM_TO_M };
  }

  // Fallback for entries without catalog dimensions: scale from image aspect ratio.
  const img = texture.image;
  const aspect = img.width / img.height;
  if (aspect >= 1) {
    return { w: FALLBACK_LONG_SIDE, h: FALLBACK_LONG_SIDE / aspect };
  }
  return { w: FALLBACK_LONG_SIDE * aspect, h: FALLBACK_LONG_SIDE };
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
  spot.position.y = Math.max(3.6, slot.position.y + 2.5);
  spot.position.add(slot.normal.clone().multiplyScalar(0.7));

  const target = new THREE.Object3D();
  target.position.copy(slot.position);
  spot.target = target;
  return spot;
}
