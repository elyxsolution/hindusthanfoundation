import { Component, Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, ToneMapping, Vignette, N8AO, SMAA } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { buildSite } from './scene.js';
import { LOOP } from './world.js';

// Camera presets: where to stand and what to look at for each stage of the process.
export const VIEWS = {
  overview: { pos: [-3, 12.5, 62], look: [-3, 7.8, 0], hfov: 66 },
  excavate: { pos: [-50, 5.5, 22], look: [-35, 3.6, -1], hfov: 54 },
  bore: { pos: [-15, 10, 42], look: [-15, 9.5, -4], hfov: 54 },
  cage: { pos: [9, 11, 42], look: [8, 9.5, -4], hfov: 52 },
  pour: { pos: [9, 12.5, 21], look: [20.5, 4.2, -3], hfov: 46 },
  under: { pos: [6, 30, 40], look: [3, -4, -4], hfov: 66 },
};

const SUN_AZ = 0.62; // radians around Y
const SUN_EL = 36; // degrees

function Rig({ api, quality }) {
  const { camera, scene, gl, size } = useThree();
  const sun = useRef();
  const site = useMemo(() => buildSite(), []);
  const cam = useRef({ pos: new THREE.Vector3(...VIEWS.overview.pos), look: new THREE.Vector3(...VIEWS.overview.look), hfov: VIEWS.overview.hfov, yaw: 0, pitch: 0 });
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), l: new THREE.Vector3(), o: new THREE.Vector3(), sph: new THREE.Spherical() }), []);

  const sunVec = useMemo(() => {
    const el = THREE.MathUtils.degToRad(SUN_EL);
    return new THREE.Vector3(Math.cos(el) * Math.sin(SUN_AZ), Math.sin(el), Math.cos(el) * Math.cos(SUN_AZ));
  }, []);

  // Sky dome plus an environment map baked from the same sky, so paint, glass and puddles reflect it.
  const sky = useMemo(() => {
    const s = new Sky();
    s.scale.setScalar(2000);
    const u = s.material.uniforms;
    u.turbidity.value = 3.2;
    u.rayleigh.value = 1.15;
    u.mieCoefficient.value = 0.004;
    u.mieDirectionalG.value = 0.82;
    u.sunPosition.value.copy(sunVec);
    return s;
  }, [sunVec]);

  useEffect(() => {
    const envScene = new THREE.Scene();
    const s2 = new Sky();
    s2.scale.setScalar(1000);
    Object.keys(sky.material.uniforms).forEach((k) => {
      if (s2.material.uniforms[k]) s2.material.uniforms[k].value = sky.material.uniforms[k].value;
    });
    envScene.add(s2);
    const pmrem = new THREE.PMREMGenerator(gl);
    const rt = pmrem.fromScene(envScene, 0, 0.1, 1200);
    scene.environment = rt.texture;
    scene.environmentIntensity = 0.85;
    scene.fog = new THREE.Fog('#c4d4e6', 170, 1500);
    return () => {
      rt.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, sky]);

  useEffect(() => {
    site.setXray(api.xray);
  }, [site, api.xray]);

  useEffect(() => {
    // expose for the page UI (and for debugging)
    api.site = site;
  }, [site, api]);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    if (api.playing) api.time += dt * api.speed;
    api.loopT = ((api.time % LOOP) + LOOP) % LOOP;
    site.update(api.time, api.playing ? dt * api.speed : 0);

    // sun follows the plot
    if (sun.current) {
      sun.current.position.copy(sunVec).multiplyScalar(160).add(new THREE.Vector3(2, 0, 6));
      sun.current.target.position.set(2, 0, 6);
      sun.current.target.updateMatrixWorld();
    }

    // camera: critically damped follow of the chosen view, plus drag-orbit offsets
    const v = VIEWS[api.view] || VIEWS.overview;
    const c = cam.current;
    const k = 2.6;
    tmp.p.set(...v.pos);
    tmp.l.set(...v.look);
    c.pos.x = THREE.MathUtils.damp(c.pos.x, tmp.p.x, k, dt);
    c.pos.y = THREE.MathUtils.damp(c.pos.y, tmp.p.y, k, dt);
    c.pos.z = THREE.MathUtils.damp(c.pos.z, tmp.p.z, k, dt);
    c.look.x = THREE.MathUtils.damp(c.look.x, tmp.l.x, k, dt);
    c.look.y = THREE.MathUtils.damp(c.look.y, tmp.l.y, k, dt);
    c.look.z = THREE.MathUtils.damp(c.look.z, tmp.l.z, k, dt);
    c.hfov = THREE.MathUtils.damp(c.hfov, v.hfov, k, dt);
    c.yaw = THREE.MathUtils.damp(c.yaw, api.yaw, 5, dt);
    c.pitch = THREE.MathUtils.damp(c.pitch, api.pitch, 5, dt);

    const aspect = size.width / size.height;
    const idle = api.dragging ? 0 : 1;
    const t = performance.now() / 1000;
    tmp.o.copy(c.pos).sub(c.look);
    tmp.sph.setFromVector3(tmp.o);
    tmp.sph.theta += c.yaw + Math.sin(t * 0.13) * 0.035 * idle;
    tmp.sph.phi = THREE.MathUtils.clamp(tmp.sph.phi - c.pitch, 0.5, 1.52);
    tmp.o.setFromSpherical(tmp.sph);
    const panX = aspect < 1 && api.view === 'overview' ? Math.sin(t * 0.11) * 22 : 0;
    camera.position.copy(c.look).add(tmp.o);
    camera.position.x += panX;
    tmp.l.copy(c.look);
    tmp.l.x += panX;
    tmp.l.y -= aspect < 1 ? 5 : 0; // portrait: lift the action above the step card and dock
    camera.lookAt(tmp.l);
    // portrait screens: tighter field of view, so machines stay readable
    const hfov = c.hfov * (aspect < 1 ? 0.62 : 1);
    const vfov = THREE.MathUtils.clamp(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(hfov) / 2) / aspect), 0.3, 1.1);
    camera.fov = THREE.MathUtils.radToDeg(vfov);
    camera.updateProjectionMatrix();
    if (!api.ready && api.frames++ > 3) {
      api.ready = true;
      api.onReady?.();
    }
  }, -1);

  return (
    <>
      <primitive object={sky} />
      <primitive object={site.root} />
      <hemisphereLight args={['#bcd3f2', '#6b5a45', 0.55]} />
      <directionalLight
        ref={sun}
        castShadow
        intensity={3.3}
        color="#fff1da"
        shadow-mapSize={quality === 'low' ? [2048, 2048] : [4096, 4096]}
        shadow-camera-left={-95}
        shadow-camera-right={95}
        shadow-camera-top={60}
        shadow-camera-bottom={-50}
        shadow-camera-near={20}
        shadow-camera-far={420}
        shadow-bias={-0.0002}
        shadow-normalBias={0.06}
      />
      <EffectComposer multisampling={0}>
        {quality === 'low' ? <SMAA /> : <N8AO aoRadius={2.6} distanceFalloff={1.4} intensity={2.2} quality="medium" color="#1a120a" />}
        <Bloom mipmapBlur luminanceThreshold={0.98} luminanceSmoothing={0.2} intensity={0.12} radius={0.6} />
        <Vignette eskil={false} offset={0.32} darkness={0.38} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <SMAA />
      </EffectComposer>
    </>
  );
}

class Boundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <div className="stage-fallback">3D view is not available on this device.</div> : this.props.children;
  }
}

export default function PilingStage({ api }) {
  const wrap = useRef();
  const mobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 800px)').matches;

  useEffect(() => {
    const el = wrap.current;
    let sx = 0;
    let sy = 0;
    let y0 = 0;
    let p0 = 0;
    const down = (e) => {
      api.dragging = true;
      sx = e.clientX;
      sy = e.clientY;
      y0 = api.yaw;
      p0 = api.pitch;
      el.setPointerCapture?.(e.pointerId);
      el.classList.add('is-drag');
    };
    const move = (e) => {
      if (!api.dragging) return;
      api.yaw = THREE.MathUtils.clamp(y0 - (e.clientX - sx) * 0.004, -1.1, 1.1);
      api.pitch = THREE.MathUtils.clamp(p0 + (e.clientY - sy) * 0.0025, -0.25, 0.4);
    };
    const up = () => {
      api.dragging = false;
      el.classList.remove('is-drag');
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    };
  }, [api]);

  return (
    <div ref={wrap} className="stage" role="img" aria-label="Interactive 3D animation of a bored piling site: excavator and tipper, SANY rotary rigs boring, a crawler crane lowering a reinforcement cage, and a ready-mix truck pouring concrete through a tremie pipe">
      <Boundary>
        <Canvas
          flat
          shadows="soft"
          dpr={mobile ? [1, 1.25] : [1, 1.6]}
          camera={{ fov: 37, near: 0.5, far: 3000, position: VIEWS.overview.pos }}
          gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
        >
          <Suspense fallback={null}>
            <Rig api={api} quality={mobile ? 'low' : 'high'} />
          </Suspense>
        </Canvas>
      </Boundary>
    </div>
  );
}
