import { useRef, useMemo, useCallback } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { DiaryEntry } from '../../types';
import { EMOTION_MAP } from '../../types';
import { getStarBodyTexture, getStarGlowTexture } from './StarTexture';

interface DiaryStarSpriteProps {
  diary: DiaryEntry;
  displayPosition: [number, number, number];
  isHighlighted: boolean;
  onClick: (diary: DiaryEntry) => void;
  isNew: boolean;
}

function hashParams(id: string) {
  const c = (i: number) => id.charCodeAt(i) || 65 + i;
  return {
    freq1: 1.3 + ((c(0) % 7) * 0.4),
    freq2: 3.7 + ((c(1) % 11) * 0.6),
    freq3: 8.2 + ((c(2) % 5) * 1.1),
    amp1: 0.55 + ((c(3) % 4) * 0.1),
    amp2: 0.25 + ((c(4) % 6) * 0.06),
    amp3: 0.12 + ((c(5) % 3) * 0.05),
    phase1: ((c(0) % 100) / 100) * Math.PI * 2,
    phase2: ((c(1) % 100) / 100) * Math.PI * 2,
    phase3: ((c(2) % 100) / 100) * Math.PI * 2,
  };
}

export default function DiaryStarSprite({ diary, displayPosition, isHighlighted, onClick, isNew }: DiaryStarSpriteProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Sprite>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const coreRef = useRef<THREE.Sprite>(null);
  const bookmarkRef = useRef<THREE.Sprite>(null);
  const photoRef = useRef<THREE.Sprite>(null);
  const hoverSpriteRef = useRef<THREE.Sprite>(null);
  const isHovered = useRef(false);
  const hasPhotos = diary.photoFileIds && diary.photoFileIds.length > 0;

  const config = EMOTION_MAP[diary.emotion];
  const color = useMemo(() => new THREE.Color(config.color), [config.color]);
  const params = useMemo(() => hashParams(diary.id), [diary.id]);
  const bodyTex = useMemo(() => getStarBodyTexture(), []);
  const glowTex = useMemo(() => getStarGlowTexture(diary.emotion), [diary.emotion]);

  const baseScale = isHighlighted ? 1.8 : 1;
  const initialScale = isNew ? 0.01 : baseScale;

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const basePos = displayPosition;

    // When hovered, freeze the animation — star stops twinkling
    const frozen = isHovered.current;

    const p = params;
    const scint = frozen ? 0.5 : // middle brightness when frozen
      p.amp1 * Math.sin(t * p.freq1 + p.phase1) +
      p.amp2 * Math.sin(t * p.freq2 + p.phase2) +
      p.amp3 * Math.sin(t * p.freq3 + p.phase3);
    const totalAmp = p.amp1 + p.amp2 + p.amp3;
    const normalized = frozen ? 0.6 : (scint / totalAmp + 1) / 2;
    const opacity = 0.25 + normalized * 0.75;

    if (bodyRef.current) {
      // White diffraction spikes — no color tint, pure white light
      bodyRef.current.material.opacity = isHighlighted ? 0.6 + normalized * 0.4 : 0.35 + normalized * 0.55;
    }
    if (glowRef.current) {
      // Colored glow behind — carries the emotion tint
      glowRef.current.material.opacity = opacity * 0.6;
      glowRef.current.material.color = color;
    }
    if (coreRef.current) {
      // Tiny white-hot core
      coreRef.current.material.opacity = 0.7 + normalized * 0.3;
    }
    if (photoRef.current && hasPhotos) {
      photoRef.current.material.opacity = frozen ? 0.4 : 0.18 + Math.sin(t * 1.8 + p.phase2) * 0.12;
    }
    if (bookmarkRef.current && diary.isBookmarked) {
      bookmarkRef.current.material.opacity = frozen ? 0.5 : 0.3 + Math.sin(t * 2.5 + p.phase1) * 0.2;
    }
    if (hoverSpriteRef.current) {
      hoverSpriteRef.current.material.opacity = isHovered.current ? 0.5 : 0;
    }

    const pulse = frozen ? 1 : 1 + scint * 0.25;
    const targetScale = baseScale * pulse;
    groupRef.current.position.lerp(
      new THREE.Vector3(
        basePos[0] + Math.sin(t * 0.55 + p.phase2) * 0.08,
        basePos[1] + Math.sin(t * 0.9 + p.phase1) * 0.22,
        basePos[2] + Math.cos(t * 0.5 + p.phase3) * 0.06,
      ),
      0.08,
    );

    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.08,
    );
  });

  const handlePointerOver = useCallback(() => {
    isHovered.current = true;
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    isHovered.current = false;
    document.body.style.cursor = '';
  }, []);

  const handleClick = useCallback((e: ThreeEvent<THREE.Mesh>) => {
    e.stopPropagation();
    onClick(diary);
  }, [diary, onClick]);

  return (
    <group ref={groupRef} position={displayPosition} scale={[initialScale, initialScale, initialScale]}>
      {/* Back glow — colored by emotion */}
      <sprite
        ref={glowRef}
        position={[0, 0, 0]}
        scale={[isHighlighted ? 2.6 : 2.0, isHighlighted ? 2.6 : 2.0, 1]}
      >
        <spriteMaterial map={glowTex} color={color} transparent opacity={0.55}
          blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>

      {/* Front body — white diffraction spikes, NO color tint */}
      <sprite
        ref={bodyRef}
        position={[0, 0, 0]}
        scale={[isHighlighted ? 1.1 : 0.75, isHighlighted ? 1.1 : 0.75, 1]}
      >
        <spriteMaterial map={bodyTex} transparent opacity={0.65}
          blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>

      {/* Tiny white-hot core */}
      <sprite
        ref={coreRef}
        position={[0, 0, 0]}
        scale={[isHighlighted ? 0.3 : 0.2, isHighlighted ? 0.3 : 0.2, 1]}
      >
        <spriteMaterial map={glowTex} transparent opacity={0.8}
          blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>

      {/* Bookmarked star ring */}
      {diary.isBookmarked && (
        <sprite
          ref={bookmarkRef}
          position={[0, 0.2, 0]}
          scale={[1.1, 1.1, 1]}
        >
          <spriteMaterial map={glowTex} color="#FFD700" transparent opacity={0.5}
            blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </sprite>
      )}

      {/* Hover glow — appears when mouse is over the star */}
      <sprite ref={hoverSpriteRef} position={[0, 0, 0]} scale={[1.3, 1.3, 1]}>
        <spriteMaterial map={glowTex} color="#ffffff" transparent opacity={0}
          blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>

      {/* Photo indicator — tiny gold dot above star */}
      {hasPhotos && (
        <sprite
          ref={photoRef}
          position={[0, 0.6, 0]}
          scale={[0.2, 0.2, 1]}
        >
          <spriteMaterial map={glowTex} color="#FFD700" transparent opacity={0.25}
            blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </sprite>
      )}

      {/* Large click target — easy to hit */}
      <mesh
        position={[0, 0, 0]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        visible={false}
      >
        <sphereGeometry args={[0.9, 8, 8]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}
