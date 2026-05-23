import * as THREE from 'three';

const HEIGHT = 4;
const DOOR_W = 1.8;
const DOOR_H = 2.6;
const SPACE_PER_PAINTING = 3.5;
const MIN_SIDE = 10;
const PAINTING_Y = 1.6;

export function buildMuseum(scene, config) {
  const {
    paintingCount,
    author,
    hasPrev = false,
    hasNext = false,
    prevLabel = null,
    nextLabel = null,
  } = config;

  // Paintings live only on E and W walls. Each wall takes ceil(N/2) paintings.
  const perSideWall = Math.max(1, Math.ceil(paintingCount / 2));
  const side = Math.max(MIN_SIDE, perSideWall * SPACE_PER_PAINTING + 3);
  const width = side;
  const depth = side;

  const group = new THREE.Group();
  group.name = `room:${author}`;

  // --- Materials (shared inside the group, disposed when the room is removed)
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x5e3f23,
    roughness: 0.88,
    metalness: 0.05,
  });
  const ceilMat = new THREE.MeshStandardMaterial({
    color: 0xece6d6,
    roughness: 1.0,
  });
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xeae2d0,
    roughness: 0.95,
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.5,
    metalness: 0.2,
  });

  // --- Floor & ceiling
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    floorMat,
  );
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    ceilMat,
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = HEIGHT;
  group.add(ceiling);

  // --- Walls
  const segments = [];
  const triggers = [];

  buildXAlignedWall({
    group,
    wallMat,
    frameMat,
    z: -depth / 2,
    length: width,
    rotY: 0,
    normalIn: new THREE.Vector3(0, 0, 1),
    hasDoor: hasPrev,
    doorLabel: prevLabel,
    arrow: '←',
    triggerDir: 'prev',
    segments,
    triggers,
  });

  buildXAlignedWall({
    group,
    wallMat,
    frameMat,
    z: depth / 2,
    length: width,
    rotY: Math.PI,
    normalIn: new THREE.Vector3(0, 0, -1),
    hasDoor: hasNext,
    doorLabel: nextLabel,
    arrow: '→',
    triggerDir: 'next',
    segments,
    triggers,
  });

  buildZAlignedWall({
    group,
    wallMat,
    x: width / 2,
    length: depth,
    rotY: -Math.PI / 2,
    normalIn: new THREE.Vector3(-1, 0, 0),
    segments,
  });

  buildZAlignedWall({
    group,
    wallMat,
    x: -width / 2,
    length: depth,
    rotY: Math.PI / 2,
    normalIn: new THREE.Vector3(1, 0, 0),
    segments,
  });

  // --- Painting slots: split N total paintings between E and W walls
  const slots = [];
  const nE = Math.ceil(paintingCount / 2);
  const nW = paintingCount - nE;

  if (nE > 0) {
    layoutSlotsOnWall(slots, {
      count: nE,
      wallLength: depth,
      // E wall at x = +width/2, normal -X, paintings face -X
      fixedAxis: 'x',
      fixedValue: width / 2 - 0.05,
      normal: new THREE.Vector3(-1, 0, 0),
      rotY: -Math.PI / 2,
    });
  }
  if (nW > 0) {
    layoutSlotsOnWall(slots, {
      count: nW,
      wallLength: depth,
      fixedAxis: 'x',
      fixedValue: -width / 2 + 0.05,
      normal: new THREE.Vector3(1, 0, 0),
      rotY: Math.PI / 2,
    });
  }

  // --- Author plaque on the back wall (E or W, whichever has fewer paintings)
  addAuthorPlaque(group, author, width, depth);

  scene.add(group);

  return {
    group,
    slots,
    segments,
    triggers,
    dimensions: { width, depth, height: HEIGHT },
    author,
    spawn: {
      // Spawn just past the door, facing into the room.
      fromPrev: {
        position: new THREE.Vector3(0, PAINTING_Y, -depth / 2 + 3),
        yaw: Math.PI, // face +Z, away from the N door
      },
      fromNext: {
        position: new THREE.Vector3(0, PAINTING_Y, depth / 2 - 3),
        yaw: 0, // face -Z, away from the S door
      },
      initial: {
        position: new THREE.Vector3(0, PAINTING_Y, 0),
        yaw: 0,
      },
    },
  };
}

// Wall whose face is parallel to the X-axis (i.e. it sits at z = constant).
function buildXAlignedWall({
  group,
  wallMat,
  frameMat,
  z,
  length,
  rotY,
  normalIn,
  hasDoor,
  doorLabel,
  arrow,
  triggerDir,
  segments,
  triggers,
}) {
  if (!hasDoor) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(length, HEIGHT),
      wallMat,
    );
    mesh.position.set(0, HEIGHT / 2, z);
    mesh.rotation.y = rotY;
    group.add(mesh);
    segments.push({ ax: -length / 2, az: z, bx: length / 2, bz: z });
    return;
  }

  const sideW = length / 2 - DOOR_W / 2;
  // Left panel
  const leftMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(sideW, HEIGHT),
    wallMat,
  );
  leftMesh.position.set(-length / 2 + sideW / 2, HEIGHT / 2, z);
  leftMesh.rotation.y = rotY;
  group.add(leftMesh);

  // Right panel
  const rightMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(sideW, HEIGHT),
    wallMat,
  );
  rightMesh.position.set(length / 2 - sideW / 2, HEIGHT / 2, z);
  rightMesh.rotation.y = rotY;
  group.add(rightMesh);

  // Lintel above the opening
  const lintelH = HEIGHT - DOOR_H;
  const lintel = new THREE.Mesh(
    new THREE.PlaneGeometry(DOOR_W, lintelH),
    wallMat,
  );
  lintel.position.set(0, HEIGHT - lintelH / 2, z);
  lintel.rotation.y = rotY;
  group.add(lintel);

  // Doorframe (3 thin boxes, slightly proud of the wall on the inside face)
  const FW = 0.08;
  const offset = normalIn.clone().multiplyScalar(0.02);

  const topBar = new THREE.Mesh(
    new THREE.BoxGeometry(DOOR_W + 2 * FW, FW, 0.1),
    frameMat,
  );
  topBar.position.set(0, DOOR_H + FW / 2, z).add(offset);
  group.add(topBar);

  const leftJamb = new THREE.Mesh(
    new THREE.BoxGeometry(FW, DOOR_H, 0.1),
    frameMat,
  );
  leftJamb.position.set(-DOOR_W / 2 - FW / 2, DOOR_H / 2, z).add(offset);
  group.add(leftJamb);

  const rightJamb = new THREE.Mesh(
    new THREE.BoxGeometry(FW, DOOR_H, 0.1),
    frameMat,
  );
  rightJamb.position.set(DOOR_W / 2 + FW / 2, DOOR_H / 2, z).add(offset);
  group.add(rightJamb);

  // Sign with destination author
  if (doorLabel) {
    const sign = buildSign(`${arrow}  ${doorLabel}`);
    sign.position.set(0, DOOR_H + lintelH / 2, z).add(
      normalIn.clone().multiplyScalar(0.04),
    );
    sign.rotation.y = rotY;
    group.add(sign);
  }

  // Collision: two segments (left and right of the doorway)
  segments.push({
    ax: -length / 2,
    az: z,
    bx: -DOOR_W / 2,
    bz: z,
  });
  segments.push({
    ax: DOOR_W / 2,
    az: z,
    bx: length / 2,
    bz: z,
  });

  // Trigger volume: just inside the room, spanning the doorway width
  const inwardZ1 = z + normalIn.z * 0.3;
  const inwardZ2 = z + normalIn.z * 1.4;
  triggers.push({
    minX: -DOOR_W / 2 - 0.1,
    maxX: DOOR_W / 2 + 0.1,
    minZ: Math.min(inwardZ1, inwardZ2),
    maxZ: Math.max(inwardZ1, inwardZ2),
    direction: triggerDir,
  });
}

// Wall whose face is parallel to the Z-axis (i.e. it sits at x = constant).
function buildZAlignedWall({ group, wallMat, x, length, rotY, segments }) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(length, HEIGHT),
    wallMat,
  );
  mesh.position.set(x, HEIGHT / 2, 0);
  mesh.rotation.y = rotY;
  group.add(mesh);
  segments.push({ ax: x, az: -length / 2, bx: x, bz: length / 2 });
}

function layoutSlotsOnWall(slots, opts) {
  const { count, wallLength, fixedAxis, fixedValue, normal, rotY } = opts;
  const usable = wallLength - 1.5;
  const step = usable / count;
  const start = -usable / 2 + step / 2;
  for (let i = 0; i < count; i++) {
    const along = start + i * step;
    const position = new THREE.Vector3();
    if (fixedAxis === 'x') {
      position.set(fixedValue, PAINTING_Y, along);
    } else {
      position.set(along, PAINTING_Y, fixedValue);
    }
    slots.push({ position, normal: normal.clone(), rotationY: rotY });
  }
}

function buildSign(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#5b4a2a';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
  ctx.fillStyle = '#f3e8c8';
  ctx.font = '600 92px -apple-system, "Segoe UI", Georgia, serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const w = 2.4;
  const h = w * (canvas.height / canvas.width);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}

function addAuthorPlaque(group, author, width, depth) {
  // A larger plaque on the floor near the room center, decorative
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#c9b176';
  ctx.font = 'italic 600 110px Georgia, "Times New Roman", serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(author, canvas.width / 2, canvas.height / 2);

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
  plaque.position.set(0, 0.01, 0);
  group.add(plaque);
}
