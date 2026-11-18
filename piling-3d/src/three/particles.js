import * as THREE from 'three';
import { smooth, rng } from './kit.js';

// A small pooled system of soil clods: thrown off the auger, dropped from buckets, tumbling to rest.
export function makeClods(M, N = 900) {
  const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), M.soilClod, N);
  mesh.castShadow = true;
  mesh.frustumCulled = false;
  const r = rng(91);
  const col = new THREE.Color();
  for (let i = 0; i < N; i++) {
    col.setHSL(0.07 + r() * 0.03, 0.3 + r() * 0.2, 0.55 + r() * 0.4);
    mesh.setColorAt(i, col);
  }
  mesh.instanceColor.needsUpdate = true;

  const p = new Float32Array(N * 3);
  const v = new Float32Array(N * 3);
  const size = new Float32Array(N);
  const age = new Float32Array(N).fill(99);
  const life = new Float32Array(N).fill(1);
  const spin = new Float32Array(N * 3);
  let head = 0;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const pos = new THREE.Vector3();
  const sc = new THREE.Vector3();

  return {
    mesh,
    emit(x, y, z, vx, vy, vz, s = 0.12, l = 2.6) {
      const i = head;
      head = (head + 1) % N;
      p.set([x, y, z], i * 3);
      v.set([vx, vy, vz], i * 3);
      size[i] = s * (0.6 + r() * 0.8);
      age[i] = 0;
      life[i] = l;
      spin.set([r() * 6 - 3, r() * 6 - 3, r() * 6 - 3], i * 3);
    },
    update(dt) {
      for (let i = 0; i < N; i++) {
        if (age[i] > life[i]) {
          sc.set(0, 0, 0);
          m.compose(pos.set(0, -50, 0), q, sc);
          mesh.setMatrixAt(i, m);
          continue;
        }
        age[i] += dt;
        const k = i * 3;
        const grounded = p[k + 1] <= size[i] * 0.5 + 0.001;
        if (!grounded) {
          v[k + 1] -= 9.8 * dt;
          p[k] += v[k] * dt;
          p[k + 1] += v[k + 1] * dt;
          p[k + 2] += v[k + 2] * dt;
          if (p[k + 1] < size[i] * 0.5) {
            p[k + 1] = size[i] * 0.5;
            v[k] *= 0.15;
            v[k + 2] *= 0.15;
            v[k + 1] = 0;
          }
        }
        const s = size[i] * (1 - smooth(life[i] - 0.8, life[i], age[i]));
        e.set(spin[k] * age[i], spin[k + 1] * age[i], spin[k + 2] * age[i]);
        q.setFromEuler(e);
        m.compose(pos.set(p[k], p[k + 1], p[k + 2]), q, sc.set(s * 1.2, s, s * 1.1));
        mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}
