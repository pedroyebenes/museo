import * as THREE from 'three';
import { buildRotundaShell } from './rotunda.js';
import {
  getCategoryRoomMaterials,
  getHubMaterials,
  getReadableHashTextColor,
} from './materials.js';

const HEIGHT = 5.5;
const RADIUS = 11;
const PLAYER_Y = 1.6;
const SPAWN_OFFSET = 3.0;

export function buildHub(scene, config) {
  const { id, title, items, colorKey } = normalizeConfig(config);
  const group = new THREE.Group();
  group.name = `room:${id}`;

  const layout = computeDoorLayout(items.length);
  const doors = layout.map((slot, i) => ({
    angle: slot.angle,
    label: items[i].label,
    arrow: items[i].arrow,
    signShape: items[i].signShape,
    textColor:
      items[i].textColor ||
      (items[i].colorKey ? getReadableHashTextColor(items[i].colorKey) : undefined),
    borderColor:
      items[i].borderColor ||
      (items[i].colorKey ? getReadableHashTextColor(items[i].colorKey) : undefined),
    destination: items[i].destination,
    doorInfo: items[i].doorInfo ?? null,
  }));

  const materials =
    id === 'hub'
      ? getHubMaterials()
      : getCategoryRoomMaterials(colorKey || title || id);

  const { segments, triggers, doorInteractables } = buildRotundaShell(group, {
    radius: RADIUS,
    height: HEIGHT,
    doors,
    materials,
  });

  addChandelier(group, RADIUS, materials);
  addCenterMedallion(group, materials);
  if (id === 'hub') addCentralGlobe(group);
  addHubTitle(group, title, materials);

  scene.add(group);

  const spawnFromItem = {};
  layout.forEach((slot, i) => {
    spawnFromItem[items[i].id] = computeDoorSpawn(slot);
  });

  return {
    group,
    slots: [],
    segments,
    triggers,
    doorInteractables,
    dimensions: { width: RADIUS * 2, depth: RADIUS * 2, height: HEIGHT },
    author: null,
    kind: id === 'hub' ? 'hub' : 'category',
    spawn: {
      initial: {
        position: new THREE.Vector3(0, PLAYER_Y, RADIUS - 4),
        yaw: 0,
      },
      ...Object.fromEntries(
        Object.entries(spawnFromItem).map(([itemId, s]) => [
          `from:${itemId}`,
          s,
        ]),
      ),
    },
  };
}

function normalizeConfig(config) {
  return {
    id: config.id || 'hub',
    title: config.title || 'Hall principal',
    colorKey: config.colorKey,
    items: config.items || [],
  };
}

function computeDoorLayout(n) {
  const layout = [];
  for (let i = 0; i < n; i++) {
    layout.push({ angle: (i / n) * Math.PI * 2 });
  }
  return layout;
}

function computeDoorSpawn(slot) {
  const { angle } = slot;
  const normalIn = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
  const wallPos = new THREE.Vector3(
    RADIUS * Math.sin(angle),
    PLAYER_Y,
    -RADIUS * Math.cos(angle),
  );
  return {
    position: wallPos.clone().add(normalIn.multiplyScalar(SPAWN_OFFSET)),
    // Face into the hall so the door you just left is behind you.
    yaw: Math.atan2(-normalIn.x, -normalIn.z),
  };
}

function addChandelier(group, radius, materials) {
  const bulbColor = materials.chandelierBulbColor || new THREE.Color(0xfff2c2);
  const lightColor = materials.chandelierLightColor || new THREE.Color(0xffe1a8);
  const chandelier = new THREE.Group();
  chandelier.position.set(0, HEIGHT + 2.2, 0);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 24, 16),
    new THREE.MeshStandardMaterial({
      color: bulbColor,
      emissive: lightColor,
      emissiveIntensity: 1.8,
      roughness: 0.35,
    }),
  );
  chandelier.add(bulb);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.75, 0.05, 12, 40),
    new THREE.MeshStandardMaterial({
      color: 0xc7a060,
      metalness: 0.85,
      roughness: 0.35,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.12;
  chandelier.add(ring);

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.55, 6),
      new THREE.MeshStandardMaterial({ color: 0xc7a060, metalness: 0.8, roughness: 0.4 }),
    );
    arm.position.set(Math.cos(a) * 0.55, -0.05, Math.sin(a) * 0.55);
    arm.rotation.z = Math.PI / 2;
    arm.rotation.y = -a;
    chandelier.add(arm);
  }

  const cableLen = Math.max(2.8, radius * 0.35);
  const cable = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, cableLen, 8),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 }),
  );
  cable.position.y = cableLen / 2;
  chandelier.add(cable);

  const light = new THREE.PointLight(lightColor, 3.2, radius * 2.2, 1.4);
  light.position.set(0, -0.08, 0);
  chandelier.add(light);

  group.add(chandelier);
}

function addCenterMedallion(group, materials) {
  const accent = materials.medallionColor || new THREE.Color(0xc7a060);
  const accentCss = `#${accent.getHexString()}`;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.strokeStyle = colorWithAlpha(accentCss, 0.65);
  for (let r = 80; r <= 420; r += 70) {
    ctx.lineWidth = r > 300 ? 4 : 6;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 90, cy + Math.sin(a) * 90);
    ctx.lineTo(cx + Math.cos(a) * 430, cy + Math.sin(a) * 430);
    ctx.stroke();
  }

  ctx.fillStyle = colorWithAlpha(accentCss, 0.25);
  ctx.beginPath();
  ctx.arc(cx, cy, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colorWithAlpha(accentCss, 0.8);
  ctx.lineWidth = 5;
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.014;
  group.add(mesh);
}

function addCentralGlobe(group) {
  const globe = new THREE.Group();
  globe.name = 'hall:central-globe';
  globe.position.set(0, 0, 0);

  const standMat = new THREE.MeshStandardMaterial({
    color: 0x2b2119,
    roughness: 0.46,
    metalness: 0.28,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc7a060,
    roughness: 0.36,
    metalness: 0.72,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.9, 0.18, 48), standMat);
  base.position.y = 0.09;
  globe.add(base);

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.7, 32), standMat);
  pedestal.position.y = 0.52;
  globe.add(pedestal);

  const axis = new THREE.Group();
  axis.position.y = 1.18;
  axis.rotation.z = -0.42;
  globe.add(axis);

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.82, 48, 32),
    new THREE.MeshStandardMaterial({
      map: makeSimpleGlobeTexture(),
      roughness: 0.72,
      metalness: 0.02,
    }),
  );
  axis.add(sphere);

  const meridian = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.015, 10, 96), brassMat);
  meridian.rotation.y = Math.PI / 2;
  axis.add(meridian);

  const equator = new THREE.Mesh(new THREE.TorusGeometry(0.825, 0.008, 8, 96), brassMat);
  equator.rotation.x = Math.PI / 2;
  axis.add(equator);

  for (const y of [-0.42, 0.42]) {
    const r = Math.sqrt(0.82 * 0.82 - y * y);
    const parallel = new THREE.Mesh(new THREE.TorusGeometry(r, 0.006, 8, 80), brassMat);
    parallel.rotation.x = Math.PI / 2;
    parallel.position.y = y;
    axis.add(parallel);
  }

  const pinGeo = new THREE.SphereGeometry(0.04, 16, 10);
  const topPin = new THREE.Mesh(pinGeo, brassMat);
  topPin.position.y = 0.91;
  axis.add(topPin);
  const bottomPin = new THREE.Mesh(pinGeo, brassMat);
  bottomPin.position.y = -0.91;
  axis.add(bottomPin);

  const fillLight = new THREE.PointLight(0xffe5b0, 0.7, 4.5, 1.8);
  fillLight.position.set(0, 2.3, 1.2);
  globe.add(fillLight);

  group.add(globe);
}

function makeSimpleGlobeTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext('2d');

  const ocean = ctx.createLinearGradient(0, 0, 0, c.height);
  ocean.addColorStop(0, '#2e79ac');
  ocean.addColorStop(1, '#164f7d');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, c.width, c.height);

  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  for (let y = 64; y < c.height; y += 64) {
    ctx.fillRect(0, y, c.width, 2);
  }
  for (let x = 64; x < c.width; x += 64) {
    ctx.fillRect(x, 0, 2, c.height);
  }

  ctx.fillStyle = '#4f9b5f';
  drawLand(ctx, [[130, 160], [210, 105], [305, 130], [335, 215], [250, 260], [150, 240]]);
  drawLand(ctx, [[278, 280], [345, 300], [385, 380], [320, 455], [255, 386]]);
  drawLand(ctx, [[510, 145], [610, 115], [705, 155], [680, 245], [560, 255], [470, 215]]);
  drawLand(ctx, [[665, 250], [755, 280], [790, 360], [710, 420], [640, 350]]);
  drawLand(ctx, [[830, 165], [935, 150], [985, 230], [905, 285], [820, 245]]);

  ctx.fillStyle = 'rgba(240,225,150,0.32)';
  drawLand(ctx, [[575, 215], [645, 205], [690, 250], [645, 300], [565, 275]]);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function drawLand(ctx, points) {
  ctx.beginPath();
  points.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
}

function addHubTitle(group, title, materials) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const titleColor = materials.titleColor || new THREE.Color(0xc7a060);
  ctx.fillStyle = `#${titleColor.getHexString()}`;
  const fontSize = fitTitleFont(ctx, title, canvas.width - 96, 110, 54);
  ctx.font = `italic 600 ${fontSize}px Georgia, "Times New Roman", serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(title, canvas.width / 2, canvas.height / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const w = 6;
  const h = w * (canvas.height / canvas.width);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
  });
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  plaque.rotation.x = -Math.PI / 2;
  plaque.position.set(0, 0.015, 0);
  group.add(plaque);
}

function colorWithAlpha(hex, alpha) {
  const color = new THREE.Color(hex);
  return `rgba(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)},${alpha})`;
}

function fitTitleFont(ctx, text, maxWidth, startSize, minSize) {
  for (let size = startSize; size >= minSize; size -= 2) {
    ctx.font = `italic 600 ${size}px Georgia, "Times New Roman", serif`;
    if (ctx.measureText(text).width <= maxWidth) return size;
  }
  return minSize;
}
