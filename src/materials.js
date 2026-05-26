import * as THREE from 'three';
import { getQualityProfile } from './qualityProfile.js';
import {
  configureCanvasTexture,
  createHeightBuffer,
  createSeededRandom,
  createTileableNoise2D,
  fbmNoise2D,
  hashString,
  heightBufferToNormalTexture,
} from './proceduralTextureUtils.js';

export { hashString };

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
  const hue = hashHue(author);
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
    authorHue: hue,
    artistDomeMat: makeArtistDomeMaterial(hue),
  };
}

export function getCategoryRoomMaterials(category) {
  const base = getHubMaterials();
  const hue = hashHue(category);
  const accentColor = new THREE.Color().setHSL(hue / 360, 0.62, 0.68);
  const lightColor = new THREE.Color().setHSL(hue / 360, 0.7, 0.78);
  const wallMat = base.wallMat.clone();
  wallMat.color = new THREE.Color().setHSL(hue / 360, 0.08, 0.94);

  const wainscotMat = base.wainscotMat.clone();
  wainscotMat.color = new THREE.Color().setHSL(hue / 360, 0.07, 0.86);

  const trimMat = base.trimMat.clone();
  trimMat.color = new THREE.Color().setHSL(((hue + 28) % 360) / 360, 0.42, 0.6);

  const domeMat = getPantheonDomeMaterial(hue);

  return {
    ...base,
    wallMat,
    wainscotMat,
    trimMat,
    domeMat,
    oculusColor: lightColor,
    oculusEmissive: lightColor,
    skylightColor: lightColor,
    chandelierLightColor: lightColor,
    chandelierBulbColor: lightColor,
    medallionColor: accentColor,
    titleColor: accentColor,
  };
}

export function getReadableHashTextColor(value, background = '#0e0a06') {
  const hue = hashHue(value);
  let color = new THREE.Color().setHSL(hue / 360, 0.62, 0.72);
  while (contrastRatio(color, new THREE.Color(background)) < 4.5) {
    const hsl = {};
    color.getHSL(hsl);
    if (hsl.l >= 0.9) break;
    color = new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l + 0.04);
  }
  return `#${color.getHexString()}`;
}

function hashHue(value) {
  return hashString(value) % 360;
}

function contrastRatio(a, b) {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const light = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (light + 0.05) / (dark + 0.05);
}

function relativeLuminance(color) {
  const channels = [color.r, color.g, color.b].map((value) => {
    if (value <= 0.03928) return value / 12.92;
    return ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function build() {
  const quality = getQualityProfile();
  const { floorTex, floorNormal } = makeParquetTexture(quality);
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.78,
    metalness: 0.06,
  });
  if (floorNormal) {
    floorMat.normalMap = floorNormal;
    floorMat.normalScale.set(0.2, 0.2);
  }
  floorMat.userData.shared = true;

  const { colorTex: wallTex, normalTex: wallNormal } = makePlasterWallTexture(quality);
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: 0.92,
    metalness: 0.02,
  });
  if (wallNormal) {
    wallMat.normalMap = wallNormal;
    wallMat.normalScale.set(0.55, 0.55);
  }
  wallMat.userData.shared = true;

  const { colorTex: wainscotTex, normalTex: wainscotNormal } = makeWainscotTexture(quality);
  const wainscotMat = new THREE.MeshStandardMaterial({
    map: wainscotTex,
    roughness: 0.48,
    metalness: 0.12,
  });
  if (wainscotNormal) {
    wainscotMat.normalMap = wainscotNormal;
    wainscotMat.normalScale.set(0.85, 0.85);
  }
  wainscotMat.userData.shared = true;

  const ceilTex = makeCofferedCeilingTexture(quality);
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
  const quality = getQualityProfile();
  const base = build();
  const hubFloorTex = makeMarbleFloorTexture(quality);
  const floorMat = new THREE.MeshStandardMaterial({
    map: hubFloorTex,
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

function makeMarbleFloorTexture(quality = getQualityProfile()) {
  const size = quality.architectureTextureSize.hubMarble;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const cx = c.width / 2;
  const cy = c.height / 2;
  const scale = size / 1024;

  const bg = ctx.createRadialGradient(cx, cy, 40 * scale, cx, cy, 520 * scale);
  bg.addColorStop(0, '#f7efe0');
  bg.addColorStop(0.55, '#ead9bc');
  bg.addColorStop(1, '#ccb892');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);

  const veinNoise = createTileableNoise2D(64, 64, 'hub-marble-vein');
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const n = fbmNoise2D(veinNoise, x / (48 * scale), y / (48 * scale), 3, 2, 0.55);
      const vein = Math.sin((x * 0.018 + y * 0.011 + n * 4) * Math.PI) * 0.5 + 0.5;
      const tint = (n - 0.5) * 14 + (vein - 0.5) * 18;
      const i = (y * c.width + x) * 4;
      d[i] = Math.max(0, Math.min(255, d[i] + tint * 0.6));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + tint * 0.5));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + tint * 0.35));
    }
  }
  ctx.putImageData(img, 0, 0);

  ctx.strokeStyle = 'rgba(199,160,96,0.28)';
  ctx.lineWidth = 2.5 * scale;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * 500 * scale, cy + Math.sin(a) * 500 * scale);
    ctx.stroke();
  }

  for (let r = 120 * scale; r <= 460 * scale; r += 80 * scale) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  const tex = configureCanvasTexture(new THREE.CanvasTexture(c), null, {
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
  });
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

  const tex = configureCanvasTexture(new THREE.CanvasTexture(c), null, {
    generateMipmaps: true,
  });
  tex.repeat.set(-1, 1);
  tex.offset.set(1, 0);
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

function makeParquetTexture(quality = getQualityProfile()) {
  const size = quality.architectureTextureSize.floor;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const rand = createSeededRandom('parquet');
  const scale = size / 2048;

  const PLANK_H = Math.round(56 * scale);
  const palette = ['#7a5230', '#82542f', '#6a4220', '#7d4f2a', '#85583a', '#704a26'];
  const heightBuf = quality.enableNormalMaps ? createHeightBuffer(size, size, 0.5) : null;

  let y = 0;
  let rowOffset = 0;
  while (y < c.height) {
    let x = -rowOffset;
    while (x < c.width) {
      const w = Math.round((180 + rand() * 220) * scale);
      const color = palette[Math.floor(rand() * palette.length)];
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, PLANK_H);

      const grainCount = Math.round(8 * scale);
      ctx.strokeStyle = 'rgba(0,0,0,0.045)';
      ctx.lineWidth = 1;
      for (let g = 0; g < grainCount; g++) {
        const gy = y + 8 * scale + rand() * (PLANK_H - 16 * scale);
        ctx.beginPath();
        ctx.moveTo(x + 4 * scale, gy);
        ctx.lineTo(x + w - 4 * scale, gy);
        ctx.stroke();
        if (heightBuf) {
          const hx = Math.min(c.width - 1, Math.max(0, Math.round(x + w * 0.5)));
          const hy = Math.min(c.height - 1, Math.max(0, Math.round(gy)));
          heightBuf[hy * size + hx] = Math.min(1, heightBuf[hy * size + hx] + 0.015);
        }
      }

      ctx.strokeStyle = 'rgba(255,240,210,0.04)';
      for (let g = 0; g < 4; g++) {
        const gy = y + 10 * scale + rand() * (PLANK_H - 20 * scale);
        ctx.beginPath();
        ctx.moveTo(x + 4 * scale, gy);
        ctx.lineTo(x + w - 4 * scale, gy);
        ctx.stroke();
      }

      const bevel = Math.max(1, Math.round(2 * scale));
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(x, y + PLANK_H - bevel, w, bevel);
      ctx.fillStyle = 'rgba(255,245,220,0.06)';
      ctx.fillRect(x, y, w, bevel);

      ctx.strokeStyle = 'rgba(0,0,0,0.14)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, PLANK_H - 1);

      if (heightBuf) {
        for (let py = y; py < y + PLANK_H && py < size; py++) {
          for (let px = Math.max(0, x); px < x + w && px < size; px++) {
            const edgeDist = Math.min(px - x, x + w - px, py - y, y + PLANK_H - py);
            const bump = edgeDist < bevel * 2 ? -0.025 : 0.008 + rand() * 0.004;
            heightBuf[py * size + px] = Math.max(0, Math.min(1, 0.5 + bump));
          }
        }
      }

      x += w;
    }
    y += PLANK_H;
    rowOffset = Math.round((rowOffset + 140 * scale) % (400 * scale));
  }

  const floorTex = configureCanvasTexture(new THREE.CanvasTexture(c), null, {
    repeat: [4, 4],
  });
  const floorNormal = quality.enableNormalMaps
    ? heightBufferToNormalTexture(heightBuf, size, size, { strength: 3.5, wrapX: true, wrapY: true })
    : null;
  if (floorNormal) {
    floorNormal.wrapS = floorNormal.wrapT = THREE.RepeatWrapping;
    floorNormal.repeat.set(4, 4);
  }
  return { floorTex, floorNormal };
}

function makePlasterWallTexture(quality = getQualityProfile()) {
  const size = quality.architectureTextureSize.wall;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const noise = createTileableNoise2D(size, size, 'plaster-wall');
  const heightBuf = quality.enableNormalMaps ? createHeightBuffer(size, size, 0.5) : null;

  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const vGrad = y / size;
      const baseR = 248 - vGrad * 8;
      const baseG = 245 - vGrad * 9;
      const baseB = 238 - vGrad * 12;

      const n = fbmNoise2D(noise, x / 32, y / 32, 4, 2, 0.5);
      const micro = fbmNoise2D(noise, x / 6, y / 6, 2, 2, 0.45);
      const grain = fbmNoise2D(noise, x / 2.2, y / 2.2, 2, 2, 0.4);
      const band = Math.sin((y / size) * Math.PI * 8) * 0.015;
      const variation = (n - 0.5) * 12 + (micro - 0.5) * 6 + (grain - 0.5) * 3 + band * 255;

      const i = (y * size + x) * 4;
      d[i] = Math.max(0, Math.min(255, baseR + variation));
      d[i + 1] = Math.max(0, Math.min(255, baseG + variation));
      d[i + 2] = Math.max(0, Math.min(255, baseB + variation * 0.9));
      d[i + 3] = 255;

      if (heightBuf) {
        heightBuf[y * size + x] = 0.5 + (n - 0.5) * 0.08 + (micro - 0.5) * 0.04 + (grain - 0.5) * 0.02;
      }
    }
  }
  ctx.putImageData(img, 0, 0);

  for (let y = 0; y < size; y += Math.round(size / 8)) {
    const g = ctx.createLinearGradient(0, y, 0, y + size / 10);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, y, size, size / 10);
  }

  const colorTex = configureCanvasTexture(new THREE.CanvasTexture(c));
  const normalTex = quality.enableNormalMaps
    ? heightBufferToNormalTexture(heightBuf, size, size, { strength: 2.5, wrapX: true, wrapY: true })
    : null;
  return { colorTex, normalTex };
}

function makeWainscotTexture(quality = getQualityProfile()) {
  const width = quality.architectureTextureSize.wainscotW;
  const height = quality.architectureTextureSize.wainscotH;
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  const colorNoise = createTileableNoise2D(width, height, 'wainscot-marble');
  const turbNoise = createTileableNoise2D(width, height, 'wainscot-turb');
  const heightBuf = quality.enableNormalMaps ? createHeightBuffer(width, height, 0.5) : null;

  const img = ctx.createImageData(width, height);
  const d = img.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const vGrad = y / height;
      const baseR = 238 - vGrad * 18;
      const baseG = 228 - vGrad * 20;
      const baseB = 210 - vGrad * 22;

      // Base color variation (coarse Perlin)
      const cn = fbmNoise2D(colorNoise, x / 40, y / 24, 3, 2, 0.5);
      const colorVar = (cn - 0.5) * 18;

      // Perlin marble turbulence: sum of |noise| at multiple scales
      const turbLow = Math.abs(fbmNoise2D(turbNoise, x / 80, y / 80, 3, 2.1, 0.52) * 2 - 1);
      const turbHigh = Math.abs(fbmNoise2D(turbNoise, x / 22, y / 22, 2, 2, 0.48) * 2 - 1);
      const turb = turbLow * 3.4 + turbHigh * 0.9;

      // Marble veins: sine of position + turbulence → natural curved bands
      const veinRaw = Math.sin((x / width * 4.5 + turb) * Math.PI);
      // Normalize to [0, 1]: 0 = vein core (dark), 1 = marble body
      const veinSharp = veinRaw * 0.5 + 0.5;
      // Sharpen transition for thinner veins
      const veinFactor = Math.pow(veinSharp, 0.45);

      // Darken at vein core, subtle bright edge
      const veinDark = (1 - veinFactor) * 30;
      const veinEdge = veinFactor > 0.65 ? (veinFactor - 0.65) / 0.35 * 7 : 0;

      const i = (y * width + x) * 4;
      d[i]     = Math.max(0, Math.min(255, baseR + colorVar - veinDark * 0.9 + veinEdge));
      d[i + 1] = Math.max(0, Math.min(255, baseG + colorVar - veinDark + veinEdge));
      d[i + 2] = Math.max(0, Math.min(255, baseB + colorVar * 0.85 - veinDark * 0.65 + veinEdge * 0.8));
      d[i + 3] = 255;
      if (heightBuf) {
        heightBuf[y * width + x] = 0.5 + (cn - 0.5) * 0.05 - (1 - veinFactor) * 0.05;
      }
    }
  }
  ctx.putImageData(img, 0, 0);

  for (let i = 1; i < 4; i++) {
    const x = (i * width) / 4;
    const dividerW = Math.max(4, Math.round(width / 128));
    const g = ctx.createLinearGradient(x - dividerW, 0, x + dividerW, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, 'rgba(0,0,0,0.10)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - dividerW, 0, dividerW * 2, height);
    ctx.strokeStyle = 'rgba(199,160,96,0.28)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x, height * 0.04);
    ctx.lineTo(x, height * 0.96);
    ctx.stroke();
    if (heightBuf) {
      for (let py = 0; py < height; py++) {
        for (let dx = -dividerW; dx <= dividerW; dx++) {
          const px = x + dx;
          if (px < 0 || px >= width) continue;
          heightBuf[py * width + Math.round(px)] = 0.42;
        }
      }
    }
  }

  const colorTex = configureCanvasTexture(new THREE.CanvasTexture(c), null, {
    wrapS: THREE.RepeatWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
  });
  const normalTex = quality.enableNormalMaps
    ? heightBufferToNormalTexture(heightBuf, width, height, { strength: 3, wrapX: true, wrapY: false })
    : null;
  if (normalTex) {
    normalTex.wrapS = THREE.RepeatWrapping;
    normalTex.wrapT = THREE.ClampToEdgeWrapping;
  }
  return { colorTex, normalTex };
}

let pantheonDomeTexCached = null;

function getPantheonDomeTex() {
  if (!pantheonDomeTexCached) {
    pantheonDomeTexCached = makePantheonDomeTexture();
    pantheonDomeTexCached.userData.shared = true;
  }
  return pantheonDomeTexCached;
}

function getPantheonDomeMaterial(hue) {
  const mat = new THREE.MeshStandardMaterial({
    map: getPantheonDomeTex(),
    side: THREE.DoubleSide,
    roughness: 0.88,
    metalness: 0.04,
    color: new THREE.Color().setHSL(hue / 360, 0.12, 0.94),
  });
  mat.userData.shared = false;
  return mat;
}

function makePantheonDomeTexture() {
  const W = 2048;
  const H = 1024;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  // Base: warm travertine limestone
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0.0,  '#fff8e8');
  bg.addColorStop(0.08, '#ecdbb8');
  bg.addColorStop(0.55, '#d8c4a0');
  bg.addColorStop(0.85, '#c4ae88');
  bg.addColorStop(1.0,  '#b09870');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Stone grain
  const stoneNoise = createTileableNoise2D(64, 32, 'pantheon-stone');
  const stoneImg = ctx.getImageData(0, 0, W, H);
  const sd = stoneImg.data;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const n = fbmNoise2D(stoneNoise, x / 60, y / 60, 3, 2, 0.5);
      const grain = (n - 0.5) * 14;
      const i = (y * W + x) * 4;
      sd[i]     = Math.max(0, Math.min(255, sd[i]     + grain));
      sd[i + 1] = Math.max(0, Math.min(255, sd[i + 1] + grain * 0.9));
      sd[i + 2] = Math.max(0, Math.min(255, sd[i + 2] + grain * 0.7));
    }
  }
  ctx.putImageData(stoneImg, 0, 0);

  // Coffered grid: 5 rings × 28 columns
  const COLS = 28;
  const ROWS = 5;
  const startY = H * 0.09;
  const endY   = H * 0.80;
  const cofferW = W / COLS;
  const cofferH = (endY - startY) / ROWS;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cx = col * cofferW;
      const cy = startY + row * cofferH;

      const bfX = cofferW * 0.11;
      const bfY = cofferH * 0.11;

      // Shadow border
      const shadowG = ctx.createLinearGradient(cx, cy, cx + cofferW, cy + cofferH);
      shadowG.addColorStop(0, 'rgba(0,0,0,0.18)');
      shadowG.addColorStop(0.5, 'rgba(0,0,0,0.07)');
      shadowG.addColorStop(1, 'rgba(0,0,0,0.18)');
      ctx.fillStyle = shadowG;
      ctx.fillRect(cx + bfX * 0.3, cy + bfY * 0.3, cofferW - bfX * 0.6, cofferH - bfY * 0.6);

      // Inner panel (lighter)
      const innerG = ctx.createLinearGradient(cx, cy, cx, cy + cofferH);
      innerG.addColorStop(0, 'rgba(0,0,0,0.10)');
      innerG.addColorStop(0.5, 'rgba(255,255,255,0.03)');
      innerG.addColorStop(1, 'rgba(255,255,255,0.07)');
      ctx.fillStyle = innerG;
      ctx.fillRect(cx + bfX, cy + bfY, cofferW - bfX * 2, cofferH - bfY * 2);

      // Gold rosette
      const rx = cx + cofferW / 2;
      const ry = cy + cofferH / 2;
      const rRad = Math.min(cofferW, cofferH) * 0.075;

      ctx.beginPath();
      ctx.arc(rx, ry, rRad * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(140,110,50,0.28)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(rx, ry, rRad, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(188,148,65,0.82)';
      ctx.fill();

      // 8 petal rings
      ctx.strokeStyle = 'rgba(212,172,78,0.6)';
      ctx.lineWidth = Math.max(0.4, rRad * 0.32);
      for (let p = 0; p < 8; p++) {
        const angle = (p / 8) * Math.PI * 2;
        const px = rx + Math.cos(angle) * rRad * 2.3;
        const py = ry + Math.sin(angle) * rRad * 2.3;
        ctx.beginPath();
        ctx.arc(px, py, rRad * 0.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // Base cornice strip
  const corniceY = H * 0.80;
  ctx.fillStyle = 'rgba(148,118,72,0.65)';
  ctx.fillRect(0, corniceY, W, H * 0.045);
  ctx.strokeStyle = 'rgba(200,165,88,0.82)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, corniceY); ctx.lineTo(W, corniceY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, corniceY + H * 0.045); ctx.lineTo(W, corniceY + H * 0.045); ctx.stroke();

  // Oculus glow at apex
  const oculusG = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, H * 0.11);
  oculusG.addColorStop(0.0, 'rgba(255,252,228,1.0)');
  oculusG.addColorStop(0.3, 'rgba(255,234,158,0.85)');
  oculusG.addColorStop(0.7, 'rgba(220,184,98,0.4)');
  oculusG.addColorStop(1.0, 'rgba(180,138,58,0)');
  ctx.fillStyle = oculusG;
  ctx.fillRect(0, 0, W, H * 0.13);

  const tex = configureCanvasTexture(new THREE.CanvasTexture(c), null, {
    generateMipmaps: true,
  });
  tex.repeat.set(-1, 1);
  tex.offset.set(1, 0);
  return tex;
}

let artistDomeTexCached = null;

function getArtistDomeTex() {
  if (!artistDomeTexCached) {
    artistDomeTexCached = makeArtistSkyTexture();
    artistDomeTexCached.userData.shared = true;
  }
  return artistDomeTexCached;
}

export function makeArtistDomeMaterial(hue = 0) {
  const mat = new THREE.MeshStandardMaterial({
    map: getArtistDomeTex(),
    side: THREE.DoubleSide,
    roughness: 0.90,
    metalness: 0.02,
    color: new THREE.Color().setHSL(hue / 360, 0.06, 0.97),
  });
  mat.userData.shared = false;
  return mat;
}

function makeArtistSkyTexture() {
  const W = 2048;
  const H = 1024;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  // Sky gradient: warm white at zenith → soft pale blue at base
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0.0,  '#fffef8');
  sky.addColorStop(0.12, '#f8f2e4');
  sky.addColorStop(0.38, '#edf2f8');
  sky.addColorStop(0.68, '#e4ecf5');
  sky.addColorStop(0.88, '#d8e2ec');
  sky.addColorStop(1.0,  '#c8d4e4');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Subtle cloud wisps
  const cloudNoise = createTileableNoise2D(64, 32, 'artist-sky-clouds');
  const cloudImg = ctx.getImageData(0, 0, W, H);
  const cd = cloudImg.data;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const vf = y / H;
      if (vf > 0.10 && vf < 0.75) {
        const fade = Math.sin(((vf - 0.10) / 0.65) * Math.PI);
        const n = fbmNoise2D(cloudNoise, x / 110, y / 55, 4, 2.1, 0.5);
        const cloud = Math.max(0, (n - 0.40) * 1.8) * fade;
        const i = (y * W + x) * 4;
        const w = cloud * 20;
        cd[i]     = Math.min(255, cd[i]     + w);
        cd[i + 1] = Math.min(255, cd[i + 1] + w);
        cd[i + 2] = Math.min(255, cd[i + 2] + w * 0.75);
      }
    }
  }
  ctx.putImageData(cloudImg, 0, 0);

  // Gold cornice band at base
  const corniceG = ctx.createLinearGradient(0, H * 0.80, 0, H);
  corniceG.addColorStop(0,   'rgba(200,165,78,0)');
  corniceG.addColorStop(0.4, 'rgba(188,148,62,0.55)');
  corniceG.addColorStop(1.0, 'rgba(158,122,48,0.75)');
  ctx.fillStyle = corniceG;
  ctx.fillRect(0, H * 0.80, W, H * 0.20);

  ctx.strokeStyle = 'rgba(212,175,82,0.88)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, H * 0.82); ctx.lineTo(W, H * 0.82); ctx.stroke();

  // Oculus glow
  const oculusG = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, H * 0.14);
  oculusG.addColorStop(0.0, 'rgba(255,252,238,1.0)');
  oculusG.addColorStop(0.25, 'rgba(255,248,222,0.75)');
  oculusG.addColorStop(0.65, 'rgba(230,235,245,0.35)');
  oculusG.addColorStop(1.0, 'rgba(200,215,235,0)');
  ctx.fillStyle = oculusG;
  ctx.fillRect(0, 0, W, H * 0.16);

  const tex = configureCanvasTexture(new THREE.CanvasTexture(c), null, {
    generateMipmaps: true,
  });
  tex.repeat.set(-1, 1);
  tex.offset.set(1, 0);
  return tex;
}

export function buildNeutralEnvMap(renderer) {
  const W = 512;
  const H = 256;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  // Warm gallery environment: skylight ceiling, neutral walls, warm floor
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0.0,  '#fff8f0');
  grad.addColorStop(0.30, '#f5ede0');
  grad.addColorStop(0.52, '#e8d8c4');
  grad.addColorStop(0.72, '#c8b89a');
  grad.addColorStop(1.0,  '#a09070');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const canvasTex = new THREE.CanvasTexture(c);
  canvasTex.mapping = THREE.EquirectangularReflectionMapping;
  canvasTex.colorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envMap = pmrem.fromEquirectangular(canvasTex).texture;
  pmrem.dispose();
  canvasTex.dispose();
  return envMap;
}

function makeCofferedCeilingTexture(quality = getQualityProfile()) {
  const size = quality.architectureTextureSize.ceiling;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const scale = size / 1024;

  ctx.fillStyle = '#f5f0e4';
  ctx.fillRect(0, 0, c.width, c.height);

  const STEP = Math.round(128 * scale);
  const beamW = Math.max(3, Math.round(4 * scale));

  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  for (let i = 0; i < c.width; i += STEP) {
    ctx.fillRect(i, 0, beamW, c.height);
    ctx.fillRect(0, i, c.width, beamW);
  }

  for (let i = beamW; i < c.width; i += STEP) {
    for (let j = beamW; j < c.height; j += STEP) {
      const w = STEP - beamW;
      const g = ctx.createLinearGradient(i, j, i, j + w);
      g.addColorStop(0, 'rgba(0,0,0,0.06)');
      g.addColorStop(0.45, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(255,240,210,0.04)');
      ctx.fillStyle = g;
      ctx.fillRect(i + beamW * 0.5, j + beamW * 0.5, w - beamW, w - beamW);

      ctx.strokeStyle = 'rgba(199,160,96,0.5)';
      ctx.lineWidth = Math.max(1, 1.5 * scale);
      const inset = Math.round(14 * scale);
      ctx.strokeRect(i + inset, j + inset, w - inset * 2, w - inset * 2);
    }
  }

  const tex = configureCanvasTexture(new THREE.CanvasTexture(c), null, {
    repeat: [3, 3],
  });
  return tex;
}
