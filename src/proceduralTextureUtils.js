import * as THREE from 'three';
import { getQualityProfile } from './qualityProfile.js';

export function hashString(value) {
  value = String(value);
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

let materialRenderer = null;

export function initMaterialRenderer(renderer) {
  materialRenderer = renderer;
}

export function getMaterialRenderer() {
  return materialRenderer;
}

export function createSeededRandom(seed) {
  let state = typeof seed === 'string' ? hashString(seed) : seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function createTileableNoise2D(periodX, periodY, seed) {
  const rand = createSeededRandom(seed);
  const gridW = periodX + 1;
  const gridH = periodY + 1;
  const grid = new Float32Array(gridW * gridH);
  for (let i = 0; i < grid.length; i++) grid[i] = rand();

  function sampleGrid(gx, gy) {
    const x = ((gx % periodX) + periodX) % periodX;
    const y = ((gy % periodY) + periodY) % periodY;
    return grid[y * gridW + x];
  }

  return (x, y) => {
    const fx = x - Math.floor(x);
    const fy = y - Math.floor(y);
    const ix = Math.floor(x);
    const iy = Math.floor(y);

    const v00 = sampleGrid(ix, iy);
    const v10 = sampleGrid(ix + 1, iy);
    const v01 = sampleGrid(ix, iy + 1);
    const v11 = sampleGrid(ix + 1, iy + 1);

    const sx = smoothstep(fx);
    const sy = smoothstep(fy);
    const top = lerp(v00, v10, sx);
    const bottom = lerp(v01, v11, sx);
    return lerp(top, bottom, sy);
  };
}

export function fbmNoise2D(noise, x, y, octaves = 4, lacunarity = 2, gain = 0.5) {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let total = 0;
  for (let i = 0; i < octaves; i++) {
    value += noise(x * frequency, y * frequency) * amplitude;
    total += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  return value / total;
}

export function configureCanvasTexture(texture, renderer = materialRenderer, options = {}) {
  const quality = getQualityProfile();
  const {
    wrapS = THREE.RepeatWrapping,
    wrapT = THREE.RepeatWrapping,
    repeat = null,
    generateMipmaps = true,
  } = options;

  texture.wrapS = wrapS;
  texture.wrapT = wrapT;
  if (repeat) texture.repeat.set(repeat[0], repeat[1]);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = generateMipmaps;
  texture.minFilter = generateMipmaps
    ? THREE.LinearMipmapLinearFilter
    : THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const maxAniso = renderer?.capabilities?.getMaxAnisotropy?.() ?? quality.anisotropy;
  texture.anisotropy = Math.min(quality.anisotropy, maxAniso);
  texture.userData.shared = true;
  return texture;
}

export function createHeightBuffer(width, height, fill = 0.5) {
  return new Float32Array(width * height).fill(fill);
}

export function sampleHeight(heightBuf, width, height, x, y, wrapX, wrapY) {
  let px = Math.round(x);
  let py = Math.round(y);
  if (wrapX) px = ((px % width) + width) % width;
  else px = Math.max(0, Math.min(width - 1, px));
  if (wrapY) py = ((py % height) + height) % height;
  else py = Math.max(0, Math.min(height - 1, py));
  return heightBuf[py * width + px];
}

export function heightBufferToNormalTexture(heightBuf, width, height, { strength = 2, wrapX = true, wrapY = true } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(width, height);
  const d = img.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const hL = sampleHeight(heightBuf, width, height, x - 1, y, wrapX, wrapY);
      const hR = sampleHeight(heightBuf, width, height, x + 1, y, wrapX, wrapY);
      const hD = sampleHeight(heightBuf, width, height, x, y - 1, wrapX, wrapY);
      const hU = sampleHeight(heightBuf, width, height, x, y + 1, wrapX, wrapY);

      let nx = (hL - hR) * strength;
      let ny = (hD - hU) * strength;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;

      const i = (y * width + x) * 4;
      d[i] = Math.round((nx * 0.5 + 0.5) * 255);
      d[i + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      d[i + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      d[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  configureCanvasTexture(tex, materialRenderer, { generateMipmaps: true });
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}
