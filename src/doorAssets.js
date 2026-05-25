import * as THREE from 'three';

const DEFAULT_SIGN_WIDTH = 1.68;

let portalGlowMat = null;
let returnPortalGlowMat = null;
let returnFrameMat = null;
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

export function getReturnPortalGlowMaterial() {
  if (returnPortalGlowMat) return returnPortalGlowMat;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 6, 128, 128, 128);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.22, '#aae8ff');
  g.addColorStop(0.52, '#1a8fc0');
  g.addColorStop(0.80, '#06223a');
  g.addColorStop(1, '#020810');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.userData.shared = true;
  returnPortalGlowMat = new THREE.MeshBasicMaterial({ map: tex });
  returnPortalGlowMat.userData.shared = true;
  return returnPortalGlowMat;
}

export function getReturnFrameMaterial() {
  if (returnFrameMat) return returnFrameMat;
  returnFrameMat = new THREE.MeshStandardMaterial({
    color: 0x8cdaf5,
    emissive: 0x1a6890,
    emissiveIntensity: 0.55,
    roughness: 0.08,
    metalness: 0.92,
  });
  returnFrameMat.userData.shared = true;
  return returnFrameMat;
}

export function createDoorSignMesh({
  label,
  arrow = '',
  lintelH = 2.4,
  width = DEFAULT_SIGN_WIDTH,
  textColor = '#f3e8c8',
  borderColor = '#c7a060',
  shape = 'standard',
}) {
  const key = [
    arrow,
    label,
    lintelH.toFixed(2),
    textColor,
    borderColor,
    shape,
  ].join('|');
  if (signCache.has(key)) {
    const cached = signCache.get(key);
    return cached.clone();
  }

  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext('2d');
  drawPlaqueShape(ctx, c.width, c.height, { shape, borderColor });

  const txt = arrow ? `${arrow}  ${label}` : label;
  const maxTextW = c.width - 80;
  const fontSize = fitSignFont(ctx, txt, maxTextW, 72, 34);
  ctx.fillStyle = textColor;
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

function drawPlaqueShape(ctx, w, h, { shape, borderColor }) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#0e0a06';
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 8;

  if (shape === 'return') {
    drawReturnPlaquePath(ctx, w, h, 34);
    ctx.fill();
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(243,232,200,0.42)';
    drawReturnPlaquePath(ctx, w, h, 58);
    ctx.stroke();
    return;
  }

  ctx.fillRect(0, 0, w, h);
  ctx.strokeRect(6, 6, w - 12, h - 12);
}

function drawReturnPlaquePath(ctx, w, h, inset) {
  const x0 = inset;
  const x1 = w - inset;
  const y0 = inset * 0.55;
  const y1 = h - inset * 0.55;
  const notch = h * 0.28;
  ctx.beginPath();
  ctx.moveTo(x0 + notch, y0);
  ctx.lineTo(x1 - notch, y0);
  ctx.quadraticCurveTo(x1, y0, x1, y0 + notch);
  ctx.lineTo(x1, y1 - notch);
  ctx.quadraticCurveTo(x1, y1, x1 - notch, y1);
  ctx.lineTo(x0 + notch, y1);
  ctx.lineTo(x0, h / 2);
  ctx.closePath();
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
