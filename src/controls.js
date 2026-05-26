import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

const SPEED = 4.8; // m/s
const RUN_MULT = 1.8;
const EYE_HEIGHT = 1.6;
const PLAYER_RADIUS = 0.32;
const TOUCH_LOOK_SPEED = 0.0045;
const TOUCH_STICK_RADIUS = 68;
const TOUCH_DEAD_ZONE = 0.14;
const STICK_VISUAL_SIZE = 148;

const ICON_RUN = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.5 3.8 2.4 2.4V19h2v-7.2l-2.4-2.4 1.4-1.4L16 12l-4.6 4.6-1.4-1.4 2.4-2.4H5v-2h7z"/></svg>';
const ICON_INFO = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zm-1.25 4h2.5v7.5h-2.5V11z"/></svg>';
const ICON_REPORT = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2 1 21h22L12 2zm0 4.2 7.53 13.3H4.47L12 6.2zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>';

export function createControls({ camera, renderer, onLock, onUnlock, onToggleInfo, onReport }) {
  const controls = new PointerLockControls(camera, renderer.domElement);
  const isTouchDevice =
    window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

  let segments = [];
  let mobileActive = false;
  let mobileMoveX = 0;
  let mobileMoveZ = 0;
  let touchYaw = camera.rotation.y;
  let touchPitch = camera.rotation.x;
  let stickBaseX = 0;
  let stickBaseY = 0;
  let mobileRun = false;
  let suspended = false;
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
    if (suspended || !isActive()) return;

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

      const speed = SPEED * ((keys.run || mobileRun) ? RUN_MULT : 1) * dt;
      move.set(0, 0, 0);
      move.addScaledVector(forward, dz * speed);
      move.addScaledVector(right, dx * speed);

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
      camera.rotation.set(0, yaw, 0, 'YXZ');
      touchYaw = yaw;
      touchPitch = 0;
    }
  }

  function lockOnClick() {
    if (suspended) return;
    if (isTouchDevice) {
      startMobileControls();
      return;
    }
    controls.lock();
  }

  function suspend() {
    suspended = true;
    if (controls.isLocked) controls.unlock();
    if (mobileActive) {
      resetTouchState();
      mobileActive = false;
      touchUi.root.classList.add('hidden');
      document.removeEventListener('touchmove', preventTouchScroll);
    }
  }

  function resume() {
    suspended = false;
  }

  function unlock() {
    if (controls.isLocked) controls.unlock();
    if (mobileActive) suspend();
  }

  function isActive() {
    return !suspended && (controls.isLocked || mobileActive);
  }

  function startMobileControls() {
    if (mobileActive) return;
    mobileActive = true;
    document.body.classList.add('is-touch');
    touchYaw = camera.rotation.y;
    touchPitch = camera.rotation.x;
    touchUi.root.classList.remove('hidden');
    document.addEventListener('touchmove', preventTouchScroll, { passive: false });
    onLock && onLock();
  }

  function preventTouchScroll(e) {
    if (mobileActive) e.preventDefault();
  }

  function resetTouchState() {
    mobileMoveX = 0;
    mobileMoveZ = 0;
    stickPointerId = null;
    lookPointerId = null;
    touchUi.hideStick();
    touchUi.setRunActive(false);
  }

  function applyStickDeadZone(value) {
    const abs = Math.abs(value);
    if (abs <= TOUCH_DEAD_ZONE) return 0;
    return Math.sign(value) * ((abs - TOUCH_DEAD_ZONE) / (1 - TOUCH_DEAD_ZONE));
  }

  function createTouchUi() {
    const root = document.createElement('div');
    root.id = 'touch-controls';
    root.className = 'hidden';
    root.innerHTML = `
      <div id="touch-move-zone" aria-label="Zona de movimiento"></div>
      <div id="touch-look-zone" aria-label="Zona de cámara"></div>
      <div id="touch-stick" aria-hidden="true">
        <div id="touch-stick-knob"></div>
      </div>
      <button type="button" id="touch-report" class="touch-action-btn inactive" aria-label="Reportar error" aria-disabled="true">${ICON_REPORT}</button>
      <button type="button" id="touch-run" class="touch-action-btn" aria-label="Correr">${ICON_RUN}</button>
      <button type="button" id="touch-info" class="touch-action-btn" aria-label="Mostrar u ocultar ficha">${ICON_INFO}</button>
    `;
    document.body.appendChild(root);

    const moveZone = root.querySelector('#touch-move-zone');
    const lookZone = root.querySelector('#touch-look-zone');
    const stick = root.querySelector('#touch-stick');
    const knob = root.querySelector('#touch-stick-knob');
    const reportBtn = root.querySelector('#touch-report');
    const runBtn = root.querySelector('#touch-run');
    const infoBtn = root.querySelector('#touch-info');

    function showStickAt(x, y) {
      stick.style.left = `${x}px`;
      stick.style.top = `${y}px`;
      stick.classList.add('visible');
    }

    function hideStick() {
      stick.classList.remove('visible');
      knob.style.transform = 'translate(-50%, -50%)';
    }

    function setRunActive(active) {
      mobileRun = active;
      runBtn.classList.toggle('active', active);
    }

    function positionStickBase(clientX, clientY) {
      const half = STICK_VISUAL_SIZE / 2;
      const x = Math.min(
        window.innerWidth * 0.48 - half,
        Math.max(half + 8, clientX),
      );
      const y = Math.min(
        window.innerHeight - half - 8,
        Math.max(half + 8, clientY),
      );
      stickBaseX = x;
      stickBaseY = y;
      showStickAt(x, y);
    }

    function updateStickFromPointer(e) {
      const rawX = e.clientX - stickBaseX;
      const rawY = e.clientY - stickBaseY;
      const distance = Math.min(TOUCH_STICK_RADIUS, Math.hypot(rawX, rawY));
      const angle = Math.atan2(rawY, rawX);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      mobileMoveX = applyStickDeadZone(x / TOUCH_STICK_RADIUS);
      mobileMoveZ = applyStickDeadZone(-y / TOUCH_STICK_RADIUS);
      knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    }

    const onMovePointerDown = (e) => {
      if (!mobileActive || stickPointerId !== null) return;
      e.preventDefault();
      stickPointerId = e.pointerId;
      positionStickBase(e.clientX, e.clientY);
      moveZone.setPointerCapture(e.pointerId);
      updateStickFromPointer(e);
    };
    const onMovePointerMove = (e) => {
      if (e.pointerId !== stickPointerId) return;
      updateStickFromPointer(e);
    };
    const onMovePointerEnd = (e) => {
      if (e.pointerId !== stickPointerId) return;
      stickPointerId = null;
      mobileMoveX = 0;
      mobileMoveZ = 0;
      hideStick();
    };

    const onLookPointerDown = (e) => {
      if (!mobileActive || lookPointerId !== null) return;
      lookPointerId = e.pointerId;
      lastLookX = e.clientX;
      lastLookY = e.clientY;
      lookZone.setPointerCapture(e.pointerId);
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

    function setReportAvailable(available) {
      reportBtn.setAttribute('aria-disabled', available ? 'false' : 'true');
      reportBtn.classList.toggle('inactive', !available);
    }

    reportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onReport && onReport();
    });
    runBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setRunActive(!mobileRun);
    });
    infoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onToggleInfo && onToggleInfo();
    });
    reportBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    runBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    infoBtn.addEventListener('pointerdown', (e) => e.stopPropagation());

    moveZone.addEventListener('pointerdown', onMovePointerDown);
    moveZone.addEventListener('pointermove', onMovePointerMove);
    moveZone.addEventListener('pointerup', onMovePointerEnd);
    moveZone.addEventListener('pointercancel', onMovePointerEnd);
    lookZone.addEventListener('pointerdown', onLookPointerDown);
    lookZone.addEventListener('pointermove', onLookPointerMove);
    lookZone.addEventListener('pointerup', onLookPointerEnd);
    lookZone.addEventListener('pointercancel', onLookPointerEnd);

    function dispose() {
      document.removeEventListener('touchmove', preventTouchScroll);
      moveZone.removeEventListener('pointerdown', onMovePointerDown);
      moveZone.removeEventListener('pointermove', onMovePointerMove);
      moveZone.removeEventListener('pointerup', onMovePointerEnd);
      moveZone.removeEventListener('pointercancel', onMovePointerEnd);
      lookZone.removeEventListener('pointerdown', onLookPointerDown);
      lookZone.removeEventListener('pointermove', onLookPointerMove);
      lookZone.removeEventListener('pointerup', onLookPointerEnd);
      lookZone.removeEventListener('pointercancel', onLookPointerEnd);
      root.remove();
    }

    return { root, hideStick, setRunActive, setReportAvailable, dispose };
  }

  function dispose() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('touchmove', preventTouchScroll);
    resetTouchState();
    mobileActive = false;
    document.body.classList.remove('is-touch');
    touchUi.dispose();
    controls.dispose();
  }

  function setReportAvailable(available) {
    touchUi.setReportAvailable(available);
  }

  return {
    controls,
    update,
    isActive,
    setSegments,
    setPose,
    lockOnClick,
    suspend,
    resume,
    unlock,
    setReportAvailable,
    dispose,
    PLAYER_RADIUS,
  };
}
