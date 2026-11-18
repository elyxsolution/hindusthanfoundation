import * as THREE from 'three';
import { canvasTexture, rng } from './kit.js';

// One shared material set for the whole site. Paints are clear-coated so they pick up the sky.

const paint = (color, o = {}) =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.46, metalness: 0.1, clearcoat: 0.3, clearcoatRoughness: 0.4, envMapIntensity: 0.62, ...o });
const metal = (color, roughness = 0.45, metalness = 0.8, o = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: 1.2, ...o });
const matte = (color, roughness = 0.9, o = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...o });

function trackTexture() {
  const r = rng(7);
  return canvasTexture(
    256,
    64,
    (g, w, h) => {
      g.fillStyle = '#2a2c2f';
      g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 32) {
        const grad = g.createLinearGradient(x, 0, x + 32, 0);
        grad.addColorStop(0, '#3a3d41');
        grad.addColorStop(0.5, '#2d2f33');
        grad.addColorStop(1, '#202224');
        g.fillStyle = grad;
        g.fillRect(x + 1, 2, 30, h - 4);
        g.fillStyle = '#16171a';
        g.fillRect(x, 0, 2, h);
        g.fillStyle = '#4b4f54';
        g.beginPath();
        g.arc(x + 9, 14, 2.4, 0, 6.3);
        g.arc(x + 23, 14, 2.4, 0, 6.3);
        g.arc(x + 9, 50, 2.4, 0, 6.3);
        g.arc(x + 23, 50, 2.4, 0, 6.3);
        g.fill();
      }
      for (let i = 0; i < 900; i++) {
        g.fillStyle = `rgba(${96 + r() * 40},${78 + r() * 30},${56 + r() * 24},${0.05 + r() * 0.16})`;
        g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 2);
      }
    },
    { repeat: true }
  );
}

export function mudTexture(seed = 3, base = '#6b5740', size = 256) {
  const r = rng(seed);
  return canvasTexture(
    size,
    size,
    (g, w, h) => {
      g.fillStyle = base;
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 4200; i++) {
        const l = 22 + r() * 24;
        g.fillStyle = `hsla(${24 + r() * 10},${26 + r() * 20}%,${l}%,${0.2 + r() * 0.4})`;
        g.beginPath();
        g.arc(r() * w, r() * h, 0.6 + r() * 3.2, 0, 6.3);
        g.fill();
      }
    },
    { repeat: true }
  );
}

function stripeTexture() {
  // Rotating mixer drum: spiral blade band, lighter and darker.
  return canvasTexture(
    512,
    256,
    (g, w, h) => {
      g.fillStyle = '#d9d9d4';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#a7a8a6';
      for (let i = -2; i < 8; i++) {
        g.save();
        g.translate(i * 80, 0);
        g.transform(1, 0, -0.55, 1, 0, 0);
        g.fillRect(0, 0, 18, h);
        g.restore();
      }
      const r = rng(11);
      for (let i = 0; i < 1400; i++) {
        g.fillStyle = `rgba(${90 + r() * 60},${80 + r() * 50},${66 + r() * 40},${0.04 + r() * 0.12})`;
        g.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 3);
      }
    },
    { repeat: true }
  );
}

function concreteTexture() {
  const r = rng(29);
  return canvasTexture(
    256,
    256,
    (g, w, h) => {
      g.fillStyle = '#a9a8a1';
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 5000; i++) {
        const v = 130 + r() * 70;
        g.fillStyle = `rgba(${v},${v - 2},${v - 6},${0.2 + r() * 0.4})`;
        g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2.5);
      }
    },
    { repeat: true }
  );
}

export function makeMaterials() {
  const track = trackTexture();
  track.repeat.set(10, 1);
  const mud = mudTexture(3, '#6b5740');
  const concrete = concreteTexture();
  const drum = stripeTexture();

  return {
    // machine paints
    sany: paint('#cf2219'),
    sanyDark: paint('#a81c15'),
    hitachi: paint('#ee6a00'),
    kubota: paint('#f05a14'),
    tipper: paint('#2a56a0'),
    mixer: paint('#eceae4'),
    white: paint('#efeee9'),
    yellow: paint('#f2c200'),
    // metal
    steel: metal('#6d7278', 0.46, 0.72),
    steelDark: metal('#2c2f33', 0.52, 0.65),
    steelBlack: metal('#15171a', 0.55, 0.6),
    chrome: metal('#d4d8dc', 0.14, 1),
    cast: metal('#46484c', 0.7, 0.5),
    rebar: metal('#6d5342', 0.52, 0.65),
    rope: metal('#1f2022', 0.6, 0.6),
    sling: matte('#e0b21c', 0.8),
    // rubber and track
    rubber: matte('#141516', 0.92),
    track: new THREE.MeshStandardMaterial({ map: track, roughness: 0.6, metalness: 0.5 }),
    // glass, plastics
    glass: new THREE.MeshPhysicalMaterial({ color: '#86a8bc', roughness: 0.04, metalness: 0.2, transparent: true, opacity: 0.46, envMapIntensity: 2.4, side: THREE.DoubleSide }),
    cabInterior: matte('#1c1f22', 0.8),
    seat: matte('#25272a', 0.8),
    lamp: new THREE.MeshStandardMaterial({ color: '#fff4d2', emissive: '#ffd890', emissiveIntensity: 0.6 }),
    beacon: new THREE.MeshStandardMaterial({ color: '#ff8a1c', emissive: '#ff6a00', emissiveIntensity: 1.2 }),
    // earth, concrete
    mud: new THREE.MeshStandardMaterial({ map: mud, roughness: 1, bumpMap: mud, bumpScale: 2.2 }),
    soilClod: matte('#5f4a33', 1),
    concreteWet: new THREE.MeshStandardMaterial({ map: concrete, color: '#b9b8b0', roughness: 0.28, metalness: 0 }),
    concreteDry: new THREE.MeshStandardMaterial({ map: concrete, color: '#9d9c95', roughness: 0.92, bumpMap: concrete, bumpScale: 1 }),
    drum: new THREE.MeshStandardMaterial({ map: drum, roughness: 0.55, metalness: 0.1 }),
    // people
    vest: matte('#d5ec12', 0.7),
    reflect: metal('#e8eaee', 0.3, 0.6),
    helmet: paint('#f4f4f0', { clearcoat: 0.6 }),
    helmetYellow: paint('#f3c612'),
    jeans: matte('#2e4a73', 0.9),
    shirt: matte('#4c5a68', 0.9),
    skin: matte('#a97650', 0.7),
    skin2: matte('#c08a62', 0.7),
    boot: matte('#26211c', 0.85),
    // site furniture
    barrierRed: paint('#d92b2b'),
    barrierWhite: paint('#f0efec'),
    cone: paint('#ff6a14', { clearcoat: 0.2 }),
    coneWhite: matte('#f4f4f0', 0.7),
    hoarding: metal('#7f93a8', 0.55, 0.5),
    hoardingPost: metal('#3f4650', 0.6, 0.6),
    plank: matte('#8b6b46', 0.85),
    net: new THREE.MeshStandardMaterial({ color: '#2a8a52', roughness: 1, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    tex: { track, mud, concrete, drum },
  };
}
