import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------------------------------------------------------------------------------------------
// Small helpers shared by every machine. Everything is built in metres, +Y up.
// Static sub-assemblies are collected per material and merged into one mesh each, so a whole
// excavator costs a handful of draw calls instead of a few hundred.
// ---------------------------------------------------------------------------------------------

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// 0..1 ramp of x between a and b, then back down between c and d (a trapezoid).
export const pulse = (a, b, c, d, x) => smooth(a, b, x) * (1 - smooth(c, d, x));

export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
}

export function canvasTexture(w, h, draw, { repeat = false, srgb = true, aniso = 8 } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = aniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

// Collects primitives per material, then bakes them into one merged mesh per material.
export class Parts {
  constructor() {
    this.map = new Map();
  }

  push(mat, geo, m) {
    geo.applyMatrix4(m);
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    if (!this.map.has(mat)) this.map.set(mat, []);
    this.map.get(mat).push(geo);
    return this;
  }

  place(mat, geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    _q.setFromEuler(_e.set(rx, ry, rz));
    _m.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
    return this.push(mat, geo, _m);
  }

  box(mat, w, h, d, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    return this.place(mat, new THREE.BoxGeometry(w, h, d), x, y, z, rx, ry, rz);
  }

  // Cylinder along Y by default (rt = top radius, rb = bottom radius).
  cyl(mat, rt, rb, h, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, seg = 16, open = false) {
    return this.place(mat, new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), x, y, z, rx, ry, rz);
  }

  sphere(mat, r, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, seg = 12) {
    return this.place(mat, new THREE.SphereGeometry(r, seg, Math.max(6, seg >> 1)), x, y, z, 0, 0, 0, sx, sy, sz);
  }

  // A cylinder running between two points.
  rod(mat, ax, ay, az, bx, by, bz, r = 0.05, seg = 6) {
    _a.set(ax, ay, az);
    _b.set(bx, by, bz);
    const len = _a.distanceTo(_b);
    if (len < 1e-5) return this;
    _p.addVectors(_a, _b).multiplyScalar(0.5);
    _q.setFromUnitVectors(_up, _b.clone().sub(_a).normalize());
    _m.compose(_p, _q, _s.set(1, 1, 1));
    return this.push(mat, new THREE.CylinderGeometry(r, r, len, seg, 1), _m);
  }

  // A box running between two points (square section, for plates and struts).
  beam(mat, ax, ay, az, bx, by, bz, w = 0.1, d = 0.1) {
    _a.set(ax, ay, az);
    _b.set(bx, by, bz);
    const len = _a.distanceTo(_b);
    if (len < 1e-5) return this;
    _p.addVectors(_a, _b).multiplyScalar(0.5);
    _q.setFromUnitVectors(_up, _b.clone().sub(_a).normalize());
    _m.compose(_p, _q, _s.set(1, 1, 1));
    return this.push(mat, new THREE.BoxGeometry(w, len, d), _m);
  }

  build({ cast = true, receive = true } = {}) {
    const g = new THREE.Group();
    this.map.forEach((list, mat) => {
      const geo = mergeGeometries(list, false);
      list.forEach((l) => l.dispose());
      if (!geo) return;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = cast;
      mesh.receiveShadow = receive;
      g.add(mesh);
    });
    this.map.clear();
    return g;
  }
}

const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 8, 1);
// Stretch a unit cylinder mesh between two world points (for ropes, slings, hydraulic rods).
export function aim(mesh, a, b, r) {
  const len = a.distanceTo(b);
  mesh.position.addVectors(a, b).multiplyScalar(0.5);
  _b.subVectors(b, a);
  if (len > 1e-5) mesh.quaternion.setFromUnitVectors(_up, _b.multiplyScalar(1 / len));
  mesh.scale.set(r, Math.max(len, 1e-4), r);
}
export function lineMesh(mat, r = 0.02, cast = false) {
  const m = new THREE.Mesh(unitCyl, mat);
  m.castShadow = cast;
  m.userData.r = r;
  m.frustumCulled = false;
  return m;
}

// A telescoping hydraulic ram between two Object3D anchors: barrel on the parent side, chrome rod out of it.
export class Ram {
  constructor(parent, a, b, { barrel, rod, rb = 0.085, rr = 0.05 }) {
    this.a = a;
    this.b = b;
    this.rb = rb;
    this.rr = rr;
    this.barrel = lineMesh(barrel, rb, true);
    this.rod = lineMesh(rod, rr, false);
    parent.add(this.barrel, this.rod);
    this.pa = new THREE.Vector3();
    this.pb = new THREE.Vector3();
    this.mid = new THREE.Vector3();
    this.inv = new THREE.Matrix4();
    this.parent = parent;
  }

  update() {
    this.parent.updateWorldMatrix(true, false);
    this.inv.copy(this.parent.matrixWorld).invert();
    this.a.getWorldPosition(this.pa).applyMatrix4(this.inv);
    this.b.getWorldPosition(this.pb).applyMatrix4(this.inv);
    const len = this.pa.distanceTo(this.pb);
    const bl = len * 0.52;
    this.mid.lerpVectors(this.pa, this.pb, 0.52);
    aim(this.barrel, this.pa, this.mid, this.rb);
    this.barrel.scale.y = bl;
    aim(this.rod, this.mid, this.pb, this.rr);
    this.rod.scale.y = Math.max(len - bl, 1e-4);
  }
}

// Texture with text on it, for decals on machines and vests.
export function labelTexture(text, { w = 512, h = 128, font = '800 84px Arial Black, Arial, sans-serif', color = '#ffffff', bg = null, stroke = null, tracking = 0 } = {}) {
  return canvasTexture(
    w,
    h,
    (g) => {
      if (bg) {
        g.fillStyle = bg;
        g.fillRect(0, 0, w, h);
      }
      g.font = font;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      if (tracking && 'letterSpacing' in g) g.letterSpacing = `${tracking}px`;
      if (stroke) {
        g.lineWidth = 6;
        g.strokeStyle = stroke;
        g.strokeText(text, w / 2, h / 2 + 4);
      }
      g.fillStyle = color;
      g.fillText(text, w / 2, h / 2 + 4);
    },
    { aniso: 8 }
  );
}

export function decal(text, width, height, opts = {}) {
  const tex = labelTexture(text, { w: opts.w || 512, h: opts.h || Math.round(((opts.w || 512) * height) / width), ...opts });
  const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.55, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, depthWrite: false });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
  m.renderOrder = 2;
  return m;
}

// A helical auger flight: a ribbon wound around a core, double sided.
export function helixFlight(R, r0, height, turns, segs = 120, thick = 0.05) {
  const pos = [];
  const nor = [];
  const uv = [];
  const idx = [];
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const a = u * turns * Math.PI * 2;
    const y = (u - 0.5) * height;
    const c = Math.cos(a);
    const s = Math.sin(a);
    // inner edge, outer edge, each with a top and a bottom face for thickness
    [[r0, 0.5], [R, 0.5], [r0, -0.5], [R, -0.5]].forEach(([r, th]) => {
      pos.push(c * r, y + th * thick, s * r);
      nor.push(0, th > 0 ? 1 : -1, 0);
      uv.push(u * turns, r === R ? 1 : 0);
    });
    if (i > 0) {
      const b = (i - 1) * 4;
      const n = i * 4;
      // top face, bottom face, outer rim
      idx.push(b, n, b + 1, b + 1, n, n + 1);
      idx.push(b + 2, b + 3, n + 2, b + 3, n + 3, n + 2);
      idx.push(b + 1, n + 1, b + 3, b + 3, n + 1, n + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Wire-rope cage (rebar): vertical bars, a helical spiral and stiffener rings. Origin at the bottom centre.
export function cageGeometry(radius = 0.42, height = 12, bars = 14) {
  const parts = new Parts();
  const mat = {}; // single bucket
  const list = [];
  const bar = 0.017;
  for (let i = 0; i < bars; i++) {
    const a = (i / bars) * Math.PI * 2;
    const g = new THREE.CylinderGeometry(bar, bar, height, 5, 1);
    g.translate(Math.cos(a) * radius, height / 2, Math.sin(a) * radius);
    list.push(g);
  }
  // spiral binding
  const pitch = 0.2;
  const pts = [];
  const steps = Math.floor((height / pitch) * 20);
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const a = u * (height / pitch) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * (radius + 0.012), u * height, Math.sin(a) * (radius + 0.012)));
  }
  list.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), steps, 0.011, 4, false));
  // stiffener rings every 2 m
  for (let y = 0.2; y <= height; y += 2) {
    const g = new THREE.TorusGeometry(radius, 0.026, 5, 28);
    g.rotateX(Math.PI / 2);
    g.translate(0, y, 0);
    list.push(g);
  }
  list.forEach((g) => {
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  });
  void parts;
  void mat;
  return mergeGeometries(list, false);
}

// Lathe from a profile of [radius, y] pairs.
export function lathe(profile, seg = 24) {
  return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg);
}

export const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
