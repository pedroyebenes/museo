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

function makeSanPietroDomeFrescoTexture() {
  const W = 2048;
  const H = 1024;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const RIBS = 16;
  const secW = W / RIBS;

  // Background: lapis lazuli blue, gold at apex
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0.00, '#fff5c0');
  bg.addColorStop(0.05, '#c8890e');
  bg.addColorStop(0.13, '#1c3a8a');
  bg.addColorStop(0.55, '#162f78');
  bg.addColorStop(0.88, '#0f2260');
  bg.addColorStop(1.00, '#0a1848');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 16 gold ribs (structural ribs of the dome)
  const rW = secW * 0.09;
  for (let i = 0; i < RIBS; i++) {
    const x = i * secW;
    const g = ctx.createLinearGradient(x - rW * 2.5, 0, x + rW * 2.5, 0);
    g.addColorStop(0,    'rgba(190,148,50,0)');
    g.addColorStop(0.25, 'rgba(215,175,72,0.45)');
    g.addColorStop(0.48, 'rgba(240,205,95,0.92)');
    g.addColorStop(0.52, 'rgba(245,210,100,0.92)');
    g.addColorStop(0.75, 'rgba(215,175,72,0.45)');
    g.addColorStop(1,    'rgba(190,148,50,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rW * 2.5, 0, rW * 5, H);
  }

  // Horizontal gold divider bands
  for (const yf of [0.13, 0.40, 0.53, 0.61, 0.76, 0.88]) {
    const y = H * yf;
    const bh = H * 0.013;
    const g = ctx.createLinearGradient(0, y, 0, y + bh);
    g.addColorStop(0,   'rgba(190,148,50,0.3)');
    g.addColorStop(0.3, 'rgba(232,187,78,0.82)');
    g.addColorStop(0.7, 'rgba(232,187,78,0.82)');
    g.addColorStop(1,   'rgba(190,148,50,0.3)');
    ctx.fillStyle = g;
    ctx.fillRect(0, y, W, bh);
  }

  // Inner ring near apex
  ctx.fillStyle = 'rgba(240,200,90,0.82)';
  ctx.fillRect(0, H * 0.09, W, H * 0.005);

  // Upper apostle figures (13% – 40%)
  for (let i = 0; i < RIBS; i++) {
    domeDrawApostle(ctx, (i + 0.5) * secW, H * 0.135, secW * 0.68, H * 0.26);
  }

  // Inscription band: "TV ES PETRVS..." (53% – 61%)
  const inscY = H * 0.535;
  const inscH = H * 0.07;
  ctx.fillStyle = 'rgba(6,12,42,0.90)';
  ctx.fillRect(0, inscY, W, inscH);
  const fSize = Math.floor(inscH * 0.56);
  ctx.font = `bold ${fSize}px "Times New Roman", Times, serif`;
  ctx.fillStyle = 'rgba(228,190,78,0.97)';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const insc = '  TV · ES · PETRVS · ET · SVPER · HANC · PETRAM · AEDIFICABO · ECCLESIAM · MEAM · ET · TIBI · DABO · CLAVES · REGNI · CAELORVM  ';
  const tw = ctx.measureText(insc).width;
  for (let x = 0; x < W + tw; x += tw) ctx.fillText(insc, x, inscY + inscH / 2);

  // Angel / cherub row (61% – 76%)
  for (let i = 0; i < RIBS; i++) {
    domeDrawAngel(ctx, (i + 0.5) * secW, H * 0.615, secW * 0.55, H * 0.13);
  }

  // Arched windows arcade (76% – 88%)
  for (let i = 0; i < RIBS; i++) {
    domeDrawArch(ctx, (i + 0.5) * secW, H * 0.762, secW * 0.62, H * 0.10);
  }

  // Bottom cornice strip (88% – 100%)
  const cg = ctx.createLinearGradient(0, H * 0.88, 0, H);
  cg.addColorStop(0, '#1e2d6a');
  cg.addColorStop(0.4, '#2a3d88');
  cg.addColorStop(1, '#0e1848');
  ctx.fillStyle = cg;
  ctx.fillRect(0, H * 0.88, W, H * 0.12);
  for (let d = 0; d < 4; d++) {
    ctx.fillStyle = `rgba(215,175,72,${0.5 - d * 0.1})`;
    ctx.fillRect(0, H * 0.88 + d * H * 0.024, W, H * 0.004);
  }

  // Golden apex glow (composited on top)
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, H * 0.32);
  glow.addColorStop(0.00, 'rgba(255,248,188,0.95)');
  glow.addColorStop(0.12, 'rgba(235,195,80,0.75)');
  glow.addColorStop(0.32, 'rgba(180,140,40,0.28)');
  glow.addColorStop(0.60, 'rgba(20,50,130,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H * 0.36);

  // Mosaic tesserae grid (very subtle)
  ctx.globalAlpha = 0.024;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.5;
  for (let x = 0; x < W; x += 9) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 9) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.userData.shared = true;
  return tex;
}

function domeDrawApostle(ctx, cx, topY, figW, figH) {
  const headR = figW * 0.135;
  const headCY = topY + headR * 1.5;

  // Halo
  ctx.beginPath();
  ctx.arc(cx, headCY, headR * 1.68, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(245,210,95,0.88)';
  ctx.lineWidth = figW * 0.042;
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.ellipse(cx, headCY, headR, headR * 1.08, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(245,215,145,0.92)';
  ctx.fill();

  // Outer robe
  const bodyTop = headCY + headR * 1.08;
  const bodyBot = topY + figH;
  ctx.beginPath();
  ctx.moveTo(cx - figW * 0.14, bodyTop);
  ctx.lineTo(cx - figW * 0.40, bodyBot);
  ctx.lineTo(cx + figW * 0.40, bodyBot);
  ctx.lineTo(cx + figW * 0.14, bodyTop);
  ctx.closePath();
  ctx.fillStyle = 'rgba(228,192,108,0.78)';
  ctx.fill();

  // Inner robe highlight
  ctx.beginPath();
  ctx.moveTo(cx - figW * 0.06, bodyTop);
  ctx.lineTo(cx - figW * 0.20, bodyBot);
  ctx.lineTo(cx + figW * 0.20, bodyBot);
  ctx.lineTo(cx + figW * 0.06, bodyTop);
  ctx.closePath();
  ctx.fillStyle = 'rgba(248,220,148,0.40)';
  ctx.fill();

  // Left arm holding scroll
  ctx.beginPath();
  ctx.moveTo(cx - figW * 0.11, bodyTop + figH * 0.10);
  ctx.lineTo(cx - figW * 0.38, bodyTop + figH * 0.32);
  ctx.lineTo(cx - figW * 0.22, bodyTop + figH * 0.36);
  ctx.lineTo(cx - figW * 0.05, bodyTop + figH * 0.14);
  ctx.closePath();
  ctx.fillStyle = 'rgba(228,192,108,0.68)';
  ctx.fill();

  // Scroll
  ctx.fillStyle = 'rgba(248,220,148,0.82)';
  ctx.fillRect(cx - figW * 0.41, bodyTop + figH * 0.28, figW * 0.17, figH * 0.11);
}

function domeDrawAngel(ctx, cx, topY, figW, figH) {
  const headR = figW * 0.15;
  const headCY = topY + headR * 1.4;

  // Halo
  ctx.beginPath();
  ctx.arc(cx, headCY, headR * 1.62, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(245,210,95,0.90)';
  ctx.lineWidth = figW * 0.045;
  ctx.stroke();

  // Head (rounder, cherubic)
  ctx.beginPath();
  ctx.arc(cx, headCY, headR * 1.04, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(245,215,145,0.93)';
  ctx.fill();

  // Wings
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx, headCY + headR * 0.5);
    ctx.quadraticCurveTo(cx + dir * figW * 0.56, headCY - headR * 0.4, cx + dir * figW * 0.52, headCY + figH * 0.32);
    ctx.quadraticCurveTo(cx + dir * figW * 0.30, headCY + figH * 0.42, cx, headCY + figH * 0.36);
    ctx.closePath();
    ctx.fillStyle = 'rgba(228,192,108,0.58)';
    ctx.fill();
    // Wing highlight
    ctx.beginPath();
    ctx.moveTo(cx, headCY + headR * 0.5);
    ctx.quadraticCurveTo(cx + dir * figW * 0.34, headCY - headR * 0.25, cx + dir * figW * 0.31, headCY + figH * 0.20);
    ctx.quadraticCurveTo(cx + dir * figW * 0.17, headCY + figH * 0.28, cx, headCY + figH * 0.28);
    ctx.closePath();
    ctx.fillStyle = 'rgba(248,220,148,0.28)';
    ctx.fill();
  }

  // Small torso
  ctx.beginPath();
  ctx.ellipse(cx, headCY + headR + figH * 0.14, figW * 0.14, figH * 0.12, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(228,192,108,0.72)';
  ctx.fill();
}

function domeDrawArch(ctx, cx, topY, archW, archH) {
  const archR = archW * 0.44;
  const baseY = topY + archH * 0.95;
  const sprY = topY + archH * 0.40;

  // Interior glow
  const ig = ctx.createRadialGradient(cx, sprY, 0, cx, sprY, archW * 0.52);
  ig.addColorStop(0,   'rgba(240,220,150,0.22)');
  ig.addColorStop(0.5, 'rgba(200,180,100,0.08)');
  ig.addColorStop(1,   'rgba(20,50,130,0)');

  ctx.beginPath();
  ctx.moveTo(cx - archW * 0.42, baseY);
  ctx.lineTo(cx - archW * 0.42, sprY);
  ctx.arc(cx, sprY, archW * 0.42, Math.PI, 0);
  ctx.lineTo(cx + archW * 0.42, baseY);
  ctx.closePath();
  ctx.fillStyle = ig;
  ctx.fill();
  ctx.strokeStyle = 'rgba(215,175,72,0.78)';
  ctx.lineWidth = archW * 0.034;
  ctx.stroke();

  // Keystone
  ctx.beginPath();
  ctx.moveTo(cx - archW * 0.055, topY + archH * 0.08);
  ctx.lineTo(cx + archW * 0.055, topY + archH * 0.08);
  ctx.lineTo(cx + archW * 0.038, topY + archH * 0.20);
  ctx.lineTo(cx - archW * 0.038, topY + archH * 0.20);
  ctx.closePath();
  ctx.fillStyle = 'rgba(215,175,72,0.82)';
  ctx.fill();
}

export function getDomeMaterial() {
  if (domeMatCached) return domeMatCached;
  domeMatCached = new THREE.MeshStandardMaterial({
    map: makeSanPietroDomeFrescoTexture(),
    side: THREE.DoubleSide,
    roughness: 0.82,
    metalness: 0.08,
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
