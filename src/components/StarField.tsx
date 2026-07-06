import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { DiaryEntry } from '../types';
import { EMOTION_MAP } from '../types';
import { motion } from 'framer-motion';

interface StarFieldProps {
  diaries: DiaryEntry[];
  highlightedIds: string[];
  onStarClick: (diary: DiaryEntry) => void;
  newStarId: string | null;
}

function DiaryStar({
  diary,
  isHighlighted,
  onClick,
  isNew,
}: {
  diary: DiaryEntry;
  isHighlighted: boolean;
  onClick: (e: ThreeEvent<THREE.Mesh>) => void;
  isNew: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const config = EMOTION_MAP[diary.emotion];
  const color = new THREE.Color(config.color);

  const scale = isHighlighted ? 1.8 : 1;
  const initialScale = isNew ? 0 : scale;

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const id = diary.id.charCodeAt(0) + diary.id.charCodeAt(1);
    const offset = (id % 100) / 100;
    const pulse = 1 + Math.sin(t * 1.5 + offset * Math.PI * 2) * 0.15;
    const targetScale = scale * pulse;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1,
    );
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.3 + Math.sin(t * 2 + offset) * 0.2;
    }
  });

  const glowTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, config.glowColor);
    gradient.addColorStop(0.2, config.glowColor + '88');
    gradient.addColorStop(0.5, config.glowColor + '22');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
  }, [config.glowColor]);

  const meshScale: [number, number, number] = [initialScale, initialScale, initialScale];

  return (
    <group>
      <mesh
        ref={meshRef}
        position={diary.starPosition}
        onClick={onClick}
        scale={meshScale}
      >
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHighlighted ? 2.5 : 1.2}
          toneMapped={false}
        />
      </mesh>
      <sprite
        ref={glowRef}
        position={diary.starPosition}
        scale={[0.6, 0.6, 1]}
      >
        <spriteMaterial
          map={glowTexture}
          transparent
          opacity={isHighlighted ? 0.7 : 0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
    </group>
  );
}

function SearchTrail({ diaries, highlightedIds }: { diaries: DiaryEntry[]; highlightedIds: string[] }) {
  const points = useMemo(() => {
    if (highlightedIds.length < 2) return [];
    const matched = highlightedIds
      .map(id => diaries.find(d => d.id === id))
      .filter((d): d is DiaryEntry => !!d);
    return matched.map(d => new THREE.Vector3(...d.starPosition));
  }, [diaries, highlightedIds]);

  if (points.length < 2) return null;

  return (
    <Line
      points={points}
      color="#ffffff"
      lineWidth={0.5}
      transparent
      opacity={0.3}
      depthWrite={false}
    />
  );
}

function StarFieldScene({ diaries, highlightedIds, onStarClick, newStarId }: StarFieldProps) {
  const groupRef = useRef<THREE.Group>(null);

  const handleStarClick = useCallback(
    (diary: DiaryEntry) => (e: ThreeEvent<THREE.Mesh>) => {
      e.stopPropagation();
      onStarClick(diary);
    },
    [onStarClick],
  );

  return (
    <>
      <color attach="background" args={['#060618']} />
      <fog attach="fog" args={['#060618', 15, 40]} />

      <ambientLight intensity={0.1} />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#4466aa" />

      {/* Background dust particles */}
      <Stars
        radius={30}
        depth={20}
        count={2000}
        factor={4}
        saturation={0}
        fade
        speed={0.2}
      />

      <group ref={groupRef}>
        {diaries.map(diary => (
          <DiaryStar
            key={diary.id}
            diary={diary}
            isHighlighted={highlightedIds.includes(diary.id)}
            onClick={handleStarClick(diary)}
            isNew={diary.id === newStarId}
          />
        ))}
        <SearchTrail diaries={diaries} highlightedIds={highlightedIds} />
      </group>

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={25}
        maxPolarAngle={Math.PI * 0.7}
        minPolarAngle={0.2}
        target={[0, 3, 0]}
        autoRotate
        autoRotateSpeed={0.15}
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
        camera={{ position: [0, 2, 14], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <StarFieldScene {...props} />
      </Canvas>
    </motion.div>
  );
}
