import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, ToneMapping, Vignette, N8AO, SMAA } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

const SUN_AZ = 0.62; // radians around Y
const SUN_EL = 36; // degrees

// Sky dome, an environment map baked from the same sky (paint, glass and puddles reflect it), fog,
// a shadow-casting sun that follows the plot, and the post-processing chain.
export default function Atmosphere({ quality = 'high', sunAt = [2, 0, 6] }) {
  const { scene, gl } = useThree();
  const sun = useRef();
  const sunVec = useMemo(() => {
    const el = THREE.MathUtils.degToRad(SUN_EL);
    return new THREE.Vector3(Math.cos(el) * Math.sin(SUN_AZ), Math.sin(el), Math.cos(el) * Math.cos(SUN_AZ));
  }, []);

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

  useFrame(() => {
    if (!sun.current) return;
    sun.current.position.set(sunAt[0], sunAt[1], sunAt[2]).addScaledVector(sunVec, 160);
    sun.current.target.position.set(sunAt[0], sunAt[1], sunAt[2]);
    sun.current.target.updateMatrixWorld();
  });

  const high = quality === 'high';
  return (
    <>
      <primitive object={sky} />
      <hemisphereLight args={['#bcd3f2', '#6b5a45', 0.55]} />
      <directionalLight
        ref={sun}
        castShadow
        intensity={3.3}
        color="#fff1da"
        shadow-mapSize={high ? [4096, 4096] : [2048, 2048]}
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
        {high ? <N8AO aoRadius={2.6} distanceFalloff={1.4} intensity={2.2} quality="medium" color="#1a120a" /> : <SMAA />}
        <Bloom mipmapBlur luminanceThreshold={0.98} luminanceSmoothing={0.2} intensity={0.12} radius={0.6} />
        <Vignette eskil={false} offset={0.32} darkness={0.38} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <SMAA />
      </EffectComposer>
    </>
  );
}
