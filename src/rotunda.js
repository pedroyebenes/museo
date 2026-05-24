import * as THREE from 'three';
import { DOOR_WIDTH, DOOR_HEIGHT } from './wallBuilder.js';
import { getDomeMaterial } from './materials.js';
import { getQualityProfile } from './qualityProfile.js';
import { getPortalGlowMaterial, createDoorSignMesh } from './doorAssets.js';

const DOOR_W = DOOR_WIDTH;
const DOOR_H = DOOR_HEIGHT;
const FW = 0.08;
const BASEBOARD_H = 0.15;
const BASEBOARD_PROUD = 0.04;
const WAINSCOT_H = 1.05;
const CHAIR_RAIL_H = 0.06;
const CHAIR_RAIL_PROUD = 0.045;
const CROWN_H = 0.14;
const CROWN_PROUD = 0.055;
const DAMASK_TILE_W = 1.5;
const DAMASK_TILE_H = 1.5;
const WAINSCOT_TILE_W = 1.6;
const COLUMN_COUNT = 12;

let columnShaftMat = null;

function getColumnShaftMaterial() {
  if (!columnShaftMat) {
    columnShaftMat = new THREE.MeshStandardMaterial({
      color: 0xf0e6d0,
      roughness: 0.55,
      metalness: 0.08,
    });
    columnShaftMat.userData.shared = true;
  }
  return columnShaftMat;
}

export function buildRotundaShell(group, opts) {
  const { radius, height, doors, materials } = opts;
  const quality = getQualityProfile();
  const mats = materials;
  const segments = [];
  const triggers = [];

  addFloor(group, radius, mats, quality);
  addRotundaDome(group, radius, height, mats, quality);
  addCorniceRing(group, radius, height, mats, quality);
  addColumns(group, radius, height, doors, mats, quality);
  buildCurvedWalls(group, mats, radius, height, doors, segments, triggers);

  return { segments, triggers };
}

function addFloor(group, radius, mats, quality) {
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(radius, quality.floorSegments),
    mats.floorMat,
  );
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);
}

function addRotundaDome(group, radius, height, mats, quality) {
  const domeRadius = radius * 0.98;
  const domeMat = getDomeMaterial();

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(
      domeRadius,
      quality.domeWidthSegments,
      quality.domeHeightSegments,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.52,
    ),
    domeMat,
  );
  dome.scale.y = 0.62;
  dome.position.set(0, height, 0);
  group.add(dome);

  const oculusY = height + domeRadius * 0.52 * 0.62;
  const oculus = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.12, Math.max(24, quality.columnSegments + 8)),
    new THREE.MeshStandardMaterial({
      color: 0xfff8e8,
      emissive: 0xffe9b8,
      emissiveIntensity: 1.2,
      roughness: 0.25,
      metalness: 0.05,
      side: THREE.DoubleSide,
    }),
  );
  oculus.rotation.x = -Math.PI / 2;
  oculus.position.set(0, oculusY, 0);
  group.add(oculus);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.14, radius * 0.016, 14, quality.torusSegments / 2),
    mats.trimMat,
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, oculusY - 0.03, 0);
  group.add(ring);

  const skylight = new THREE.PointLight(0xfff2cc, 2.8, radius * 2.8, 1.4);
  skylight.position.set(0, oculusY + 0.2, 0);
  group.add(skylight);
}

function addCorniceRing(group, radius, height, mats, quality) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius - 0.08, 0.12, 10, quality.torusSegments),
    mats.trimMat,
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, height - CROWN_H / 2, 0);
  group.add(ring);
}

function addColumns(group, radius, height, doors, mats, quality) {
  const doorAngles = doors.map((d) => d.angle);
  const colR = radius - 0.75;
  const colH = height - 0.35;
  const halfDoor = (DOOR_W / 2 + 0.15) / radius;
  const shaftMat = getColumnShaftMaterial();
  const segs = quality.columnSegments;

  for (let i = 0; i < COLUMN_COUNT; i++) {
    const angle = (i / COLUMN_COUNT) * Math.PI * 2;
    if (doorAngles.some((a) => angleDistance(a, angle) < halfDoor * 1.8)) {
      continue;
    }

    const pos = wallPoint(angle, colR, colH / 2);
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.34, colH, segs),
      shaftMat,
    );
    shaft.position.copy(pos);
    group.add(shaft);

    const capital = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.3, 0.18, segs),
      mats.trimMat,
    );
    capital.position.copy(pos);
    capital.position.y = colH + 0.04;
    group.add(capital);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.42, 0.14, segs),
      mats.trimMat,
    );
    base.position.copy(pos);
    base.position.y = 0.07;
    group.add(base);
  }
}

function buildCurvedWalls(group, mats, radius, height, doors, segments, triggers) {
  const sorted = [...doors].sort((a, b) => a.angle - b.angle);
  const n = sorted.length;
  const wallR = radius - 0.05;
  const halfDoor = (DOOR_W / 2 + 0.15) / radius;

  for (let i = 0; i < n; i++) {
    const door = sorted[i];
    addOrientedDoor(group, mats, door, wallR, height, triggers);

    const next = sorted[(i + 1) % n];
    let arcStart = door.angle + halfDoor;
    let arcEnd = next.angle - halfDoor;
    if (i === n - 1) arcEnd += Math.PI * 2;
    const arcSpan = arcEnd - arcStart;
    if (arcSpan < 0.08) continue;

    const mid = arcStart + arcSpan / 2;
    const panelW = wallR * arcSpan;
    buildWallPanel(group, mats, mid, wallR, panelW, height);

    const p1 = wallPoint(arcStart, wallR, 0);
    const p2 = wallPoint(arcEnd, wallR, 0);
    segments.push({ ax: p1.x, az: p1.z, bx: p2.x, bz: p2.z });
  }
}

function buildWallPanel(group, mats, angle, radius, panelW, height) {
  const rotY = facingYaw(angle);
  const normalIn = inwardNormal(angle);
  const center = wallPoint(angle, radius, 0);

  const wainscot = new THREE.Mesh(
    new THREE.PlaneGeometry(panelW, WAINSCOT_H),
    mats.wainscotMat,
  );
  applyWorldUVs(wainscot.geometry, panelW, WAINSCOT_H, WAINSCOT_TILE_W, WAINSCOT_H);
  wainscot.position.copy(center);
  wainscot.position.y = WAINSCOT_H / 2;
  wainscot.rotation.y = rotY;
  group.add(wainscot);

  const upperH = height - WAINSCOT_H;
  const upper = new THREE.Mesh(
    new THREE.PlaneGeometry(panelW, upperH),
    mats.wallMat,
  );
  applyWorldUVs(upper.geometry, panelW, upperH, DAMASK_TILE_W, DAMASK_TILE_H);
  upper.position.copy(center);
  upper.position.y = WAINSCOT_H + upperH / 2;
  upper.rotation.y = rotY;
  group.add(upper);

  addBar(group, mats.baseboardMat, center, panelW, BASEBOARD_H, BASEBOARD_PROUD, BASEBOARD_H / 2, normalIn, rotY);
  addBar(group, mats.trimMat, center, panelW, CHAIR_RAIL_H, CHAIR_RAIL_PROUD, WAINSCOT_H + CHAIR_RAIL_H / 2, normalIn, rotY);
}

function addOrientedDoor(group, mats, door, radius, height, triggers) {
  const { angle, label, destination } = door;
  const rotY = facingYaw(angle);
  const normalIn = inwardNormal(angle);
  const tangent = tangentVector(angle);
  const wallCenter = wallPoint(angle, radius, 0);
  const lintelH = height - DOOR_H;

  const lintel = new THREE.Mesh(
    new THREE.PlaneGeometry(DOOR_W, lintelH),
    mats.wallMat,
  );
  applyWorldUVs(lintel.geometry, DOOR_W, lintelH, DAMASK_TILE_W, DAMASK_TILE_H);
  lintel.position.copy(wallCenter);
  lintel.position.y = DOOR_H + lintelH / 2;
  lintel.rotation.y = rotY;
  group.add(lintel);

  addDoorFrame(group, mats, wallCenter, rotY, normalIn, tangent);
  addDoorPortal(group, mats, wallCenter, rotY, normalIn, tangent);
  if (label) {
    const sign = createDoorSignMesh({ label, lintelH: height - DOOR_H });
    sign.position.copy(wallCenter);
    sign.position.y = DOOR_H + lintelH / 2;
    sign.position.add(normalIn.clone().multiplyScalar(0.055));
    sign.rotation.y = rotY;
    group.add(sign);
  }

  triggers.push(makeRadialTrigger(wallCenter, normalIn, tangent, destination));
}

function addDoorFrame(group, mats, center, rotY, normalIn, tangent) {
  const offset = normalIn.clone().multiplyScalar(0.03);
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(DOOR_W + 2 * FW, FW, 0.1),
    mats.frameMat,
  );
  top.position.copy(center);
  top.position.y = DOOR_H + FW / 2;
  top.position.add(offset);
  top.rotation.y = rotY;
  group.add(top);

  const sideGeo = new THREE.BoxGeometry(FW, DOOR_H, 0.1);
  for (const dir of [-1, 1]) {
    const jamb = new THREE.Mesh(sideGeo, mats.frameMat);
    jamb.position.copy(center);
    jamb.position.y = DOOR_H / 2;
    jamb.position.add(tangent.clone().multiplyScalar(dir * (DOOR_W / 2 + FW / 2)));
    jamb.position.add(offset);
    jamb.rotation.y = rotY;
    group.add(jamb);
  }
}

function addDoorPortal(group, mats, center, rotY, normalIn, tangent) {
  const recessDepth = 0.38;
  const portalCenter = center.clone();
  portalCenter.y = DOOR_H / 2;
  portalCenter.add(normalIn.clone().multiplyScalar(0.04));

  const recessMat = new THREE.MeshStandardMaterial({
    color: 0x24160e,
    roughness: 0.92,
    metalness: 0.04,
  });
  const doorLeafMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a22,
    roughness: 0.72,
    metalness: 0.08,
  });

  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(DOOR_W * 0.88, DOOR_H * 0.92),
    getPortalGlowMaterial(),
  );
  back.position.copy(portalCenter);
  back.position.add(normalIn.clone().multiplyScalar(recessDepth * 0.92));
  back.rotation.y = rotY + Math.PI;
  group.add(back);

  const sideDepth = recessDepth * 0.55;
  for (const dir of [-1, 1]) {
    const side = new THREE.Mesh(
      new THREE.BoxGeometry(FW * 0.7, DOOR_H * 0.94, sideDepth),
      recessMat,
    );
    side.position.copy(portalCenter);
    side.position.add(tangent.clone().multiplyScalar(dir * (DOOR_W / 2 - FW * 0.2)));
    side.position.add(normalIn.clone().multiplyScalar(0.04 + sideDepth / 2));
    side.rotation.y = rotY;
    group.add(side);
  }

  const leafW = DOOR_W / 2 - 0.12;
  const leafH = DOOR_H - 0.18;
  const openAngle = 0.42;
  for (const dir of [-1, 1]) {
    const leaf = new THREE.Mesh(
      new THREE.BoxGeometry(leafW, leafH, 0.07),
      doorLeafMat,
    );
    leaf.position.copy(portalCenter);
    leaf.position.add(tangent.clone().multiplyScalar(dir * (DOOR_W / 4)));
    leaf.position.add(normalIn.clone().multiplyScalar(0.12));
    leaf.rotation.y = rotY + dir * openAngle;
    group.add(leaf);
  }
}

function addBar(group, material, center, length, barH, proud, yCenter, normalIn, rotY) {
  const bar = new THREE.Mesh(new THREE.BoxGeometry(length, barH, proud), material);
  bar.position.copy(center);
  bar.position.y = yCenter;
  bar.position.add(normalIn.clone().multiplyScalar(proud / 2));
  bar.rotation.y = rotY;
  group.add(bar);
}

function makeRadialTrigger(wallCenter, normalIn, tangent, destination) {
  const halfW = DOOR_W / 2 + 0.12;
  const pNear = wallCenter.clone().add(normalIn.clone().multiplyScalar(0.25));
  const pFar = wallCenter.clone().add(normalIn.clone().multiplyScalar(1.5));
  const corners = [
    pNear.clone().add(tangent.clone().multiplyScalar(-halfW)),
    pNear.clone().add(tangent.clone().multiplyScalar(halfW)),
    pFar.clone().add(tangent.clone().multiplyScalar(-halfW)),
    pFar.clone().add(tangent.clone().multiplyScalar(halfW)),
  ];
  return {
    minX: Math.min(...corners.map((p) => p.x)),
    maxX: Math.max(...corners.map((p) => p.x)),
    minZ: Math.min(...corners.map((p) => p.z)),
    maxZ: Math.max(...corners.map((p) => p.z)),
    destination,
  };
}

function wallPoint(angle, radius, y) {
  return new THREE.Vector3(
    radius * Math.sin(angle),
    y,
    -radius * Math.cos(angle),
  );
}

function inwardNormal(angle) {
  return new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
}

function tangentVector(angle) {
  return new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
}

function facingYaw(angle) {
  return Math.atan2(-Math.sin(angle), Math.cos(angle));
}

function angleDistance(a, b) {
  let d = Math.abs(a - b) % (Math.PI * 2);
  return d > Math.PI ? Math.PI * 2 - d : d;
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
