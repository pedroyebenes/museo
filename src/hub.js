import * as THREE from 'three';
import { buildRoomShell } from './wallBuilder.js';
import { getSharedMaterials } from './materials.js';

const HEIGHT = 5.2;
const SIDE = 24;
const PLAYER_Y = 1.6;
const SPAWN_OFFSET = 3.0;

// Builds the central hub with one door per author, arranged clockwise around
// the perimeter starting from the NW corner.
export function buildHub(scene, authorOrder) {
  const width = SIDE;
  const depth = SIDE;

  const group = new THREE.Group();
  group.name = 'room:hub';

  const layout = computeDoorLayout(authorOrder.length, width, depth);

  // Group door specs by wall so wallBuilder gets one entry per wall
  const wallDoors = { N: [], E: [], S: [], W: [] };
  layout.forEach((slot, i) => {
    const author = authorOrder[i];
    wallDoors[slot.wall].push({
      position: slot.position,
      label: author,
      destination: { kind: 'author', authorIndex: i },
    });
  });

  const { segments, triggers } = buildRoomShell(group, {
    width,
    depth,
    height: HEIGHT,
    walls: [
      { side: 'N', doors: wallDoors.N },
      { side: 'E', doors: wallDoors.E },
      { side: 'S', doors: wallDoors.S },
      { side: 'W', doors: wallDoors.W },
    ],
  });

  addChandelier(group, width, depth);
  addCenterMedallion(group);
  addHubTitle(group);

  scene.add(group);

  // Compute per-author spawn point (used when returning to the hub).
  const spawnFromAuthor = {};
  layout.forEach((slot, i) => {
    spawnFromAuthor[i] = computeDoorSpawn(slot, width, depth);
  });

  return {
    group,
    slots: [],
    segments,
    triggers,
    dimensions: { width, depth, height: HEIGHT },
    author: null,
    kind: 'hub',
    spawn: {
      initial: {
        position: new THREE.Vector3(0, PLAYER_Y, depth / 2 - 4),
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

function computeDoorLayout(n, width, depth) {
  const per = distributeAcrossWalls(n);
  const layout = [];
  // N: increasing X
  for (let i = 0; i < per[0]; i++) {
    const t = (i + 0.5) / per[0];
    layout.push({ wall: 'N', position: -width / 2 + t * width });
  }
  // E: increasing Z
  for (let i = 0; i < per[1]; i++) {
    const t = (i + 0.5) / per[1];
    layout.push({ wall: 'E', position: -depth / 2 + t * depth });
  }
  // S: decreasing X (clockwise wraps)
  for (let i = 0; i < per[2]; i++) {
    const t = (i + 0.5) / per[2];
    layout.push({ wall: 'S', position: width / 2 - t * width });
  }
  // W: decreasing Z
  for (let i = 0; i < per[3]; i++) {
    const t = (i + 0.5) / per[3];
    layout.push({ wall: 'W', position: depth / 2 - t * depth });
  }
  return layout;
}

function distributeAcrossWalls(n) {
  const base = Math.floor(n / 4);
  const extra = n - base * 4;
  const counts = [base, base, base, base];
  for (let i = 0; i < extra; i++) counts[i]++;
  return counts;
}

function computeDoorSpawn(slot, width, depth) {
  const { wall, position } = slot;
  switch (wall) {
    case 'N':
      return {
        position: new THREE.Vector3(
          position,
          PLAYER_Y,
          -depth / 2 + SPAWN_OFFSET,
        ),
        yaw: Math.PI,
      };
    case 'S':
      return {
        position: new THREE.Vector3(
          position,
          PLAYER_Y,
          depth / 2 - SPAWN_OFFSET,
        ),
        yaw: 0,
      };
    case 'E':
      return {
        position: new THREE.Vector3(
          width / 2 - SPAWN_OFFSET,
          PLAYER_Y,
          position,
        ),
        yaw: -Math.PI / 2,
      };
    case 'W':
      return {
        position: new THREE.Vector3(
          -width / 2 + SPAWN_OFFSET,
          PLAYER_Y,
          position,
        ),
        yaw: Math.PI / 2,
      };
  }
}

function addChandelier(group, width, depth) {
  // A point light + a small emissive sphere standing in for the bulb cluster.
  const chandelier = new THREE.Group();
  chandelier.position.set(0, HEIGHT - 1.2, 0);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 24, 16),
    new THREE.MeshStandardMaterial({
      color: 0xfff2c2,
      emissive: 0xffd57a,
      emissiveIntensity: 1.6,
      roughness: 0.4,
    }),
  );
  chandelier.add(bulb);

  // Ring trim
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.04, 12, 32),
    new THREE.MeshStandardMaterial({
      color: 0xc7a060,
      metalness: 0.85,
      roughness: 0.35,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -0.1;
  chandelier.add(ring);

  // Suspension cable
  const cable = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.6 }),
  );
  cable.position.y = 0.6;
  chandelier.add(cable);

  // Warm point light just below the cluster
  const light = new THREE.PointLight(0xffe1a8, 2.8, Math.max(width, depth) * 1.6, 1.4);
  light.position.set(0, -0.05, 0);
  chandelier.add(light);

  // Gentle ambient fill from above
  const ambient = new THREE.PointLight(0xfff1d0, 0.6, Math.max(width, depth) * 2.0, 1.4);
  ambient.position.set(0, 0.8, 0);
  chandelier.add(ambient);

  group.add(chandelier);
}

function addCenterMedallion(group) {
  // A subtle gilded ring on the floor under the chandelier.
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // Outer ring
  ctx.strokeStyle = 'rgba(199,160,96,0.55)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 220, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 180, 0, Math.PI * 2);
  ctx.stroke();
  // Inner ornaments
  ctx.lineWidth = 2;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const x1 = cx + Math.cos(a) * 150;
    const y1 = cy + Math.sin(a) * 150;
    const x2 = cx + Math.cos(a) * 180;
    const y2 = cy + Math.sin(a) * 180;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  // Central rosette
  ctx.beginPath();
  ctx.arc(cx, cy, 60, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.012;
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
  plaque.position.set(0, 0.013, -4.5);
  group.add(plaque);
}
