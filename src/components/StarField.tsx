import { useCallback, useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { DiaryEntry } from '../types';
import { motion } from 'framer-motion';
import DiaryStarSprite from './starfield/DiaryStarSprite';
import BackgroundStars from './starfield/BackgroundStars';

interface StarFieldProps {
  diaries: DiaryEntry[];
  highlightedIds: string[];
  focusedDiaryId: string | null;
  onStarClick: (diary: DiaryEntry) => void;
  newStarId: string | null;
}

function getDisplayPositions(diaries: DiaryEntry[], highlightedIds: string[]) {
  const positions = new Map<string, [number, number, number]>();
  if (highlightedIds.length < 2) return positions;

  const matched = highlightedIds
    .map(id => diaries.find(d => d.id === id))
    .filter((d): d is DiaryEntry => !!d);
  if (matched.length < 2) return positions;

  const radius = THREE.MathUtils.clamp(2.2 + matched.length * 0.36, 3.2, 6.8);
  const center = new THREE.Vector3(0, 3.1, 0);

  matched.forEach((diary, index) => {
    const angle = (index / matched.length) * Math.PI * 2;
    const wave = Math.sin(angle * 2) * 0.65;
    positions.set(diary.id, [
      center.x + Math.cos(angle) * radius,
      center.y + wave,
      center.z + Math.sin(angle) * radius * 0.72,
    ]);
  });

  return positions;
}

function CameraNudge({
  diaries,
  highlightedIds,
  focusedDiaryId,
  controlsRef,
}: {
  diaries: DiaryEntry[];
  highlightedIds: string[];
  focusedDiaryId: string | null;
  controlsRef: MutableRefObject<any>;
}) {
  const { camera } = useThree();
  const progressRef = useRef(0);
  const lastFocusRef = useRef<string | null>(null);

  const targetDiary = useMemo(
    () => diaries.find(d => d.id === focusedDiaryId) || null,
    [diaries, focusedDiaryId],
  );
  const displayPositions = useMemo(
    () => getDisplayPositions(diaries, highlightedIds),
    [diaries, highlightedIds],
  );

  useFrame(() => {
    if (!targetDiary) {
      lastFocusRef.current = null;
      progressRef.current = 0;
      return;
    }

    if (lastFocusRef.current !== targetDiary.id) {
      lastFocusRef.current = targetDiary.id;
      progressRef.current = 0;
    }

    if (progressRef.current >= 1) return;
    progressRef.current += 0.018;

    const target = new THREE.Vector3(...(displayPositions.get(targetDiary.id) || targetDiary.starPosition));
    const cameraTarget = target.clone().add(new THREE.Vector3(-3.2, 1.5, 6.2));
    camera.position.lerp(cameraTarget, 0.045);

    const controls = controlsRef.current;
    if (controls?.target) {
      controls.target.lerp(target, 0.06);
      controls.update();
    }
  });

  return null;
}

function StarFieldScene({ diaries, highlightedIds, focusedDiaryId, onStarClick, newStarId }: StarFieldProps) {
  const controlsRef = useRef<any>(null);
  const displayPositions = useMemo(
    () => getDisplayPositions(diaries, highlightedIds),
    [diaries, highlightedIds],
  );

  // Initial camera target: center of all diary stars, or default
  const initialTarget = useMemo(() => {
    if (diaries.length === 0) return [0, 2.5, 0] as [number, number, number];
    let sx = 0, sy = 0, sz = 0;
    for (const d of diaries) {
      sx += d.starPosition[0];
      sy += d.starPosition[1];
      sz += d.starPosition[2];
    }
    return [sx / diaries.length, sy / diaries.length, sz / diaries.length] as [number, number, number];
  }, [diaries]);

  const handleStarClick = useCallback(
    (diary: DiaryEntry) => onStarClick(diary),
    [onStarClick],
  );

  return (
    <>
      <color attach="background" args={['#000000']} />
      <fog attach="fog" args={['#000000', 42, 92]} />

      <BackgroundStars />

      <group>
        {diaries.map(diary => (
          <DiaryStarSprite
            key={diary.id}
            diary={diary}
            displayPosition={displayPositions.get(diary.id) || diary.starPosition}
            isHighlighted={highlightedIds.includes(diary.id)}
            onClick={handleStarClick}
            isNew={diary.id === newStarId}
          />
        ))}
      </group>

      <CameraNudge
        diaries={diaries}
        highlightedIds={highlightedIds}
        focusedDiaryId={focusedDiaryId}
        controlsRef={controlsRef}
      />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.06}
        minDistance={1.5}
        maxDistance={60}
        maxPolarAngle={Math.PI}
        minPolarAngle={0}
        target={initialTarget}
        zoomSpeed={0.95}
        rotateSpeed={0.68}
        panSpeed={0.58}
        enablePan
        autoRotate={false}
      />
    </>
  );
}

export default function StarField(props: StarFieldProps) {
  return (
    <motion.div
      className="absolute inset-0 bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
    >
      <Canvas
        camera={{ position: [0, 5, 18], fov: 55 }}
        dpr={[1, 2]}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.18 }}
      >
        <StarFieldScene {...props} />
      </Canvas>
    </motion.div>
  );
}
