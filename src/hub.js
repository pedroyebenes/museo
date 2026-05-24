import * as THREE from 'three';
import { buildRotundaShell } from './rotunda.js';
import { getHubMaterials } from './materials.js';

const HEIGHT = 5.5;
const RADIUS = 11;
const PLAYER_Y = 1.6;
const SPAWN_OFFSET = 3.0;

export function buildHub(scene, authorOrder) {
  const group = new THREE.Group();
  group.name = 'room:hub';

  const layout = computeDoorLayout(authorOrder.length);
  const doors = layout.map((slot, i) => ({
    angle: slot.angle,
    label: authorOrder[i],
    destination: { kind: 'author', authorIndex: i },
  }));

  const { segments, triggers } = buildRotundaShell(group, {
    radius: RADIUS,
    height: HEIGHT,
    doors,
    materials: getHubMaterials(),
  });

  addChandelier(group, RADIUS);
  addCenterMedallion(group);
  addHubTitle(group);

  scene.add(group);

  const spawnFromAuthor = {};
  layout.forEach((slot, i) => {
    spawnFromAuthor[i] = computeDoorSpawn(slot);
  });

  return {
    group,
    slots: [],
    segments,
    triggers,
    dimensions: { width: RADIUS * 2, depth: RADIUS * 2, height: HEIGHT },
    author: null,
    kind: 'hub',
    spawn: {
      initial: {
        position: new THREE.Vector3(0, PLAYER_Y, RADIUS - 4),
        yaw: 0,
      },
      ...Object.fromEntries(
        Object.entries(spawnFromAuthor).map(([i, s]) => [
          `fromAuthor${i}`,
          s,
        ]),
      ),
    },
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

function addChandelier(group, radius) {
  const chandelier = new THREE.Group();
  chandelier.position.set(0, HEIGHT + 2.2, 0);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 24, 16),
    new THREE.MeshStandardMaterial({
      color: 0xfff2c2,
      emissive: 0xffd57a,
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

  const light = new THREE.PointLight(0xffe1a8, 3.2, radius * 2.2, 1.4);
  light.position.set(0, -0.08, 0);
  chandelier.add(light);

  group.add(chandelier);
}

function addCenterMedallion(group) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.strokeStyle = 'rgba(199,160,96,0.65)';
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

  ctx.fillStyle = 'rgba(199,160,96,0.25)';
  ctx.beginPath();
  ctx.arc(cx, cy, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(199,160,96,0.8)';
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

function addHubTitle(group) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#c7a060';
  ctx.font = 'italic 600 110px Georgia, "Times New Roman", serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText('Hall principal', canvas.width / 2, canvas.height / 2);

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
