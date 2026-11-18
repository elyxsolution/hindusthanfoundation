import * as THREE from 'three';
import { Parts, lineMesh, aim, decal, lerp, V3 } from './kit.js';
import { addCrawler, addCab } from './chassis.js';

// SANY SCC450-class crawler crane, built facing +X with a lattice boom. The scene drives it with
// swing (yaw of the upper structure), luff (boom angle above horizontal) and rope (hook drop below the tip).
const BOOM_L = 25;
const PIVOT = { x: 2.3, y: 0.85 };

export function buildCrane(M) {
  const root = new THREE.Group();

  // ---- crawlers ----
  const base = new Parts();
  [-1, 1].forEach((s) => addCrawler(base, M, { len: 6.2, w: 1.05, h: 1.3, x0: 0, z: s * 2.25 }));
  base.box(M.steelDark, 4.4, 0.85, 3.6, 0, 0.85, 0);
  base.cyl(M.steel, 1.7, 1.7, 0.3, 0, 1.4, 0, 0, 0, 0, 32);
  root.add(base.build());

  // ---- upper structure (swings) ----
  const upper = new THREE.Group();
  upper.position.y = 1.55;
  const U = new Parts();
  U.box(M.steelDark, 7.4, 0.35, 3.5, -0.7, 0.17, 0);
  U.box(M.sany, 2.8, 1.85, 3.1, -1.7, 1.3, 0);
  U.box(M.sanyDark, 2.8, 0.14, 3.16, -1.7, 2.28, 0);
  for (let i = 0; i < 8; i++) U.box(M.steelBlack, 0.05, 0.05, 2.5, -3.12, 0.7 + i * 0.13, 0);
  [0, 1, 2].forEach((i) => U.box(M.cast, 1.5, 0.52, 3.3, -4.0, 0.62 + i * 0.54, 0)); // counterweight slabs
  U.box(M.sanyDark, 1.52, 0.08, 3.34, -4.0, 1.7, 0);
  U.box(M.steel, 1.4, 0.8, 0.7, 0.6, 0.78, 1.3);
  U.cyl(M.steelBlack, 0.1, 0.1, 1.2, -0.9, 2.95, 1.1);
  U.cyl(M.steelBlack, 0.14, 0.1, 0.14, -0.9, 3.6, 1.1);
  for (let i = 0; i < 5; i++) U.rod(M.yellow, -2.8 + i * 0.85, 2.3, 1.45, -2.8 + i * 0.85, 2.8, 1.45, 0.025);
  U.rod(M.yellow, -2.8, 2.8, 1.45, 0.6, 2.8, 1.45, 0.025);
  addCab(U, M, { x: 1.35, y: 0.35, z: -1.0, w: 1.3, h: 1.8, d: 1.6, body: M.sany, roof: M.white });
  U.cyl(M.beacon, 0.09, 0.09, 0.16, 1.35, 2.3, -1.0);
  // A-frame gantry
  [-1, 1].forEach((s) => {
    U.rod(M.sanyDark, -1.5, 0.35, s * 1.15, -0.45, 6.4, s * 0.38, 0.12);
    U.rod(M.sanyDark, -2.7, 0.35, s * 1.1, -0.45, 6.4, s * 0.38, 0.1);
  });
  U.box(M.steelDark, 0.8, 0.5, 1.1, -0.45, 6.55, 0);
  [-1, 1].forEach((s) => U.cyl(M.steel, 0.28, 0.28, 0.1, -0.45, 6.8, s * 0.3, Math.PI / 2, 0, 0, 14));
  for (let i = 0; i < 3; i++) U.rod(M.steelDark, -1.7 - i * 0.2, 0.9 + i * 1.6, 0.9 - i * 0.22, -0.9 - i * 0.1, 1.4 + i * 1.7, 0.7 - i * 0.12, 0.04);
  // boom foot
  U.box(M.steelDark, 0.9, 0.9, 1.5, PIVOT.x - 0.2, PIVOT.y - 0.15, 0);
  U.cyl(M.steel, 0.2, 0.2, 1.7, PIVOT.x, PIVOT.y, 0, Math.PI / 2, 0, 0, 12);
  // backstays
  [-1, 1].forEach((s) => U.rod(M.rope, -0.45, 6.5, s * 0.3, -4.6, 2.6, s * 1.2, 0.03));
  upper.add(U.build());
  root.add(upper);

  [-1, 1].forEach((s) => {
    const d = decal('SANY SCC450', 2.6, 0.5, { w: 768, h: 148, font: '800 96px Arial Black, Arial, sans-serif' });
    d.position.set(-1.7, 1.15, s * 1.56);
    d.rotation.y = s > 0 ? 0 : Math.PI;
    upper.add(d);
  });

  // ---- boom ----
  const boom = new THREE.Group();
  boom.position.set(PIVOT.x, PIVOT.y, 0);
  const B = new Parts();
  const N = 20;
  const stationW = (x) => (x < BOOM_L * 0.5 ? 1.75 : lerp(1.75, 0.78, (x - BOOM_L * 0.5) / (BOOM_L * 0.5)));
  const corner = (x, k) => {
    const w = stationW(x) / 2;
    return [[w, w], [w, -w], [-w, -w], [-w, w]][k];
  };
  for (let i = 0; i <= N; i++) {
    const x = (i / N) * BOOM_L;
    const x2 = ((i + 1) / N) * BOOM_L;
    for (let k = 0; k < 4; k++) {
      const [ya, za] = corner(x, k);
      const [yb, zb] = corner(x, (k + 1) % 4);
      const r = lerp(0.075, 0.05, i / N);
      B.rod(M.sany, x, ya, za, x, yb, zb, 0.028); // ring brace
      if (i < N) {
        const [yc, zc] = corner(x2, k);
        B.rod(M.sany, x, ya, za, x2, yc, zc, r); // chord
        const [yd, zd] = corner(x2, (k + 1) % 4);
        if (i % 2 === 0) B.rod(M.sany, x, ya, za, x2, yd, zd, 0.032);
        else B.rod(M.sany, x, yb, zb, x2, yc, zc, 0.032);
      }
    }
  }
  // tip head with the sheave and pendant lugs
  B.box(M.steelDark, 1.1, 0.95, 0.95, BOOM_L + 0.2, 0, 0);
  [-1, 1].forEach((s) => B.box(M.sany, 1.3, 1.25, 0.06, BOOM_L + 0.35, 0.05, s * 0.5));
  B.cyl(M.steel, 0.52, 0.52, 0.14, BOOM_L + 0.55, -0.08, 0, Math.PI / 2, 0, 0, 20);
  B.cyl(M.steelDark, 0.1, 0.1, 1.1, BOOM_L + 0.55, -0.08, 0, Math.PI / 2, 0, 0, 8);
  B.box(M.steelDark, 0.4, 0.5, 0.9, BOOM_L - 0.6, 0.85, 0);
  // base section pads and lug
  B.box(M.sanyDark, 1.4, 1.95, 1.95, 0.5, 0, 0);
  // boom hoist cable running down the boom
  B.rod(M.rope, BOOM_L + 0.55, 0.55, 0.1, 1.5, 0.95, 0.1, 0.02);
  boom.add(B.build());
  const tipObj = new THREE.Object3D();
  tipObj.position.set(BOOM_L + 0.55, -0.55, 0);
  boom.add(tipObj);
  const pendObj = new THREE.Object3D();
  pendObj.position.set(BOOM_L - 0.6, 1.15, 0);
  boom.add(pendObj);
  upper.add(boom);

  // pendant lines, A-frame head to boom tip
  const pendA = lineMesh(M.rope, 0.03);
  const pendB = lineMesh(M.rope, 0.03);
  root.add(pendA, pendB);

  // ---- hook block ----
  const hook = new THREE.Group();
  const H = new Parts();
  H.box(M.yellow, 0.56, 0.9, 0.46, 0, 0.6, 0);
  [-1, 1].forEach((s) => H.cyl(M.steelDark, 0.2, 0.2, 0.06, 0, 0.7, s * 0.26, Math.PI / 2, 0, 0, 14));
  H.box(M.steelBlack, 0.3, 0.28, 0.34, 0, 0.0, 0);
  H.cyl(M.steelBlack, 0.06, 0.06, 0.3, 0, -0.2, 0, 0, 0, 0, 8);
  const hk = new THREE.TorusGeometry(0.2, 0.065, 8, 20, Math.PI * 1.55);
  hk.rotateZ(Math.PI * 0.72);
  H.push(M.steelBlack, hk, new THREE.Matrix4().makeTranslation(0, -0.44, 0));
  hook.add(H.build());
  root.add(hook);
  const ropeA = lineMesh(M.rope, 0.026);
  const ropeB = lineMesh(M.rope, 0.026);
  root.add(ropeA, ropeB);

  const tipW = V3();
  const tipL = V3();
  const pend = V3();
  const a1 = V3();
  const a2 = V3();
  const b1 = V3();
  const b2 = V3();
  const hookL = V3();
  const hookW = V3();

  // set({ swing, luff, rope, sx, sz }): all lengths in metres, angles in radians
  function set({ swing = 0, luff = 1.2, rope = 8, sx = 0, sz = 0 }) {
    upper.rotation.y = swing;
    boom.rotation.z = luff;
    root.updateWorldMatrix(true, true);
    tipObj.getWorldPosition(tipW);
    tipL.copy(tipW);
    root.worldToLocal(tipL);
    hookL.set(tipL.x + sx, tipL.y - rope, tipL.z + sz);
    hook.position.copy(hookL);
    hook.rotation.set(sz * 0.05, 0, -sx * 0.05);
    a1.set(tipL.x, tipL.y, tipL.z + 0.12);
    a2.set(tipL.x, tipL.y, tipL.z - 0.12);
    b1.set(hookL.x, hookL.y + 1.0, hookL.z + 0.2);
    b2.set(hookL.x, hookL.y + 1.0, hookL.z - 0.2);
    aim(ropeA, a1, b1, 0.026);
    aim(ropeB, a2, b2, 0.026);
    // pendants from the gantry head to the boom tip
    pendObj.getWorldPosition(pend);
    root.worldToLocal(pend);
    upper.updateWorldMatrix(true, false);
    const head = V3(-0.45, 6.55, 0.3).applyMatrix4(upper.matrixWorld);
    root.worldToLocal(head);
    const head2 = V3(-0.45, 6.55, -0.3).applyMatrix4(upper.matrixWorld);
    root.worldToLocal(head2);
    aim(pendA, head, V3(pend.x, pend.y, pend.z + 0.25), 0.03);
    aim(pendB, head2, V3(pend.x, pend.y, pend.z - 0.25), 0.03);
    // world position of the hook's lifting eye (just under the block)
    hookW.copy(hookL);
    hookW.y -= 0.4;
    root.localToWorld(hookW);
    return hookW;
  }

  return {
    obj: root,
    set,
    hookEye: () => hookW,
    tipLocal: () => tipL,
    hookLocal: () => hookL,
    hookGroup: hook,
  };
}
