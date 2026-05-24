import * as THREE from 'three';

const DEFAULT_SIGN_WIDTH = 1.68;

let portalGlowMat = null;
const signCache = new Map();

export function getPortalGlowMaterial() {
  if (portalGlowMat) return portalGlowMat;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  g.addColorStop(0, '#fff4d0');
  g.addColorStop(0.35, '#e8c078');
  g.addColorStop(0.72, '#6a4528');
  g.addColorStop(1, '#24160e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.userData.shared = true;
  portalGlowMat = new THREE.MeshBasicMaterial({ map: tex });
  portalGlowMat.userData.shared = true;
  return portalGlowMat;
}

export function createDoorSignMesh({ label, arrow = '', lintelH = 2.4, width = DEFAULT_SIGN_WIDTH }) {
  const key = `${arrow}|${label}|${lintelH.toFixed(2)}`;
  if (signCache.has(key)) {
    const cached = signCache.get(key);
    return cached.clone();
  }

  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0e0a06';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = '#c7a060';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, c.width - 12, c.height - 12);

  const txt = arrow ? `${arrow}  ${label}` : label;
  const maxTextW = c.width - 80;
  const fontSize = fitSignFont(ctx, txt, maxTextW, 72, 34);
  ctx.fillStyle = '#f3e8c8';
  ctx.font = `600 ${fontSize}px Georgia, "Times New Roman", serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  drawWrappedCenteredText(ctx, txt, c.width / 2, c.height / 2, maxTextW, fontSize * 1.15, 2);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.userData.shared = true;

  const w = width;
  const h = Math.min(w * (c.height / c.width), lintelH - 0.18);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true }),
  );
  signCache.set(key, mesh);
  return mesh.clone();
}

function fitSignFont(ctx, text, maxWidth, startSize, minSize) {
  for (let size = startSize; size >= minSize; size -= 2) {
    ctx.font = `600 ${size}px Georgia, "Times New Roman", serif`;
    if (ctx.measureText(text).width <= maxWidth) return size;
  }
  return minSize;
}

function drawWrappedCenteredText(ctx, text, cx, cy, maxWidth, lineHeight, maxLines) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  let display = lines;
  if (lines.length > maxLines) {
    display = lines.slice(0, maxLines);
    let last = display[maxLines - 1];
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 0) {
      last = last.slice(0, -1);
    }
    display[maxLines - 1] = `${last}…`;
  }
  const blockH = (display.length - 1) * lineHeight;
  let y = cy - blockH / 2;
  for (const row of display) {
    ctx.fillText(row, cx, y);
    y += lineHeight;
  }
}
