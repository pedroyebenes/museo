import * as THREE from 'three';
import { getSharedMaterials, makeArtistDomeMaterial } from './materials.js';
import { getPortalGlowMaterial, getReturnPortalGlowMaterial, getReturnFrameMaterial, createDoorSignMesh } from './doorAssets.js';

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
  const {
    width,
    depth,
    height,
    walls,
    materials = getSharedMaterials(),
    domeCeiling = false,
  } = opts;
  const mats = materials;

  // Floor + ceiling
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    mats.floorMat,
  );
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  if (domeCeiling) {
    addDomeCeiling(group, width, depth, height, mats);
  } else {
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      mats.ceilMat,
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = height;
    group.add(ceiling);
  }

  const segments = [];
  const triggers = [];
  const doorInteractables = [];

  for (const wallSpec of walls) {
    buildWall(group, wallSpec, { width, depth, height }, mats, segments, triggers, doorInteractables);
  }

  return { segments, triggers, doorInteractables };
}

function buildWall(group, wallSpec, dims, mats, segments, triggers, doorInteractables) {
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
    const offsetU = (span.from + length / 2) / DAMASK_TILE_W;
    buildPanel(group, mats, axis, fixed, centerAlong, panelW, height, rotY, normalIn, offsetU);
    addCollisionSegment(segments, axis, fixed, span.from, span.to);
  }

  // Per-door: lintel above the opening + doorframe + portal + sign + trigger
  for (const d of sortedDoors) {
    const isReturn = d.destination?.kind === 'hub' || d.signShape === 'return';
    addLintel(group, mats, d, axis, fixed, height, rotY, normalIn, length);
    addDoorFrame(group, mats, d, axis, fixed, normalIn, isReturn);
    addDoorPortal(group, mats, d, axis, fixed, normalIn, rotY, isReturn);
    if (d.label) addDoorSign(group, d, axis, fixed, height, rotY, normalIn);
    triggers.push(makeTrigger(d, axis, fixed, normalIn));

    if (d.doorInfo && doorInteractables) {
      const center = placeAlong(axis, fixed, d.position, DOOR_H / 2);
      const hitbox = new THREE.Mesh(
        new THREE.PlaneGeometry(DOOR_W, DOOR_H),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      hitbox.position.copy(center);
      hitbox.position.add(normalIn.clone().multiplyScalar(0.2));
      hitbox.rotation.y = rotY;
      hitbox.userData.door = d.doorInfo;
      group.add(hitbox);
      doorInteractables.push(hitbox);
    }
  }

  // Crown moulding runs the full wall length (continuous over door lintels)
  addCrownMoulding(group, mats, axis, fixed, length, height, normalIn);
}

function buildPanel(group, mats, axis, fixed, centerAlong, panelW, height, rotY, normalIn, offsetU = 0) {
  // Wainscot (bottom band)
  const wainscotGeo = new THREE.PlaneGeometry(panelW, WAINSCOT_H);
  applyWorldUVs(wainscotGeo, panelW, WAINSCOT_H, WAINSCOT_TILE_W, WAINSCOT_H, offsetU, 0);
  const wainscot = new THREE.Mesh(wainscotGeo, mats.wainscotMat);
  wainscot.position.copy(
    placeAlong(axis, fixed, centerAlong, WAINSCOT_H / 2),
  );
  wainscot.rotation.y = rotY;
  group.add(wainscot);

  // Upper wall (damask)
  const upperH = height - WAINSCOT_H;
  const upperGeo = new THREE.PlaneGeometry(panelW, upperH);
  applyWorldUVs(upperGeo, panelW, upperH, DAMASK_TILE_W, DAMASK_TILE_H, offsetU, 0);
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

function addLintel(group, mats, door, axis, fixed, height, rotY, normalIn, length) {
  const lintelH = height - DOOR_H;
  const geo = new THREE.PlaneGeometry(DOOR_W, lintelH);
  const offsetU = (door.position - DOOR_W / 2 + length / 2) / DAMASK_TILE_W;
  applyWorldUVs(geo, DOOR_W, lintelH, DAMASK_TILE_W, DAMASK_TILE_H, offsetU, 0);
  const lintel = new THREE.Mesh(geo, mats.wallMat);
  lintel.position.copy(
    placeAlong(axis, fixed, door.position, DOOR_H + lintelH / 2),
  );
  lintel.rotation.y = rotY;
  group.add(lintel);
}

function addDoorFrame(group, mats, door, axis, fixed, normalIn, isReturn = false) {
  const frameMat = isReturn ? getReturnFrameMaterial() : mats.frameMat;
  const offset = normalIn.clone().multiplyScalar(0.03);

  // Top bar
  let topGeo;
  if (axis === 'x') {
    topGeo = new THREE.BoxGeometry(DOOR_W + 2 * FW, FW, 0.1);
  } else {
    topGeo = new THREE.BoxGeometry(0.1, FW, DOOR_W + 2 * FW);
  }
  const top = new THREE.Mesh(topGeo, frameMat);
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
      jamb = new THREE.Mesh(sideGeoX, frameMat);
      jamb.position.set(
        door.position + dir * (DOOR_W / 2 + FW / 2),
        DOOR_H / 2,
        fixed,
      );
    } else {
      jamb = new THREE.Mesh(sideGeoZ, frameMat);
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

function addDoorPortal(group, mats, door, axis, fixed, normalIn, rotY, isReturn = false) {
  const recessDepth = 0.38;
  const inset = normalIn.clone().multiplyScalar(0.04);
  const center = placeAlong(axis, fixed, door.position, DOOR_H / 2);
  center.add(inset);

  const recessMat = new THREE.MeshStandardMaterial({
    color: isReturn ? 0x020d18 : 0x24160e,
    roughness: 0.92,
    metalness: 0.04,
  });
  const doorLeafMat = new THREE.MeshStandardMaterial({
    color: isReturn ? 0x0a1828 : 0x5c3a22,
    roughness: isReturn ? 0.38 : 0.72,
    metalness: isReturn ? 0.45 : 0.08,
  });
  const trimMat = isReturn ? getReturnFrameMaterial() : mats.trimMat;

  const backDist = recessDepth * 0.92;
  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(DOOR_W * 0.88, DOOR_H * 0.92),
    isReturn ? getReturnPortalGlowMaterial() : getPortalGlowMaterial(),
  );
  back.position.copy(center);
  back.position.add(normalIn.clone().multiplyScalar(backDist));
  back.rotation.y = rotY + Math.PI;
  group.add(back);

  const sideDepth = recessDepth * 0.55;
  for (const dir of [-1, 1]) {
    let side;
    if (axis === 'x') {
      side = new THREE.Mesh(
        new THREE.BoxGeometry(FW * 0.7, DOOR_H * 0.94, sideDepth),
        recessMat,
      );
      side.position.set(
        door.position + dir * (DOOR_W / 2 - FW * 0.2),
        DOOR_H / 2,
        fixed + normalIn.z * (inset.z + sideDepth / 2),
      );
    } else {
      side = new THREE.Mesh(
        new THREE.BoxGeometry(sideDepth, DOOR_H * 0.94, FW * 0.7),
        recessMat,
      );
      side.position.set(
        fixed + normalIn.x * (inset.x + sideDepth / 2),
        DOOR_H / 2,
        door.position + dir * (DOOR_W / 2 - FW * 0.2),
      );
    }
    group.add(side);
  }

  const leafW = DOOR_W / 2 - 0.12;
  const leafH = DOOR_H - 0.18;
  const leafD = 0.07;
  const openAngle = 0.42;

  for (const dir of [-1, 1]) {
    const leaf = new THREE.Mesh(
      axis === 'x'
        ? new THREE.BoxGeometry(leafW, leafH, leafD)
        : new THREE.BoxGeometry(leafD, leafH, leafW),
      doorLeafMat,
    );
    leaf.position.copy(center);
    if (axis === 'x') {
      leaf.position.x += dir * (DOOR_W / 4);
      leaf.position.z += normalIn.z * 0.12;
      leaf.rotation.y = rotY + dir * openAngle;
    } else {
      leaf.position.z += dir * (DOOR_W / 4);
      leaf.position.x += normalIn.x * 0.12;
      leaf.rotation.y = rotY + dir * openAngle;
    }
    group.add(leaf);

    const handle = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 10, 10),
      trimMat,
    );
    handle.position.copy(leaf.position);
    if (axis === 'x') {
      handle.position.x -= dir * (leafW / 2 - 0.18);
    } else {
      handle.position.z -= dir * (leafW / 2 - 0.18);
    }
    handle.position.y -= leafH * 0.15;
    group.add(handle);
  }
}

function addDomeCeiling(group, width, depth, height, mats) {
  const span = Math.min(width, depth);
  const radius = span * 0.42;

  // Dome sphere with sky fresco
  const domeMat = mats.artistDomeMat || makeArtistDomeMaterial(mats.authorHue || 0);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 48, 28, 0, Math.PI * 2, 0, Math.PI * 0.48),
    domeMat,
  );
  dome.scale.y = 0.82;
  dome.position.set(0, height, 0);
  group.add(dome);

  const oculus = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.11, 32),
    new THREE.MeshStandardMaterial({
      color: 0xfff6e0,
      emissive: 0xffe8b0,
      emissiveIntensity: 0.85,
      roughness: 0.35,
      metalness: 0.05,
    }),
  );
  oculus.rotation.x = -Math.PI / 2;
  oculus.position.set(0, height + radius * 0.72, 0);
  group.add(oculus);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.13, radius * 0.018, 12, 40),
    mats.trimMat,
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.copy(oculus.position);
  ring.position.y -= 0.02;
  group.add(ring);

  const skylight = new THREE.PointLight(0xfff0cc, 1.4, span * 1.2, 1.5);
  skylight.position.set(0, height + radius * 0.75, 0);
  group.add(skylight);
}

function addDoorSign(group, door, axis, fixed, height, rotY, normalIn) {
  const lintelH = height - DOOR_H;
  const sign = createDoorSignMesh({
    label: door.label,
    arrow: door.arrow,
    lintelH,
    textColor: door.textColor,
    borderColor: door.borderColor,
    shape: door.signShape,
  });
  // Centre the sign within the lintel area
  sign.position.copy(
    placeAlong(axis, fixed, door.position, DOOR_H + lintelH / 2),
  );
  sign.position.add(normalIn.clone().multiplyScalar(0.055));
  sign.rotation.y = rotY;
  group.add(sign);
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

function applyWorldUVs(geo, worldW, worldH, tileW, tileH, offsetU = 0, offsetV = 0) {
  const sX = worldW / tileW;
  const sY = worldH / tileH;
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) * sX + offsetU, uv.getY(i) * sY + offsetV);
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
