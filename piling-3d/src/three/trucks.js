import * as THREE from 'three';
import { Parts, decal, lathe, lerp, smooth, pulse, V3, aim, lineMesh, rng } from './kit.js';
import { addWheel, addCab } from './chassis.js';

// A lumpy mound of soil: a noisy half-sphere. Origin at the base centre.
export function heapGeometry(seed = 1, detail = 4) {
  const r = rng(seed);
  const g = new THREE.IcosahedronGeometry(1, detail);
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  const off = [r() * 10, r() * 10, r() * 10];
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = Math.sin(v.x * 5.1 + off[0]) * Math.cos(v.z * 4.3 + off[1]) * 0.1 + Math.sin(v.y * 7 + v.x * 3 + off[2]) * 0.06 + Math.sin(v.x * 17 + v.z * 13) * 0.025;
    v.multiplyScalar(1 + n);
    v.y = Math.max(v.y * 0.62, -0.05);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

// Tata-style 6x4 tipper, facing +X. The body tips up at the front and the load slides out of the tailgate.
export function buildTipper(M, { clods }) {
  const root = new THREE.Group();
  const C = new Parts();
  // chassis rails and axles
  [-1, 1].forEach((s) => C.box(M.steelBlack, 9.0, 0.28, 0.2, -0.2, 0.98, s * 0.8));
  C.box(M.steelBlack, 8.6, 0.12, 1.2, -0.2, 0.84, 0);
  [3.0, -1.0, -2.3].forEach((x) => C.cyl(M.steelDark, 0.1, 0.1, 2.0, x, 0.55, 0, Math.PI / 2, 0, 0, 10));
  [3.0].forEach((x) => [-1, 1].forEach((s) => addWheel(C, M, { x, z: s * 1.02, r: 0.55, w: 0.34 })));
  [-1.0, -2.3].forEach((x) => [-1, 1].forEach((s) => [0, 1].forEach((d) => addWheel(C, M, { x, z: s * (1.0 + d * 0.38), r: 0.55, w: 0.3 }))));
  // mudguards
  [3.0].forEach((x) => [-1, 1].forEach((s) => C.box(M.tipper, 1.4, 0.06, 0.4, x, 1.35, s * 1.05)));
  [-1.65].forEach((x) => [-1, 1].forEach((s) => C.box(M.tipper, 2.6, 0.06, 0.8, x, 1.4, s * 1.25)));
  // cab-over
  C.box(M.tipper, 1.9, 2.0, 2.2, 3.5, 2.0, 0);
  C.box(M.tipper, 0.2, 1.4, 2.3, 4.5, 1.75, 0);
  C.box(M.steelBlack, 0.28, 0.35, 2.3, 4.55, 1.05, 0); // bumper
  C.box(M.white, 0.04, 0.6, 1.9, 4.46, 2.05, 0); // grille
  for (let i = 0; i < 5; i++) C.box(M.steelBlack, 0.05, 0.03, 1.8, 4.5, 1.85 + i * 0.11, 0);
  [-1, 1].forEach((s) => {
    C.sphere(M.lamp, 0.12, 4.5, 1.45, s * 0.8, 0.6, 1, 1.4);
    C.box(M.glass, 0.04, 0.9, 0.9, 4.45, 2.7, s * 0.5);
    C.box(M.glass, 1.0, 0.8, 0.03, 3.8, 2.65, s * 1.11);
  });
  C.box(M.tipper, 2.1, 0.12, 2.3, 3.45, 3.05, 0); // cab roof
  C.box(M.steelBlack, 0.12, 0.45, 0.18, 4.35, 2.45, 1.25); // mirror arms
  C.box(M.steelBlack, 0.12, 0.45, 0.18, 4.35, 2.45, -1.25);
  // fuel tank and steps
  C.cyl(M.steel, 0.38, 0.38, 1.4, 1.9, 0.95, 1.05, Math.PI / 2, Math.PI / 2, 0, 14);
  C.box(M.steelBlack, 0.5, 0.05, 0.3, 3.4, 0.9, 1.2);
  // headache rack over the cab
  C.box(M.tipper, 0.2, 1.4, 2.35, 2.5, 2.55, 0);
  root.add(C.build());

  // dump body, hinged at the rear
  const bed = new THREE.Group();
  bed.position.set(-3.6, 1.2, 0);
  root.add(bed);
  const B = new Parts();
  const L = 5.6;
  B.box(M.steelDark, L, 0.16, 2.4, L / 2, 0.08, 0);
  [-1, 1].forEach((s) => {
    B.box(M.tipper, L, 1.45, 0.12, L / 2, 0.88, s * 1.2);
    B.box(M.steelDark, L + 0.1, 0.1, 0.22, L / 2, 1.62, s * 1.2);
  });
  B.box(M.tipper, 0.12, 2.1, 2.4, L - 0.06, 1.1, 0); // front bulkhead
  B.box(M.tipper, 0.1, 1.4, 2.4, 0.0, 0.88, 0); // tailgate
  for (let i = 1; i < 5; i++) [-1, 1].forEach((s) => B.box(M.steelDark, 0.1, 1.4, 0.06, (L * i) / 5, 0.88, s * 1.27));
  bed.add(B.build());
  // load
  const loadGeo = heapGeometry(4, 4);
  const load = new THREE.Mesh(loadGeo, M.mud);
  load.castShadow = true;
  load.receiveShadow = true;
  bed.add(load);
  // ram
  const ramMesh = lineMesh(M.chrome, 0.08, true);
  root.add(ramMesh);

  const wp = V3();
  const a = V3(0.5, 0.5, 0);
  const b = V3(0, 0, 0);
  let acc = 0;

  // fill 0..1 grows as the excavator loads; dump (0..1) tips the body and the soil slides out
  function set({ fill = 0.5, tip = 0 }) {
    bed.rotation.z = tip * 0.72;
    const f = Math.max(fill, 0.001) * (1 - smooth(0.35, 1, tip));
    load.position.set(L / 2 - tip * 1.4, 0.16, 0);
    load.scale.set(2.5 * Math.min(1, 0.4 + fill), 1.2 * f, 1.15);
    load.visible = f > 0.01;
    // body ram
    b.set(-0.2, 0.55, 0);
    a.set(L * 0.62, 0.0, 0).applyAxisAngle(V3(0, 0, 1), tip * 0.72).add(bed.position);
    aim(ramMesh, V3(L * 0.5 - 3.6 - 0.8 * 0.0 + 0.4, 0.9, 0), a, 0.09 + 0.0);
    ramMesh.scale.x = 0.09;
    ramMesh.scale.z = 0.09;
    if (clods && tip > 0.35 && tip < 0.98) {
      acc += 0.016 * 50;
      while (acc > 1) {
        acc -= 1;
        wp.set(-3.8, 1.6 + Math.random() * 0.8, (Math.random() - 0.5) * 2);
        root.localToWorld(wp);
        clods.emit(wp.x, wp.y, wp.z, -(0.6 + Math.random()), -0.2, (Math.random() - 0.5) * 0.8, 0.06 * (0.6 + Math.random()), 3);
      }
    }
  }

  return { obj: root, set };
}

// 8x4 transit mixer, facing +X. The drum turns; the chute swings out to the pile's hopper.
export function buildMixer(M) {
  const root = new THREE.Group();
  const C = new Parts();
  [-1, 1].forEach((s) => C.box(M.steelBlack, 10.2, 0.3, 0.22, 0, 1.0, s * 0.8));
  C.box(M.steelBlack, 9.8, 0.14, 1.3, 0, 0.88, 0);
  [3.7, 2.35, -2.7, -4.0].forEach((x, i) => {
    C.cyl(M.steelDark, 0.1, 0.1, 2.0, x, 0.55, 0, Math.PI / 2, 0, 0, 10);
    const dual = i >= 2;
    [-1, 1].forEach((s) => {
      addWheel(C, M, { x, z: s * 1.02, r: 0.56, w: 0.34 });
      if (dual) addWheel(C, M, { x, z: s * 1.42, r: 0.56, w: 0.3 });
    });
  });
  [3.7, 2.35].forEach((x) => [-1, 1].forEach((s) => C.box(M.white, 1.4, 0.06, 0.4, x, 1.4, s * 1.08)));
  [-3.35].forEach((x) => [-1, 1].forEach((s) => C.box(M.white, 3.3, 0.06, 0.85, x, 1.42, s * 1.28)));
  // cab-over
  C.box(M.white, 2.0, 2.0, 2.3, 4.3, 2.0, 0);
  C.box(M.white, 0.22, 1.3, 2.4, 5.35, 1.75, 0);
  C.box(M.steelBlack, 0.3, 0.38, 2.4, 5.42, 1.05, 0);
  for (let i = 0; i < 5; i++) C.box(M.steelBlack, 0.05, 0.03, 1.9, 5.4, 1.85 + i * 0.11, 0);
  [-1, 1].forEach((s) => {
    C.sphere(M.lamp, 0.12, 5.4, 1.45, s * 0.85, 0.6, 1, 1.4);
    C.box(M.glass, 0.04, 0.95, 1.0, 5.33, 2.7, s * 0.52);
    C.box(M.glass, 1.1, 0.85, 0.03, 4.55, 2.65, s * 1.16);
  });
  C.box(M.white, 2.2, 0.12, 2.4, 4.25, 3.05, 0);
  C.box(M.steelBlack, 0.12, 0.45, 0.18, 5.2, 2.45, 1.32);
  C.box(M.steelBlack, 0.12, 0.45, 0.18, 5.2, 2.45, -1.32);
  // water tank, ladder, hydraulic pump
  C.cyl(M.white, 0.45, 0.45, 1.6, 3.0, 2.05, 0, Math.PI / 2, 0, 0, 18);
  C.cyl(M.white, 0.46, 0.46, 0.05, 3.0, 2.05, 0.8, Math.PI / 2, 0, 0, 18);
  C.rod(M.steel, -3.9, 1.0, 1.33, -3.9, 3.4, 1.33, 0.03);
  C.rod(M.steel, -3.6, 1.0, 1.33, -3.6, 3.4, 1.33, 0.03);
  for (let i = 0; i < 8; i++) C.rod(M.steel, -3.9, 1.3 + i * 0.28, 1.33, -3.6, 1.3 + i * 0.28, 1.33, 0.022);
  // drum pedestal and rear stand
  C.box(M.steelDark, 0.9, 1.0, 1.5, -3.9, 1.55, 0);
  C.box(M.steelDark, 0.9, 0.8, 1.7, 1.3, 1.45, 0);
  root.add(C.build());

  // drum: tilted lathe, spinning on its own axis
  const tilt = new THREE.Group();
  tilt.position.set(-0.9, 2.55, 0);
  tilt.rotation.z = 0.2;
  root.add(tilt);
  const drumGeo = lathe(
    [
      [0.62, -3.4],
      [0.9, -3.2],
      [1.2, -2.5],
      [1.32, -1.6],
      [1.34, -0.2],
      [1.3, 1.2],
      [1.12, 2.2],
      [0.78, 2.9],
      [0.3, 3.15],
      [0.0, 3.2],
    ],
    36
  );
  const drum = new THREE.Mesh(drumGeo, M.drum);
  drum.rotation.z = -Math.PI / 2;
  drum.castShadow = true;
  drum.receiveShadow = true;
  const spin = new THREE.Group();
  spin.add(drum);
  tilt.add(spin);
  // charging hopper at the rear and the drum collar
  const T = new Parts();
  T.cyl(M.steelDark, 0.95, 1.34, 0.4, -3.6, 0, 0, 0, 0, -Math.PI / 2, 24, true);
  T.cyl(M.steelDark, 0.7, 0.7, 0.2, -3.85, 0, 0, 0, 0, -Math.PI / 2, 20, true);
  T.box(M.steelDark, 0.7, 0.5, 1.5, -3.5, 1.0, 0, 0, 0, 0.2);
  tilt.add(T.build());
  [-1, 1].forEach((s) => {
    const d = decal('RMC', 2.6, 1.0, { w: 640, h: 246, font: '800 190px Arial Black, Arial, sans-serif', color: '#1c2d62', bg: null });
    d.position.set(-0.2, 0.1, s * 1.36);
    d.rotation.y = s > 0 ? 0 : Math.PI;
    tilt.add(d);
  });

  // chute: pivot at the rear, a trough that is aimed at a world target
  const pivot = new THREE.Group();
  pivot.position.set(-5.0, 2.75, 0);
  root.add(pivot);
  const chuteMesh = new THREE.Group();
  pivot.add(chuteMesh);
  const CH = new Parts();
  CH.box(M.steel, 1, 0.06, 0.62, 0.5, 0, 0);
  [-1, 1].forEach((s) => CH.box(M.steel, 1, 0.3, 0.05, 0.5, 0.14, s * 0.3));
  chuteMesh.add(CH.build());
  const flowIn = new THREE.Mesh(new THREE.BoxGeometry(1, 0.12, 0.5), M.concreteWet);
  flowIn.position.set(0.5, 0.09, 0);
  chuteMesh.add(flowIn);
  const stream = lineMesh(M.concreteWet, 0.12);
  const flowMat = M.concreteWet;
  void flowMat;
  root.add(stream);
  const splash = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 6), M.concreteWet);
  root.add(splash);

  const tgt = V3();
  const stow = V3(-2.6, 4.2, 0.0);
  const d = V3();
  const end = V3();
  const lo = V3();
  const lo2 = V3();
  const baseSpin = { v: 0 };

  // pour: 0..1 chute deployment, flow 0..1 concrete running, drumRate rad/s, target: hopper mouth world position
  function set({ deploy = 0, flow = 0, drumRate = 1.2, target, dt = 0.016 }) {
    baseSpin.v += drumRate * dt;
    spin.rotation.x = baseSpin.v; // the lathe axis lies along x after drum.rotation.z
    root.updateWorldMatrix(true, true);
    if (target) {
      lo.copy(target);
      root.worldToLocal(lo);
      tgt.lerpVectors(stow, lo, deploy);
    } else tgt.copy(stow);
    d.subVectors(tgt, pivot.position);
    const dist = Math.max(d.length(), 0.5);
    pivot.rotation.set(0, Math.atan2(-d.z, d.x), Math.atan2(d.y, Math.hypot(d.x, d.z)));
    chuteMesh.scale.x = dist;
    flowIn.visible = flow > 0.02;
    flowIn.scale.set(1, 1, 0.5 + 0.5 * flow);
    // the stream from the chute's end into the hopper
    end.copy(tgt);
    if (flow > 0.02 && target) {
      lo2.set(end.x, end.y - 0.1, end.z);
      aim(stream, lo2, V3(end.x, end.y - 0.7, end.z), 0.16 + 0.04 * Math.sin(performance.now() * 0.03));
      stream.visible = true;
      splash.visible = true;
      splash.position.set(end.x, end.y - 0.66, end.z);
      splash.scale.set(1.5 + 0.3 * Math.sin(performance.now() * 0.02), 0.6, 1.5);
    } else {
      stream.visible = false;
      splash.visible = false;
    }
    void lerp;
    void pulse;
  }

  return { obj: root, set };
}
