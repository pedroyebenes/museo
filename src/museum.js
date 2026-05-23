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
  const { author, paintingCount } = config;

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
        yaw: Math.PI,
      },
      initial: {
        position: new THREE.Vector3(0, PAINTING_Y, depth / 2 - 2.8),
        yaw: Math.PI,
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
