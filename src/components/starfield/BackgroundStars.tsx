import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { pickSpectralType } from './SpectralTypes';
import { getStarBodyTexture } from './StarTexture';

// Shared circle texture — ALL background stars use this
let circleTexture: THREE.CanvasTexture | null = null;
function getCircleTexture(): THREE.CanvasTexture {
  if (circleTexture) return circleTexture;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.15, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.3)');
  grad.addColorStop(0.7, 'rgba(255,255,255,0.04)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  circleTexture = new THREE.CanvasTexture(canvas);
  circleTexture.needsUpdate = true;
  return circleTexture;
}

interface StarLayerProps {
  count: number;
  innerRadius: number;
  outerRadius: number;
  size: number;
  baseOpacity: number;
  animate?: 'none' | 'collective' | 'individual';
  useSpikeTex?: boolean;
}

function StarLayer({ count, innerRadius, outerRadius, size, baseOpacity, animate, useSpikeTex }: StarLayerProps) {
  const ref = useRef<THREE.Points>(null);
  const tex = useMemo(() => useSpikeTex ? getStarBodyTexture() : getCircleTexture(), [useSpikeTex]);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / count) * 0.65;
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = innerRadius + Math.random() * (outerRadius - innerRadius);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi) + 1.5;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Every star has color — no gray/white stars
      const star = pickSpectralType();
      const hexColor = new THREE.Color(star.color);
      const brightness = 0.4 + 0.6 * (1 - (star.magnitude.min / star.magnitude.max));
      col[i * 3] = hexColor.r * brightness;
      col[i * 3 + 1] = hexColor.g * brightness;
      col[i * 3 + 2] = hexColor.b * brightness;
    }

    return { positions: pos, colors: col };
  }, [count, innerRadius, outerRadius]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, [positions, colors]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const mat = ref.current.material as THREE.PointsMaterial;

    if (animate === 'collective') {
      const pulse = 0.8 + Math.sin(t * 0.7) * 0.2;
      mat.opacity = baseOpacity * pulse;
    } else {
      mat.opacity = baseOpacity;
    }
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        map={tex}
        size={size}
        vertexColors
        transparent
        opacity={baseOpacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

export default function BackgroundStars() {
  return (
    <>
      <StarLayer count={2000} innerRadius={28} outerRadius={40} size={0.10} baseOpacity={0.45} animate="none" />
      <StarLayer count={1200} innerRadius={16} outerRadius={28} size={0.15} baseOpacity={0.60} animate="collective" />
      <StarLayer count={400}  innerRadius={8}  outerRadius={16} size={0.30} baseOpacity={0.75} animate="individual" useSpikeTex />
    </>
  );
}
