import { useMemo } from 'react';
import * as THREE from 'three';

interface NebulaPlaneProps {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  opacity: number;
}

function generateNebulaTexture(hexColor: string): THREE.CanvasTexture {
  const size = 256;
  const half = size / 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Parse color
  const red = parseInt(hexColor.slice(1, 3), 16);
  const green = parseInt(hexColor.slice(3, 5), 16);
  const blue = parseInt(hexColor.slice(5, 7), 16);

  // 3-4 overlapping soft radial gradients at random positions
  const gradients = [
    { x: half * 0.7, y: half * 0.6, r: half * 1.1, a: 0.6 },
    { x: half * 1.3, y: half * 0.4, r: half * 1.0, a: 0.45 },
    { x: half * 0.35, y: half * 1.3, r: half * 0.9, a: 0.5 },
    { x: half * 0.8, y: half * 0.8, r: half * 1.4, a: 0.3 },
  ];

  for (const g of gradients) {
    const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
    grad.addColorStop(0, `rgba(${red},${green},${blue},${g.a})`);
    grad.addColorStop(0.3, `rgba(${red},${green},${blue},${g.a * 0.6})`);
    grad.addColorStop(0.6, `rgba(${red},${green},${blue},${g.a * 0.15})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function NebulaPlane({ position, rotation, scale, color, opacity }: NebulaPlaneProps) {
  const texture = useMemo(() => generateNebulaTexture(color), [color]);

  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

export default function Nebulae({ enabled, style }: { enabled: boolean; style: 'realistic' | 'dark' }) {
  if (!enabled) return null;
  const baseOpacity = style === 'realistic' ? 1 : 0.35;

  return (
    <>
      <NebulaPlane
        position={[3, 2, -12]} rotation={[0, 0, 0.3]} scale={[12, 8, 1]}
        color="#2a1040" opacity={0.12 * baseOpacity}
      />
      <NebulaPlane
        position={[-5, -1, -10]} rotation={[0, 0.5, 0]} scale={[10, 7, 1]}
        color="#0a2040" opacity={0.10 * baseOpacity}
      />
      <NebulaPlane
        position={[0, 4, -15]} rotation={[-0.2, 0, 0]} scale={[15, 6, 1]}
        color="#1a0a20" opacity={0.08 * baseOpacity}
      />
      <NebulaPlane
        position={[6, -2, -18]} rotation={[0.1, -0.3, -0.1]} scale={[14, 8, 1]}
        color="#0d1a30" opacity={0.06 * baseOpacity}
      />
    </>
  );
}
