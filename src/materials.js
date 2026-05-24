import * as THREE from 'three';

// Shared textures + materials. Created once and reused across every room.
// Marked with userData.shared = true so the room disposer skips them.

let cached = null;

export function getSharedMaterials() {
  if (cached) return cached;
  cached = build();
  return cached;
}

export function getAuthorRoomMaterials(author) {
  const base = getSharedMaterials();
  const hue = hashString(author) % 360;
  const wallMat = base.wallMat.clone();
  wallMat.color = new THREE.Color().setHSL(hue / 360, 0.06, 0.96);

  const wainscotMat = base.wainscotMat.clone();
  wainscotMat.color = new THREE.Color().setHSL(hue / 360, 0.05, 0.9);

  const trimMat = base.trimMat.clone();
  trimMat.color = new THREE.Color().setHSL(((hue + 34) % 360) / 360, 0.35, 0.62);

  return {
    ...base,
    wallMat,
    wainscotMat,
    trimMat,
  };
}

function build() {
  const floorTex = makeParquetTexture();
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.78,
    metalness: 0.06,
  });
  floorMat.userData.shared = true;

  const wallTex = makePlasterWallTexture();
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: 0.92,
    metalness: 0.02,
  });
  wallMat.userData.shared = true;

  const wainscotTex = makeWainscotTexture();
  const wainscotMat = new THREE.MeshStandardMaterial({
    map: wainscotTex,
    roughness: 0.48,
    metalness: 0.12,
  });
  wainscotMat.userData.shared = true;

  const ceilTex = makeCofferedCeilingTexture();
  const ceilMat = new THREE.MeshStandardMaterial({
    map: ceilTex,
    roughness: 0.95,
    metalness: 0.0,
  });
  ceilMat.userData.shared = true;

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x2e2420,
    roughness: 0.45,
    metalness: 0.28,
  });
  frameMat.userData.shared = true;

  const baseboardMat = new THREE.MeshStandardMaterial({
    color: 0x5c4a3a,
    roughness: 0.5,
    metalness: 0.1,
  });
  baseboardMat.userData.shared = true;

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xd4b878,
    roughness: 0.4,
    metalness: 0.45,
  });
  trimMat.userData.shared = true;

  return {
    floorMat,
    wallMat,
    wainscotMat,
    ceilMat,
    frameMat,
    baseboardMat,
    trimMat,
  };
}

let hubCached = null;
let domeMatCached = null;

export function getHubMaterials() {
  if (hubCached) return hubCached;
  const base = build();
  const floorMat = new THREE.MeshStandardMaterial({
    map: makeMarbleFloorTexture(),
    roughness: 0.42,
    metalness: 0.12,
  });
  floorMat.userData.shared = true;

  const wallMat = base.wallMat.clone();
  wallMat.color = new THREE.Color('#f7f3ea');

  const wainscotMat = base.wainscotMat.clone();
  wainscotMat.color = new THREE.Color('#e0d6c6');

  hubCached = { ...base, floorMat, wallMat, wainscotMat };
  return hubCached;
}

function makeMarbleFloorTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext('2d');
  const cx = c.width / 2;
  const cy = c.height / 2;

  const bg = ctx.createRadialGradient(cx, cy, 40, cx, cy, 520);
  bg.addColorStop(0, '#f7efe0');
  bg.addColorStop(0.55, '#ead9bc');
  bg.addColorStop(1, '#ccb892');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);

  ctx.strokeStyle = 'rgba(199,160,96,0.35)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 500, cy + Math.sin(a) * 500);
    ctx.stroke();
  }

  for (let r = 120; r <= 460; r += 80) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.userData.shared = true;
  return tex;
}

function makeDomeInteriorTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext('2d');
  const cx = c.width / 2;
  const cy = c.height / 2;

  const sky = ctx.createRadialGradient(cx, cy, 20, cx, cy, 520);
  sky.addColorStop(0, '#fff9eb');
  sky.addColorStop(0.22, '#f3e2b8');
  sky.addColorStop(0.55, '#dcc18a');
  sky.addColorStop(0.82, '#b99258');
  sky.addColorStop(1, '#8c693f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, c.width, c.height);

  ctx.strokeStyle = 'rgba(120,80,40,0.18)';
  ctx.lineWidth = 2;
  for (let ring = 1; ring <= 5; ring++) {
    ctx.beginPath();
    ctx.arc(cx, cy, ring * 90, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 500, cy + Math.sin(a) * 500);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.userData.shared = true;
  return tex;
}

export function getDomeMaterial() {
  if (domeMatCached) return domeMatCached;
  domeMatCached = new THREE.MeshStandardMaterial({
    map: makeDomeInteriorTexture(),
    side: THREE.DoubleSide,
    roughness: 0.88,
    metalness: 0.04,
  });
  domeMatCached.userData.shared = true;
  return domeMatCached;
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeParquetTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext('2d');

  const PLANK_H = 96;
  const palette = ['#7a5230', '#82542f', '#6a4220', '#7d4f2a', '#85583a', '#704a26'];
  let y = 0;
  let rowOffset = 0;
  while (y < c.height) {
    let x = -rowOffset;
    while (x < c.width) {
      const w = 200 + Math.floor(Math.random() * 260);
      const color = palette[Math.floor(Math.random() * palette.length)];
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, PLANK_H);

      // grain streaks
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      for (let g = 0; g < 6; g++) {
        const gy = y + 10 + Math.random() * (PLANK_H - 20);
        ctx.beginPath();
        ctx.moveTo(x + 4, gy);
        ctx.lineTo(x + w - 4, gy);
        ctx.stroke();
      }
      // small lighter highlights
      ctx.strokeStyle = 'rgba(255,240,210,0.05)';
      for (let g = 0; g < 3; g++) {
        const gy = y + 12 + Math.random() * (PLANK_H - 24);
        ctx.beginPath();
        ctx.moveTo(x + 4, gy);
        ctx.lineTo(x + w - 4, gy);
        ctx.stroke();
      }
      // plank borders
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, PLANK_H);
      x += w;
    }
    y += PLANK_H;
    rowOffset = (rowOffset + 140) % 400;
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.userData.shared = true;
  return tex;
}

function makePlasterWallTexture() {
  // Seamless neoclassical plaster: low-contrast stucco so panel UV offsets
  // do not produce visible block boundaries.
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, 0, c.height);
  bg.addColorStop(0, '#f8f5ee');
  bg.addColorStop(1, '#ebe6dc');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);

  // Soft vertical stucco bands (period = tile height for seamless repeat)
  for (let x = 0; x < c.width; x += 3) {
    const a = 0.02 + Math.random() * 0.03;
    ctx.strokeStyle = `rgba(120,110,95,${a})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (Math.random() - 0.5) * 2, c.height);
    ctx.stroke();
  }

  // Very faint horizontal lime wash (seamless at y=0 and y=height)
  for (let y = 0; y < c.height; y += 64) {
    const g = ctx.createLinearGradient(0, y, 0, y + 48);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.06)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, y, c.width, 48);
  }

  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 8;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.userData.shared = true;
  return tex;
}

function makeWainscotTexture() {
  // Pale marble wainscot panels; tiles seamlessly along wall length.
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, 0, c.height);
  bg.addColorStop(0, '#ebe4d6');
  bg.addColorStop(0.5, '#e2d9c8');
  bg.addColorStop(1, '#d8cfc0');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);

  for (let i = 0; i < 120; i++) {
    const x = Math.random() * c.width;
    const alpha = 0.03 + Math.random() * 0.06;
    ctx.strokeStyle = `rgba(90,80,70,${alpha})`;
    ctx.lineWidth = 0.3 + Math.random() * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (Math.random() - 0.5) * 3, c.height);
    ctx.stroke();
  }
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * c.width;
    ctx.strokeStyle = `rgba(255,250,240,${0.04 + Math.random() * 0.05})`;
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (Math.random() - 0.5) * 2, c.height);
    ctx.stroke();
  }
  for (let i = 1; i < 4; i++) {
    const x = (i * c.width) / 4;
    const g = ctx.createLinearGradient(x - 5, 0, x + 5, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, 'rgba(0,0,0,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 5, 0, 10, c.height);
    ctx.strokeStyle = 'rgba(199,160,96,0.22)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 8);
    ctx.lineTo(x, c.height - 8);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping; // wainscot never tiles vertically
  // Tiling is driven per-geometry by wallBuilder's UVs.
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.userData.shared = true;
  return tex;
}

function makeCofferedCeilingTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f5f0e4';
  ctx.fillRect(0, 0, c.width, c.height);

  const STEP = 128;
  // outer dark grid
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  for (let i = 0; i < c.width; i += STEP) {
    ctx.fillRect(i, 0, 8, c.height);
    ctx.fillRect(0, i, c.width, 8);
  }
  // inner recess shadow on each panel
  for (let i = 8; i < c.width; i += STEP) {
    for (let j = 8; j < c.height; j += STEP) {
      const w = STEP - 8;
      // top-left shadow gradient
      const g = ctx.createLinearGradient(i, j, i, j + w);
      g.addColorStop(0, 'rgba(0,0,0,0.08)');
      g.addColorStop(0.5, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(255,240,210,0.05)');
      ctx.fillStyle = g;
      ctx.fillRect(i + 6, j + 6, w - 12, w - 12);
      // gold trim
      ctx.strokeStyle = 'rgba(199,160,96,0.55)';
      ctx.lineWidth = 2;
      ctx.strokeRect(i + 14, j + 14, w - 28, w - 28);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.userData.shared = true;
  return tex;
}
