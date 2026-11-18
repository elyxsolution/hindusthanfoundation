import * as THREE from 'three';
import { canvasTexture, rng } from './kit.js';
import { worldUV } from './site.js';

// ------------------------------------------------------------------------------------------------
// Underground "core sample": a glass block of layered soil around a pile, so you can see inside the ground.
// A lid (ground texture with a small hole for the bore) covers it until the story reveals it.
// ------------------------------------------------------------------------------------------------
export const STRATA = [
  { to: 1.4, name: 'Topsoil', col: '#4a3524' },
  { to: 5.0, name: 'Stiff clay', col: '#8b5a30' },
  { to: 9.5, name: 'Silty sand', col: '#b88e58' },
  { to: 14, name: 'Weathered rock', col: '#8c8173' },
  { to: 40, name: 'Hard rock', col: '#5c5f67' },
];

function strataTexture(depth) {
  const r = rng(515);
  return canvasTexture(256, 1024, (g, w, h) => {
    let y0 = 0;
    STRATA.forEach((s, i) => {
      const y1 = Math.min(h, (s.to / depth) * h);
      g.fillStyle = s.col;
      g.fillRect(0, y0, w, y1 - y0 + 2);
      for (let k = 0; k < 900; k++) {
        const v = r();
        g.fillStyle = v > 0.5 ? `rgba(255,255,255,${0.03 + r() * 0.07})` : `rgba(0,0,0,${0.05 + r() * 0.12})`;
        g.fillRect(r() * w, y0 + r() * (y1 - y0), 1 + r() * 4, 1 + r() * 2);
      }
      if (i >= 2) {
        for (let k = 0; k < 30; k++) {
          g.fillStyle = `rgba(${150 + r() * 60},${140 + r() * 50},${120 + r() * 50},0.35)`;
          g.beginPath();
          g.ellipse(r() * w, y0 + r() * (y1 - y0), 3 + r() * 8, 2 + r() * 5, r() * 3, 0, 6.3);
          g.fill();
        }
      }
      g.strokeStyle = 'rgba(0,0,0,0.35)';
      g.lineWidth = 2;
      g.beginPath();
      for (let x = 0; x <= w; x += 8) g.lineTo(x, y1 + Math.sin(x * 0.07 + i) * 3);
      g.stroke();
      y0 = y1;
    });
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(1, 'rgba(0,0,0,0.45)');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
  });
}

export function labelSprite(text, { size = 0.9, color = '#ffffff' } = {}) {
  const tex = canvasTexture(256, 96, (g, w, h) => {
    g.font = '700 54px Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineWidth = 8;
    g.strokeStyle = 'rgba(10,15,28,0.85)';
    g.strokeText(text, w / 2, h / 2);
    g.fillStyle = color;
    g.fillText(text, w / 2, h / 2);
  });
  const m = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, fog: false });
  const sp = new THREE.Sprite(m);
  sp.renderOrder = 6;
  sp.scale.set(size * 2.66, size, 1);
  return sp;
}

// x0..x1 / z0..z1 are the world-space edges of the opening; depth is how far the glass block reaches down.
export function buildCore({ x0, x1, z0, z1, depth = 20, pile }) {
  const g = new THREE.Group();
  const w = x1 - x0;
  const d = z1 - z0;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const tex = strataTexture(depth);
  const glass = () => new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity: 0, side: THREE.DoubleSide, roughness: 0.6, metalness: 0, depthWrite: false, fog: false });
  const mats = {
    front: glass(),
    side: glass(),
    back: new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide, fog: false, transparent: true, opacity: 0 }),
    floor: new THREE.MeshBasicMaterial({ color: '#150f0a', fog: false, transparent: true, opacity: 0 }),
  };
  const base = { front: 0.34, side: 0.3 };

  const front = new THREE.Mesh(new THREE.PlaneGeometry(w, depth), mats.front);
  front.position.set(cx, -depth / 2, z1);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, depth), mats.back);
  back.position.set(cx, -depth / 2, z0);
  back.rotation.y = Math.PI;
  const left = new THREE.Mesh(new THREE.PlaneGeometry(d, depth), mats.side);
  left.position.set(x0, -depth / 2, cz);
  left.rotation.y = -Math.PI / 2;
  const right = new THREE.Mesh(new THREE.PlaneGeometry(d, depth), mats.side);
  right.position.set(x1, -depth / 2, cz);
  right.rotation.y = Math.PI / 2;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mats.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(cx, -depth, cz);
  front.renderOrder = 3;
  left.renderOrder = 3;
  right.renderOrder = 3;
  g.add(back, floor, left, right, front);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(w, depth, d)),
    new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, fog: false })
  );
  edges.position.set(cx, -depth / 2, cz);
  edges.renderOrder = 4;
  g.add(edges);

  const ticks = new THREE.Group();
  for (let m = 5; m <= depth; m += 5) {
    const t = labelSprite(`${m} m`, { size: 0.8 });
    t.position.set(x0 - 1.4, -m, z1);
    ticks.add(t);
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.06), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, fog: false }));
    line.position.set(x0 - 0.35, -m, z1 + 0.02);
    line.renderOrder = 6;
    line.material.depthTest = false;
    ticks.add(line);
  }
  g.add(ticks);

  function setOpacity(a) {
    g.visible = a > 0.01;
    mats.front.opacity = base.front * a;
    mats.side.opacity = base.side * a;
    mats.back.opacity = a;
    mats.floor.opacity = a;
    edges.material.opacity = 0.55 * a;
    ticks.children.forEach((c) => (c.material.opacity = (c.isSprite ? 1 : 0.8) * a));
  }
  setOpacity(0);

  // lid: a plate of ground that covers the opening, with a hole where the bore is
  const lidShape = new THREE.Shape();
  const m = 0.03;
  lidShape.moveTo(x0 - m, -(z0 - m));
  lidShape.lineTo(x1 + m, -(z0 - m));
  lidShape.lineTo(x1 + m, -(z1 + m));
  lidShape.lineTo(x0 - m, -(z1 + m));
  lidShape.closePath();
  const hole = new THREE.Path();
  hole.absarc(pile.x, -pile.z, 0.62, 0, Math.PI * 2, true);
  lidShape.holes.push(hole);
  const lidGeo = new THREE.ShapeGeometry(lidShape, 24);
  lidGeo.rotateX(-Math.PI / 2);
  worldUV(lidGeo);

  return { group: g, setOpacity, lidGeo, depth };
}
