import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface NebulaPlaneProps {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color1: string;
  color2: string;
  color3: string;
  opacity: number;
  driftSpeed?: number;
}

/**
 * Generate a nebula texture with multiple overlapping gradients
 * and Perlin-like noise blobs for organic cloud structure.
 */
function generateNebulaTexture(
  color1: string, color2: string, color3: string,
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Parse colors
  const parseRgb = (hex: string) => ({
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  });
  const c1 = parseRgb(color1);
  const c2 = parseRgb(color2);
  const c3 = parseRgb(color3);

  // Clear
  ctx.clearRect(0, 0, size, size);

  // Generate random "blob" centers — simulates gas cloud clumps
  const blobs: { x: number; y: number; r: number; color: typeof c1; alpha: number }[] = [];
  const rng = mulberry32(hashStr(color1 + color2 + color3));

  for (let i = 0; i < 18; i++) {
    const colorChoice = rng();
    blobs.push({
      x: rng() * size,
      y: rng() * size,
      r: 40 + rng() * 200,
      color: colorChoice < 0.4 ? c1 : colorChoice < 0.7 ? c2 : c3,
      alpha: 0.15 + rng() * 0.55,
    });
  }

  // Render blobs
  for (const b of blobs) {
    const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    grad.addColorStop(0, `rgba(${b.color.r},${b.color.g},${b.color.b},${b.alpha})`);
    grad.addColorStop(0.25, `rgba(${b.color.r},${b.color.g},${b.color.b},${b.alpha * 0.7})`);
    grad.addColorStop(0.5, `rgba(${b.color.r},${b.color.g},${b.color.b},${b.alpha * 0.35})`);
    grad.addColorStop(0.75, `rgba(${b.color.r},${b.color.g},${b.color.b},${b.alpha * 0.08})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  // Add wispy filaments — thin elongated gradients
  for (let i = 0; i < 8; i++) {
    const x1 = rng() * size;
    const y1 = rng() * size;
    const x2 = x1 + (rng() - 0.5) * size * 1.2;
    const y2 = y1 + (rng() - 0.5) * size * 1.2;

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const filamentR = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / 2 + 30 + rng() * 60;

    const colorChoice = rng() < 0.5 ? c2 : c3;
    const alpha = 0.04 + rng() * 0.12;
    const grad = ctx.createRadialGradient(midX, midY, 5, midX, midY, filamentR);
    grad.addColorStop(0, `rgba(${colorChoice.r},${colorChoice.g},${colorChoice.b},${alpha})`);
    grad.addColorStop(0.5, `rgba(${colorChoice.r},${colorChoice.g},${colorChoice.b},${alpha * 0.4})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  // Edge softening — fade borders to transparent
  const edgeGrad = ctx.createRadialGradient(size / 2, size / 2, size * 0.3, size / 2, size / 2, size * 0.7);
  edgeGrad.addColorStop(0, 'rgba(0,0,0,0)');
  edgeGrad.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = 'source-over';

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

// Deterministic RNG for consistent textures across renders
function mulberry32(a: number) {
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i); h |= 0;
  }
  return h;
}

function NebulaPlane({
  position, rotation, scale, color1, color2, color3, opacity, driftSpeed = 0.2,
}: NebulaPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(
    () => generateNebulaTexture(color1, color2, color3),
    [color1, color2, color3],
  );

  // drift offset unique to this plane
  const driftOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    // Slow breathing opacity
    const breathe = 1 + Math.sin(t * driftSpeed * 0.7 + driftOffset) * 0.15;
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity * breathe;
    // Very slow rotation drift
    meshRef.current.rotation.z += 0.0001 * driftSpeed;
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
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

/**
 * Nebulae — rich, animated nebula planes that create
 * a colorful, immersive deep-space atmosphere.
 *
 * Color palettes inspired by real nebulae:
 * - Orion Nebula: pinks, magentas, soft blues
 * - Carina Nebula: warm ambers, golds, deep reds
 * - Eagle Nebula: teals, cyan-greens, dusky purples
 * - Veil Nebula: electric blues, cyans, ghostly greens
 */
export default function Nebulae({ enabled, style }: { enabled: boolean; style: 'realistic' | 'dark' }) {
  if (!enabled) return null;

  const intensity = style === 'realistic' ? 1 : 0.35;

  // Each nebula has 3 colors: primary, secondary, and accent
  const nebulae: {
    pos: [number, number, number];
    rot: [number, number, number];
    scl: [number, number, number];
    c1: string;
    c2: string;
    c3: string;
    op: number;
    drift: number;
  }[] = [
    // --- Main nebula cluster (front-center) — Orion-style pink/purple ---
    {
      pos: [1.5, 3, -10], rot: [0.1, 0, 0.15], scl: [13, 9, 1],
      c1: '#e890b0', c2: '#8b3a6b', c3: '#d4a0c0',
      op: 0.13 * intensity, drift: 0.15,
    },
    {
      pos: [-2, 1.5, -9], rot: [0, -0.2, -0.1], scl: [10, 8, 1],
      c1: '#c070a0', c2: '#6b2a50', c3: '#e0b8d0',
      op: 0.09 * intensity, drift: 0.2,
    },

    // --- Right side — Carina-style warm amber/gold ---
    {
      pos: [8, -1, -14], rot: [-0.05, -0.3, 0.1], scl: [14, 8, 1],
      c1: '#e8a860', c2: '#a04030', c3: '#f0c890',
      op: 0.10 * intensity, drift: 0.18,
    },
    {
      pos: [5, 0.5, -12], rot: [0.08, -0.15, 0.05], scl: [9, 6, 1],
      c1: '#d09050', c2: '#803020', c3: '#e0b870',
      op: 0.07 * intensity, drift: 0.22,
    },

    // --- Left side — Eagle-style teal/cyan-green ---
    {
      pos: [-7, 2, -13], rot: [0.05, 0.3, -0.08], scl: [12, 7, 1],
      c1: '#509890', c2: '#1a4038', c3: '#80d0c0',
      op: 0.09 * intensity, drift: 0.17,
    },
    {
      pos: [-4, -0.5, -11], rot: [-0.08, 0.2, 0.1], scl: [8, 6, 1],
      c1: '#408070', c2: '#103028', c3: '#70b8a8',
      op: 0.06 * intensity, drift: 0.25,
    },

    // --- Top area — Veil-style electric blue/cyan ---
    {
      pos: [0, 7, -16], rot: [-0.15, 0, 0], scl: [16, 7, 1],
      c1: '#4070c0', c2: '#182848', c3: '#80b0e0',
      op: 0.08 * intensity, drift: 0.12,
    },
    {
      pos: [3, 5, -15], rot: [-0.1, -0.1, -0.05], scl: [8, 5, 1],
      c1: '#3058a0', c2: '#101830', c3: '#6090d0',
      op: 0.06 * intensity, drift: 0.2,
    },

    // --- Deep background — dusky purple haze ---
    {
      pos: [0, 0, -20], rot: [0, 0, 0], scl: [18, 10, 1],
      c1: '#3a1848', c2: '#180820', c3: '#5a3068',
      op: 0.07 * intensity, drift: 0.1,
    },
    {
      pos: [-3, -2, -18], rot: [0.05, 0.1, -0.05], scl: [14, 8, 1],
      c1: '#2a1038', c2: '#100818', c3: '#4a2058',
      op: 0.05 * intensity, drift: 0.13,
    },

    // --- Accent wisps — subtle color pops ---
    {
      pos: [6, -3, -8], rot: [0.2, -0.25, 0.15], scl: [7, 5, 1],
      c1: '#e06080', c2: '#802040', c3: '#f090a0',
      op: 0.05 * intensity, drift: 0.28,
    },
    {
      pos: [-6, 4, -10], rot: [-0.1, 0.35, -0.1], scl: [6, 5, 1],
      c1: '#4088b0', c2: '#102840', c3: '#80c0e0',
      op: 0.05 * intensity, drift: 0.24,
    },
  ];

  return (
    <>
      {nebulae.map((n, i) => (
        <NebulaPlane
          key={`${n.c1}-${i}`}
          position={n.pos}
          rotation={n.rot}
          scale={n.scl}
          color1={n.c1}
          color2={n.c2}
          color3={n.c3}
          opacity={n.op}
          driftSpeed={n.drift}
        />
      ))}
    </>
  );
}
