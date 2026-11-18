import * as THREE from 'three';
import { Parts, canvasTexture, cageGeometry, lerp, clamp01, smooth, V3 } from './kit.js';
import { buildBore } from './site.js';
import { BORE_D } from './world.js';

// Static load test (kentledge method), built around a test pile at the local origin.
// A reaction frame of steel beams stands on timber cribs and is loaded with concrete blocks (the kentledge).
// A hydraulic jack on the pile head pushes up against the frame; dial gauges on a reference beam read the pile settling.
export const BLOCKS = 12;
const BX = 5.0; // block size x
const BY = 1.3;
const BZ = 1.5;
const DECK_Y = 2.85; // top of the cross beams
export const DESIGN_MT = 500;
export const TEST_MT = 750;

// The loading schedule: six equal steps up to 150% of the design load, each ramped then held.
// v is 0..1 through the loading phase. Returns the load as a fraction of the design load and the pile-head settlement in mm.
export function loadCurve(v) {
  const steps = 6;
  const k = clamp01(v) * steps;
  const idx = Math.min(steps, Math.floor(k));
  const f = k - idx;
  const frac = Math.min(1.5, 0.25 * (idx + smooth(0, 0.4, f)));
  const settle = 3.4 * frac + 2.4 * Math.pow(frac, 2.6);
  return { frac, settle, step: Math.min(steps, idx + 1) };
}

function dialTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#f4f4f0';
    g.beginPath();
    g.arc(w / 2, h / 2, w / 2 - 4, 0, 6.3);
    g.fill();
    g.strokeStyle = '#111';
    g.lineWidth = 5;
    g.stroke();
    g.fillStyle = '#111';
    g.font = '700 26px Arial';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (let i = 0; i < 50; i++) {
      const a = (i / 50) * Math.PI * 2 - Math.PI / 2;
      const long = i % 5 === 0;
      const r0 = w / 2 - 12;
      const r1 = w / 2 - (long ? 34 : 22);
      g.lineWidth = long ? 4 : 2;
      g.beginPath();
      g.moveTo(w / 2 + Math.cos(a) * r0, h / 2 + Math.sin(a) * r0);
      g.lineTo(w / 2 + Math.cos(a) * r1, h / 2 + Math.sin(a) * r1);
      g.stroke();
      if (long) g.fillText(String(i / 5), w / 2 + Math.cos(a) * (w / 2 - 54), h / 2 + Math.sin(a) * (w / 2 - 54));
    }
    g.font = '600 20px Arial';
    g.fillText('mm', w / 2, h / 2 + 44);
  });
}

export function buildTestStation(M, shaftMat) {
  const group = new THREE.Group();
  const P = new Parts();

  // ---- cribs: timber sleepers laid in alternating layers ----
  const crib = (x, z) => {
    for (let l = 0; l < 12; l++) {
      const y = 0.075 + l * 0.15;
      if (l % 2 === 0) [-0.36, 0, 0.36].forEach((o) => P.box(M.plank, 1.4, 0.15, 0.28, x, y, z + o));
      else [-0.5, -0.17, 0.17, 0.5].forEach((o) => P.box(M.plank, 0.28, 0.15, 1.1, x + o, y, z));
    }
  };
  [-5.4, 5.4].forEach((x) => [-1.0, 1.0].forEach((z) => crib(x, z)));

  // ---- reaction frame: spreader, two main beams (I-section), cross beams ----
  const ibeam = (len, h, w, x, y, z, alongX = true) => {
    const fl = 0.07;
    const wb = 0.05;
    if (alongX) {
      P.box(M.steelDark, len, fl, w, x, y + h / 2 - fl / 2, z);
      P.box(M.steelDark, len, fl, w, x, y - h / 2 + fl / 2, z);
      P.box(M.steelDark, len, h - 2 * fl, wb, x, y, z);
    } else {
      P.box(M.steelDark, w, fl, len, x, y + h / 2 - fl / 2, z);
      P.box(M.steelDark, w, fl, len, x, y - h / 2 + fl / 2, z);
      P.box(M.steelDark, wb, h - 2 * fl, len, x, y, z);
    }
  };
  P.box(M.sanyDark, 0.5, 0.5, 3.1, 0, 1.7, 0); // spreader under the main beams (box girder)
  P.box(M.yellow, 0.52, 0.06, 3.12, 0, 1.47, 0);
  [-1.0, 1.0].forEach((z) => {
    ibeam(12.4, 0.7, 0.45, 0, 2.25, z);
    P.box(M.yellow, 12.4, 0.04, 0.47, 0, 1.92, z);
  });
  for (let x = -4.8; x <= 4.81; x += 1.6) ibeam(3.8, 0.25, 0.3, x, 2.725, 0, false);
  // stiffeners on the main beams
  [-1.0, 1.0].forEach((z) => [-4, -2, 0, 2, 4].forEach((x) => P.box(M.steelDark, 0.06, 0.56, 0.4, x, 2.25, z)));

  // ---- pile cap and bearing plate (these settle) ----
  const settle = new THREE.Group();
  const S = new Parts();
  S.cyl(M.concreteDry, 0.64, 0.64, 0.35, 0, 0.175, 0, 0, 0, 0, 28);
  S.box(M.steel, 0.95, 0.05, 0.95, 0, 0.375, 0);
  S.cyl(M.sanyDark, 0.27, 0.27, 0.6, 0, 0.7, 0, 0, 0, 0, 24); // jack body
  S.cyl(M.steelBlack, 0.3, 0.3, 0.05, 0, 1.025, 0, 0, 0, 0, 24);
  S.cyl(M.steelDark, 0.12, 0.12, 0.34, 0.3, 0.72, 0, 0, 0, 0, 10); // jack port
  // datum arms for the dial gauges
  [-1.1, 1.1].forEach((x) => {
    S.box(M.steel, 0.05, 0.04, 1.8, x * 0.55 + 0.0, 0.4, 1.0);
    S.box(M.steelBlack, 0.12, 0.05, 0.12, x * 0.55, 0.4, 1.9);
  });
  settle.add(S.build());
  group.add(settle);

  // jack rod + load cell (rod length changes as the pile settles)
  const rodMat = M.chrome;
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1, 20), rodMat);
  rod.castShadow = true;
  group.add(rod);
  const cell = new Parts();
  cell.cyl(M.steelBlack, 0.24, 0.24, 0.2, 0, 1.35, 0, 0, 0, 0, 20);
  cell.cyl(M.yellow, 0.245, 0.245, 0.03, 0, 1.35, 0, 0, 0, 0, 20);
  group.add(cell.build());

  // ---- reference beam, stakes and dial gauges ----
  P.box(M.steelBlack, 6.2, 0.06, 0.08, 0, 1.15, 1.9);
  [-3.1, 3.1].forEach((x) => {
    P.cyl(M.steelDark, 0.04, 0.04, 1.2, x, 0.6, 1.9, 0, 0, 0, 8);
    P.box(M.steelDark, 0.3, 0.05, 0.3, x, 0.03, 1.9);
  });
  const dialMat = new THREE.MeshStandardMaterial({ map: dialTexture(), roughness: 0.4 });
  const gauges = [-0.6, 0.6].map((x) => {
    const g = new THREE.Group();
    g.position.set(x, 1.15 + 0.18, 1.98);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.07, 24), M.steelBlack);
    body.rotation.x = Math.PI / 2;
    g.add(body);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.105, 28), dialMat);
    face.position.z = 0.037;
    g.add(face);
    const needle = new THREE.Group();
    needle.position.z = 0.045;
    const nm = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.085, 0.004), new THREE.MeshBasicMaterial({ color: '#d11' }));
    nm.position.y = 0.04;
    needle.add(nm);
    g.add(needle);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 6), M.chrome);
    group.add(stem);
    group.add(g);
    return { g, needle, stem, x };
  });
  const gaugeBracket = new Parts();
  gaugeBracket.box(M.steelBlack, 0.16, 0.2, 0.09, -0.6, 1.25, 1.94);
  gaugeBracket.box(M.steelBlack, 0.16, 0.2, 0.09, 0.6, 1.25, 1.94);
  group.add(gaugeBracket.build());

  // ---- pump unit with a digital readout ----
  const PU = new Parts();
  PU.box(M.sanyDark, 1.5, 0.9, 0.8, 3.3, 0.55, 3.7);
  PU.box(M.steelDark, 1.6, 0.1, 0.9, 3.3, 0.05, 3.7);
  PU.box(M.steelBlack, 1.3, 0.04, 0.6, 3.3, 1.02, 3.7);
  PU.cyl(M.steel, 0.2, 0.2, 0.18, 2.75, 1.14, 3.7, 0, 0, 0, 14);
  group.add(PU.build());
  const dispCanvas = document.createElement('canvas');
  dispCanvas.width = 384;
  dispCanvas.height = 144;
  const dispTex = new THREE.CanvasTexture(dispCanvas);
  dispTex.colorSpace = THREE.SRGBColorSpace;
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.36), new THREE.MeshBasicMaterial({ map: dispTex }));
  disp.position.set(3.55, 0.6, 4.112);
  group.add(disp);
  const hose = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([V3(2.6, 0.5, 3.6), V3(1.8, 0.08, 3.2), V3(0.8, 0.07, 2.2), V3(0.4, 0.12, 0.9), V3(0.42, 0.72, 0.15)]),
      40,
      0.045,
      8,
      false
    ),
    M.rubber
  );
  hose.castShadow = true;
  group.add(hose);
  let lastDisp = '';
  function drawDisplay(load, settle) {
    const key = `${Math.round(load)}|${settle.toFixed(1)}`;
    if (key === lastDisp) return;
    lastDisp = key;
    const g = dispCanvas.getContext('2d');
    g.fillStyle = '#0a0f1c';
    g.fillRect(0, 0, 384, 144);
    g.fillStyle = '#ff6a1a';
    g.font = '700 28px Arial';
    g.textAlign = 'left';
    g.fillText('LOAD  MT', 18, 38);
    g.fillText('SETTLE  mm', 18, 108);
    g.fillStyle = '#ffd9bf';
    g.font = '700 54px "Courier New", monospace';
    g.textAlign = 'right';
    g.fillText(String(Math.round(load)).padStart(3, '0'), 366, 60);
    g.fillText(settle.toFixed(1), 366, 124);
    dispTex.needsUpdate = true;
  }
  drawDisplay(0, 0);

  group.add(P.build());

  // ---- kentledge blocks (instanced) ----
  const blockTex = canvasTexture(512, 128, (g, w, h) => {
    g.fillStyle = '#a7a6a0';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      const v = 120 + Math.random() * 80;
      g.fillStyle = `rgba(${v},${v - 2},${v - 6},${0.18 + Math.random() * 0.3})`;
      g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2.4, 1 + Math.random() * 2.4);
    }
    g.strokeStyle = 'rgba(40,38,34,0.55)';
    g.lineWidth = 6;
    g.strokeRect(3, 3, w - 6, h - 6);
    g.fillStyle = 'rgba(255,255,255,0.82)';
    g.font = '700 56px Arial';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('HFC  60 MT', w / 2, h / 2 + 4);
  });
  const blockMat = new THREE.MeshStandardMaterial({ map: blockTex, color: '#ffffff', roughness: 0.92 });
  const blocks = new THREE.InstancedMesh(new THREE.BoxGeometry(BX, BY, BZ), blockMat, BLOCKS);
  blocks.castShadow = true;
  blocks.receiveShadow = true;
  blocks.frustumCulled = false;
  const col = new THREE.Color();
  for (let i = 0; i < BLOCKS; i++) blocks.setColorAt(i, col.setScalar(0.82 + ((i * 37) % 11) / 40));
  blocks.instanceColor.needsUpdate = true;
  group.add(blocks);
  const bm = new THREE.Matrix4();
  const q0 = new THREE.Quaternion();
  const stackSlot = (i) => {
    const layer = Math.floor(i / 4);
    const k = i % 4;
    return { x: (k % 2 === 0 ? -1 : 1) * (BX / 2 + 0.03), y: DECK_Y + BY / 2 + layer * (BY + 0.02), z: (k < 2 ? -1 : 1) * (BZ / 2 + 0.04) };
  };
  const yardSlot = (i) => {
    const layer = Math.floor(i / 4);
    const k = i % 4;
    // yard stack: two blocks side by side, two rows, three high; the crane takes the top layer first
    return { x: 9.2 + (k % 2) * (BX + 0.3), y: BY / 2 + (2 - layer) * (BY + 0.02), z: 4.2 + (k < 2 ? 0 : 1) * (BZ + 0.3) };
  };
  function setBlock(i, x, y, z) {
    bm.compose(V3(x, y, z), q0, V3(1, 1, 1));
    blocks.setMatrixAt(i, bm);
    blocks.instanceMatrix.needsUpdate = true;
  }
  for (let i = 0; i < BLOCKS; i++) {
    const s = yardSlot(BLOCKS - 1 - i);
    setBlock(i, s.x, s.y, s.z);
  }

  // ---- underground: the test pile (concrete + cage, drawn a little see-through) ----
  const bore = buildBore(M, shaftMat, { cover: false, collar: false });
  group.add(bore.group);
  const under = new THREE.Group();
  const pileMat = M.concreteWet.clone();
  pileMat.transparent = true;
  pileMat.opacity = 0.62;
  const shaftConcrete = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, BORE_D, 24, 1), pileMat);
  shaftConcrete.position.y = -BORE_D / 2;
  under.add(shaftConcrete);
  const cage = new THREE.Mesh(cageGeometry(0.4, 12.5, 14), M.rebar);
  cage.position.y = -12.4;
  under.add(cage);
  group.add(under);

  // ---- load path arrows: soil resistance along the shaft and under the toe ----
  const arrowGeo = new THREE.ConeGeometry(0.2, 0.9, 10);
  const arrowMat = new THREE.MeshBasicMaterial({ color: '#ff8a3a', fog: false });
  const arrowSlots = [];
  for (let d = 1.6; d <= 14.5; d += 1.5) {
    [[0.6, 0], [-0.6, 0], [0, 0.6], [0, -0.6]].forEach(([x, z]) => arrowSlots.push({ x, z, d, toe: false }));
  }
  [[0, 0], [0.3, 0.1], [-0.3, 0.1], [0.1, -0.3], [-0.15, -0.28]].forEach(([x, z]) => arrowSlots.push({ x, z, d: BORE_D + 0.45, toe: true }));
  const arrows = new THREE.InstancedMesh(arrowGeo, arrowMat, arrowSlots.length);
  arrows.frustumCulled = false;
  group.add(arrows);
  const am = new THREE.Matrix4();
  const as = V3();
  const ap = V3();

  const rodPos = V3();
  function setLoad({ frac = 0, settleMM = 0, time = 0 }) {
    // frac 0..1.5 of the design load; settlement is exaggerated about 14x for visibility
    const vis = settleMM * 0.011;
    settle.position.y = -vis;
    under.position.y = -vis;
    const baseTop = 1.025 - vis; // top of jack body
    const rodTop = 1.25;
    rod.scale.y = Math.max(rodTop - baseTop, 0.02);
    rod.position.y = (rodTop + baseTop) / 2;
    gauges.forEach((gg) => {
      // the dial reads the pile head: one full turn is 10 mm
      gg.needle.rotation.z = -(settleMM / 10) * Math.PI * 2;
      const top = gg.g.position.y - 0.12;
      const bottom = 0.42 - vis;
      gg.stem.scale.y = Math.max(top - bottom, 0.02);
      gg.stem.position.set(gg.x, (top + bottom) / 2, 1.9);
    });
    drawDisplay(frac * DESIGN_MT, settleMM);
    // arrows
    const pulse = 0.92 + 0.08 * Math.sin(time * 5);
    arrowSlots.forEach((a, i) => {
      const k = a.toe ? frac * 1.7 : frac * (0.35 + 0.65 * (a.d / BORE_D));
      const s = Math.max(k * pulse, 0.0001);
      as.set(s, s, s);
      ap.set(a.x, -a.d + (a.toe ? 0 : 0), a.z);
      am.compose(ap, q0, as);
      arrows.setMatrixAt(i, am);
    });
    arrows.instanceMatrix.needsUpdate = true;
    void rodPos;
  }
  setLoad({ frac: 0, settleMM: 0 });

  return { group, blocks, setBlock, stackSlot, yardSlot, setLoad, bore, clamp01, lerp, DECK_Y, BY };
}
