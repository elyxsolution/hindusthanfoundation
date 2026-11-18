import * as THREE from 'three';
import { makeMaterials } from './materials.js';
import { Parts, cageGeometry, lineMesh, aim, lerp, smooth, pulse, easeInOut, clamp01, V3 } from './kit.js';
import { makeClods } from './particles.js';
import { buildRig } from './rig.js';
import { buildCrane } from './crane.js';
import { buildExcavator } from './excavator.js';
import { buildTipper, buildMixer } from './trucks.js';
import { buildWorker } from './workers.js';
import { GROUND, buildGround, buildBore, makeShaftMaterial, buildHeap, buildHoarding, buildBarriers, buildCones, buildSkyline, buildClouds, buildFrame, buildContainer, buildStock, buildHopper } from './site.js';
import { buildCore } from './core.js';
import { buildTestStation, BLOCKS, DESIGN_MT, loadCurve } from './testStation.js';
import { LOOP, BORE_D, PILES } from './world.js';

const seg = (t, a, b) => clamp01((t - a) / (b - a));
const H_CAGE = 12;
const SLING = 2.4;

// A camera framing: where to look, how far back, from which angle, and how wide.
const F = (lx, ly, lz, dist, az, el, hfov, shift = 0) => ({ lx, ly, lz, dist, az, el, hfov, shift });
const mixF = (a, b, w) => ({ lx: lerp(a.lx, b.lx, w), ly: lerp(a.ly, b.ly, w), lz: lerp(a.lz, b.lz, w), dist: lerp(a.dist, b.dist, w), az: lerp(a.az, b.az, w), el: lerp(a.el, b.el, w), hfov: lerp(a.hfov, b.hfov, w), shift: lerp(a.shift, b.shift, w) });
const mixPose = (a, b, w) => ({ yh: lerp(a.yh, b.yh, w), ext: lerp(a.ext, b.ext, w), rot: lerp(a.rot, b.rot, w), soilAmt: lerp(a.soilAmt, b.soilAmt, w), fling: lerp(a.fling, b.fling, w), drip: lerp(a.drip, b.drip, w) });

// Everything on the site. update(time, dt) runs the 48-second loop on its own (standalone page).
// update(time, dt, { p }) is the scroll story: p = 0..1 hero, 1..2 rotary boring, 2..3 cage and concrete, 3..4 load test.
export function buildSite() {
  const M = makeMaterials();
  const root = new THREE.Group();
  const clods = makeClods(M);
  root.add(clods.mesh);

  const R2 = PILES.rig2;
  const R4 = PILES.pour;
  const TP = PILES.test;

  // ---- ground, openings for the underground views, and bores ----
  const pilePts = [PILES.rig1, PILES.cage].map((p) => [p.x, p.z]);
  const holes = {
    rig2: { x0: R2.x - 3.0, x1: R2.x + 1.7, z0: R2.z - 2.6, z1: R2.z + 2.6, pile: R2 },
    pour: { x0: R4.x - 4.2, x1: R4.x + 3.0, z0: R4.z - 2.6, z1: R4.z + 2.6, pile: R4 },
    test: { x0: TP.x - 4.0, x1: TP.x + 4.0, z0: -1.7, z1: 1.7, pile: TP },
  };
  const spots = [
    [-17.7, -9, 6, 4], [-3.7, 0, 6, 4], [13, -6, 7, 5], [30, -3, 7, 5], [25, 2, 7, 3], [-38, -2, 6, 5], [-30.2, -2.6, 6, 3], [-17, 14.5, 4, 3], [TP.x + 3, 1, 14, 9], [TP.x + 17, -5, 6, 4],
  ];
  const ground = buildGround(M, pilePts, spots, Object.values(holes));
  root.add(ground);
  const shaft = makeShaftMaterial();
  const shaft2 = shaft.clone();
  shaft2.transparent = true;
  const bores = {};
  [['rig1', PILES.rig1, false], ['rig2', R2, false], ['cage', PILES.cage, true], ['pour', R4, true]].forEach(([k, p, cover]) => {
    const b = buildBore(M, k === 'rig2' ? shaft2 : shaft, { cover });
    b.group.position.set(p.x, 0, p.z);
    root.add(b.group);
    bores[k] = b;
  });

  // glass core samples with lids that fade away (rig2: boring, pour: cage + concrete, test: load test)
  const cores = {};
  const lids = {};
  Object.entries(holes).forEach(([k, h]) => {
    const c = buildCore({ x0: h.x0, x1: h.x1, z0: h.z0, z1: h.z1, depth: 20, pile: h.pile });
    root.add(c.group);
    cores[k] = c;
    const lm = ground.material.clone();
    lm.transparent = true;
    lm.polygonOffset = true;
    lm.polygonOffsetFactor = -2;
    lm.polygonOffsetUnits = -2;
    const lid = new THREE.Mesh(c.lidGeo, lm);
    lid.position.y = 0.004;
    lid.receiveShadow = true;
    root.add(lid);
    lids[k] = lid;
  });
  const setCore = (k, a) => {
    cores[k].setOpacity(a);
    lids[k].material.opacity = 1 - a;
    lids[k].material.depthWrite = a < 0.02;
    lids[k].visible = a < 0.995;
  };

  // beyond the site boundary: a dusty verge out to the horizon
  const outerMat = new THREE.MeshStandardMaterial({ color: '#7f7a62', roughness: 1 });
  // a frame of verge around the site (not under it, so the underground views stay clear)
  const outerShape = new THREE.Shape();
  outerShape.moveTo(-1200, -700);
  outerShape.lineTo(1200, -700);
  outerShape.lineTo(1200, 700);
  outerShape.lineTo(-1200, 700);
  outerShape.closePath();
  const gh = new THREE.Path();
  gh.moveTo(-GROUND.w / 2, -GROUND.d / 2);
  gh.lineTo(-GROUND.w / 2, GROUND.d / 2);
  gh.lineTo(GROUND.w / 2, GROUND.d / 2);
  gh.lineTo(GROUND.w / 2, -GROUND.d / 2);
  gh.closePath();
  outerShape.holes.push(gh);
  const outer = new THREE.Mesh(new THREE.ShapeGeometry(outerShape), outerMat);
  outer.rotation.x = -Math.PI / 2;
  outer.position.y = -0.08;
  outer.receiveShadow = true;
  root.add(outer);
  const under = new THREE.Mesh(new THREE.PlaneGeometry(5000, 4000), new THREE.MeshBasicMaterial({ color: '#1a130d', fog: false }));
  under.rotation.x = -Math.PI / 2;
  under.position.y = -20.05;
  under.visible = false;
  under.material.transparent = true;
  root.add(under);

  // ---- concrete in the pour pile, and its cage ----
  const pourMat = M.concreteWet.clone();
  pourMat.transparent = true;
  pourMat.opacity = 0.8;
  const concrete = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.47, 1, 24, 1), pourMat);
  concrete.geometry.translate(0, 0.5, 0);
  concrete.position.set(R4.x, -BORE_D, R4.z);
  concrete.receiveShadow = true;
  root.add(concrete);
  const cageGeo = cageGeometry(0.42, H_CAGE, 14);
  const cageInPour = new THREE.Mesh(cageGeo, M.rebar);
  cageInPour.position.set(R4.x, 0.35 - H_CAGE, R4.z);
  cageInPour.castShadow = true;
  root.add(cageInPour);

  // ---- soil heaps and dressing ----
  root.add(buildHeap(M, -44.9, 1.2, 3.8, 1.3, 2.9, 11, 0.6));
  root.add(buildHeap(M, -19.6, 17.0, 2.4, 1.0, 2.0, 5, 0.2));
  root.add(buildHeap(M, -12.6, 13.0, 4.2, 1.7, 3.2, 9, 1.1));
  root.add(buildHeap(M, PILES.rig1.x - 2.6, PILES.rig1.z + 2.6, 2.4, 1.1, 2.0, 3, 0.4));
  root.add(buildHeap(M, R2.x - 6.8, R2.z + 3.8, 2.0, 0.9, 1.7, 8, 1.3));
  root.add(buildHeap(M, R2.x - 7.0, R2.z - 3.6, 2.8, 1.3, 2.4, 6, 2.0));
  root.add(buildHeap(M, -60, 18, 4, 1.4, 3, 2, 0.3));
  root.add(buildHeap(M, 40, 15, 5, 1.8, 3.4, 12, 0.9));
  root.add(buildHoarding(M));
  const barriers = buildBarriers(M, -62, 62, 31);
  const cones = buildCones(M, [[-63, 31.6], [63, 31.6], [-24, 28.5], [-5, 29], [22, 28.5], [44, 29], [-40, 20], [38, 17]]);
  root.add(barriers, cones);
  root.add(buildSkyline());
  root.add(buildClouds());
  const frame = buildFrame(M);
  frame.position.set(-84, 0, -38);
  frame.rotation.y = 0.18;
  root.add(frame);
  const stock = buildStock(M);
  stock.position.set(66, 0, 22);
  stock.rotation.y = 0.2;
  root.add(stock);
  [[-60, -30, 0.1, '#2c5fa8'], [-60, -34.5, 0.1, '#b9402e'], [78, -26, -0.15, '#e8e6e0']].forEach(([x, z, ry, c]) => {
    const box = buildContainer(M, c);
    box.position.set(x, 0, z);
    box.rotation.y = ry;
    root.add(box);
  });

  // ---- machines ----
  const rig1 = buildRig(M, { phase: 0, clods, spinDir: 1 });
  rig1.obj.position.set(PILES.rig1.x + 4.3, 0, PILES.rig1.z);
  rig1.obj.rotation.y = Math.PI;
  root.add(rig1.obj);
  const rig2 = buildRig(M, { phase: 0.5, clods, spinDir: 1 });
  rig2.obj.position.set(R2.x + 4.3, 0, R2.z);
  rig2.obj.rotation.y = Math.PI;
  root.add(rig2.obj);

  const crane1 = buildCrane(M);
  crane1.obj.position.set(13, 0, -6);
  crane1.obj.rotation.y = Math.PI;
  root.add(crane1.obj);
  const crane2 = buildCrane(M);
  crane2.obj.position.set(30, 0, -3);
  crane2.obj.rotation.y = Math.PI;
  root.add(crane2.obj);
  const crane3 = buildCrane(M);
  crane3.obj.position.set(TP.x + 17, 0, TP.z - 5);
  crane3.obj.rotation.y = Math.PI;
  root.add(crane3.obj);

  const ex200 = buildExcavator(M, { scale: 1, color: M.hitachi, label: 'EX200', tag: 'TATA HITACHI', period: 8, offset: 0, clods });
  ex200.obj.position.set(-38, 0, -2);
  root.add(ex200.obj);
  const kubota = buildExcavator(M, { scale: 0.55, color: M.kubota, label: 'U30', tag: 'Kubota', period: 6, offset: 0.2, clods, blade: true, canopy: true });
  kubota.obj.position.set(-17, 0, 14.5);
  root.add(kubota.obj);

  const tipper = buildTipper(M, { clods });
  tipper.obj.position.set(-30.2, 0, -2.6);
  root.add(tipper.obj);
  const mixer = buildMixer(M);
  mixer.obj.position.set(25, 0, 2);
  root.add(mixer.obj);

  // ---- the load test station ----
  const station = buildTestStation(M, shaft);
  station.group.position.set(TP.x, 0, TP.z);
  root.add(station.group);

  // ---- carried loads ----
  const cageCarry = new THREE.Mesh(cageGeo, M.rebar);
  cageCarry.castShadow = true;
  root.add(cageCarry);
  const cageStory = new THREE.Mesh(cageGeo, M.rebar);
  cageStory.castShadow = true;
  cageStory.visible = false;
  root.add(cageStory);
  const lyingMat = M.rebar.clone();
  lyingMat.transparent = true;
  const cageLying = new THREE.Mesh(cageGeo, lyingMat);
  cageLying.castShadow = true;
  cageLying.rotation.z = Math.PI / 2;
  cageLying.position.set(18, 0.45, 12.5);
  root.add(cageLying);
  const tremie = buildHopper(M);
  root.add(tremie);
  const standParts = new Parts();
  for (let l = 0; l < 3; l++) standParts.box(M.plank, 1.3, 0.14, 1.3, R4.x - 5.8, 0.07 + l * 0.14, R4.z);
  const tremieStand = standParts.build();
  tremieStand.visible = false;
  root.add(tremieStand);

  const slingsC = [0, 1, 2, 3].map(() => lineMesh(M.sling, 0.018));
  const slingsT = [0, 1, 2].map(() => lineMesh(M.sling, 0.018));
  const slingsB = [0, 1].map(() => lineMesh(M.sling, 0.02));
  const slingsS = [0, 1, 2, 3].map(() => lineMesh(M.sling, 0.018));
  root.add(...slingsC, ...slingsT, ...slingsB, ...slingsS);

  // ---- people ----
  const workers = [];
  const addWorker = (x, z, ry, opts) => {
    const w = buildWorker(M, opts);
    w.obj.position.set(x, 0, z);
    w.obj.rotation.y = ry;
    root.add(w.obj);
    workers.push(w);
  };
  addWorker(-27, 24, Math.PI + 0.05, { pose: 'point', scale: 1.55, phase: 0 });
  addWorker(-24.7, 24.4, Math.PI - 0.12, { pose: 'idle', scale: 1.55, phase: 0.4, skin: 'skin2', helmet: 'helmet' });
  addWorker(-16, -3.5, 0.5, { pose: 'signal', scale: 1.2, phase: 0.2 });
  addWorker(6.2, -2.6, 2.6, { pose: 'signal', scale: 1.2, phase: 0.7, skin: 'skin2' });
  addWorker(-3.0, 6.4, 3.2, { pose: 'idle', scale: 1.2, phase: 0.9 });
  addWorker(24.2, -0.4, 4.4, { pose: 'wave', scale: 1.2, phase: 0.3 });
  addWorker(-29.6, -4.6, 0.1, { pose: 'signal', scale: 1.2, phase: 0.5, skin: 'skin2' });
  addWorker(10.5, 10, 3.0, { pose: 'idle', scale: 1.2, phase: 0.6, helmet: 'helmetYellow' });
  addWorker(TP.x + 6.4, 4.2, 3.4, { pose: 'idle', scale: 1.2, phase: 0.3, helmet: 'helmetYellow' });
  addWorker(TP.x - 6.4, 4.0, 2.9, { pose: 'wave', scale: 1.2, phase: 0.8, skin: 'skin2' });

  // ---- drive helpers ----
  const tmp = V3();
  function driveCrane(crane, target, sx = 0, sz = 0) {
    const g = crane.obj;
    g.updateWorldMatrix(true, false);
    tmp.copy(target);
    g.worldToLocal(tmp);
    const swing = Math.atan2(-tmp.z, tmp.x);
    const rr = Math.hypot(tmp.x, tmp.z);
    let phi = 1.2;
    for (let i = 0; i < 4; i++) phi = Math.acos(Math.min(0.985, Math.max(0.2, (rr - 2.3 - 0.55 * Math.sin(phi)) / 25.55)));
    crane.set({ swing, luff: phi, rope: 1, sx, sz });
    const tl = crane.tipLocal();
    const rope = Math.max(1, tl.y - (tmp.y + 0.4));
    crane.set({ swing, luff: phi, rope, sx, sz });
    return crane.hookEye();
  }

  const ringW = V3();
  const target = V3();
  const rim = V3();
  const eyeTmp = V3();
  const W0 = { x: 6, z: 12.5 }; // top end of the spare cage on the stack
  const LYING = -1; // the stack lies with its top end toward -x
  const P3 = PILES.cage;
  const P4 = R4;
  const STAND = { x: R4.x - 5.8, z: R4.z }; // where the tremie pipe stands until the crane picks it
  let first = true;
  let ghostOn = false;
  // Each chapter runs on its own looping clock: it restarts whenever the chapter is entered and then repeats on its own.
  const T1 = 15; // one bore
  const T2 = 15; // cage, tremie, pour
  const T3 = 15; // stack the kentledge, load the pile
  // chapter 2 keeps its old internal timeline (cage 0-0.4, tremie 0.4-0.78, pour 0.78-0.95); this maps the new 15 s pacing onto it
  const KN = [[0, 0], [0.04, 0.02], [0.28, 0.4], [0.52, 0.78], [0.86, 0.95], [1, 1]];
  const remap2 = (u) => {
    for (let i = 0; i < KN.length - 1; i++) {
      if (u <= KN[i + 1][0]) return lerp(KN[i][1], KN[i + 1][1], (u - KN[i][0]) / (KN[i + 1][0] - KN[i][0]));
    }
    return 1;
  };
  const clocks = [0, 0, 0];

  const tipOf = (u) => {
    const p = rig2.poseAt(u);
    return p.yh - (10 + 9 * p.ext);
  };
  const state = { focus: F(-3, 10.6, 0, 64, 0, 0.075, 72, 0.06), hud: { chapter: 0 } };

  // ---------- scroll-story camera framings ----------
  function focusHero(sp) {
    return F(-3, 10.6, 0, 64, lerp(-0.05, 0.05, smooth(0, 0.6, sp)), 0.075, 72, 0.06);
  }
  // Every chapter opens on the whole machine, zooms in on the work, and pulls back out at the end of its loop.
  const boreWide = F(R2.x + 4, 10, R2.z, 78, 0.04, 0.06, 52, 0.15);
  const cageWide = F(20, 10, R4.z, 80, 0.0, 0.06, 52, 0.14);
  const testWide = F(TP.x + 4, 8, 0, 74, 0.0, 0.1, 56, 0.12);

  function focusBore(u) {
    const zoom = smooth(0.1, 0.3, u) * (1 - smooth(0.74, 0.93, u));
    const down = smooth(0.06, 0.44, u);
    const up = smooth(0.5, 0.74, u);
    const ly = u < 0.5 ? lerp(9, -6.5, down) : lerp(-6.5, 8.5, up);
    const close = F(R2.x - 0.2, ly, R2.z, lerp(41, 34, smooth(0.06, 0.3, u)) + 6 * smooth(0.55, 0.74, u), 0.04, 0.05, 52, 0.17);
    return mixF(boreWide, close, zoom);
  }
  function focusCage(u) {
    const zoom = smooth(0.08, 0.22, u) * (1 - smooth(0.88, 0.98, u));
    let ly = lerp(9, -4, smooth(0.02, 0.24, u));
    ly = lerp(ly, 6, smooth(0.28, 0.36, u));
    ly = lerp(ly, -4, smooth(0.5, 0.62, u));
    const close = F(17.6, ly, R4.z, 40, 0.0, 0.05, 52, 0.17);
    return mixF(cageWide, close, zoom);
  }
  function focusTest(u) {
    const zoom = smooth(0.06, 0.2, u) * (1 - smooth(0.9, 0.99, u));
    const stack = F(TP.x + 4, 6.8, 0, 52, 0.0, 0.1, 60, 0.12);
    const load = F(TP.x - 0.5, -1.2, 0, 29, 0.0, 0.07, 48, 0.17);
    const close = mixF(stack, load, smooth(0.38, 0.48, u));
    return mixF(testWide, close, zoom);
  }
  // moving to the next machine: pull out to the whole machine, shift across, then the next chapter zooms in
  const hop = (from, wideFrom, to, wideTo, t) =>
    mixF(mixF(from, wideFrom, smooth(0, 0.5, t)), mixF(wideTo, to, smooth(0.5, 1, t)), smooth(0.35, 0.65, t));

  // ---------- kentledge: how a block travels from the yard to the stack ----------
  const yClear = 12.5;
  function blockMotion(i, f) {
    const Y = station.yardSlot(i);
    const S = station.stackSlot(i);
    const prev = i === 0 ? Y : station.stackSlot(i - 1);
    const eyeUp = (b) => b.y + station.BY / 2 + SLING;
    let hx;
    let hy;
    let hz;
    let b = Y;
    let slings = false;
    if (f < 0.2) {
      const m = easeInOut(seg(f, 0, 0.2));
      hx = lerp(prev.x, Y.x, m);
      hz = lerp(prev.z, Y.z, m);
      hy = lerp(yClear, eyeUp(Y), easeInOut(seg(f, 0.06, 0.2)));
    } else if (f < 0.28) {
      hx = Y.x; hz = Y.z; hy = eyeUp(Y);
      slings = f > 0.24;
    } else if (f < 0.42) {
      hx = Y.x; hz = Y.z;
      hy = lerp(eyeUp(Y), yClear, easeInOut(seg(f, 0.28, 0.42)));
      slings = true;
      b = { x: hx, y: hy - SLING - station.BY / 2, z: hz };
    } else if (f < 0.68) {
      const m = easeInOut(seg(f, 0.42, 0.68));
      hx = lerp(Y.x, S.x, m); hz = lerp(Y.z, S.z, m); hy = yClear;
      slings = true;
      b = { x: hx, y: hy - SLING - station.BY / 2, z: hz };
    } else if (f < 0.88) {
      hx = S.x; hz = S.z;
      hy = lerp(yClear, eyeUp(S), easeInOut(seg(f, 0.68, 0.88)));
      slings = true;
      b = { x: hx, y: hy - SLING - station.BY / 2, z: hz };
    } else if (f < 0.94) {
      hx = S.x; hz = S.z; hy = eyeUp(S); b = S;
      slings = f < 0.9;
    } else {
      hx = S.x; hz = S.z;
      hy = lerp(eyeUp(S), yClear, easeInOut(seg(f, 0.94, 1)));
      b = S;
    }
    return { hx, hy, hz, b, slings };
  }

  function update(time, dt, story) {
    const t = ((time % LOOP) + LOOP) % LOOP;
    const hasStory = !!story;
    const sp = hasStory ? story.p : 0;
    if (first) {
      root.updateMatrixWorld(true);
      first = false;
    }
    // how much the camera is on each chapter (1 = on it), and the chapter's own loop position
    const act = (k) => 1 - smooth(0.5, 0.95, Math.abs(sp - k));
    const a1 = hasStory ? act(1) : 0;
    const a2 = hasStory ? act(2) : 0;
    const a3 = hasStory ? (sp >= 3 ? 1 : act(3)) : 0;
    [a1, a2, a3].forEach((a, i) => {
      clocks[i] = a > 0.001 ? clocks[i] + dt : 0;
    });
    const u1 = (clocks[0] / T1) % 1;
    const n2 = (clocks[1] / T2) % 1; // chapter 2 clock, 0..1
    const u2 = remap2(n2);
    const u3 = (clocks[2] / T3) % 1;
    const scripted2 = hasStory && a2 > 0.001; // crane 2 and the pour pile are scripted once the camera is on its way there

    // ---------------- tremie, crane 2 and the mixer ----------------
    if (!scripted2) {
      let funnelTop = 17;
      if (t < 2) funnelTop = 17;
      else if (t < 12) funnelTop = lerp(17, 1.4, easeInOut(seg(t, 2, 12)));
      else if (t < 36) funnelTop = lerp(1.4, 2.5, smooth(12, 36, t));
      else if (t < 46) funnelTop = lerp(2.5, 17, easeInOut(seg(t, 36, 46)));
      const sway = Math.sin(t * 1.3) * 0.03;
      tremie.position.set(P4.x + sway, funnelTop, P4.z);
      target.set(P4.x, funnelTop + SLING + 0.5, P4.z);
      driveCrane(crane2, target, 0, 0);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        ringW.set(P4.x + sway + Math.cos(a) * 0.8, funnelTop + 0.28, P4.z + Math.sin(a) * 0.8);
        aim(slingsT[i], eyeTmp.copy(crane2.hookEye()).setY(funnelTop + SLING + 0.45), ringW, 0.018);
        slingsT[i].visible = true;
      }
      const deploy = pulse(10, 12.5, 37, 39.5, t);
      const flow = pulse(14, 15.5, 35, 36.5, t);
      rim.set(P4.x, funnelTop + 0.45, P4.z);
      mixer.set({ deploy, flow, drumRate: lerp(1.3, 3.6, flow), target: rim, dt });
      const level = smooth(14, 36, t);
      concrete.visible = level > 0.002;
      concrete.scale.y = Math.max(0.001, level * (BORE_D + 0.1));
      const c4 = t >= 24 ? smooth(44, 46, t) : 1 - smooth(0, 2, t);
      bores.pour.plate.position.x = lerp(2.6, 0, c4);
      bores.pour.plate.visible = true;
      cageInPour.visible = true;
      cageStory.visible = false;
      tremieStand.visible = false;
      slingsS.forEach((s) => (s.visible = false));
    } else {
      // scripted by scroll: lower the cage, then pick the tremie pipe, lower it, and pour
      bores.pour.plate.visible = false;
      cageInPour.visible = false;
      cageStory.visible = true;
      tremieStand.visible = true;
      let cageTop = 13.5;
      if (u2 < 0.02) cageTop = 13.5;
      else if (u2 < 0.4) cageTop = lerp(13.5, 0.35, easeInOut(seg(u2, 0.02, 0.4)));
      else cageTop = 0.35;
      cageStory.position.set(P4.x, cageTop - H_CAGE, P4.z);

      let hx = P4.x;
      let hz = P4.z;
      let eye;
      let funnelTop = 15.9;
      let funnelX = STAND.x;
      let carrying = false;
      if (u2 < 0.4) {
        eye = cageTop + SLING;
      } else if (u2 < 0.46) {
        eye = lerp(0.35 + SLING, 20, easeInOut(seg(u2, 0.41, 0.46)));
      } else if (u2 < 0.54) {
        const m = easeInOut(seg(u2, 0.46, 0.54));
        hx = lerp(P4.x, STAND.x, m);
        eye = 20;
      } else if (u2 < 0.58) {
        hx = STAND.x;
        eye = lerp(20, funnelTop + SLING + 0.5, easeInOut(seg(u2, 0.54, 0.58)));
      } else if (u2 < 0.62) {
        hx = STAND.x;
        funnelTop = lerp(15.9, 17, easeInOut(seg(u2, 0.58, 0.62)));
        eye = funnelTop + SLING + 0.5;
        carrying = true;
      } else if (u2 < 0.7) {
        const m = easeInOut(seg(u2, 0.62, 0.7));
        hx = lerp(STAND.x, P4.x, m);
        funnelX = hx;
        funnelTop = 17;
        eye = funnelTop + SLING + 0.5;
        carrying = true;
      } else {
        hx = P4.x;
        funnelX = P4.x;
        carrying = true;
        if (u2 < 0.78) funnelTop = lerp(17, 1.4, easeInOut(seg(u2, 0.7, 0.78)));
        else funnelTop = lerp(1.4, 2.5, smooth(0.78, 0.93, u2));
        eye = funnelTop + SLING + 0.5;
      }
      if (carrying) funnelX = hx;
      if (u2 < 0.62) funnelX = STAND.x;
      tremie.position.set(funnelX, funnelTop, STAND.z);
      target.set(hx, eye, hz);
      driveCrane(crane2, target, 0, 0);
      // slings: to the cage until it is released, to the funnel while the pipe is carried
      const onCage = u2 < 0.405;
      for (let i = 0; i < 4; i++) {
        slingsS[i].visible = onCage;
        if (!onCage) continue;
        const a = (i / 4) * Math.PI * 2;
        ringW.set(P4.x + Math.cos(a) * 0.42, cageTop, P4.z + Math.sin(a) * 0.42);
        aim(slingsS[i], crane2.hookEye(), ringW, 0.018);
      }
      const onTremie = u2 >= 0.565;
      for (let i = 0; i < 3; i++) {
        slingsT[i].visible = onTremie;
        if (!onTremie) continue;
        const a = (i / 3) * Math.PI * 2;
        ringW.set(tremie.position.x + Math.cos(a) * 0.8, tremie.position.y + 0.28, tremie.position.z + Math.sin(a) * 0.8);
        aim(slingsT[i], eyeTmp.copy(crane2.hookEye()).setY(funnelTop + SLING + 0.45), ringW, 0.018);
      }
      const deploy = pulse(0.7, 0.76, 0.95, 0.99, u2);
      const flow = pulse(0.79, 0.81, 0.92, 0.94, u2);
      rim.set(P4.x, funnelTop + 0.45, P4.z);
      mixer.set({ deploy, flow, drumRate: lerp(1.3, 3.6, flow), target: rim, dt });
      const level = smooth(0.8, 0.93, u2);
      concrete.visible = level > 0.002;
      concrete.scale.y = Math.max(0.001, level * (BORE_D + 0.1));
    }

    // ---------------- crane 1 and the reinforcement cage (loop) ----------------
    let hx;
    let hz;
    let yT = 13.5;
    let eyeY;
    if (t < 16) {
      hx = P3.x;
      hz = P3.z;
      yT = lerp(13.5, 0.35, easeInOut(seg(t, 0, 14.5)));
      eyeY = yT + SLING;
    } else if (t < 31) {
      const m = easeInOut(seg(t, 19, 27.5));
      hx = lerp(P3.x, W0.x, m);
      hz = lerp(P3.z, W0.z, m);
      eyeY = t < 19 ? lerp(2.75, 7, easeInOut(seg(t, 16, 19))) : t < 26 ? lerp(7, 11, easeInOut(seg(t, 19, 26))) : lerp(11, 0.45 + SLING, easeInOut(seg(t, 26, 30.5)));
      yT = 0.45;
    } else if (t < 41) {
      hx = W0.x;
      hz = W0.z;
      yT = lerp(0.45, 12.45, easeInOut(seg(t, 31, 41)));
      eyeY = yT + SLING;
    } else {
      const m = easeInOut(seg(t, 41, 48));
      hx = lerp(W0.x, P3.x, m);
      hz = lerp(W0.z, P3.z, m);
      yT = t < 44.5 ? lerp(12.45, 17.5, easeInOut(seg(t, 41, 44.5))) : lerp(17.5, 13.5, easeInOut(seg(t, 44.5, 48)));
      eyeY = yT + SLING;
    }
    target.set(hx, eyeY, hz);
    driveCrane(crane1, target, Math.sin(t * 1.1) * 0.05, Math.cos(t * 0.9) * 0.05);

    cageCarry.visible = t < 29.6 || t >= 31;
    cageLying.visible = t < 31;
    lyingMat.opacity = smooth(0, 2.5, t);
    if (t < 29.6) {
      const topY = t < 16 ? yT : 0.35;
      cageCarry.position.set(P3.x, topY - H_CAGE, P3.z);
      cageCarry.rotation.set(0, 0, 0);
    } else if (t >= 31) {
      const alpha = Math.asin(clamp01((yT - 0.45) / H_CAGE));
      const along = t < 41 ? Math.cos(alpha) * H_CAGE : 0;
      cageCarry.position.set(hx - LYING * along, yT - Math.sin(alpha) * H_CAGE, hz);
      cageCarry.rotation.set(0, 0, LYING * (alpha - Math.PI / 2));
    }
    const slingsOn = t < 16 || t >= 29.5;
    const carryObj = t >= 29.5 && t < 31 ? cageLying : cageCarry;
    slingsC.forEach((s, i) => {
      s.visible = slingsOn;
      if (!slingsOn) return;
      const a = (i / 4) * Math.PI * 2;
      ringW.set(Math.cos(a) * 0.42, H_CAGE, Math.sin(a) * 0.42);
      carryObj.updateMatrixWorld(true);
      carryObj.localToWorld(ringW);
      aim(s, crane1.hookEye(), ringW, 0.018);
    });
    const c3 = smooth(27.5, 29.5, t) * (1 - smooth(41, 44, t));
    bores.cage.plate.position.x = lerp(2.6, 0, c3);

    // ---------------- rotary rigs ----------------
    rig1.update(t, dt);
    let borePose;
    const tu = rig2.timeU(t);
    if (hasStory) {
      borePose = mixPose(rig2.poseAt(tu), rig2.poseAt(u1), smooth(0, 1, a1));
    } else borePose = rig2.poseAt(tu);
    rig2.apply(borePose, dt);
    // the shaft is only as deep as the tool has bored so far; it fades away at the end of each run, then bores again
    if (hasStory) {
      const dStory = u1 < 0.5 ? Math.max(0, -tipOf(u1)) : BORE_D;
      const w1 = smooth(0, 1, a1);
      bores.rig2.setDepth(lerp(BORE_D, Math.min(BORE_D, dStory), w1));
      shaft2.opacity = lerp(1, 1 - smooth(0.9, 1.0, u1), w1);
    } else {
      bores.rig2.setDepth(BORE_D);
      shaft2.opacity = 1;
    }

    // ---------------- the rest of the site (always alive) ----------------
    ex200.update(t, dt);
    kubota.update(t, dt);
    const fill = t >= 45.5 ? 0.02 : 0.08 + 0.9 * smooth(0, 41, t);
    tipper.set({ fill, tip: pulse(41, 44, 46, 47.7, t) });
    workers.forEach((w) => w.update(time));

    // foreground dressing steps aside once the camera moves in; the spare cage and crane 1's own cage loop make way in chapter 2
    if (hasStory) {
      const fg = 1 - smooth(0.3, 0.9, sp);
      barriers.visible = cones.visible = fg > 0.02;
      barriers.scale.y = cones.scale.y = Math.max(fg, 0.001);
      [workers[0], workers[1]].forEach((w) => {
        w.obj.visible = fg > 0.02;
        w.obj.scale.setScalar(Math.max(fg, 0.001));
      });
      const clearLoop = smooth(1.3, 1.6, sp);
      lyingMat.opacity *= 1 - clearLoop;
      if (clearLoop > 0.98) {
        cageCarry.visible = false;
        cageLying.visible = false;
        slingsC.forEach((sl) => (sl.visible = false));
      }
    } else {
      barriers.visible = cones.visible = true;
      barriers.scale.y = cones.scale.y = 1;
    }

    // ---------------- load test station ----------------
    const hud = { chapter: sp < 0.5 ? 0 : sp < 1.5 ? 1 : sp < 2.5 ? 2 : 3, u: 0 };
    const stackP = clamp01(u3 / 0.42);
    const sIdx = Math.min(BLOCKS - 1, Math.floor(stackP * BLOCKS));
    const f = stackP >= 1 ? 1 : stackP * BLOCKS - sIdx;
    let m = null;
    for (let j = 0; j < BLOCKS; j++) {
      if (j < sIdx || (j === sIdx && stackP >= 1)) {
        const S = station.stackSlot(j);
        station.setBlock(j, S.x, S.y, S.z);
      } else if (j > sIdx || stackP <= 0) {
        const Y = station.yardSlot(j);
        station.setBlock(j, Y.x, Y.y, Y.z);
      }
    }
    if (stackP > 0 && stackP < 1) {
      m = blockMotion(sIdx, f);
      station.setBlock(sIdx, m.b.x, m.b.y, m.b.z);
    }
    // hook position for crane 3
    let hxw;
    let hyw;
    let hzw;
    if (stackP <= 0) {
      const Y = station.yardSlot(0);
      hxw = Y.x; hyw = yClear; hzw = Y.z;
    } else if (stackP >= 1) {
      const S = station.stackSlot(BLOCKS - 1);
      hxw = S.x; hyw = yClear; hzw = S.z;
    } else {
      hxw = m.hx; hyw = m.hy; hzw = m.hz;
    }
    target.set(TP.x + hxw, hyw, TP.z + hzw);
    driveCrane(crane3, target, Math.sin(time * 1.1) * 0.04, Math.cos(time * 0.9) * 0.04);
    const carrying = stackP > 0 && stackP < 1 && m.slings;
    slingsB.forEach((s, i) => {
      s.visible = carrying;
      if (!carrying) return;
      ringW.set(TP.x + m.b.x + (i === 0 ? -1.6 : 1.6), m.b.y + station.BY / 2 + 0.05, TP.z + m.b.z);
      aim(s, crane3.hookEye(), ringW, 0.02);
    });
    const placed = stackP >= 1 ? BLOCKS : sIdx + (f > 0.9 ? 1 : 0);
    const v = clamp01((u3 - 0.42) / 0.48);
    const lc = loadCurve(v);
    station.setLoad({ frac: lc.frac, settleMM: lc.settle, time });
    hud.load = lc.frac * DESIGN_MT;
    hud.settle = lc.settle;
    hud.v = v;
    hud.placed = placed;
    hud.blocks = BLOCKS;
    hud.stacking = stackP;

    // ---------------- story: openings, collars, camera, readouts ----------------
    if (hasStory) {
      let fc;
      if (sp < 1) fc = mixF(focusHero(sp), focusBore(u1), smooth(0, 1, sp));
      else if (sp < 2) fc = hop(focusBore(u1), boreWide, focusCage(n2), cageWide, sp - 1);
      else if (sp < 3) fc = hop(focusCage(n2), cageWide, focusTest(u3), testWide, sp - 2);
      else fc = focusTest(u3);
      // keep the camera above ground (it pitches down to look into the core)
      fc.el = Math.max(fc.el, Math.asin(clamp01((2.5 - fc.ly) / fc.dist)));
      state.focus = fc;
      // the core is revealed only while the camera looks below ground; the ground turns into a ghost at the same time
      const looking = 1 - smooth(1, 6, fc.ly);
      const op1 = smooth(0.55, 0.95, sp) * (1 - smooth(1.05, 1.45, sp)) * looking;
      const op2 = smooth(1.55, 1.95, sp) * (1 - smooth(2.05, 2.45, sp)) * looking;
      const op3 = smooth(2.55, 2.95, sp) * looking;
      setCore('rig2', op1);
      setCore('pour', op2);
      setCore('test', op3);
      bores.rig2.group.children.forEach((c) => {
        if (c.isGroup && c !== bores.rig2.plate) c.visible = op1 < 0.5;
      });
      bores.pour.group.children.forEach((c) => {
        if (c.isGroup && c !== bores.pour.plate) c.visible = op2 < 0.5;
      });
      const ug = Math.max(op1, op2, op3);
      // switching a material between opaque and transparent recompiles it, so only do that when it really changes
      const ghost = ug > 0.01;
      if (ghost !== ghostOn) {
        ghostOn = ghost;
        ground.material.transparent = ghost;
        ground.material.needsUpdate = true;
      }
      ground.material.opacity = lerp(1, 0.13, ug);
      ground.material.depthWrite = ug < 0.05;
      under.visible = ghost;
      under.material.opacity = ug;
      ['rig2', 'pour', 'test'].forEach((k) => {
        lids[k].material.opacity = Math.min(lids[k].material.opacity, ground.material.opacity);
      });
      const activeBore = { rig2: op1 > 0.01, pour: op2 > 0.01 };
      bores.rig1.group.visible = ug < 0.2;
      bores.cage.group.visible = ug < 0.2;
      bores.rig2.group.visible = ug < 0.2 || activeBore.rig2;
      bores.pour.group.visible = ug < 0.2 || activeBore.pour;
      station.bore.group.visible = ug < 0.2 || op3 > 0.01;
      hud.u = hud.chapter === 0 ? 0 : hud.chapter === 1 ? u1 : hud.chapter === 2 ? n2 : u3;
      const cutFor = (clock, T, a) => {
        const tr = clock % T;
        const up = smooth(T - 0.8, T, tr);
        const down = clock >= T ? 1 - smooth(0, 0.8, tr) : 0;
        return Math.max(up, down) * a;
      };
      hud.cut = Math.max(cutFor(clocks[1], T2, a2), cutFor(clocks[2], T3, a3));
      hud.depth = Math.max(0, -rig2.tipY());
      hud.boreDepth = hasStory ? (u1 < 0.5 ? Math.max(0, -tipOf(u1)) : BORE_D) : BORE_D;
      hud.cage = clamp01(seg(u2, 0.02, 0.4));
      hud.cageDepth = u2 < 0.4 ? Math.max(0, 13.5 - (13.5 - 0.35) * easeInOut(seg(u2, 0.02, 0.4))) : 0.35;
      hud.concrete = smooth(0.8, 0.93, u2) * BORE_D;
      hud.phase2 = u2 < 0.42 ? 'cage' : u2 < 0.78 ? 'tremie' : 'pour';
    }
    state.hud = hud;

    clods.update(dt);
  }

  function setXray(on) {
    shaft.color.set(on ? '#b79a74' : '#ffffff');
    shaft.emissive.set(on ? '#3a2a1a' : '#000000');
    ground.material.transparent = on;
    ground.material.opacity = on ? 0.12 : 1;
    ground.material.depthWrite = !on;
    ground.material.needsUpdate = true;
    under.visible = on;
  }

  return { root, update, setXray, ground, M, bores, state };
}
