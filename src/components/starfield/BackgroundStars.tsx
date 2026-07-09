import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getStarBodyTexture } from './StarTexture';

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
  grad.addColorStop(0.18, 'rgba(245,250,255,0.92)');
  grad.addColorStop(0.48, 'rgba(180,215,255,0.20)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  circleTexture = new THREE.CanvasTexture(canvas);
  circleTexture.needsUpdate = true;
  return circleTexture;
}

interface StarLayerProps {
  count: number;
  size: number;
  baseOpacity: number;
  shape: 'galaxy' | 'field' | 'near';
  speed: number;
  useSpikeTex?: boolean;
}

function StarLayer({ count, size, baseOpacity, shape, speed, useSpikeTex }: StarLayerProps) {
  const ref = useRef<THREE.Points>(null);
  const tex = useMemo(() => useSpikeTex ? getStarBodyTexture() : getCircleTexture(), [useSpikeTex]);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      let x = 0;
      let y = 0;
      let z = 0;

      if (shape === 'galaxy') {
        const arm = i % 4;
        const t = Math.random() * Math.PI * 7.2;
        const radius = 2.5 + Math.pow(Math.random(), 0.72) * 38;
        const angle = t + arm * Math.PI * 0.5 + radius * 0.038;
        const spread = 0.22 + radius * 0.03;
        x = Math.cos(angle) * radius + (Math.random() - 0.5) * spread * 4.5;
        z = Math.sin(angle) * radius * 0.42 + (Math.random() - 0.5) * spread * 3.2;
        y = Math.sin(t * 0.68) * 1.6 + (Math.random() - 0.5) * (0.7 + radius * 0.025);
      } else if (shape === 'near') {
        const theta = Math.random() * Math.PI * 2;
        const r = 12 + Math.random() * 30;
        x = Math.cos(theta) * r;
        z = Math.sin(theta) * r;
        y = -8 + Math.random() * 22;
      } else {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 18 + Math.random() * 36;
        x = r * Math.sin(phi) * Math.cos(theta);
        y = r * Math.cos(phi) * 0.55 + 1;
        z = r * Math.sin(phi) * Math.sin(theta);
      }

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const brightness = 0.34 + Math.random() * 0.78;
      const cool = Math.random();
      col[i * 3] = brightness * (0.66 + cool * 0.18);
      col[i * 3 + 1] = brightness * (0.78 + cool * 0.18);
      col[i * 3 + 2] = brightness * (0.92 + cool * 0.22);
    }

    return { positions: pos, colors: col };
  }, [count, shape]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, [positions, colors]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y += delta * speed;
    ref.current.rotation.z = Math.sin(t * speed * 0.55) * 0.035 - 0.18;
    ref.current.position.x = Math.sin(t * speed * 0.7) * 0.45;
    ref.current.position.y = Math.cos(t * speed * 0.5) * 0.16;

    const mat = ref.current.material as THREE.PointsMaterial;
    mat.opacity = baseOpacity * (0.9 + Math.sin(t * 1.25 + speed * 20) * 0.1);
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
        toneMapped={false}
      />
    </points>
  );
}

export default function BackgroundStars() {
  return (
    <>
      <StarLayer count={18000} size={0.045} baseOpacity={0.92} shape="galaxy" speed={0.035} />
      <StarLayer count={5200} size={0.07} baseOpacity={0.78} shape="field" speed={0.024} />
      <StarLayer count={1800} size={0.13} baseOpacity={0.74} shape="near" speed={0.045} useSpikeTex />
    </>
  );
}
