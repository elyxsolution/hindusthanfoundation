import * as THREE from 'three';
import { Parts, Ram, decal, lerp, smooth, V3, easeInOut } from './kit.js';
import { addCrawler, addCab } from './chassis.js';

// Hydraulic excavator, built facing +X, in two sizes: Tata Hitachi EX200 (scale 1) and Kubota U30 (scale ~0.55).
// The arm is a three-link chain (boom, stick, bucket) with real rams computed between anchor points each frame.

// Key poses: swing (yaw), boom, stick, bucket angles (radians), time in 0..1 of the cycle.
export const EXCAVATOR_CYCLE = [
  // dig: reach out and low
  { t: 0.0, swing: -2.7, boom: -0.35, stick: 1.1, bucket: 0.2 },
  { t: 0.14, swing: -2.7, boom: -0.62, stick: 0.62, bucket: 0.1 },
  // curl and drag in
  { t: 0.28, swing: -2.7, boom: -0.42, stick: 1.45, bucket: 1.55 },
  // raise
  { t: 0.4, swing: -2.7, boom: 0.35, stick: 1.5, bucket: 1.6 },
  // swing to the truck
  { t: 0.62, swing: 0.2, boom: 0.4, stick: 1.2, bucket: 1.55 },
  // dump
  { t: 0.72, swing: 0.2, boom: 0.4, stick: 0.95, bucket: 0.2 },
  // swing back
  { t: 0.92, swing: -2.7, boom: 0.15, stick: 1.0, bucket: 0.5 },
  { t: 1.0, swing: -2.7, boom: -0.35, stick: 1.1, bucket: 0.2 },
];

function sample(keys, u) {
  let i = 0;
  while (i < keys.length - 2 && u > keys[i + 1].t) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const k = easeInOut(Math.min(1, Math.max(0, (u - a.t) / (b.t - a.t))));
  return { swing: lerp(a.swing, b.swing, k), boom: lerp(a.boom, b.boom, k), stick: lerp(a.stick, b.stick, k), bucket: lerp(a.bucket, b.bucket, k) };
}

export function buildExcavator(M, { scale = 1, color, label, tag, keys = EXCAVATOR_CYCLE, period = 9, offset = 0, clods, blade = false, canopy = false }) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.scale.setScalar(scale);
  root.add(body);

  // undercarriage
  const C = new Parts();
  [-1, 1].forEach((s) => addCrawler(C, M, { len: 4.4, w: 0.7, h: 0.9, x0: 0, z: s * 1.18 }));
  C.box(M.steelDark, 3.0, 0.6, 1.8, 0, 0.7, 0);
  if (blade) {
    C.box(color, 0.3, 0.55, 2.5, 2.5, 0.38, 0);
    [-1, 1].forEach((s) => C.rod(M.steelDark, 1.2, 0.7, s * 0.7, 2.4, 0.5, s * 0.8, 0.07));
  }
  body.add(C.build());

  // house
  const house = new THREE.Group();
  house.position.y = 1.0;
  const U = new Parts();
  U.cyl(M.steel, 1.0, 1.0, 0.18, 0, 0.0, 0, 0, 0, 0, 24);
  U.box(M.steelDark, 3.6, 0.25, 2.4, -0.3, 0.2, 0);
  U.box(color, 1.4, 1.25, 2.3, -1.4, 0.9, 0); // engine bay
  U.box(M.steelBlack, 1.42, 0.1, 2.3, -1.4, 1.55, 0);
  U.box(M.cast, 0.9, 1.1, 2.3, -2.4, 0.78, 0); // counterweight
  U.box(M.steel, 1.1, 0.5, 0.5, 0.4, 0.62, 1.0);
  if (canopy) {
    // Kubota: open canopy with ROPS frame
    [[1, 1], [1, -1], [-0.6, 1], [-0.6, -1]].forEach(([x, z]) => U.rod(M.steelBlack, x * 0.75 + 0.35, 0.3, z * 0.55 - 0.45, x * 0.75 + 0.35, 2.1, z * 0.55 - 0.45, 0.045));
    U.box(color, 1.8, 0.09, 1.3, 0.05, 2.12, -0.45);
    U.box(M.seat, 0.55, 0.14, 0.55, -0.35, 0.55, -0.45);
    U.box(M.seat, 0.1, 0.65, 0.5, -0.62, 0.85, -0.45);
    U.box(M.cabInterior, 0.5, 0.55, 0.4, 0.55, 0.5, -0.45);
    U.box(M.glass, 0.03, 1.5, 1.2, 1.0, 1.35, -0.45);
  } else {
    addCab(U, M, { x: 0.65, y: 0.28, z: -0.75, w: 1.1, h: 1.75, d: 1.35, body: color, roof: color });
  }
  house.add(U.build());
  body.add(house);

  // arm chain
  const boom = new THREE.Group();
  boom.position.set(1.1, 0.5, 0.12);
  house.add(boom);
  const BM = new Parts();
  BM.box(color, 0.5, 0.5, 0.6, 0.15, 0.1, 0);
  // two-piece boom: a gooseneck
  BM.beam(color, 0.0, 0.0, 0, 2.2, 1.35, 0, 0.55, 0.52);
  BM.beam(color, 2.2, 1.35, 0, 4.4, 0.75, 0, 0.5, 0.5);
  BM.cyl(M.steelDark, 0.2, 0.2, 0.62, 4.4, 0.75, 0, Math.PI / 2, 0, 0, 10);
  boom.add(BM.build());

  const stick = new THREE.Group();
  stick.position.set(4.4, 0.75, 0);
  boom.add(stick);
  const SM = new Parts();
  SM.beam(color, 0.0, 0.0, 0, 2.5, 0.0, 0, 0.42, 0.4);
  SM.cyl(M.steelDark, 0.17, 0.17, 0.5, 2.5, 0.0, 0, Math.PI / 2, 0, 0, 10);
  stick.add(SM.build());

  const bucket = new THREE.Group();
  bucket.position.set(2.5, 0, 0);
  stick.add(bucket);
  const BK = new Parts();
  // bucket body: a scoop built from a back plate, side plates and teeth
  BK.box(M.steelDark, 0.12, 0.85, 1.05, 0.28, -0.42, 0, 0, 0, -0.25);
  BK.box(M.steelDark, 0.8, 0.1, 1.05, 0.56, -0.86, 0, 0, 0, 0.1);
  [-1, 1].forEach((s) => BK.box(M.steelDark, 0.8, 0.85, 0.08, 0.5, -0.5, s * 0.5, 0, 0, 0));
  BK.box(M.steelDark, 0.4, 0.3, 0.9, 0.05, -0.1, 0);
  for (let i = 0; i < 5; i++) BK.box(M.steel, 0.28, 0.1, 0.1, 0.98, -0.94, -0.42 + i * 0.21, 0, 0, -0.1);
  BK.cyl(M.steelDark, 0.14, 0.14, 0.62, 0, 0, 0, Math.PI / 2, 0, 0, 10);
  bucket.add(BK.build());
  const bucketTip = new THREE.Object3D();
  bucketTip.position.set(0.9, -0.88, 0);
  bucket.add(bucketTip);

  // rams (barrel + chrome rod) between anchors
  const mkAnchor = (parent, x, y, z = 0) => {
    const o = new THREE.Object3D();
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  };
  const ramStyle = { barrel: M.steelDark, rod: M.chrome, rb: 0.1, rr: 0.058 };
  const rams = [
    new Ram(house, mkAnchor(house, 1.0, 0.2, 0.0), mkAnchor(boom, 1.35, 0.5, 0.22), { ...ramStyle, rb: 0.12, rr: 0.07 }),
    new Ram(boom, mkAnchor(boom, 2.4, 1.45, 0.2), mkAnchor(stick, 0.4, 0.5, 0.2), ramStyle),
    new Ram(stick, mkAnchor(stick, 1.2, 0.35, 0.2), mkAnchor(bucket, 0.25, 0.1, 0.0), { ...ramStyle, rb: 0.085, rr: 0.05 }),
  ];
  // the second boom ram (far side), for symmetry from the other angle
  rams.push(new Ram(house, mkAnchor(house, 1.0, 0.2, 0.0), mkAnchor(boom, 1.35, 0.5, -0.22), { ...ramStyle, rb: 0.12, rr: 0.07 }));

  // decals
  [-1, 1].forEach((s) => {
    const d = decal(label, 1.1, 0.34, { w: 512, h: 158, font: '800 120px Arial Black, Arial, sans-serif', color: '#ffffff' });
    d.position.set(-1.35, 0.95, s * 1.16);
    d.rotation.y = s > 0 ? 0 : Math.PI;
    house.add(d);
    if (tag) {
      const t = decal(tag, 1.6, 0.26, { w: 768, h: 124, font: '700 86px Arial, sans-serif', color: '#ffffff' });
      t.position.set(2.4, 0.6, s * 0.34);
      t.rotation.set(0, s > 0 ? 0 : Math.PI, -0.4);
      boom.add(t);
    }
  });

  const tipW = V3();
  const state = { tipW, dumping: 0, digging: 0 };
  let prevDump = 0;
  let acc = 0;

  function update(t, dt) {
    const u = (((t / period + offset) % 1) + 1) % 1;
    const p = sample(keys, u);
    house.rotation.y = p.swing;
    boom.rotation.z = p.boom;
    stick.rotation.z = -p.stick;
    bucket.rotation.z = -p.bucket + 0.6;
    root.updateWorldMatrix(true, true);
    rams.forEach((r) => r.update());
    bucketTip.getWorldPosition(tipW);

    // soil falls when the bucket opens over the truck (dump) and scrapes up when digging
    if (clods) {
      const dumping = u > 0.7 && u < 0.78 ? 1 : 0;
      const digging = u > 0.12 && u < 0.3 ? 1 : 0;
      state.dumping = dumping;
      state.digging = digging;
      acc += dt * (dumping ? 110 : digging ? 22 : 0);
      while (acc > 1) {
        acc -= 1;
        const r = () => (Math.random() - 0.5);
        clods.emit(tipW.x + r() * 0.6, tipW.y + 0.2, tipW.z + r() * 0.6, r() * 1.2, dumping ? -0.5 : 1.2, r() * 1.2, (dumping ? 0.07 : 0.05) * (0.6 + Math.random() * 0.8) * (scale > 0.8 ? 1.2 : 0.8), 2.2);
      }
    }
    prevDump = u;
  }

  void prevDump;
  void smooth;
  return { obj: root, update, state };
}
