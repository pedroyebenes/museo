import * as THREE from 'three';

// Shared textures + materials. Created once and reused across every room.
// Marked with userData.shared = true so the room disposer skips them.

let cached = null;

export function getSharedMaterials() {
  if (cached) return cached;
  cached = build();
  return cached;
}

function build() {
  const floorTex = makeParquetTexture();
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.78,
    metalness: 0.06,
  });
  floorMat.userData.shared = true;

  const wallTex = makePlasterTexture();
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: 0.92,
    metalness: 0.0,
  });
  wallMat.userData.shared = true;

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

  return { floorMat, wallMat, ceilMat, frameMat, baseboardMat, trimMat };
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

function makePlasterTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ebe2cf';
  ctx.fillRect(0, 0, c.width, c.height);
  // soft cloud blotches
  for (let i = 0; i < 80; i++) {
    const x = Math.random() * c.width;
    const y = Math.random() * c.height;
    const r = 30 + Math.random() * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const alpha = 0.04 + Math.random() * 0.05;
    g.addColorStop(0, `rgba(120,90,60,${alpha})`);
    g.addColorStop(1, 'rgba(120,90,60,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // fine noise
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 1.5);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
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
