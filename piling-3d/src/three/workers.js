import * as THREE from 'three';
import { Parts, decal, lerp, V3 } from './kit.js';

// Site workers in hi-vis vests and hard hats. Facing +Z. Poses: 'idle', 'point', 'signal', 'look'.
export function buildWorker(M, { pose = 'idle', skin = 'skin', helmet = 'helmet', label = 'HFC', phase = 0, scale = 1 }) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.scale.setScalar(scale);
  root.add(body);
  const P = new Parts();
  const S = M[skin];

  // legs and boots
  [-1, 1].forEach((s) => {
    P.cyl(M.jeans, 0.085, 0.07, 0.86, s * 0.1, 0.5, 0, 0, 0, 0, 8);
    P.box(M.boot, 0.15, 0.1, 0.27, s * 0.1, 0.07, 0.04);
  });
  // torso, vest, stripes
  P.box(M.shirt, 0.4, 0.58, 0.24, 0, 1.22, 0);
  P.box(M.vest, 0.43, 0.56, 0.27, 0, 1.22, 0);
  [0.07, -0.17].forEach((y) => P.box(M.reflect, 0.44, 0.05, 0.28, 0, 1.24 + y, 0));
  [-1, 1].forEach((s) => P.box(M.reflect, 0.05, 0.56, 0.28, s * 0.1, 1.22, 0));
  P.box(M.jeans, 0.38, 0.2, 0.24, 0, 0.92, 0);
  // head, neck, helmet
  P.cyl(S, 0.05, 0.05, 0.08, 0, 1.55, 0, 0, 0, 0, 6);
  P.sphere(S, 0.105, 0, 1.68, 0, 0.92, 1.05, 1);
  P.sphere(M[helmet], 0.135, 0, 1.73, 0, 1, 0.9, 1.08, 14);
  P.box(M[helmet], 0.3, 0.03, 0.12, 0, 1.69, 0.13);
  body.add(P.build());

  const arm = (side) => {
    const g = new THREE.Group();
    g.position.set(side * 0.26, 1.46, 0);
    const A = new Parts();
    A.cyl(M.vest, 0.06, 0.055, 0.3, 0, -0.15, 0, 0, 0, 0, 8);
    A.cyl(M.shirt, 0.05, 0.045, 0.28, 0, -0.44, 0, 0, 0, 0, 8);
    A.sphere(S, 0.05, 0, -0.62, 0);
    g.add(A.build());
    body.add(g);
    return g;
  };
  const armL = arm(-1);
  const armR = arm(1);

  [1].forEach(() => {
    const back = decal(label, 0.3, 0.12, { w: 256, h: 100, font: '800 74px Arial Black, Arial, sans-serif', color: '#13234a' });
    back.position.set(0, 1.28, -0.141);
    back.rotation.y = Math.PI;
    body.add(back);
    const front = decal(label, 0.12, 0.05, { w: 256, h: 100, font: '800 70px Arial Black, Arial, sans-serif', color: '#13234a' });
    front.position.set(0.11, 1.38, 0.141);
    body.add(front);
  });

  const v = V3();
  function update(t) {
    const w = t + phase * 6;
    const breathe = Math.sin(w * 1.7) * 0.004;
    body.position.y = breathe;
    if (pose === 'point') {
      armR.rotation.set(-1.45 + Math.sin(w * 0.9) * 0.04, 0, 0.2);
      armL.rotation.set(0.1, 0, -0.12);
    } else if (pose === 'signal') {
      const wave = Math.sin(w * 3.2) * 0.35;
      armR.rotation.set(0, 0, 2.5 - wave * 0.4);
      armL.rotation.set(0, 0, -2.5 + wave * 0.4);
    } else if (pose === 'wave') {
      armR.rotation.set(0, 0, 2.7 + Math.sin(w * 4) * 0.35);
      armL.rotation.set(0.05, 0, -0.12);
    } else {
      armR.rotation.set(Math.sin(w * 1.1) * 0.05, 0, 0.1);
      armL.rotation.set(Math.sin(w * 1.1 + 1) * 0.05, 0, -0.1);
    }
    void v;
    void lerp;
  }
  update(0);
  return { obj: root, update };
}
