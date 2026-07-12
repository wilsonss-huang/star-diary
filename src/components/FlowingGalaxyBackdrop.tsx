import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import BackgroundStars from './starfield/BackgroundStars';

function FlowingGalaxyScene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 58, 140]} />
      <BackgroundStars reducedMotion={reducedMotion} />
    </>
  );
}

/**
 * The welcome screen uses the same procedural, slowly moving galaxy as the
 * atlas. It deliberately renders only background particles: diary stars are
 * never mounted here, so no personal star map is revealed before entering.
 */
export default function FlowingGalaxyBackdrop() {
  const reducedMotion = typeof window !== 'undefined'
    && (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768);

  return (
    <div className="flowing-galaxy-backdrop" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 7.5, 31], fov: 52 }}
        dpr={[1, reducedMotion ? 1 : 2]}
        gl={{
          antialias: !reducedMotion,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.18,
        }}
      >
        <FlowingGalaxyScene reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
