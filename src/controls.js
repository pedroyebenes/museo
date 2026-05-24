import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

const SPEED = 3.2; // m/s
const RUN_MULT = 1.8;
const EYE_HEIGHT = 1.6;
const PLAYER_RADIUS = 0.32;
const TOUCH_LOOK_SPEED = 0.003;
const TOUCH_STICK_RADIUS = 54;
const TOUCH_DEAD_ZONE = 0.12;

export function createControls({ camera, renderer, onLock, onUnlock }) {
  const controls = new PointerLockControls(camera, renderer.domElement);
  const isTouchDevice =
    window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

  let segments = []; // collision: axis-aligned wall segments
  let mobileActive = false;
  let mobileMoveX = 0;
  let mobileMoveZ = 0;
  let touchYaw = camera.rotation.y;
  let touchPitch = camera.rotation.x;
  let stickPointerId = null;
  let lookPointerId = null;
  let lastLookX = 0;
  let lastLookY = 0;
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
  const touchUi = createTouchUi();

  function update(dt) {
    if (!isActive()) return;

    let dx = mobileActive ? mobileMoveX : 0;
    let dz = mobileActive ? mobileMoveZ : 0;
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
      touchYaw = yaw;
      touchPitch = 0;
    }
  }

  function lockOnClick() {
    if (isTouchDevice) {
      startMobileControls();
      return;
    }
    controls.lock();
  }

  function isActive() {
    return controls.isLocked || mobileActive;
  }

  function startMobileControls() {
    if (mobileActive) return;
    mobileActive = true;
    touchYaw = camera.rotation.y;
    touchPitch = camera.rotation.x;
    touchUi.root.classList.remove('hidden');
    onLock && onLock();
  }

  function resetTouchState() {
    mobileMoveX = 0;
    mobileMoveZ = 0;
    stickPointerId = null;
    lookPointerId = null;
    touchUi.knob.style.transform = 'translate(-50%, -50%)';
  }

  function createTouchUi() {
    const root = document.createElement('div');
    root.id = 'touch-controls';
    root.className = 'hidden';
    root.innerHTML = `
      <div id="touch-look"></div>
      <div id="touch-stick" aria-label="Control de movimiento">
        <div id="touch-stick-knob"></div>
      </div>
    `;
    document.body.appendChild(root);

    const lookArea = root.querySelector('#touch-look');
    const stick = root.querySelector('#touch-stick');
    const knob = root.querySelector('#touch-stick-knob');

    const onStickPointerDown = (e) => {
      if (!mobileActive || stickPointerId !== null) return;
      stickPointerId = e.pointerId;
      stick.setPointerCapture(e.pointerId);
      updateStick(e);
    };
    const onStickPointerMove = (e) => {
      if (e.pointerId === stickPointerId) updateStick(e);
    };
    const onStickPointerEnd = (e) => {
      if (e.pointerId !== stickPointerId) return;
      stickPointerId = null;
      mobileMoveX = 0;
      mobileMoveZ = 0;
      knob.style.transform = 'translate(-50%, -50%)';
    };

    const onLookPointerDown = (e) => {
      if (!mobileActive || lookPointerId !== null) return;
      lookPointerId = e.pointerId;
      lastLookX = e.clientX;
      lastLookY = e.clientY;
      lookArea.setPointerCapture(e.pointerId);
    };
    const onLookPointerMove = (e) => {
      if (e.pointerId !== lookPointerId) return;
      const dx = e.clientX - lastLookX;
      const dy = e.clientY - lastLookY;
      lastLookX = e.clientX;
      lastLookY = e.clientY;
      touchYaw -= dx * TOUCH_LOOK_SPEED;
      touchPitch -= dy * TOUCH_LOOK_SPEED;
      touchPitch = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, touchPitch));
      camera.rotation.set(touchPitch, touchYaw, 0, 'YXZ');
    };
    const onLookPointerEnd = (e) => {
      if (e.pointerId === lookPointerId) lookPointerId = null;
    };

    stick.addEventListener('pointerdown', onStickPointerDown);
    stick.addEventListener('pointermove', onStickPointerMove);
    stick.addEventListener('pointerup', onStickPointerEnd);
    stick.addEventListener('pointercancel', onStickPointerEnd);
    lookArea.addEventListener('pointerdown', onLookPointerDown);
    lookArea.addEventListener('pointermove', onLookPointerMove);
    lookArea.addEventListener('pointerup', onLookPointerEnd);
    lookArea.addEventListener('pointercancel', onLookPointerEnd);

    function updateStick(e) {
      const rect = stick.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rawX = e.clientX - centerX;
      const rawY = e.clientY - centerY;
      const distance = Math.min(TOUCH_STICK_RADIUS, Math.hypot(rawX, rawY));
      const angle = Math.atan2(rawY, rawX);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const normalizedX = x / TOUCH_STICK_RADIUS;
      const normalizedY = y / TOUCH_STICK_RADIUS;

      mobileMoveX = Math.abs(normalizedX) > TOUCH_DEAD_ZONE ? normalizedX : 0;
      mobileMoveZ = Math.abs(normalizedY) > TOUCH_DEAD_ZONE ? -normalizedY : 0;
      knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    }

    function dispose() {
      stick.removeEventListener('pointerdown', onStickPointerDown);
      stick.removeEventListener('pointermove', onStickPointerMove);
      stick.removeEventListener('pointerup', onStickPointerEnd);
      stick.removeEventListener('pointercancel', onStickPointerEnd);
      lookArea.removeEventListener('pointerdown', onLookPointerDown);
      lookArea.removeEventListener('pointermove', onLookPointerMove);
      lookArea.removeEventListener('pointerup', onLookPointerEnd);
      lookArea.removeEventListener('pointercancel', onLookPointerEnd);
      root.remove();
    }

    return { root, knob, dispose };
  }

  function dispose() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    resetTouchState();
    touchUi.dispose();
    controls.dispose();
  }

  return {
    controls,
    update,
    isActive,
    setSegments,
    setPose,
    lockOnClick,
    dispose,
    PLAYER_RADIUS,
  };
}
