import * as THREE from 'three';
import { loadPaintingTexture } from './textureUtils.js';

const CM_TO_M = 0.01;
const FRAME_THICKNESS = 0.06;
const FRAME_DEPTH = 0.08;
const LABEL_HEIGHT = 0.18;
const LABEL_WIDTH = 1.2;
const FALLBACK_LONG_SIDE = 2.0;

export const PAINTING_LAYOUT = {
  labelHeight: LABEL_HEIGHT,
  labelWidth: LABEL_WIDTH,
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

export function formatPaintingDimensions(data) {
  const { width, height } = data.dimensions ?? {};
  if (width > 0 && height > 0) {
    return `${width} × ${height} cm`;
  }
  return null;
}

export function getPaintingLayoutExtents(data) {
  const dims = getPaintingDimensionsMeters(data) ?? {
    w: FALLBACK_LONG_SIDE,
    h: FALLBACK_LONG_SIDE,
  };
  const framedWidth = dims.w + FRAME_THICKNESS * 2;
  const labelBelow = labelBelowExtent();
  return {
    width: Math.max(framedWidth, LABEL_WIDTH),
    height: dims.h + FRAME_THICKNESS * 2 + labelBelow,
    canvasH: dims.h,
  };
}

export async function placePaintings(container, slots, paintings, { renderer, onProgress } = {}) {
  const interactables = [];
  let loaded = 0;
  const total = paintings.filter((_, i) => slots[i]).length;

  const report = () => {
    loaded += 1;
    onProgress?.(loaded, total);
  };

  await Promise.all(
    paintings.map(async (data, i) => {
      const slot = slots[i];
      if (!slot) return;
      try {
        const texture = await loadPaintingTexture(data.url, renderer);
        const group = buildPaintingMesh(texture, data);
        group.position.copy(slot.position);
        group.rotation.y = slot.rotationY;
        group.userData.painting = data;
        container.add(group);
        interactables.push(group);
      } catch (err) {
        console.error(`No pude cargar el cuadro "${data.title}":`, err);
        const group = buildPaintingMesh(null, data);
        group.position.copy(slot.position);
        group.rotation.y = slot.rotationY;
        group.userData.painting = data;
        container.add(group);
        interactables.push(group);
      } finally {
        report();
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
      emissive: 0x221a10,
      emissiveIntensity: 0.08,
    }),
  );
  frame.position.z = -FRAME_DEPTH / 2;
  group.add(frame);

  const canvasMaterial = texture
    ? new THREE.MeshBasicMaterial({ map: texture })
    : new THREE.MeshBasicMaterial({ color: 0x000000 });
  const canvas = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    canvasMaterial,
  );
  canvas.position.z = 0.001;
  canvas.userData.painting = data;
  group.add(canvas);

  const label = buildLabel(data);
  label.position.set(0, -h / 2 - LABEL_HEIGHT - PAINTING_LAYOUT.labelGap, 0.002);
  group.add(label);

  group.userData.painting = data;
  return group;
}

function getPaintingSize(data, texture) {
  const { width, height } = data.dimensions ?? {};
  if (width > 0 && height > 0) {
    return { w: width * CM_TO_M, h: height * CM_TO_M };
  }

  if (!texture) {
    return { w: FALLBACK_LONG_SIDE, h: FALLBACK_LONG_SIDE };
  }

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

  const textWidth = c.width - 32;
  const textX = 16;

  ctx.fillStyle = '#f0e8d6';
  ctx.font = '600 28px -apple-system, "Segoe UI", sans-serif';
  ctx.textBaseline = 'middle';
  drawWrappedText(ctx, data.title, textX, c.height * 0.28, textWidth, 30, 2);

  ctx.fillStyle = '#bbb';
  ctx.font = '400 22px -apple-system, "Segoe UI", sans-serif';
  const metaParts = [];
  if (data.author && data.year) metaParts.push(`${data.author} · ${data.year}`);
  const size = formatPaintingDimensions(data);
  if (size) metaParts.push(size);
  ctx.fillText(
    ellipsize(ctx, metaParts.join(' · '), textWidth),
    textX,
    c.height * 0.78,
  );

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(LABEL_WIDTH, LABEL_HEIGHT),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
}

function drawWrappedText(ctx, text, x, startY, maxWidth, lineHeight, maxLines) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }

    if (line) lines.push(line);
    line = word;

    if (lines.length >= maxLines) {
      const rest = words.slice(i).join(' ');
      const merged = lines[maxLines - 1] ? `${lines[maxLines - 1]} ${rest}` : rest;
      lines[maxLines - 1] = ellipsize(ctx, merged, maxWidth);
      line = '';
      break;
    }
  }

  if (line) {
    if (lines.length < maxLines) lines.push(line);
    else lines[maxLines - 1] = ellipsize(ctx, `${lines[maxLines - 1]} ${line}`, maxWidth);
  }

  lines.slice(0, maxLines).forEach((entry, index) => {
    ctx.fillText(entry, x, startY + index * lineHeight);
  });
}

function ellipsize(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  const ell = '…';
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (ctx.measureText(text.slice(0, mid) + ell).width <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, lo) + ell;
}
