import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

const SPEED = 3.2; // m/s
const RUN_MULT = 1.8;
const EYE_HEIGHT = 1.6;
const PLAYER_RADIUS = 0.32;

export function createControls({ camera, renderer, onLock, onUnlock }) {
  const controls = new PointerLockControls(camera, renderer.domElement);

  let segments = []; // collision: axis-aligned wall segments
  const keys = {
    forward: false,
    back: false,
    left: false,
    right: false,
    run: false,
  };

  const onKeyDown = (e) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keys.back = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keys.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        keys.run = true;
        break;
    }
  };
  const onKeyUp = (e) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        keys.back = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        keys.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        keys.run = false;
        break;
    }
  };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  controls.addEventListener('lock', () => onLock && onLock());
  controls.addEventListener('unlock', () => onUnlock && onUnlock());

  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const move = new THREE.Vector3();
  const tmp = new THREE.Vector3();

  function update(dt) {
    if (!controls.isLocked) return;

    let dx = 0,
      dz = 0;
    if (keys.forward) dz += 1;
    if (keys.back) dz -= 1;
    if (keys.right) dx += 1;
    if (keys.left) dx -= 1;
    if (dx !== 0 || dz !== 0) {
      const len = Math.hypot(dx, dz);
      dx /= len;
      dz /= len;

      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      right.copy(forward).cross(camera.up).normalize();

      const speed = SPEED * (keys.run ? RUN_MULT : 1) * dt;
      move.set(0, 0, 0);
      move.addScaledVector(forward, dz * speed);
      move.addScaledVector(right, dx * speed);

      // Two-pass collision resolution: move in X, resolve; then Z, resolve.
      // This produces wall-sliding behaviour.
      camera.position.x += move.x;
      resolveCollisions(camera.position);
      camera.position.z += move.z;
      resolveCollisions(camera.position);
    }
    camera.position.y = EYE_HEIGHT;
  }

  function resolveCollisions(pos) {
    for (let pass = 0; pass < 2; pass++) {
      let moved = false;
      for (const s of segments) {
        const dx = s.bx - s.ax;
        const dz = s.bz - s.az;
        const lenSq = dx * dx + dz * dz;
        if (lenSq < 1e-8) continue;
        let t = ((pos.x - s.ax) * dx + (pos.z - s.az) * dz) / lenSq;
        if (t < 0) t = 0;
        else if (t > 1) t = 1;
        const cx = s.ax + t * dx;
        const cz = s.az + t * dz;
        const ddx = pos.x - cx;
        const ddz = pos.z - cz;
        const dist = Math.hypot(ddx, ddz);
        if (dist < PLAYER_RADIUS && dist > 1e-6) {
          const push = (PLAYER_RADIUS - dist) / dist;
          pos.x += ddx * push;
          pos.z += ddz * push;
          moved = true;
        }
      }
      if (!moved) break;
    }
  }

  function setSegments(newSegments) {
    segments = newSegments;
  }

  function setPose({ position, yaw }) {
    camera.position.copy(position);
    if (typeof yaw === 'number') {
      // PointerLockControls reads camera.rotation directly.
      camera.rotation.set(0, yaw, 0, 'YXZ');
    }
  }

  function lockOnClick() {
    controls.lock();
  }

  function dispose() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    controls.dispose();
  }

  return {
    controls,
    update,
    setSegments,
    setPose,
    lockOnClick,
    dispose,
    PLAYER_RADIUS,
  };
}
