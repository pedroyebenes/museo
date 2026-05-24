import * as THREE from 'three';
import { buildRoomShell } from './wallBuilder.js';
import { getSharedMaterials } from './materials.js';

const HEIGHT = 4;
const SPACE_PER_PAINTING = 3.5;
const MIN_SIDE = 6; // a 6x6 cabinet for a single-painting room
const PAINTING_Y = 1.6;

// Builds an author room: paintings on N/E/W walls, one door on the S wall
// that leads back to the hub. Returns slots/segments/triggers/spawn.
export function buildAuthorRoom(scene, config) {
  const { author, paintingCount, bio = null } = config;

  // Distribute paintings across 3 walls (N, E, W)
  const counts = distribute3(paintingCount); // { N, E, W }
  const perWallMax = Math.max(counts.N, counts.E, counts.W, 1);
  // Room scales with painting count: each painting consumes SPACE_PER_PAINTING
  // along its wall (plus corner padding). MIN_SIDE keeps single-piece galleries
  // from being claustrophobic.
  const side = Math.max(MIN_SIDE, perWallMax * SPACE_PER_PAINTING + 2.5);
  const width = side;
  const depth = side;

  const group = new THREE.Group();
  group.name = `room:${author}`;

  const { segments, triggers } = buildRoomShell(group, {
    width,
    depth,
    height: HEIGHT,
    walls: [
      { side: 'N', doors: [] },
      { side: 'E', doors: [] },
      { side: 'W', doors: [] },
      {
        side: 'S',
        doors: [
          {
            position: 0,
            label: 'Hall principal',
            arrow: '←',
            destination: { kind: 'hub' },
          },
        ],
      },
    ],
  });

  // Slots
  const slots = [];
  if (counts.N > 0) {
    layoutSlots(slots, {
      count: counts.N,
      wallLength: width,
      fixedAxis: 'z',
      fixedValue: -depth / 2 + 0.05,
      normal: new THREE.Vector3(0, 0, 1),
      rotY: 0,
    });
  }
  if (counts.E > 0) {
    layoutSlots(slots, {
      count: counts.E,
      wallLength: depth,
      fixedAxis: 'x',
      fixedValue: width / 2 - 0.05,
      normal: new THREE.Vector3(-1, 0, 0),
      rotY: -Math.PI / 2,
    });
  }
  if (counts.W > 0) {
    layoutSlots(slots, {
      count: counts.W,
      wallLength: depth,
      fixedAxis: 'x',
      fixedValue: -width / 2 + 0.05,
      normal: new THREE.Vector3(1, 0, 0),
      rotY: Math.PI / 2,
    });
  }

  // Author plaque on the floor near the entrance
  addAuthorPlaque(group, author, depth);

  // Biographical placard mounted on the S wall, beside the door, facing into
  // the room. The visitor reads it when turning back toward the exit.
  if (bio) addAuthorBioPlaque(group, author, bio, depth);

  // Gentle hemisphere fill so the room isn't pitch black between spotlights
  addRoomLights(group, width, depth);

  scene.add(group);

  return {
    group,
    slots,
    segments,
    triggers,
    dimensions: { width, depth, height: HEIGHT },
    author,
    kind: 'author',
    spawn: {
      // Coming from the hub through the S door, face -Z (into the room)
      fromHub: {
        position: new THREE.Vector3(0, PAINTING_Y, depth / 2 - 2.8),
        yaw: 0,
      },
      initial: {
        position: new THREE.Vector3(0, PAINTING_Y, depth / 2 - 2.8),
        yaw: 0,
      },
    },
  };
}

function distribute3(n) {
  // Round-robin order: N gets the first (biggest), then E, then W.
  const N = Math.ceil(n / 3);
  const E = Math.ceil((n - N) / 2);
  const W = n - N - E;
  return { N, E, W };
}

function layoutSlots(slots, opts) {
  const { count, wallLength, fixedAxis, fixedValue, normal, rotY } = opts;
  const usable = wallLength - 2;
  const step = usable / count;
  const start = -usable / 2 + step / 2;
  for (let i = 0; i < count; i++) {
    const along = start + i * step;
    const position =
      fixedAxis === 'x'
        ? new THREE.Vector3(fixedValue, PAINTING_Y, along)
        : new THREE.Vector3(along, PAINTING_Y, fixedValue);
    slots.push({ position, normal: normal.clone(), rotationY: rotY });
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
  // Place near the centre, oriented so it reads when entering from the hub
  plaque.position.set(0, 0.012, 0.5);
  plaque.rotation.z = Math.PI; // text faces the entering visitor
  group.add(plaque);
}

function addRoomLights(group, width, depth) {
  // Soft fill so the gallery isn't dependent on spotlights only.
  const point = new THREE.PointLight(0xfff1d8, 0.65, Math.max(width, depth) * 1.4, 1.6);
  point.position.set(0, HEIGHT - 0.4, 0);
  group.add(point);
}

function addAuthorBioPlaque(group, author, bio, depth) {
  const W_PX = 820;
  const H_PX = 1080;
  const c = document.createElement('canvas');
  c.width = W_PX;
  c.height = H_PX;
  const ctx = c.getContext('2d');

  // Background — dark with a double gilded border
  ctx.fillStyle = '#0c0907';
  ctx.fillRect(0, 0, W_PX, H_PX);
  ctx.strokeStyle = '#c7a060';
  ctx.lineWidth = 10;
  ctx.strokeRect(12, 12, W_PX - 24, H_PX - 24);
  ctx.lineWidth = 2;
  ctx.strokeRect(34, 34, W_PX - 68, H_PX - 68);

  // Title — author full name
  let y = 100;
  ctx.fillStyle = '#f0dca0';
  ctx.font = 'italic 600 56px Georgia, "Times New Roman", serif';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'center';
  const title = bio.fullName || author;
  y = drawWrappedText(ctx, title, W_PX / 2, y, W_PX - 120, 64);

  // Years
  ctx.fillStyle = '#c9a067';
  ctx.font = '400 34px Georgia, serif';
  y += 24;
  ctx.fillText(bio.years || '', W_PX / 2, y);
  y += 50;

  // Origin
  if (bio.origin) {
    ctx.fillStyle = '#a98a52';
    ctx.font = 'italic 26px Georgia, serif';
    y = drawWrappedText(ctx, bio.origin, W_PX / 2, y, W_PX - 140, 36);
    y += 12;
  }

  // Separator
  ctx.strokeStyle = '#c7a060';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(180, y + 16);
  ctx.lineTo(W_PX - 180, y + 16);
  ctx.stroke();
  y += 48;

  // Bio paragraph
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
  const h = w * (H_PX / W_PX); // ~1.71m
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: false });
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  // Mount on the S wall, 1.8m to the left of the door (player's right when
  // standing at the door looking into the room), centred at eye level.
  plaque.position.set(-1.85, h / 2 + 0.25, depth / 2 - 0.07);
  plaque.rotation.y = Math.PI; // face -Z, into the room
  group.add(plaque);
}

// Draws word-wrapped text starting at (x, y). Returns the final y after the
// last line. For centred text pass an x that's the centre of the line span.
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
