import { useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { DiaryEntry } from '../types';
import { motion } from 'framer-motion';
import DiaryStarSprite from './starfield/DiaryStarSprite';
import BackgroundStars from './starfield/BackgroundStars';
import Nebulae from './starfield/Nebula';
import GalaxyBackground from './starfield/GalaxyBackground';

interface StarFieldProps {
  diaries: DiaryEntry[];
  highlightedIds: string[];
  onStarClick: (diary: DiaryEntry) => void;
  newStarId: string | null;
  starStyle: 'realistic' | 'dark';
}

function SearchTrail({ diaries, highlightedIds }: { diaries: DiaryEntry[]; highlightedIds: string[] }) {
  const points = (() => {
    if (highlightedIds.length < 2) return [];
    const matched = highlightedIds
      .map(id => diaries.find(d => d.id === id))
      .filter((d): d is DiaryEntry => !!d);
    return matched.map(d => new THREE.Vector3(...d.starPosition));
  })();

  if (points.length < 2) return null;
  return (
    <Line points={points} color="#ffffff" lineWidth={0.5}
      transparent opacity={0.3} depthWrite={false} />
  );
}

function StarFieldScene({ diaries, highlightedIds, onStarClick, newStarId, starStyle }: StarFieldProps) {
  const bgColor = starStyle === 'realistic' ? '#030812' : '#060618';

  const handleStarClick = useCallback(
    (diary: DiaryEntry) => onStarClick(diary),
    [onStarClick],
  );

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <fog attach="fog" args={[bgColor, 30, 60]} />

      {/* Galaxy skybox — only in realistic mode */}
      {starStyle === 'realistic' && <GalaxyBackground />}

      {/* Nebulae — only in realistic mode */}
      <Nebulae enabled={starStyle === 'realistic'} style={starStyle} />

      {/* Background star layers — always on, now with circular colored stars */}
      <BackgroundStars />

      {/* Diary stars */}
      <group>
        {diaries.map(diary => (
          <DiaryStarSprite
            key={diary.id}
            diary={diary}
            isHighlighted={highlightedIds.includes(diary.id)}
            onClick={handleStarClick}
            isNew={diary.id === newStarId}
          />
        ))}
        <SearchTrail diaries={diaries} highlightedIds={highlightedIds} />
      </group>

      {/* Full 360° rotation, wide zoom range */}
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={45}
        maxPolarAngle={Math.PI}
        minPolarAngle={0}
        target={[0, 2.5, 0]}
        zoomSpeed={0.8}
        rotateSpeed={0.5}
        autoRotate
        autoRotateSpeed={0.1}
      />
    </>
  );
}

export default function StarField(props: StarFieldProps) {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
    >
      <Canvas
        camera={{ position: [0, 3, 16], fov: 55 }}
        dpr={[1, 2]}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      >
        <StarFieldScene {...props} />
      </Canvas>
    </motion.div>
  );
}
