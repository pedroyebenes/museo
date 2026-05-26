import * as THREE from 'three';
import { getQualityProfile } from './qualityProfile.js';
import { buildRoomShell } from './wallBuilder.js';
import { getAuthorRoomMaterials } from './materials.js';
import {
  getPaintingLayoutExtents,
  computePaintingCenterY,
  PAINTING_LAYOUT,
} from './paintings.js';

const MIN_HEIGHT = 4;
const MIN_SIDE = 6;
const SPACE_PER_PAINTING = 3.5;
const DEFAULT_PAINTING_Y = 1.6;
const PAINTING_VIEW_DISTANCE = 2.0;

// Builds an author room: paintings on N/E/W walls, one door on the S wall
// that leads back to the hub. Returns slots/segments/triggers/spawn.
export function buildAuthorRoom(scene, config) {
  const {
    author,
    authorId = author,
    categoryId = null,
    categoryLabel = 'Categoría',
    paintings = [],
    bio = null,
    exitDoorInfo = null,
  } = config;

  const walls = partitionPaintings(paintings);
  const perWallMax = Math.max(
    walls.N.length,
    walls.E.length,
    walls.W.length,
    1,
  );

  const countSide = perWallMax * SPACE_PER_PAINTING + 2.5;
  const widthSide = Math.max(
    MIN_SIDE,
    countSide,
    wallSpanNeeded(walls.N),
    wallSpanNeeded(walls.E),
    wallSpanNeeded(walls.W),
  );
  const height = Math.max(MIN_HEIGHT, roomHeightNeeded(paintings));

  const width = widthSide;
  const depth = widthSide;

  const group = new THREE.Group();
  group.name = `room:author:${authorId}`;
  const exitDestination = categoryId
    ? { kind: 'category', categoryId }
    : { kind: 'hub' };

  const { segments, triggers, doorInteractables } = buildRoomShell(group, {
    width,
    depth,
    height,
    materials: getAuthorRoomMaterials(author),
    domeCeiling: true,
    walls: [
      { side: 'N', doors: [] },
      { side: 'E', doors: [] },
      { side: 'W', doors: [] },
      {
        side: 'S',
        doors: [
          {
            position: 0,
            label: categoryId ? categoryLabel : 'Hall principal',
            arrow: '←',
            signShape: 'return',
            textColor: '#9ee7ff',
            borderColor: '#4fb6d8',
            destination: exitDestination,
            doorInfo: exitDoorInfo,
          },
        ],
      },
    ],
  });

  const slots = [];
  if (walls.N.length > 0) {
    layoutSlots(slots, {
      paintings: walls.N,
      wallLength: width,
      fixedAxis: 'z',
      fixedValue: -depth / 2 + 0.05,
      normal: new THREE.Vector3(0, 0, 1),
      rotY: 0,
    });
  }
  if (walls.E.length > 0) {
    layoutSlots(slots, {
      paintings: walls.E,
      wallLength: depth,
      fixedAxis: 'x',
      fixedValue: width / 2 - 0.05,
      normal: new THREE.Vector3(-1, 0, 0),
      rotY: -Math.PI / 2,
    });
  }
  if (walls.W.length > 0) {
    layoutSlots(slots, {
      paintings: walls.W,
      wallLength: depth,
      fixedAxis: 'x',
      fixedValue: -width / 2 + 0.05,
      normal: new THREE.Vector3(1, 0, 0),
      rotY: Math.PI / 2,
    });
  }

  addAuthorPlaque(group, author, depth);
  if (bio) addAuthorBioPlaque(group, author, bio, depth);
  addRoomLights(group, width, depth, height);

  scene.add(group);

  const spawnZ = depth / 2 - Math.min(2.8, depth * 0.22);
  const defaultSpawn = {
    position: new THREE.Vector3(0, DEFAULT_PAINTING_Y, spawnZ),
    yaw: 0,
  };
  return {
    group,
    slots,
    segments,
    triggers,
    doorInteractables,
    dimensions: { width, depth, height },
    author,
    authorId,
    categoryId,
    kind: 'author',
    spawn: {
      fromCategory: defaultSpawn,
      fromHub: defaultSpawn,
      initial: defaultSpawn,
      ...buildPaintingSpawns(slots, paintings),
    },
  };
}

function buildPaintingSpawns(slots, paintings) {
  const spawns = {};
  for (let i = 0; i < paintings.length; i++) {
    const slot = slots[i];
    if (!slot) continue;
    const pos = slot.position
      .clone()
      .add(slot.normal.clone().multiplyScalar(PAINTING_VIEW_DISTANCE));
    pos.y = DEFAULT_PAINTING_Y;
    const yaw = Math.atan2(-slot.normal.x, -slot.normal.z);
    spawns[`atPainting:${paintings[i].id}`] = { position: pos, yaw };
  }
  return spawns;
}

function partitionPaintings(paintings) {
  const counts = distribute3(paintings.length);
  let idx = 0;
  const walls = { N: [], E: [], W: [] };
  for (const side of ['N', 'E', 'W']) {
    for (let i = 0; i < counts[side]; i++) {
      walls[side].push(paintings[idx++]);
    }
  }
  return walls;
}

function wallSpanNeeded(paintingsOnWall) {
  if (paintingsOnWall.length === 0) return 0;

  const { wallPadding, paintingGap } = PAINTING_LAYOUT;
  const widths = paintingsOnWall.map(
    (p) => getPaintingLayoutExtents(p).width,
  );
  const sum = widths.reduce((total, w) => total + w, 0);
  const gaps = Math.max(0, paintingsOnWall.length - 1) * paintingGap;
  return sum + gaps + wallPadding * 2;
}

function roomHeightNeeded(paintings) {
  const { ceilingClearance } = PAINTING_LAYOUT;
  let maxTop = MIN_HEIGHT;

  for (const painting of paintings) {
    const { canvasH } = getPaintingLayoutExtents(painting);
    const y = computePaintingCenterY(canvasH);
    const top =
      y + canvasH / 2 + PAINTING_LAYOUT.frameThickness + ceilingClearance;
    maxTop = Math.max(maxTop, top);
  }

  return maxTop;
}

function distribute3(n) {
  const N = Math.ceil(n / 3);
  const E = Math.ceil((n - N) / 2);
  const W = n - N - E;
  return { N, E, W };
}

function layoutSlots(slots, opts) {
  const { paintings, wallLength, fixedAxis, fixedValue, normal, rotY } = opts;
  const { paintingGap } = PAINTING_LAYOUT;

  const sizes = paintings.map((p) => {
    const { width, canvasH } = getPaintingLayoutExtents(p);
    return { w: width, h: canvasH };
  });

  const totalWidth =
    sizes.reduce((sum, size) => sum + size.w, 0) +
    Math.max(0, paintings.length - 1) * paintingGap;
  let along = -totalWidth / 2;

  for (let i = 0; i < paintings.length; i++) {
    const { w, h } = sizes[i];
    along += w / 2;
    const y = computePaintingCenterY(h);
    const position =
      fixedAxis === 'x'
        ? new THREE.Vector3(fixedValue, y, along)
        : new THREE.Vector3(along, y, fixedValue);
    slots.push({ position, normal: normal.clone(), rotationY: rotY });
    along += w / 2 + paintingGap;
  }
}

function addAuthorPlaque(group, author, depth) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#c7a060';
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
  plaque.position.set(0, 0.012, 0.5);
  plaque.rotation.z = Math.PI;
  group.add(plaque);
}

function addRoomLights(group, width, depth, height) {
  const point = new THREE.PointLight(
    0xfff1d8,
    0.45,
    Math.max(width, depth) * 1.4,
    1.6,
  );
  point.position.set(0, height - 0.4, 0);
  group.add(point);
}

function addAuthorBioPlaque(group, author, bio, depth) {
  const { isMobile } = getQualityProfile();
  const W_PX = isMobile ? 560 : 820;
  const H_PX = isMobile ? 740 : 1080;
  const c = document.createElement('canvas');
  c.width = W_PX;
  c.height = H_PX;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#0c0907';
  ctx.fillRect(0, 0, W_PX, H_PX);
  ctx.strokeStyle = '#c7a060';
  ctx.lineWidth = 10;
  ctx.strokeRect(12, 12, W_PX - 24, H_PX - 24);
  ctx.lineWidth = 2;
  ctx.strokeRect(34, 34, W_PX - 68, H_PX - 68);

  let y = 100;
  ctx.fillStyle = '#f0dca0';
  ctx.font = 'italic 600 56px Georgia, "Times New Roman", serif';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  const title = bio.fullName || author;
  y = drawWrappedText(ctx, title, W_PX / 2, y, W_PX - 120, 64);

  ctx.fillStyle = '#c9a067';
  ctx.font = '400 34px Georgia, serif';
  y += 24;
  ctx.fillText(bio.years || '', W_PX / 2, y);
  y += 50;

  if (bio.origin) {
    ctx.fillStyle = '#a98a52';
    ctx.font = 'italic 26px Georgia, serif';
    y = drawWrappedText(ctx, bio.origin, W_PX / 2, y, W_PX - 140, 36);
    y += 12;
  }

  ctx.strokeStyle = '#c7a060';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(180, y + 16);
  ctx.lineTo(W_PX - 180, y + 16);
  ctx.stroke();
  y += 48;

  if (bio.bio) {
    ctx.fillStyle = '#ebe4d2';
    ctx.font = '400 26px Georgia, serif';
    ctx.textAlign = 'left';
    drawWrappedText(ctx, bio.bio, 80, y, W_PX - 160, 38);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const w = 1.3;
  const h = w * (H_PX / W_PX);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: false });
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  plaque.position.set(-1.85, h / 2 + 0.25, depth / 2 - 0.07);
  plaque.rotation.y = Math.PI;
  group.add(plaque);
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(/\s+/);
  let line = '';
  let curY = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = word;
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, curY);
    curY += lineHeight;
  }
  return curY;
}
