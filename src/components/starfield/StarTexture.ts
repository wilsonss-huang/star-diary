import * as THREE from 'three';
import { EMOTION_MAP, type Emotion } from '../../types';

// Module-level caches — share across all component instances
let starBodyTexture: THREE.CanvasTexture | null = null;
const glowTextureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Generate the shared white star body texture with diffraction spikes.
 * Layers from back to front:
 *   1. Outer glow halo (large, soft radial gradient)
 *   2. Diagonal diffraction spikes (45° and 135°, subtle)
 *   3. Primary diffraction spikes (horizontal + vertical, bright)
 *   4. Core (tiny radial gradient, pure white)
 */
export function getStarBodyTexture(): THREE.CanvasTexture {
  if (starBodyTexture) return starBodyTexture;

  const size = 128;
  const half = size / 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Layer 1: Outer glow halo
  const haloGrad = ctx.createRadialGradient(half, half, half * 0.04, half, half, half);
  haloGrad.addColorStop(0, 'rgba(255,255,255,1)');
  haloGrad.addColorStop(0.05, 'rgba(255,255,255,0.9)');
  haloGrad.addColorStop(0.15, 'rgba(255,255,255,0.5)');
  haloGrad.addColorStop(0.35, 'rgba(255,255,255,0.12)');
  haloGrad.addColorStop(0.6, 'rgba(255,255,255,0.02)');
  haloGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = haloGrad;
  ctx.fillRect(0, 0, size, size);

  // Layer 2: Diagonal diffraction spikes (45°)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(half, half);
  for (let angle = 0; angle < 360; angle += 45) {
    ctx.save();
    ctx.rotate((angle * Math.PI) / 180);
    const spikeGrad = ctx.createLinearGradient(0, 0, 0, half);
    spikeGrad.addColorStop(0, 'rgba(255,255,255,0.7)');
    spikeGrad.addColorStop(0.03, 'rgba(255,255,255,0.4)');
    spikeGrad.addColorStop(0.2, 'rgba(255,255,255,0.10)');
    spikeGrad.addColorStop(0.5, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = spikeGrad;
    ctx.fillRect(-0.9, 0, 1.8, half);
    ctx.restore();
  }
  ctx.restore();

  // Layer 3: Primary diffraction spikes (horizontal + vertical, prominent)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(half, half);
  const primaryAngles = [0, 90, 180, 270];
  for (const angle of primaryAngles) {
    ctx.save();
    ctx.rotate((angle * Math.PI) / 180);
    const spikeGrad = ctx.createLinearGradient(0, 0, 0, half * 0.95);
    spikeGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
    spikeGrad.addColorStop(0.04, 'rgba(255,255,255,0.5)');
    spikeGrad.addColorStop(0.15, 'rgba(255,255,255,0.12)');
    spikeGrad.addColorStop(0.55, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = spikeGrad;
    ctx.fillRect(-0.7, 0, 1.4, half * 0.95);
    ctx.restore();
  }
  ctx.restore();

  // Layer 4: Core — very tiny bright point
  const coreGrad = ctx.createRadialGradient(half, half, 0, half, half, half * 0.06);
  coreGrad.addColorStop(0, 'rgba(255,255,255,1)');
  coreGrad.addColorStop(0.4, 'rgba(255,255,255,1)');
  coreGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(half, half, half * 0.06, 0, Math.PI * 2);
  ctx.fill();

  starBodyTexture = new THREE.CanvasTexture(canvas);
  starBodyTexture.needsUpdate = true;
  return starBodyTexture;
}

/**
 * Generate a per-emotion colored glow texture.
 * Simple radial gradient from the emotion's glowColor to transparent.
 */
export function getStarGlowTexture(emotion: Emotion): THREE.CanvasTexture {
  const cached = glowTextureCache.get(emotion);
  if (cached) return cached;

  const config = EMOTION_MAP[emotion];
  const size = 128;
  const half = size / 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Main colored radial glow
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, config.glowColor);
  gradient.addColorStop(0.08, config.glowColor + 'DD');
  gradient.addColorStop(0.25, config.glowColor + '66');
  gradient.addColorStop(0.5, config.glowColor + '15');
  gradient.addColorStop(0.75, config.glowColor + '03');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Subtle cross glow — makes the glow slightly cross-shaped like a real star
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(half, half);
  for (const angle of [0, 90, 180, 270]) {
    ctx.save();
    ctx.rotate((angle * Math.PI) / 180);
    const crossGrad = ctx.createLinearGradient(0, 0, 0, half * 0.6);
    crossGrad.addColorStop(0, config.glowColor + '44');
    crossGrad.addColorStop(0.3, config.glowColor + '18');
    crossGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = crossGrad;
    ctx.fillRect(-1.5, 0, 3, half * 0.6);
    ctx.restore();
  }
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  glowTextureCache.set(emotion, texture);
  return texture;
}

/** Force cache invalidation (useful for HMR / theme changes) */
export function clearStarTextureCache(): void {
  starBodyTexture?.dispose();
  starBodyTexture = null;
  glowTextureCache.forEach(t => t.dispose());
  glowTextureCache.clear();
}
