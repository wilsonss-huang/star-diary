import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function generateGalaxyTexture(): THREE.CanvasTexture {
  const size = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Deep space base — very dark blue-black
  const baseGrad = ctx.createLinearGradient(0, 0, size, size);
  baseGrad.addColorStop(0, '#030814');
  baseGrad.addColorStop(0.3, '#050d20');
  baseGrad.addColorStop(0.5, '#030a18');
  baseGrad.addColorStop(0.7, '#060e25');
  baseGrad.addColorStop(1, '#020610');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  // Nebula cloud 1 — large purple/pink cluster (top-right area)
  for (let i = 0; i < 40; i++) {
    const x = size * 0.4 + Math.random() * size * 0.5;
    const y = Math.random() * size * 0.45;
    const r = 80 + Math.random() * 200;
    const grad = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
    const alpha = 0.03 + Math.random() * 0.06;
    grad.addColorStop(0, `rgba(180,120,220,${alpha})`);
    grad.addColorStop(0.4, `rgba(100,50,150,${alpha * 0.7})`);
    grad.addColorStop(0.7, `rgba(40,20,80,${alpha * 0.3})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  // Nebula cloud 2 — blue/cyan cluster (left area)
  for (let i = 0; i < 35; i++) {
    const x = Math.random() * size * 0.45;
    const y = size * 0.3 + Math.random() * size * 0.5;
    const r = 60 + Math.random() * 180;
    const grad = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
    const alpha = 0.02 + Math.random() * 0.05;
    grad.addColorStop(0, `rgba(80,140,220,${alpha})`);
    grad.addColorStop(0.4, `rgba(40,80,160,${alpha * 0.7})`);
    grad.addColorStop(0.7, `rgba(15,30,80,${alpha * 0.3})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  // Nebula cloud 3 — warm amber/gold cluster (bottom-right)
  for (let i = 0; i < 25; i++) {
    const x = size * 0.5 + Math.random() * size * 0.45;
    const y = size * 0.5 + Math.random() * size * 0.45;
    const r = 50 + Math.random() * 150;
    const grad = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
    const alpha = 0.02 + Math.random() * 0.04;
    grad.addColorStop(0, `rgba(200,150,80,${alpha})`);
    grad.addColorStop(0.4, `rgba(140,90,40,${alpha * 0.6})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  // Thousands of stars — varying brightness and color
  const starColors = [
    [255, 255, 255], // pure white (brightest)
    [180, 200, 255], // blue-white
    [255, 245, 220], // warm white (like Sun)
    [255, 220, 180], // yellow-orange
    [255, 180, 120], // orange
    [220, 220, 255], // pale blue
  ];

  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const brightness = Math.random();
    const radius = brightness > 0.95 ? 1.8 : brightness > 0.8 ? 1.2 : brightness > 0.5 ? 0.7 : 0.3;

    // Pick color — brighter stars tend to be white/blue, dimmer stars warmer
    let colorIdx;
    if (brightness > 0.9) colorIdx = 0;
    else if (brightness > 0.75) colorIdx = Math.random() < 0.6 ? 0 : 1;
    else if (brightness > 0.5) colorIdx = Math.floor(Math.random() * 3) + 1;
    else colorIdx = Math.floor(Math.random() * 3) + 3;

    const [cr, cg, cb] = starColors[colorIdx];
    const alpha = 0.15 + brightness * 0.85;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
    ctx.fill();

    // Cross diffraction spikes for the brightest stars
    if (brightness > 0.92) {
      const spikeLen = 4 + Math.random() * 8;
      const spikeAlpha = alpha * (0.3 + Math.random() * 0.4);
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${spikeAlpha})`;
      ctx.lineWidth = 0.4;
      // Horizontal spike
      ctx.beginPath();
      ctx.moveTo(x - spikeLen, y);
      ctx.lineTo(x + spikeLen, y);
      ctx.stroke();
      // Vertical spike
      ctx.beginPath();
      ctx.moveTo(x, y - spikeLen);
      ctx.lineTo(x, y + spikeLen);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

let cachedTexture: THREE.CanvasTexture | null = null;
function getGalaxyTexture(): THREE.CanvasTexture {
  if (!cachedTexture) cachedTexture = generateGalaxyTexture();
  return cachedTexture;
}

export default function GalaxyBackground() {
  const texture = useMemo(() => getGalaxyTexture(), []);
  const sphereRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (sphereRef.current) {
      // Ultra-slow drift
      sphereRef.current.rotation.y += delta * 0.008;
      sphereRef.current.rotation.x += delta * 0.003;
    }
  });

  return (
    <mesh ref={sphereRef}>
      <sphereGeometry args={[50, 64, 64]} />
      <meshBasicMaterial
        map={texture}
        side={THREE.BackSide}
        toneMapped={false}
      />
    </mesh>
  );
}
