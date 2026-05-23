import * as THREE from 'three';
import { getSharedMaterials } from './materials.js';

const DOOR_W = 1.8;
const DOOR_H = 2.6;
const FW = 0.08; // doorframe bar thickness
const BASEBOARD_H = 0.15;
const BASEBOARD_DEPTH = 0.04;

export const DOOR_WIDTH = DOOR_W;
export const DOOR_HEIGHT = DOOR_H;

// Builds floor, ceiling, baseboards, and walls (with door openings, doorframes
// and signs). Returns { segments, triggers } for collision + portal handling.
//
// Wall spec shape:
//   { side: 'N'|'S'|'E'|'W',
//     doors: [{ position, label, destination, arrow? }] }
//
// Each door's `destination` is opaque — passed straight through into the
// matching trigger so the RoomManager can decide what to load.
export function buildRoomShell(group, opts) {
  const { width, depth, height, walls } = opts;
  const mats = getSharedMaterials();

  // ---- Floor & ceiling
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    mats.floorMat,
  );
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    mats.ceilMat,
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = height;
  group.add(ceiling);

  const segments = [];
  const triggers = [];

  for (const wallSpec of walls) {
    buildWall(group, wallSpec, { width, depth, height }, mats, segments, triggers);
  }

  return { segments, triggers };
}

function buildWall(group, wallSpec, dims, mats, segments, triggers) {
  const { side, doors = [] } = wallSpec;
  const { width, depth, height } = dims;

  // Geometry of this wall in plan view.
  const cfg = wallGeometry(side, width, depth);
  // axis: which coordinate varies along the wall ('x' or 'z')
  // fixed: the other coordinate's value (where the wall sits)
  // length: total wall length
  // rotY: rotation so the plane faces into the room
  // normalIn: inward-pointing normal
  const { axis, fixed, length, rotY, normalIn } = cfg;

  const sortedDoors = [...doors].sort((a, b) => a.position - b.position);

  // Compute spans between corners and doors
  let cursor = -length / 2;
  const spans = [];
  for (const d of sortedDoors) {
    const dl = d.position - DOOR_W / 2;
    const dr = d.position + DOOR_W / 2;
    if (dl > cursor + 0.01) spans.push({ from: cursor, to: dl });
    cursor = dr;
  }
  if (cursor < length / 2 - 0.01) spans.push({ from: cursor, to: length / 2 });

  // Wall panels (between doors and at the ends)
  for (const span of spans) {
    const panelW = span.to - span.from;
    const centerAlong = (span.to + span.from) / 2;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(panelW, height),
      mats.wallMat,
    );
    const pos = placeAlong(axis, fixed, centerAlong, height / 2);
    mesh.position.copy(pos);
    mesh.rotation.y = rotY;
    group.add(mesh);

    // Baseboard at the foot of this panel
    addBaseboard(group, mats, axis, fixed, centerAlong, panelW, normalIn);

    // Collision segment
    addCollisionSegment(segments, axis, fixed, span.from, span.to);
  }

  // Per-door pieces: lintel, doorframe, sign, trigger
  for (const d of sortedDoors) {
    addLintelAndFrame(group, mats, d, axis, fixed, height, rotY, normalIn);
    if (d.label) addDoorSign(group, d, axis, fixed, height, rotY, normalIn);
    triggers.push(makeTrigger(d, axis, fixed, normalIn));
  }
}

function wallGeometry(side, width, depth) {
  switch (side) {
    case 'N':
      return {
        axis: 'x',
        fixed: -depth / 2,
        length: width,
        rotY: 0,
        normalIn: new THREE.Vector3(0, 0, 1),
      };
    case 'S':
      return {
        axis: 'x',
        fixed: depth / 2,
        length: width,
        rotY: Math.PI,
        normalIn: new THREE.Vector3(0, 0, -1),
      };
    case 'E':
      return {
        axis: 'z',
        fixed: width / 2,
        length: depth,
        rotY: -Math.PI / 2,
        normalIn: new THREE.Vector3(-1, 0, 0),
      };
    case 'W':
      return {
        axis: 'z',
        fixed: -width / 2,
        length: depth,
        rotY: Math.PI / 2,
        normalIn: new THREE.Vector3(1, 0, 0),
      };
    default:
      throw new Error(`Unknown wall side: ${side}`);
  }
}

function placeAlong(axis, fixed, along, y) {
  if (axis === 'x') return new THREE.Vector3(along, y, fixed);
  return new THREE.Vector3(fixed, y, along);
}

function addBaseboard(group, mats, axis, fixed, centerAlong, panelW, normalIn) {
  const depthBoard = BASEBOARD_DEPTH;
  let geo, mesh;
  if (axis === 'x') {
    geo = new THREE.BoxGeometry(panelW, BASEBOARD_H, depthBoard);
    mesh = new THREE.Mesh(geo, mats.baseboardMat);
    mesh.position.set(
      centerAlong,
      BASEBOARD_H / 2,
      fixed + normalIn.z * depthBoard / 2,
    );
  } else {
    geo = new THREE.BoxGeometry(depthBoard, BASEBOARD_H, panelW);
    mesh = new THREE.Mesh(geo, mats.baseboardMat);
    mesh.position.set(
      fixed + normalIn.x * depthBoard / 2,
      BASEBOARD_H / 2,
      centerAlong,
    );
  }
  group.add(mesh);
}

function addLintelAndFrame(group, mats, door, axis, fixed, height, rotY, normalIn) {
  const lintelH = height - DOOR_H;

  // Lintel: wall panel above the door (uses wall material so it looks continuous)
  const lintel = new THREE.Mesh(
    new THREE.PlaneGeometry(DOOR_W, lintelH),
    mats.wallMat,
  );
  lintel.position.copy(
    placeAlong(axis, fixed, door.position, DOOR_H + lintelH / 2),
  );
  lintel.rotation.y = rotY;
  group.add(lintel);

  // Doorframe: 3 thin boxes proud of the wall on the inside face
  const offset = normalIn.clone().multiplyScalar(0.03);

  // Top bar
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(DOOR_W + 2 * FW, FW, 0.1),
    mats.frameMat,
  );
  if (axis === 'x') {
    top.position.set(door.position, DOOR_H + FW / 2, fixed);
  } else {
    // For E/W walls, the bar runs along Z
    top.geometry = new THREE.BoxGeometry(0.1, FW, DOOR_W + 2 * FW);
    top.position.set(fixed, DOOR_H + FW / 2, door.position);
  }
  top.position.add(offset);
  group.add(top);

  // Left jamb / right jamb (relative to the wall axis)
  const sideGeoX = new THREE.BoxGeometry(FW, DOOR_H, 0.1);
  const sideGeoZ = new THREE.BoxGeometry(0.1, DOOR_H, FW);
  for (const dir of [-1, 1]) {
    let jamb;
    if (axis === 'x') {
      jamb = new THREE.Mesh(sideGeoX, mats.frameMat);
      jamb.position.set(
        door.position + dir * (DOOR_W / 2 + FW / 2),
        DOOR_H / 2,
        fixed,
      );
    } else {
      jamb = new THREE.Mesh(sideGeoZ, mats.frameMat);
      jamb.position.set(
        fixed,
        DOOR_H / 2,
        door.position + dir * (DOOR_W / 2 + FW / 2),
      );
    }
    jamb.position.add(offset);
    group.add(jamb);
  }
}

function addDoorSign(group, door, axis, fixed, height, rotY, normalIn) {
  const sign = buildSignMesh(door.label, door.arrow);
  const lintelH = height - DOOR_H;
  sign.position.copy(
    placeAlong(axis, fixed, door.position, DOOR_H + lintelH / 2),
  );
  sign.position.add(normalIn.clone().multiplyScalar(0.05));
  sign.rotation.y = rotY;
  group.add(sign);
}

function buildSignMesh(label, arrow) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 192;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0e0a06';
  ctx.fillRect(0, 0, c.width, c.height);
  // gilded border
  ctx.strokeStyle = '#c7a060';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, c.width - 12, c.height - 12);
  ctx.fillStyle = '#f3e8c8';
  ctx.font = '600 88px Georgia, "Times New Roman", serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  const txt = arrow ? `${arrow}  ${label}` : label;
  ctx.fillText(txt, c.width / 2, c.height / 2);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const w = 2.4;
  const h = w * (c.height / c.width);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}

function addCollisionSegment(segments, axis, fixed, from, to) {
  if (axis === 'x') {
    segments.push({ ax: from, az: fixed, bx: to, bz: fixed });
  } else {
    segments.push({ ax: fixed, az: from, bx: fixed, bz: to });
  }
}

function makeTrigger(door, axis, fixed, normalIn) {
  // Build a small AABB sensor just inside the doorway
  const inward1 = 0.3;
  const inward2 = 1.4;
  if (axis === 'x') {
    const z1 = fixed + normalIn.z * inward1;
    const z2 = fixed + normalIn.z * inward2;
    return {
      minX: door.position - DOOR_W / 2 - 0.1,
      maxX: door.position + DOOR_W / 2 + 0.1,
      minZ: Math.min(z1, z2),
      maxZ: Math.max(z1, z2),
      destination: door.destination,
    };
  }
  const x1 = fixed + normalIn.x * inward1;
  const x2 = fixed + normalIn.x * inward2;
  return {
    minX: Math.min(x1, x2),
    maxX: Math.max(x1, x2),
    minZ: door.position - DOOR_W / 2 - 0.1,
    maxZ: door.position + DOOR_W / 2 + 0.1,
    destination: door.destination,
  };
}
