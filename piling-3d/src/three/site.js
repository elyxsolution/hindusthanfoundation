import * as THREE from 'three';
import { Parts, canvasTexture, rng, V3, lathe } from './kit.js';
import { heapGeometry } from './trucks.js';
import { BORE_D, BORE_R } from './world.js';

export const GROUND = { w: 240, d: 170 };

// ------------------------------------------------------------------------------------------------
// Ground: a wet, rutted mud plane painted procedurally (colour, roughness and bump from the same strokes),
// with real circular holes cut at every pile.
// ------------------------------------------------------------------------------------------------
function paintGround(piles, machines) {
  const W = 2048;
  const H = Math.round((W * GROUND.d) / GROUND.w);
  const px = (x) => ((x + GROUND.w / 2) / GROUND.w) * W;
  const pz = (z) => ((z + GROUND.d / 2) / GROUND.d) * H;
  const m = W / GROUND.w; // pixels per metre
  const r = rng(77);

  const mk = (draw, opts) => canvasTexture(W, H, draw, opts);
  const track = (g, pts, width, col, alpha = 1) => {
    g.strokeStyle = col;
    g.globalAlpha = alpha;
    g.lineWidth = width;
    g.lineCap = 'round';
    g.beginPath();
    pts.forEach(([x, z], i) => (i ? g.lineTo(px(x), pz(z)) : g.moveTo(px(x), pz(z))));
    g.stroke();
    g.globalAlpha = 1;
  };
  // a smooth path through points, sampled
  const curve = (pts, n = 60) => {
    const c = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'catmullrom', 0.5);
    return c.getPoints(n).map((p) => [p.x, p.z]);
  };
  const offsetPath = (pts, d) =>
    pts.map((p, i) => {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const l = Math.hypot(dx, dz) || 1;
      return [p[0] + (-dz / l) * d, p[1] + (dx / l) * d];
    });

  const paths = [
    curve([[-100, 22], [-70, 16], [-40, 20], [-10, 12], [20, 18], [60, 10], [100, 14]]),
    curve([[-100, 30], [-60, 26], [-30, 30], [5, 24], [40, 28], [100, 22]]),
    curve([[-46, 4], [-30, 14], [-10, 10], [6, 16], [30, 14], [48, 6]]),
    curve([[-30, -2], [-24, 8], [-14, 14], [-4, 8], [-12, -2], [-24, -8], [-30, -2]]),
    curve([[10, 2], [18, 12], [30, 16], [40, 8], [34, -2], [22, -6], [10, 2]]),
    curve([[-60, 36], [-30, 36], [0, 34], [30, 38], [70, 34]]),
    curve([[-60, -14], [-40, -16], [-20, -18], [0, -16], [24, -18], [50, -14]]),
    curve([[-8, 40], [-6, 26], [-2, 12], [-6, 2]]),
  ];

  const base = (g, w, h, c0, c1, speckle) => {
    g.fillStyle = c0;
    g.fillRect(0, 0, w, h);
    // broad tonal variation
    for (let i = 0; i < 220; i++) {
      const rad = 30 + r() * 180;
      const x = r() * w;
      const y = r() * h;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      const l = 24 + r() * 26;
      gr.addColorStop(0, `hsla(${22 + r() * 12},${32 + r() * 24}%,${l}%,0.3)`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    for (let i = 0; i < speckle; i++) {
      const l = 22 + r() * 36;
      g.fillStyle = `hsla(${22 + r() * 14},${28 + r() * 26}%,${l}%,${0.15 + r() * 0.35})`;
      g.beginPath();
      g.arc(r() * w, r() * h, 0.6 + r() * 2.8, 0, 6.3);
      g.fill();
    }
  };

  const puddles = [];
  const blob = (cx, cz, a, b, rot) => {
    // an irregular puddle is a cluster of overlapping ellipses
    const n = 3 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) puddles.push([cx + (r() - 0.5) * a * 1.1, cz + (r() - 0.5) * b * 1.4, a * (0.45 + r() * 0.5), b * (0.5 + r() * 0.5), rot + (r() - 0.5) * 0.6]);
  };
  for (let i = 0; i < 14; i++) blob(-90 + r() * 180, -12 + r() * 50, 2.2 + r() * 4, 0.8 + r() * 1.2, r() * 3);
  // puddles gather in the ruts near the front
  paths.slice(0, 3).forEach((p) => p.forEach((q, i) => i % 13 === 0 && blob(q[0], q[1], 1.6 + r() * 2.6, 0.7 + r() * 0.8, r() * 0.8)));

  const colour = mk((g, w, h) => {
    base(g, w, h, '#74583a', '#5a4934', 14000);
    paths.forEach((p) => {
      [-1.05, 1.05].forEach((o) => {
        track(g, offsetPath(p, o), 0.62 * m, '#3a2c20', 0.8);
        track(g, offsetPath(p, o + Math.sign(o) * 0.55), 0.32 * m, '#826c52', 0.55);
      });
      track(g, p, 1.1 * m, '#4c3a2a', 0.28);
    });
    // dark compacted pads under machines and around the piles
    machines.forEach(([x, z, rw, rh]) => {
      const gr = g.createRadialGradient(px(x), pz(z), 0, px(x), pz(z), rw * m);
      gr.addColorStop(0, 'rgba(46,34,24,0.7)');
      gr.addColorStop(1, 'rgba(46,34,24,0)');
      g.fillStyle = gr;
      g.save();
      g.translate(px(x), pz(z));
      g.scale(1, rh / rw);
      g.translate(-px(x), -pz(z));
      g.fillRect(px(x) - rw * m, pz(z) - rw * m, rw * m * 2, rw * m * 2);
      g.restore();
    });
    piles.forEach(([x, z]) => {
      const gr = g.createRadialGradient(px(x), pz(z), 0.5 * m, px(x), pz(z), 3.2 * m);
      gr.addColorStop(0, 'rgba(34,26,18,0.95)');
      gr.addColorStop(0.5, 'rgba(60,46,32,0.7)');
      gr.addColorStop(1, 'rgba(60,46,32,0)');
      g.fillStyle = gr;
      g.fillRect(px(x) - 3.4 * m, pz(z) - 3.4 * m, 6.8 * m, 6.8 * m);
    });
    puddles.forEach(([x, z, a, b, rot]) => {
      g.save();
      g.translate(px(x), pz(z));
      g.rotate(rot);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, a * m);
      gr.addColorStop(0, 'rgba(52,42,32,0.95)');
      gr.addColorStop(0.7, 'rgba(58,46,34,0.9)');
      gr.addColorStop(1, 'rgba(86,66,46,0)');
      g.fillStyle = gr;
      g.scale(1, b / a);
      g.beginPath();
      g.arc(0, 0, a * m, 0, 6.3);
      g.fill();
      g.restore();
    });
  });

  const rough = mk(
    (g, w, h) => {
      base(g, w, h, '#e6e6e6', '#d0d0d0', 8000);
      g.globalCompositeOperation = 'source-over';
      paths.forEach((p) => [-1.05, 1.05].forEach((o) => track(g, offsetPath(p, o), 0.5 * m, '#9a9a9a', 0.8)));
      puddles.forEach(([x, z, a, b, rot]) => {
        g.save();
        g.translate(px(x), pz(z));
        g.rotate(rot);
        g.scale(1, b / a);
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, a * m);
        gr.addColorStop(0, '#2a2a2a');
        gr.addColorStop(0.6, '#303030');
        gr.addColorStop(1, 'rgba(230,230,230,0)');
        g.fillStyle = gr;
        g.beginPath();
        g.arc(0, 0, a * m, 0, 6.3);
        g.fill();
        g.restore();
      });
    },
    { srgb: false }
  );

  const bump = mk(
    (g, w, h) => {
      g.fillStyle = '#808080';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 22000; i++) {
        const v = 100 + r() * 60;
        g.fillStyle = `rgba(${v},${v},${v},${0.08 + r() * 0.16})`;
        g.beginPath();
        g.arc(r() * w, r() * h, 0.6 + r() * 3.4, 0, 6.3);
        g.fill();
      }
      paths.forEach((p) => [-1.05, 1.05].forEach((o) => track(g, offsetPath(p, o), 0.6 * m, '#2c2c2c', 0.9)));
      paths.forEach((p) => [-1.05, 1.05].forEach((o) => track(g, offsetPath(p, o + Math.sign(o) * 0.55), 0.3 * m, '#bcbcbc', 0.8)));
      puddles.forEach(([x, z, a, b, rot]) => {
        g.save();
        g.translate(px(x), pz(z));
        g.rotate(rot);
        g.scale(1, b / a);
        g.fillStyle = '#7a7a7a';
        g.beginPath();
        g.arc(0, 0, a * m * 0.95, 0, 6.3);
        g.fill();
        g.restore();
      });
    },
    { srgb: false }
  );
  return { colour, rough, bump };
}

// Ground UVs come from world position, so lids and the ground itself sample the same texture.
export function worldUV(geo) {
  const uv = geo.attributes.uv;
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + GROUND.w / 2) / GROUND.w, 1 - (pos.getZ(i) + GROUND.d / 2) / GROUND.d);
  uv.needsUpdate = true;
}
// shape y = -world z (the plane is rotated -90 degrees about X)
function rectPath(r) {
  const p = new THREE.Path();
  p.moveTo(r.x0, -r.z0);
  p.lineTo(r.x1, -r.z0);
  p.lineTo(r.x1, -r.z1);
  p.lineTo(r.x0, -r.z1);
  p.closePath();
  return p;
}

export function buildGround(M, pilePositions, machineSpots, rectHoles = []) {
  const tex = paintGround(pilePositions.concat(rectHoles.map((r) => [r.pile.x, r.pile.z])), machineSpots);
  const shape = new THREE.Shape();
  shape.moveTo(-GROUND.w / 2, -GROUND.d / 2);
  shape.lineTo(GROUND.w / 2, -GROUND.d / 2);
  shape.lineTo(GROUND.w / 2, GROUND.d / 2);
  shape.lineTo(-GROUND.w / 2, GROUND.d / 2);
  shape.lineTo(-GROUND.w / 2, -GROUND.d / 2);
  pilePositions.forEach(([x, z]) => {
    const h = new THREE.Path();
    // shape y = -world z (the plane is rotated -90° about X)
    h.absarc(x, -z, 0.62, 0, Math.PI * 2, true);
    shape.holes.push(h);
  });
  rectHoles.forEach((r) => shape.holes.push(rectPath(r)));
  const geo = new THREE.ShapeGeometry(shape, 24);
  geo.rotateX(-Math.PI / 2);
  worldUV(geo);

  const mat = new THREE.MeshStandardMaterial({ map: tex.colour, roughnessMap: tex.rough, roughness: 1, bumpMap: tex.bump, bumpScale: 4, metalness: 0, envMapIntensity: 0.9 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.userData.isGround = true;
  return mesh;
}

// ------------------------------------------------------------------------------------------------
// Bores: the open shafts, steel casing collar, spoil berm and a sliding safety cover.
// ------------------------------------------------------------------------------------------------
function shaftTexture() {
  const r = rng(5);
  return canvasTexture(128, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#6e5a42');
    gr.addColorStop(0.12, '#5a4733');
    gr.addColorStop(0.45, '#3d2f22');
    gr.addColorStop(1, '#0d0a07');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1800; i++) {
      g.fillStyle = `rgba(${40 + r() * 60},${30 + r() * 40},${20 + r() * 26},${0.1 + r() * 0.3})`;
      g.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 3);
    }
    // strata bands
    [0.1, 0.22, 0.4, 0.62].forEach((y, i) => {
      g.fillStyle = i % 2 ? 'rgba(130,100,70,0.18)' : 'rgba(30,22,16,0.22)';
      g.fillRect(0, y * h, w, 10 + r() * 16);
    });
  });
}

export function buildBore(M, shaftMat, { cover = true, collar = true } = {}) {
  const g = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(BORE_R, BORE_R, BORE_D, 28, 1, true), shaftMat);
  tube.position.y = -BORE_D / 2;
  tube.receiveShadow = false;
  g.add(tube);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(BORE_R, 24), new THREE.MeshBasicMaterial({ color: '#0c0906' }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -BORE_D + 0.01;
  g.add(floor);
  if (collar) {
    const P = new Parts();
    // steel casing collar above and just inside the ground
    P.cyl(M.steelDark, 0.63, 0.63, 0.7, 0, 0.3, 0, 0, 0, 0, 28, true);
    P.cyl(M.steelDark, 0.5, 0.5, 0.7, 0, 0.3, 0, 0, 0, 0, 28, true);
    const ring = new THREE.RingGeometry(0.5, 0.64, 28);
    ring.rotateX(-Math.PI / 2);
    P.push(M.steel, ring, new THREE.Matrix4().makeTranslation(0, 0.65, 0));
    // spoil berm
    P.place(M.mud, new THREE.TorusGeometry(0.95, 0.24, 8, 28), 0, 0.12, 0, Math.PI / 2, 0, 0, 1, 1, 0.6);
    g.add(P.build());
  }

  const plate = new THREE.Group();
  const PP = new Parts();
  PP.box(M.steel, 1.7, 0.07, 1.7, 0, 0, 0);
  PP.box(M.yellow, 1.7, 0.075, 0.2, 0, 0, 0.75);
  PP.box(M.yellow, 1.7, 0.075, 0.2, 0, 0, -0.75);
  PP.rod(M.steelBlack, -0.3, 0.1, 0, 0.3, 0.1, 0, 0.025);
  plate.add(PP.build());
  plate.position.set(2.6, 0.72, 0);
  plate.visible = cover;
  g.add(plate);
  // the open shaft can be shown only as deep as the tool has bored so far
  function setDepth(d) {
    const k = Math.max(d, 0.001);
    tube.scale.y = k / BORE_D;
    tube.position.y = -k / 2;
    floor.position.y = -k + 0.01;
    tube.visible = d > 0.03;
    floor.visible = d > 0.03;
  }
  return { group: g, plate, setDepth };
}

export function makeShaftMaterial() {
  const tex = shaftTexture();
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 1, side: THREE.BackSide });
}

// ------------------------------------------------------------------------------------------------
// Dressing: soil heaps, hoarding, barriers, cones, skyline and a half-built frame.
// ------------------------------------------------------------------------------------------------
export function buildHeap(M, x, z, sx, sy, sz, seed = 1, rot = 0) {
  const m = new THREE.Mesh(heapGeometry(seed, 4), M.mud);
  m.position.set(x, 0, z);
  m.scale.set(sx, sy, sz);
  m.rotation.y = rot;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function corrugationTexture() {
  return canvasTexture(
    64,
    32,
    (g, w, h) => {
      g.fillStyle = '#8397ab';
      g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 16) {
        const gr = g.createLinearGradient(x, 0, x + 16, 0);
        gr.addColorStop(0, '#9fb0c2');
        gr.addColorStop(0.5, '#6f8296');
        gr.addColorStop(1, '#9fb0c2');
        g.fillStyle = gr;
        g.fillRect(x, 0, 16, h);
      }
    },
    { repeat: true }
  );
}

export function buildHoarding(M) {
  const g = new THREE.Group();
  const tex = corrugationTexture();
  const mk = (len, h) => {
    const t = tex.clone();
    t.needsUpdate = true;
    t.repeat.set(len / 0.7, 1);
    const mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, metalness: 0.55, envMapIntensity: 0.9 });
    return new THREE.Mesh(new THREE.PlaneGeometry(len, h), mat);
  };
  const back = mk(GROUND.w - 4, 2.6);
  back.position.set(0, 1.3, -GROUND.d / 2 + 8);
  back.castShadow = true;
  back.receiveShadow = true;
  g.add(back);
  const P = new Parts();
  const z = -GROUND.d / 2 + 8;
  for (let x = -GROUND.w / 2 + 2; x <= GROUND.w / 2 - 2; x += 2.6) P.box(M.hoardingPost, 0.14, 2.75, 0.14, x, 1.37, z + 0.1);
  P.box(M.hoardingPost, GROUND.w - 4, 0.12, 0.14, 0, 2.62, z + 0.1);
  g.add(P.build());
  return g;
}

export function buildBarriers(M, x0, x1, z) {
  const P = new Parts();
  const n = Math.round((x1 - x0) / 2.2);
  const step = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const xa = x0 + i * step;
    const xb = xa + step;
    [xa, xb].forEach((x) => {
      P.cyl(M.steelBlack, 0.032, 0.032, 1.15, x, 0.6, z, 0, 0, 0, 8);
      P.box(M.steelBlack, 0.06, 0.06, 0.7, x, 0.04, z);
    });
    [1.05, 0.62].forEach((y) => {
      const segs = 8;
      for (let k = 0; k < segs; k++) {
        const a = xa + (step * k) / segs;
        const b = xa + (step * (k + 1)) / segs;
        P.box(k % 2 ? M.barrierWhite : M.barrierRed, b - a, 0.14, 0.045, (a + b) / 2, y, z);
      }
    });
    P.rod(M.steelBlack, xa, 0.3, z, xb, 0.3, z, 0.014);
  }
  return P.build();
}

export function buildCones(M, spots) {
  const P = new Parts();
  spots.forEach(([x, z]) => {
    P.box(M.steelBlack, 0.46, 0.04, 0.46, x, 0.02, z);
    P.place(M.cone, new THREE.ConeGeometry(0.17, 0.66, 14), x, 0.37, z);
    P.cyl(M.coneWhite, 0.1, 0.12, 0.12, x, 0.35, z, 0, 0, 0, 14);
  });
  return P.build();
}

function windowTexture(seed, tint, win) {
  const r = rng(seed);
  return canvasTexture(
    128,
    256,
    (g, w, h) => {
      g.fillStyle = tint;
      g.fillRect(0, 0, w, h);
      for (let y = 5; y < h - 5; y += 10) {
        for (let x = 5; x < w - 5; x += 10) {
          const l = r();
          g.fillStyle = l > 0.1 ? win : 'rgba(255,238,200,0.85)';
          g.globalAlpha = 0.55 + r() * 0.35;
          g.fillRect(x, y, 6, 6);
        }
      }
      g.globalAlpha = 1;
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, 'rgba(255,255,255,0.12)');
      gr.addColorStop(1, 'rgba(0,0,0,0.1)');
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
    },
    { repeat: true }
  );
}

export function buildSkyline() {
  const g = new THREE.Group();
  const r = rng(404);
  const looks = [
    ['#b3b9c1', '#56697f'],
    ['#c4bfb6', '#5d6c7d'],
    ['#a9b2bd', '#4c6078'],
    ['#bdb5a8', '#65707c'],
    ['#9ea8b4', '#46586c'],
  ];
  const mats = looks.map(([t, w], i) => new THREE.MeshStandardMaterial({ map: windowTexture(40 + i, t, w), color: '#8f9aa9', roughness: 0.9, metalness: 0, envMapIntensity: 0.3 }));
  for (let i = 0; i < 90; i++) {
    const w = 12 + r() * 24;
    const d = 14 + r() * 22;
    const h = 14 + r() * r() * 56;
    const x = -420 + r() * 840;
    const z = -230 - r() * 220;
    const base = mats[i % mats.length];
    const mat = base.clone();
    mat.map = base.map.clone();
    mat.map.needsUpdate = true;
    mat.map.repeat.set(Math.max(1, Math.round(w / 12)), Math.max(1, Math.round(h / 18)));
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    b.position.set(x, h / 2, z);
    g.add(b);
    if (r() > 0.55) {
      const t = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, h * 0.22, d * 0.6), mat);
      t.position.set(x, h + h * 0.11, z);
      g.add(t);
    }
  }
  return g;
}

// A half-built RCC frame: columns, slabs, a few shuttering panels and green net.
export function buildFrame(M) {
  const P = new Parts();
  const concrete = M.concreteDry;
  const floors = 6;
  const FH = 3.4;
  const cols = [0, 1, 2, 3, 4];
  const rows = [0, 1, 2];
  const sx = 6;
  const sz = 6.2;
  for (let f = 0; f < floors; f++) {
    cols.forEach((i) => rows.forEach((j) => P.box(concrete, 0.5, FH, 0.5, i * sx, f * FH + FH / 2, j * sz)));
    if (f > 0 || true) P.box(concrete, sx * 4 + 1.2, 0.26, sz * 2 + 1.2, sx * 2, (f + 1) * FH, sz);
    // beams
    rows.forEach((j) => P.box(concrete, sx * 4, 0.5, 0.3, sx * 2, (f + 1) * FH - 0.35, j * sz));
  }
  // rebar starters on the top slab
  cols.forEach((i) => rows.forEach((j) => [[-0.15, -0.15], [0.15, 0.15], [-0.15, 0.15], [0.15, -0.15]].forEach(([a, b]) => P.cyl(M.rebar, 0.016, 0.016, 1.3, i * sx + a, floors * FH + 0.65, j * sz + b, 0, 0, 0, 5))));
  // brick infill panels on the lower floors
  for (let f = 0; f < 3; f++) P.box(M.mixer, sx * 4, FH - 0.5, 0.2, sx * 2, f * FH + FH / 2 + 0.1, 2 * sz);
  // scaffold poles at the end
  for (let y = 0; y <= floors * FH; y += 2.0) P.box(M.steel, 0.05, 0.05, 2 * sz + 1.4, -0.9, y, sz);
  for (let z = -0.7; z <= 2 * sz + 0.7; z += 2.4) P.box(M.steel, 0.06, floors * FH + 1.5, 0.06, -0.9, (floors * FH) / 2, z);
  const g = P.build();
  const net = new THREE.Mesh(new THREE.PlaneGeometry(2 * sz + 1.4, floors * FH), M.net);
  net.rotation.y = -Math.PI / 2;
  net.position.set(-1.0, (floors * FH) / 2, sz);
  g.add(net);
  return g;
}

// Stack of rebar bundles and pipes for dressing the yard.
export function buildStock(M) {
  const P = new Parts();
  for (let i = 0; i < 4; i++) for (let j = 0; j <= i; j++) P.cyl(M.rebar, 0.08, 0.08, 6, 0, 0.1 + i * 0.16, (j - i / 2) * 0.17, 0, 0, Math.PI / 2, 6);
  [-2.4, 0, 2.4].forEach((x) => P.box(M.plank, 0.14, 0.12, 1.1, x, 0.06, 0));
  return P.build();
}

export function buildHopper(M) {
  // tremie hopper: funnel on a pipe, origin at the funnel's top rim
  const g = new THREE.Group();
  const P = new Parts();
  P.push(M.steel, lathe([[0.16, -1.1], [0.2, -0.95], [0.46, -0.4], [0.82, 0.0]], 28), new THREE.Matrix4());
  P.cyl(M.steelDark, 0.84, 0.84, 0.08, 0, 0.0, 0, 0, 0, 0, 28, true);
  P.cyl(M.steelDark, 0.86, 0.86, 0.1, 0, -0.04, 0, 0, 0, 0, 28);
  // pipe with flanges
  P.cyl(M.steelDark, 0.15, 0.15, 14.4, 0, -1.1 - 7.2, 0, 0, 0, 0, 14);
  for (let y = -2.0; y > -15.4; y -= 2.0) P.cyl(M.steel, 0.2, 0.2, 0.12, 0, y, 0, 0, 0, 0, 14);
  // lifting lugs
  [0, 1, 2].forEach((i) => {
    const a = (i / 3) * Math.PI * 2;
    P.box(M.steelBlack, 0.1, 0.34, 0.1, Math.cos(a) * 0.8, 0.12, Math.sin(a) * 0.8);
  });
  g.add(P.build());
  return g;
}

export { V3 };

// Soft cumulus puffs painted on sprites, for the sky behind the skyline.
export function buildClouds() {
  const g = new THREE.Group();
  const r = rng(808);
  const tex = canvasTexture(256, 256, (c, w, h) => {
    for (let i = 0; i < 26; i++) {
      const x = w / 2 + (r() - 0.5) * w * 0.5;
      const y = h / 2 + (r() - 0.5) * h * 0.26;
      const rad = 30 + r() * 46;
      const gr = c.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, 'rgba(255,255,255,0.55)');
      gr.addColorStop(0.6, 'rgba(255,255,255,0.22)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = gr;
      c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
  });
  for (let i = 0; i < 12; i++) {
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, opacity: 0.55 + r() * 0.3 });
    const s = new THREE.Sprite(mat);
    const w = 220 + r() * 260;
    s.scale.set(w, w * 0.42, 1);
    s.position.set(-700 + r() * 1400, 150 + r() * 160, -560 - r() * 200);
    g.add(s);
  }
  return g;
}

// A site cabin / shipping container with ribbed sides and a door.
export function buildContainer(M, colour) {
  const P = new Parts();
  const paintMat = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.55, metalness: 0.35, envMapIntensity: 0.7 });
  P.box(paintMat, 6.0, 2.6, 2.44, 0, 1.4, 0);
  for (let x = -2.8; x <= 2.8; x += 0.4) {
    P.box(paintMat, 0.16, 2.5, 0.06, x, 1.4, 1.25);
    P.box(paintMat, 0.16, 2.5, 0.06, x, 1.4, -1.25);
  }
  P.box(M.steelDark, 6.1, 0.12, 2.5, 0, 0.1, 0);
  P.box(M.steelDark, 0.12, 2.5, 0.06, 3.0, 1.4, 0.6);
  P.box(M.steelDark, 0.12, 2.5, 0.06, 3.0, 1.4, -0.6);
  P.box(M.glass, 0.04, 0.8, 1.0, -2.0, 1.7, 1.26);
  P.box(M.steelBlack, 1.3, 2.0, 0.04, 0.3, 1.3, 1.28);
  return P.build();
}
