import { Component, Suspense, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Atmosphere from './Atmosphere.jsx';
import { buildSite } from './scene.js';

// The scroll-driven stage used on the main site. There are no user camera controls:
// the page scroll position (api.p) drives the whole story and the camera follows the action.
function Rig({ api, quality }) {
  const { camera, size } = useThree();
  const site = useMemo(() => buildSite(), []);
  const s = useMemo(() => ({ ps: api.p, look: new THREE.Vector3(), pos: new THREE.Vector3(), lastHud: 0, fov: 40 }), [api]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    api.time += dt;
    s.ps = api.reduced ? api.p : THREE.MathUtils.damp(s.ps, api.p, 5.5, dt);
    site.update(api.time, dt, { p: s.ps });

    const f = site.state.focus;
    const aspect = size.width / size.height;
    const portrait = aspect < 1;
    const hfov = f.hfov * (portrait ? 0.62 : 1);
    const vfov = THREE.MathUtils.clamp(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(hfov) / 2) / aspect), 0.25, 1.1);
    const visW = 2 * f.dist * Math.tan(THREE.MathUtils.degToRad(hfov) / 2);
    const visH = 2 * f.dist * Math.tan(vfov / 2);
    const t = performance.now() / 1000;
    const az = f.az + Math.sin(t * 0.17) * 0.012;
    // tall screens look down a little more, which also keeps the wet ground from turning into a mirror
    const el = portrait ? Math.max(f.el, 0.2) : f.el;
    const ce = Math.cos(el);
    // push the subject to the right on wide screens (text sits on the left) and up on tall ones
    const shift = portrait ? 0 : f.shift * visW;
    const lift = portrait ? visH * 0.15 : 0;
    s.look.set(f.lx - shift, f.ly - lift, f.lz);
    s.pos.set(s.look.x + f.dist * Math.sin(az) * ce, s.look.y + f.dist * Math.sin(el), s.look.z + f.dist * Math.cos(az) * ce);
    camera.position.copy(s.pos);
    camera.lookAt(s.look);
    camera.fov = THREE.MathUtils.radToDeg(vfov);
    camera.updateProjectionMatrix();

    if (api.onHud && t - s.lastHud > 0.08) {
      s.lastHud = t;
      api.onHud(site.state.hud);
    }
    if (!api.ready && api.frames++ > 3) {
      api.ready = true;
      api.onReady?.();
    }
  }, -1);

  useEffect(() => {
    api.site = site;
  }, [api, site]);

  return (
    <>
      <primitive object={site.root} />
      <Atmosphere quality={quality} />
    </>
  );
}

class Boundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err) {
    this.props.onFail?.(err);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function StoryStage({ api, visible, quality, onFail }) {
  const mobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 800px)').matches;
  return (
    <Boundary onFail={onFail}>
      <Canvas
        flat
        shadows="soft"
        dpr={mobile ? [1, 1.25] : [1, 1.5]}
        frameloop={visible ? 'always' : 'never'}
        camera={{ fov: 37, near: 0.5, far: 3000, position: [-3, 12.5, 62] }}
        gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
      >
        <Suspense fallback={null}>
          <Rig api={api} quality={quality} />
        </Suspense>
      </Canvas>
    </Boundary>
  );
}
