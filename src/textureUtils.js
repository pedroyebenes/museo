import * as THREE from 'three';
import { getQualityProfile } from './qualityProfile.js';

const loader = new THREE.TextureLoader();
loader.crossOrigin = 'anonymous';

const cache = new Map();
const pending = new Map();

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
  if (cache.has(url)) return cache.get(url);

  if (pending.has(url)) return pending.get(url);

  const promise = (async () => {
    const raw = await loader.loadAsync(url);
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
