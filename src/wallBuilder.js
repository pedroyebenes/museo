import * as THREE from 'three';
import { getSharedMaterials } from './materials.js';

const DOOR_W = 1.8;
const DOOR_H = 2.6;
const FW = 0.08; // doorframe bar thickness

// Vertical anatomy of every wall (from floor up):
const BASEBOARD_H = 0.15;
const BASEBOARD_PROUD = 0.04;
const WAINSCOT_H = 1.05;
const CHAIR_RAIL_H = 0.06;
const CHAIR_RAIL_PROUD = 0.045;
const CROWN_H = 0.14;
const CROWN_PROUD = 0.055;

// World-space tile sizes for shared textures so the pattern density is
// consistent across panels of different widths.
const DAMASK_TILE_W = 1.5;
const DAMASK_TILE_H = 1.5;
const WAINSCOT_TILE_W = 1.6;

export const DOOR_WIDTH = DOOR_W;
export const DOOR_HEIGHT = DOOR_H;

export function buildRoomShell(group, opts) {
  const { width, depth, height, walls, materials = getSharedMaterials() } = opts;
  const mats = materials;

  // Floor + ceiling
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
  const cfg = wallGeometry(side, width, depth);
  const { axis, fixed, length, rotY, normalIn } = cfg;

  const sortedDoors = [...doors].sort((a, b) => a.position - b.position);

  // Spans between corners and doors
  let cursor = -length / 2;
  const spans = [];
  for (const d of sortedDoors) {
    const dl = d.position - DOOR_W / 2;
    const dr = d.position + DOOR_W / 2;
    if (dl > cursor + 0.01) spans.push({ from: cursor, to: dl });
    cursor = dr;
  }
  if (cursor < length / 2 - 0.01) spans.push({ from: cursor, to: length / 2 });

  // Build each wall panel (wainscot + upper + trim) between doors and corners
  for (const span of spans) {
    const panelW = span.to - span.from;
    const centerAlong = (span.to + span.from) / 2;
    buildPanel(group, mats, axis, fixed, centerAlong, panelW, height, rotY, normalIn);
    addCollisionSegment(segments, axis, fixed, span.from, span.to);
  }

  // Per-door: lintel above the opening + doorframe + sign + trigger
  for (const d of sortedDoors) {
    addLintel(group, mats, d, axis, fixed, height, rotY, normalIn);
    addDoorFrame(group, mats, d, axis, fixed, normalIn);
    if (d.label) addDoorSign(group, d, axis, fixed, height, rotY, normalIn);
    triggers.push(makeTrigger(d, axis, fixed, normalIn));
  }

  // Crown moulding runs the full wall length (continuous over door lintels)
  addCrownMoulding(group, mats, axis, fixed, length, height, normalIn);
}

function buildPanel(group, mats, axis, fixed, centerAlong, panelW, height, rotY, normalIn) {
  // Wainscot (bottom band)
  const wainscotGeo = new THREE.PlaneGeometry(panelW, WAINSCOT_H);
  applyWorldUVs(wainscotGeo, panelW, WAINSCOT_H, WAINSCOT_TILE_W, WAINSCOT_H);
  const wainscot = new THREE.Mesh(wainscotGeo, mats.wainscotMat);
  wainscot.position.copy(
    placeAlong(axis, fixed, centerAlong, WAINSCOT_H / 2),
  );
  wainscot.rotation.y = rotY;
  group.add(wainscot);

  // Upper wall (damask)
  const upperH = height - WAINSCOT_H;
  const upperGeo = new THREE.PlaneGeometry(panelW, upperH);
  applyWorldUVs(upperGeo, panelW, upperH, DAMASK_TILE_W, DAMASK_TILE_H);
  const upper = new THREE.Mesh(upperGeo, mats.wallMat);
  upper.position.copy(
    placeAlong(axis, fixed, centerAlong, WAINSCOT_H + upperH / 2),
  );
  upper.rotation.y = rotY;
  group.add(upper);

  // Baseboard (proud, dark)
  addProudBar(group, mats.baseboardMat, axis, fixed, centerAlong, panelW, BASEBOARD_H, BASEBOARD_PROUD, BASEBOARD_H / 2, normalIn);

  // Chair rail (proud, gilded) just above the wainscot
  addProudBar(group, mats.trimMat, axis, fixed, centerAlong, panelW, CHAIR_RAIL_H, CHAIR_RAIL_PROUD, WAINSCOT_H + CHAIR_RAIL_H / 2, normalIn);
}

function addLintel(group, mats, door, axis, fixed, height, rotY, normalIn) {
  const lintelH = height - DOOR_H;
  const geo = new THREE.PlaneGeometry(DOOR_W, lintelH);
  applyWorldUVs(geo, DOOR_W, lintelH, DAMASK_TILE_W, DAMASK_TILE_H);
  const lintel = new THREE.Mesh(geo, mats.wallMat);
  lintel.position.copy(
    placeAlong(axis, fixed, door.position, DOOR_H + lintelH / 2),
  );
  lintel.rotation.y = rotY;
  group.add(lintel);
}

function addDoorFrame(group, mats, door, axis, fixed, normalIn) {
  const offset = normalIn.clone().multiplyScalar(0.03);

  // Top bar
  let topGeo;
  if (axis === 'x') {
    topGeo = new THREE.BoxGeometry(DOOR_W + 2 * FW, FW, 0.1);
  } else {
    topGeo = new THREE.BoxGeometry(0.1, FW, DOOR_W + 2 * FW);
  }
  const top = new THREE.Mesh(topGeo, mats.frameMat);
  if (axis === 'x') {
    top.position.set(door.position, DOOR_H + FW / 2, fixed);
  } else {
    top.position.set(fixed, DOOR_H + FW / 2, door.position);
  }
  top.position.add(offset);
  group.add(top);

  // Jambs
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
  // Centre the sign within the lintel area
  sign.position.copy(
    placeAlong(axis, fixed, door.position, DOOR_H + lintelH / 2),
  );
  sign.position.add(normalIn.clone().multiplyScalar(0.055));
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

function addCrownMoulding(group, mats, axis, fixed, length, height, normalIn) {
  // Continuous gilded moulding running the full wall length, just below the
  // ceiling. Passes over doors (the lintels are behind it).
  addProudBar(
    group,
    mats.trimMat,
    axis,
    fixed,
    0, // centred on the wall
    length,
    CROWN_H,
    CROWN_PROUD,
    height - CROWN_H / 2,
    normalIn,
  );
}

function addProudBar(
  group,
  material,
  axis,
  fixed,
  centerAlong,
  length,
  barH,
  proud,
  yCenter,
  normalIn,
) {
  let geo;
  let mesh;
  if (axis === 'x') {
    geo = new THREE.BoxGeometry(length, barH, proud);
    mesh = new THREE.Mesh(geo, material);
    mesh.position.set(centerAlong, yCenter, fixed + normalIn.z * proud / 2);
  } else {
    geo = new THREE.BoxGeometry(proud, barH, length);
    mesh = new THREE.Mesh(geo, material);
    mesh.position.set(fixed + normalIn.x * proud / 2, yCenter, centerAlong);
  }
  group.add(mesh);
}

function applyWorldUVs(geo, worldW, worldH, tileW, tileH) {
  const sX = worldW / tileW;
  const sY = worldH / tileH;
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) * sX, uv.getY(i) * sY);
  }
  uv.needsUpdate = true;
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

function addCollisionSegment(segments, axis, fixed, from, to) {
  if (axis === 'x') {
    segments.push({ ax: from, az: fixed, bx: to, bz: fixed });
  } else {
    segments.push({ ax: fixed, az: from, bx: fixed, bz: to });
  }
}

function makeTrigger(door, axis, fixed, normalIn) {
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
