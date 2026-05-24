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
  wallMat.color = new THREE.Color().setHSL(hue / 360, 0.42, 0.9);

  const wainscotMat = base.wainscotMat.clone();
  wainscotMat.color = new THREE.Color().setHSL(hue / 360, 0.38, 0.72);

  const trimMat = base.trimMat.clone();
  trimMat.color = new THREE.Color().setHSL(((hue + 34) % 360) / 360, 0.5, 0.58);

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

  const wallTex = makeDamaskTexture();
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: 0.88,
    metalness: 0.04,
  });
  wallMat.userData.shared = true;

  const wainscotTex = makeWainscotTexture();
  const wainscotMat = new THREE.MeshStandardMaterial({
    map: wainscotTex,
    roughness: 0.55,
    metalness: 0.2,
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
    color: 0x1c1410,
    roughness: 0.45,
    metalness: 0.28,
  });
  frameMat.userData.shared = true;

  const baseboardMat = new THREE.MeshStandardMaterial({
    color: 0x2a1a10,
    roughness: 0.5,
    metalness: 0.1,
  });
  baseboardMat.userData.shared = true;

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xc7a060,
    roughness: 0.45,
    metalness: 0.4,
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

function makeDamaskTexture() {
  // A subtle warm damask: tessellated diamond motif over a cream ground.
  // Kept low-contrast so it reads like silk wallpaper, not a costume.
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');

  // Warm cream base with a soft vertical gradient (lighter at the top)
  const bg = ctx.createLinearGradient(0, 0, 0, c.height);
  bg.addColorStop(0, '#f1e6ce');
  bg.addColorStop(1, '#e7daba');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);

  // Damask diamonds (offset rows). Two passes: a soft halo, then a darker
  // ornament inside.
  const dw = 128;
  const dh = 96;
  for (let row = -1; row <= c.height / dh + 1; row++) {
    for (let col = -1; col <= c.width / dw + 1; col++) {
      const offX = (row & 1) ? dw / 2 : 0;
      const cx = col * dw + offX + dw / 2;
      const cy = row * dh + dh / 2;
      // Soft outer halo
      const halo = ctx.createRadialGradient(cx, cy, 4, cx, cy, dw / 2);
      halo.addColorStop(0, 'rgba(170,130,70,0.10)');
      halo.addColorStop(1, 'rgba(170,130,70,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(cx - dw / 2, cy - dh / 2, dw, dh);
      // Diamond
      ctx.fillStyle = 'rgba(150,110,60,0.10)';
      ctx.beginPath();
      ctx.moveTo(cx, cy - dh / 2 + 10);
      ctx.lineTo(cx + dw / 2 - 12, cy);
      ctx.lineTo(cx, cy + dh / 2 - 10);
      ctx.lineTo(cx - dw / 2 + 12, cy);
      ctx.closePath();
      ctx.fill();
      // Inner fleur / cross
      ctx.strokeStyle = 'rgba(120,80,40,0.16)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy);
      ctx.lineTo(cx + 12, cy);
      ctx.moveTo(cx, cy - 14);
      ctx.lineTo(cx, cy + 14);
      ctx.stroke();
      // tiny gold dot
      ctx.fillStyle = 'rgba(190,150,90,0.35)';
      ctx.beginPath();
      ctx.arc(cx, cy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Fine noise so the damask reads as fabric, not vector graphics.
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 10;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  // Tiling is driven per-geometry by wallBuilder's UVs, so leave repeat = 1.
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.userData.shared = true;
  return tex;
}

function makeWainscotTexture() {
  // Dark walnut: vertical grain + soft highlights. Tiles seamlessly so it
  // reads like a continuous panelled wainscoting at any wall length.
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');

  // Base with a vertical gradient (slightly darker at the top, classic shadow)
  const bg = ctx.createLinearGradient(0, 0, 0, c.height);
  bg.addColorStop(0, '#2c1c10');
  bg.addColorStop(0.5, '#3a261a');
  bg.addColorStop(1, '#321f12');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);

  // Vertical wood grain — many fine streaks
  for (let i = 0; i < 180; i++) {
    const x = Math.random() * c.width;
    const alpha = 0.05 + Math.random() * 0.12;
    ctx.strokeStyle = `rgba(0,0,0,${alpha})`;
    ctx.lineWidth = 0.4 + Math.random() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (Math.random() - 0.5) * 4, c.height);
    ctx.stroke();
  }
  // Warm highlights
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * c.width;
    const alpha = 0.03 + Math.random() * 0.05;
    ctx.strokeStyle = `rgba(180,130,70,${alpha})`;
    ctx.lineWidth = 0.5 + Math.random() * 0.9;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (Math.random() - 0.5) * 3, c.height);
    ctx.stroke();
  }
  // Subtle vertical panel grooves: 4 deeper shadow lines per tile so the
  // wainscoting reads as panelled rather than as a single plank.
  for (let i = 1; i < 4; i++) {
    const x = (i * c.width) / 4;
    const g = ctx.createLinearGradient(x - 5, 0, x + 5, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, 'rgba(0,0,0,0.4)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 5, 0, 10, c.height);
    // matching gold pin-stripe inside the groove
    ctx.strokeStyle = 'rgba(180,130,70,0.18)';
    ctx.lineWidth = 0.6;
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
  ctx.fillStyle = '#efe6d2';
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
