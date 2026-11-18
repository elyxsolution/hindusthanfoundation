// Reusable machine sub-assemblies: crawler tracks, operator cabs, road wheels.

// A crawler track unit. Runs along X, centred on x0, sitting on y = 0.
export function addCrawler(P, M, { len = 5, w = 0.85, h = 1.0, x0 = 0, z = 0 }) {
  const r = h / 2;
  const inner = len - h;
  // belt: upper and lower runs with shoe texture, rounded ends
  P.box(M.track, inner, 0.1, w, x0, h - 0.05, z);
  P.box(M.track, inner, 0.1, w, x0, 0.05, z);
  [-1, 1].forEach((s) => {
    P.cyl(M.track, r, r, w, x0 + s * (inner / 2), r, z, Math.PI / 2, 0, 0, 20);
    P.cyl(M.steel, r * 0.62, r * 0.62, w + 0.06, x0 + s * (inner / 2), r, z, Math.PI / 2, 0, 0, 16);
    P.cyl(M.steelDark, r * 0.3, r * 0.3, w + 0.1, x0 + s * (inner / 2), r, z, Math.PI / 2, 0, 0, 10);
  });
  // track frame between the runs, with rollers
  P.box(M.steelDark, inner, h * 0.7, w - 0.16, x0, r, z);
  const n = Math.max(3, Math.floor(inner / 0.85));
  for (let i = 0; i < n; i++) {
    const x = x0 - inner / 2 + 0.55 + (i * (inner - 1.1)) / Math.max(1, n - 1);
    P.cyl(M.steel, 0.13, 0.13, w + 0.02, x, 0.2, z, Math.PI / 2, 0, 0, 10);
  }
  // upper carrier rollers
  [-0.28, 0.28].forEach((f) => P.cyl(M.steel, 0.09, 0.09, w - 0.1, x0 + f * inner, h - 0.2, z, Math.PI / 2, 0, 0, 8));
}

// Operator cab. Open face toward +x. (x, y, z) is the centre of the floor.
export function addCab(P, M, { x = 0, y = 0, z = 0, w = 1.3, h = 1.7, d = 1.3, body, roof }) {
  const t = 0.07;
  P.box(M.steelDark, d, 0.1, w, x, y + 0.05, z);
  // posts
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => P.box(body, t, h, t, x + sx * (d / 2 - t / 2), y + h / 2, z + sz * (w / 2 - t / 2)));
  // roof
  P.box(roof || body, d + 0.18, 0.1, w + 0.14, x, y + h + 0.05, z);
  P.box(M.steelBlack, d * 0.35, 0.05, w * 0.6, x - d * 0.18, y + h + 0.13, z);
  // glass
  P.box(M.glass, 0.03, h - 0.18, w - 0.12, x + d / 2 - 0.01, y + h / 2, z); // front
  P.box(M.glass, d - 0.12, h - 0.18, 0.03, x, y + h / 2, z + w / 2 - 0.01); // right
  P.box(M.glass, d - 0.12, h - 0.18, 0.03, x, y + h / 2, z - w / 2 + 0.01); // left
  P.box(M.glass, 0.03, h - 0.3, w - 0.12, x - d / 2 + 0.01, y + h / 2 + 0.05, z); // back
  // interior: seat, console, lever pods
  P.box(M.seat, 0.45, 0.12, 0.45, x - 0.1, y + 0.42, z);
  P.box(M.seat, 0.1, 0.55, 0.42, x - 0.34, y + 0.7, z);
  P.box(M.cabInterior, 0.3, 0.7, 0.4, x + d * 0.3, y + 0.35, z);
  P.box(M.cabInterior, 0.34, 0.1, 0.1, x + 0.08, y + 0.7, z + 0.34);
  P.box(M.cabInterior, 0.34, 0.1, 0.1, x + 0.08, y + 0.7, z - 0.34);
}

// A truck wheel: tyre, tread blocks, rim, hub. Axis along Z, centred at (x, r, z).
export function addWheel(P, M, { x, z, r = 0.55, w = 0.32 }) {
  P.cyl(M.rubber, r, r, w, x, r, z, Math.PI / 2, 0, 0, 22);
  P.cyl(M.rubber, r * 0.98, r * 0.98, w * 0.74, x, r, z + Math.sign(z || 1) * w * 0.12, Math.PI / 2, 0, 0, 22);
  const out = Math.sign(z || 1) * (w / 2 + 0.005);
  P.cyl(M.steel, r * 0.56, r * 0.56, 0.04, x, r, z + out, Math.PI / 2, 0, 0, 16);
  P.cyl(M.steelDark, r * 0.28, r * 0.28, 0.07, x, r, z + out * 1.4, Math.PI / 2, 0, 0, 10);
  // lug nuts
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    P.cyl(M.chrome, 0.022, 0.022, 0.05, x + Math.cos(a) * r * 0.42, r + Math.sin(a) * r * 0.42, z + out * 1.5, Math.PI / 2, 0, 0, 5);
  }
  // tread blocks around the shoulder
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    P.box(M.rubber, 0.1, 0.07, w * 1.02, x + Math.cos(a) * r, r + Math.sin(a) * r, z, 0, 0, a + Math.PI / 2);
  }
}
