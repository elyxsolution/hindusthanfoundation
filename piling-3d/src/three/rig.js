import * as THREE from 'three';
import { Parts, lineMesh, aim, decal, helixFlight, lerp, smooth, easeInOut, V3 } from './kit.js';
import { addCrawler, addCab } from './chassis.js';
import { BORE_D } from './world.js';

// SANY SR140-class rotary piling rig. Built facing +X: the mast and drill axis are ahead of the tracks.
export const AXIS_X = 4.3;
const MAST_X = 3.2;
const SHEAVE_Y = 19.95;
const HEAD_TOP = 13.5;
const HEAD_BOT = 3.6;
const TOOL_LEN = 5.6;

export function buildRig(M, { phase = 0, clods, spinDir = 1 }) {
  const root = new THREE.Group();
  const P = new Parts();

  // ---- undercarriage ----
  [-1, 1].forEach((s) => addCrawler(P, M, { len: 5.4, w: 0.95, h: 1.1, x0: -0.2, z: s * 1.75 }));
  P.box(M.steelDark, 4.2, 0.75, 2.8, -0.2, 0.75, 0);
  P.cyl(M.steel, 1.35, 1.35, 0.28, -0.1, 1.2, 0, 0, 0, 0, 28); // slew ring

  // ---- upper structure ----
  P.box(M.steelDark, 5.4, 0.3, 3.4, -0.5, 1.4, 0);
  P.box(M.sany, 2.6, 1.55, 3.0, -1.9, 2.3, 0); // engine house
  P.box(M.sanyDark, 2.6, 0.12, 3.06, -1.9, 3.1, 0);
  for (let i = 0; i < 6; i++) P.box(M.steelBlack, 0.04, 0.9, 2.2, -2.85 + i * 0.0, 2.3, 0); // grille bars (hidden detail)
  for (let i = 0; i < 7; i++) P.box(M.steelBlack, 0.05, 0.05, 2.4, -3.22, 1.9 + i * 0.13, 0);
  P.box(M.cast, 1.05, 1.5, 3.1, -3.55, 2.15, 0); // counterweight
  P.box(M.sanyDark, 1.06, 0.18, 3.12, -3.55, 2.95, 0);
  P.box(M.steel, 1.4, 0.8, 0.75, 0.2, 1.95, 1.15); // hydraulic tank / valves
  P.box(M.sanyDark, 1.5, 0.12, 0.8, 0.2, 2.4, 1.15);
  P.cyl(M.steelBlack, 0.09, 0.09, 1.1, -1.2, 3.65, 1.1); // exhaust
  P.cyl(M.steelBlack, 0.12, 0.09, 0.14, -1.2, 4.25, 1.1);
  // walkway rails on the engine house
  for (let i = 0; i < 4; i++) P.rod(M.yellow, -2.9 + i * 0.85, 3.12, 1.38, -2.9 + i * 0.85, 3.62, 1.38, 0.025);
  P.rod(M.yellow, -2.9, 3.62, 1.38, 0.3, 3.62, 1.38, 0.025);
  // cab on the near (−Z) side, forward
  addCab(P, M, { x: 1.2, y: 1.55, z: -1.0, w: 1.25, h: 1.7, d: 1.5, body: M.sany, roof: M.white });
  // beacon
  P.cyl(M.beacon, 0.09, 0.09, 0.16, 1.2, 3.55, -1.0);

  // ---- mast ----
  const mastH = SHEAVE_Y - 0.35;
  P.box(M.sany, 0.06, mastH, 0.92, MAST_X - 0.37, 0.35 + mastH / 2, 0);
  [-1, 1].forEach((s) => P.box(M.sany, 0.82, mastH, 0.05, MAST_X, 0.35 + mastH / 2, s * 0.435));
  [-1, 1].forEach((s) => {
    P.box(M.steelDark, 0.17, mastH, 0.17, MAST_X + 0.34, 0.35 + mastH / 2, s * 0.38); // guide rails
    P.box(M.steelDark, 0.12, mastH, 0.12, MAST_X - 0.33, 0.35 + mastH / 2, s * 0.4);
  });
  for (let y = 0.8; y < SHEAVE_Y - 1.5; y += 1.3) {
    const k = Math.round(y / 1.3) % 2 ? 1 : -1;
    P.rod(M.steelDark, MAST_X + 0.38, y, -0.38 * k, MAST_X + 0.38, y + 1.3, 0.38 * k, 0.03);
    P.box(M.sanyDark, 0.84, 0.06, 0.92, MAST_X, y, 0);
  }
  // mast top: sheave housing
  P.box(M.steelDark, 1.35, 0.9, 1.1, MAST_X + 0.2, SHEAVE_Y - 0.2, 0);
  [-1, 1].forEach((s) => P.cyl(M.steel, 0.46, 0.46, 0.12, MAST_X + 0.55, SHEAVE_Y + 0.15, s * 0.3, Math.PI / 2, 0, 0, 18));
  P.cyl(M.steelDark, 0.1, 0.1, 0.8, MAST_X + 0.55, SHEAVE_Y + 0.15, 0, Math.PI / 2, 0, 0, 8);
  P.box(M.sany, 1.2, 0.18, 1.06, MAST_X + 0.2, SHEAVE_Y + 0.35, 0);
  // mast foot and pile guide ring
  P.box(M.steelDark, 1.5, 0.7, 1.25, MAST_X + 0.15, 0.55, 0);
  P.cyl(M.steel, 0.5, 0.5, 0.35, AXIS_X, 0.9, 0, 0, 0, 0, 20, true);
  P.box(M.steelDark, 0.9, 0.3, 0.9, MAST_X + 0.9, 0.9, 0);
  // parallelogram linkage and tilt rams
  [-1, 1].forEach((s) => {
    P.beam(M.sanyDark, 1.9, 1.7, s * 0.75, MAST_X - 0.35, 1.2, s * 0.75, 0.28, 0.22);
    P.beam(M.sany, 0.9, 3.0, s * 0.7, MAST_X - 0.35, 7.8, s * 0.55, 0.22, 0.2);
    P.rod(M.sanyDark, 1.3, 1.9, s * 0.5, MAST_X - 0.3, 5.0, s * 0.5, 0.13);
    P.rod(M.chrome, 1.3 + (MAST_X - 1.6) * 0.5, 1.9 + 1.55, s * 0.5, MAST_X - 0.3, 5.0, s * 0.5, 0.07);
  });
  // main hoist line parked back to the winch
  P.rod(M.rope, MAST_X - 0.2, SHEAVE_Y + 0.4, 0.18, -0.2, 3.1, 0.18, 0.022);
  P.rod(M.rope, MAST_X - 0.2, SHEAVE_Y + 0.4, -0.18, -0.2, 3.1, -0.18, 0.022);
  root.add(P.build());

  // decals: vertical on the mast, horizontal on the hood and counterweight
  [-1, 1].forEach((s) => {
    const d = decal('SANY SR140', 8.4, 0.62, { w: 1024, h: 76, font: '800 66px Arial Black, Arial, sans-serif', tracking: 3 });
    d.position.set(MAST_X, 11.4, s * 0.462);
    d.rotation.set(0, s > 0 ? 0 : Math.PI, s > 0 ? Math.PI / 2 : -Math.PI / 2);
    root.add(d);
    const h = decal('SANY', 1.7, 0.5, { w: 512, h: 150, font: '800 120px Arial Black, Arial, sans-serif' });
    h.position.set(-1.9, 2.45, s * 1.515);
    h.rotation.y = s > 0 ? 0 : Math.PI;
    root.add(h);
    const c = decal('SR140', 1.8, 0.45, { w: 512, h: 128, font: '800 100px Arial Black, Arial, sans-serif', color: '#f2f2ee' });
    c.position.set(-3.55, 2.2, s * 1.56);
    c.rotation.y = s > 0 ? 0 : Math.PI;
    root.add(c);
  });

  // ---- rotary head, kelly, tool ----
  const head = new THREE.Group();
  const HP = new Parts();
  HP.box(M.steelDark, 1.15, 1.45, 1.1, 0, 0, 0);
  HP.box(M.sany, 1.2, 0.5, 1.15, 0, 0.9, 0);
  HP.cyl(M.steel, 0.62, 0.62, 0.7, 0, -0.95, 0, 0, 0, 0, 24);
  HP.cyl(M.steelBlack, 0.34, 0.34, 0.35, 0, 1.3, 0, 0, 0, 0, 16);
  HP.box(M.steelDark, 0.7, 0.9, 0.95, -0.85, 0, 0); // slides on the mast guides
  [-1, 1].forEach((s) => HP.box(M.steelBlack, 0.55, 0.9, 0.1, -0.75, 0.1, s * 0.5));
  [-1, 1].forEach((s) => HP.cyl(M.chrome, 0.05, 0.05, 1.1, 0.35, 0.55, s * 0.5)); // drive hoses
  head.add(HP.build());
  head.position.set(AXIS_X, HEAD_TOP, 0);
  root.add(head);

  const kellyMats = [
    new THREE.MeshStandardMaterial({ color: '#8d9298', metalness: 0.85, roughness: 0.32, envMapIntensity: 1.4 }),
    new THREE.MeshStandardMaterial({ color: '#a2a7ad', metalness: 0.9, roughness: 0.26, envMapIntensity: 1.5 }),
    new THREE.MeshStandardMaterial({ color: '#b9bec4', metalness: 0.9, roughness: 0.22, envMapIntensity: 1.5 }),
  ];
  const kRad = [0.23, 0.185, 0.145];
  const kelly = kRad.map((r, i) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 16, 1), kellyMats[i]);
    m.scale.set(r, 1, r);
    m.castShadow = true;
    m.frustumCulled = false;
    root.add(m);
    return m;
  });
  // keyway strips ride on the kelly
  const keys = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1, 0.05), M.steelDark);
  keys.visible = false;

  // tool: auger on a stem, with a cutting head and a soil jacket that fills as it comes up
  const tool = new THREE.Group();
  const spin = new THREE.Group();
  tool.add(spin);
  const TP = new Parts();
  TP.cyl(M.steel, 0.14, 0.14, TOOL_LEN, 0, TOOL_LEN / 2, 0, 0, 0, 0, 12);
  TP.cyl(M.steelDark, 0.5, 0.5, 0.2, 0, 0.1, 0, 0, 0, 0, 20);
  TP.cyl(M.steelDark, 0.07, 0.22, 0.42, 0, -0.1, 0, 0, 0, 0, 10);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    TP.box(M.chrome, 0.1, 0.16, 0.14, Math.cos(a) * 0.46, 0.0, Math.sin(a) * 0.46, 0, -a, 0);
  }
  TP.cyl(M.steelDark, 0.2, 0.2, 0.32, 0, TOOL_LEN + 0.14, 0, 0, 0, 0, 12);
  spin.add(TP.build());
  const flight = new THREE.Mesh(helixFlight(0.5, 0.12, TOOL_LEN - 0.4, 6.5, 160, 0.07), M.steel);
  flight.position.y = (TOOL_LEN - 0.4) / 2 + 0.3;
  flight.castShadow = true;
  spin.add(flight);
  const soilGeo = new THREE.CylinderGeometry(0.46, 0.44, TOOL_LEN - 0.6, 20, 18, false);
  {
    const pos = soilGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const k = 1 + Math.sin(y * 5.3 + Math.atan2(z, x) * 3) * 0.08 + Math.sin(y * 11 + x * 9) * 0.05 + Math.cos(Math.atan2(z, x) * 7 + y * 3) * 0.05;
      pos.setXYZ(i, x * k, y, z * k);
    }
    soilGeo.computeVertexNormals();
    soilGeo.translate(0, (TOOL_LEN - 0.6) / 2 + 0.3, 0);
  }
  const soil = new THREE.Mesh(soilGeo, M.mud);
  soil.castShadow = true;
  spin.add(soil);
  root.add(tool);

  // winch ropes head <-> mast top
  const ropeA = lineMesh(M.rope, 0.022);
  const ropeB = lineMesh(M.rope, 0.022);
  root.add(ropeA, ropeB);

  const pa = V3();
  const pb = V3();
  const wp = V3();
  const baseTool = V3();
  let emitAcc = 0;

  // Pose of the whole drilling cycle at u in 0..1 (24 s per bore when driven by time, or scrubbed by scroll).
  function poseAt(u) {
    let yh = HEAD_TOP;
    let ext = 0;
    let rot = 0.6;
    let soilAmt = 0;
    let fling = 0;
    let drip = 0;
    if (u < 0.06) {
      yh = HEAD_TOP;
      rot = 0.8;
    } else if (u < 0.5) {
      const k = easeInOut((u - 0.06) / 0.44);
      yh = lerp(HEAD_TOP, HEAD_BOT, k);
      ext = k;
      rot = 5.2;
      soilAmt = 0; // the tool goes down clean; the soil only rides up on the way out
    } else if (u < 0.72) {
      const k = easeInOut((u - 0.5) / 0.22);
      yh = lerp(HEAD_BOT, HEAD_TOP, k);
      ext = 1 - k;
      rot = 1.3;
      soilAmt = smooth(0, 0.1, k); // it fills at the bottom as the tool starts to rise
      drip = smooth(0.15, 0.5, k) * (1 - smooth(0.9, 1, k));
    } else if (u < 0.86) {
      const k = (u - 0.72) / 0.14;
      yh = HEAD_TOP;
      rot = lerp(9, 15, Math.sin(k * Math.PI));
      soilAmt = 1 - smooth(0.05, 0.95, k);
      fling = smooth(0.0, 0.12, k) * (1 - smooth(0.8, 1, k));
    } else {
      yh = HEAD_TOP;
      rot = 0.8;
    }
    return { yh, ext, rot, soilAmt, fling, drip };
  }
  const timeU = (t) => (((t % 24) / 24 + phase) % 1 + 1) % 1;

  function apply(pose, dt) {
    const { yh, ext, rot, soilAmt, fling, drip } = pose;
    const K = lerp(10, 19, ext);
    head.position.y = yh;
    const vis = K - 0.55 - TOOL_LEN - 0.35;
    const lens = [vis * 0.4, vis * 0.36, vis * 0.24];
    let y = yh - 0.55;
    kelly.forEach((m, i) => {
      m.scale.y = Math.max(lens[i], 0.01);
      m.position.set(AXIS_X, y - lens[i] / 2, 0);
      y -= lens[i] * 0.96;
    });
    const tipY = yh - K;
    tool.position.set(AXIS_X, tipY, 0);
    spin.rotation.y += rot * dt * spinDir;
    soil.visible = soilAmt > 0.01;
    soil.scale.set(1 + 0.12 * soilAmt, soilAmt, 1 + 0.12 * soilAmt);

    // winch ropes
    root.updateWorldMatrix(true, false);
    pa.set(MAST_X + 0.55, SHEAVE_Y - 0.2, 0.3);
    pb.set(AXIS_X - 0.1, yh + 1.15, 0.28);
    aim(ropeA, pa, pb, 0.022);
    pa.z = -0.3;
    pb.z = -0.28;
    aim(ropeB, pa, pb, 0.022);

    // soil flung off the spinning auger, and dripping as it leaves the bore
    if (clods) {
      if (fling > 0.02) {
        emitAcc += dt * 140 * fling;
        while (emitAcc > 1) {
          emitAcc -= 1;
          const ang = Math.random() * Math.PI * 2;
          const hy = tipY + 0.4 + Math.random() * TOOL_LEN;
          baseTool.set(AXIS_X + Math.cos(ang) * 0.5, hy, Math.sin(ang) * 0.5);
          wp.copy(baseTool);
          root.localToWorld(wp);
          const sp = 1.8 + Math.random() * 3.4;
          const wdir = V3(Math.cos(ang) * sp, 1 + Math.random() * 3, Math.sin(ang) * sp).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()));
          clods.emit(wp.x, wp.y, wp.z, wdir.x - Math.sin(ang) * rot * 0.25 * spinDir, wdir.y * 0.6, wdir.z + Math.cos(ang) * rot * 0.25 * spinDir, 0.04 + Math.random() * 0.05, 3.2);
        }
      } else if (drip > 0.02) {
        emitAcc += dt * 10 * drip;
        while (emitAcc > 1) {
          emitAcc -= 1;
          const ang = Math.random() * Math.PI * 2;
          wp.set(AXIS_X + Math.cos(ang) * 0.4, Math.max(tipY, 0.3), Math.sin(ang) * 0.4);
          root.localToWorld(wp);
          clods.emit(wp.x, wp.y, wp.z, 0, -0.5, 0, 0.04 + Math.random() * 0.04, 2.4);
        }
      }
    }
  }

  function update(t, dt) {
    apply(poseAt(timeU(t)), dt);
  }

  return { obj: root, update, poseAt, apply, timeU, tipY: () => tool.position.y, axisX: AXIS_X };
}
