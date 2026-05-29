import * as THREE from 'three';
import { getQualityProfile } from './qualityProfile.js';

const loader = new THREE.TextureLoader();
loader.crossOrigin = 'anonymous';

// Painting textures are cached so revisiting a room is instant, but the cache is
// bounded so GPU memory doesn't grow without limit across a long session. Eviction
// is LRU among *unpinned* textures: a texture is pinned (refs > 0) while any cached
// room holds it (rooms retain on build, release on disposal — see roomManager.js).
// Map iteration order is insertion order; we re-insert on hit to keep LRU ordering.
const cache = new Map(); // url -> THREE.Texture (front = least-recently-used)
const pending = new Map();
const refs = new Map(); // url -> number of cached rooms referencing this texture

const MAX_TEXTURES = 80;
const RETRY_DELAY_MS = 600;

function touch(url) {
  if (!cache.has(url)) return;
  const tex = cache.get(url);
  cache.delete(url);
  cache.set(url, tex);
}

function evictIfNeeded() {
  if (cache.size <= MAX_TEXTURES) return;
  for (const [url, tex] of cache) {
    if (cache.size <= MAX_TEXTURES) break;
    if ((refs.get(url) || 0) > 0) continue; // pinned by a live room
    tex.dispose();
    cache.delete(url);
  }
}

// Pin / unpin a room's textures. Called by roomManager when an author room is cached
// (retain) and when it is evicted (release). Released textures stay in the LRU cache
// for reuse but become eligible for eviction once over the cap.
export function retainTextures(urls) {
  for (const url of urls) refs.set(url, (refs.get(url) || 0) + 1);
}

export function releaseTextures(urls) {
  for (const url of urls) {
    const n = (refs.get(url) || 0) - 1;
    if (n <= 0) refs.delete(url);
    else refs.set(url, n);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Load once, retry a single time after a short delay. Network blips and transient
// 429s from Wikimedia are common; one retry recovers many of them without masking
// a genuinely dead URL (which still rejects and triggers the painting placeholder).
async function loadWithRetry(url) {
  try {
    return await loader.loadAsync(url);
  } catch (err) {
    await sleep(RETRY_DELAY_MS);
    return loader.loadAsync(url);
  }
}

function resizeImage(image, maxSize) {
  const { width, height } = image;
  const longSide = Math.max(width, height);
  if (longSide <= maxSize) return image;

  const scale = maxSize / longSide;
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, w, h);
  return canvas;
}

function configureTexture(texture, renderer) {
  const quality = getQualityProfile();
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  if (renderer) {
    texture.anisotropy = Math.min(
      quality.anisotropy,
      renderer.capabilities.getMaxAnisotropy(),
    );
  } else {
    texture.anisotropy = quality.anisotropy;
  }
  texture.userData.shared = true;
  return texture;
}

export async function loadPaintingTexture(url, renderer = null) {
  if (cache.has(url)) {
    touch(url);
    return cache.get(url);
  }

  if (pending.has(url)) return pending.get(url);

  const promise = (async () => {
    const raw = await loadWithRetry(url);
    const { maxTextureSize } = getQualityProfile();
    const source = raw.image;
    const resized = resizeImage(source, maxTextureSize);

    let texture;
    if (resized === source) {
      texture = raw;
    } else {
      raw.dispose();
      texture = new THREE.CanvasTexture(resized);
    }

    configureTexture(texture, renderer);
    cache.set(url, texture);
    pending.delete(url);
    evictIfNeeded();
    return texture;
  })().catch((err) => {
    pending.delete(url);
    throw err;
  });

  pending.set(url, promise);
  return promise;
}

export function getCachedTexture(url) {
  return cache.get(url) ?? null;
}
