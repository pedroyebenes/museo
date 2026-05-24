import * as THREE from 'three';
import { getQualityProfile } from './qualityProfile.js';

export function createScene() {
  const quality = getQualityProfile();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);
  scene.fog = new THREE.Fog(0x0a0a0a, 15, 60);

  const camera = new THREE.PerspectiveCamera(
    72,
    window.innerWidth / window.innerHeight,
    0.05,
    200,
  );
  camera.position.set(0, 1.6, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: quality.antialias,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.maxPixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  document.body.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xfff4e6, 0x222222, 0.55);
  scene.add(hemi);

  const ambient = new THREE.AmbientLight(0xffffff, 0.15);
  scene.add(ambient);

  return { scene, camera, renderer, quality };
}
