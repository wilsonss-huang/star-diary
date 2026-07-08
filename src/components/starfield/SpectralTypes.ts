export interface SpectralClass {
  type: string;
  color: string;
  temperature: number;
  proportion: number;
  magnitude: { min: number; max: number };
}

export const SPECTRAL_CLASSES: SpectralClass[] = [
  { type: 'O', color: '#9DB4FF', temperature: 40000, proportion: 0.00001, magnitude: { min: 0.5, max: 3.0 } },
  { type: 'B', color: '#AAC4FF', temperature: 20000, proportion: 0.001,   magnitude: { min: 0.5, max: 3.5 } },
  { type: 'A', color: '#CAD7FF', temperature: 8500,  proportion: 0.006,   magnitude: { min: 0.5, max: 4.0 } },
  { type: 'F', color: '#F8F7FF', temperature: 6500,  proportion: 0.03,    magnitude: { min: 0.8, max: 4.5 } },
  { type: 'G', color: '#FFF4EA', temperature: 5500,  proportion: 0.076,   magnitude: { min: 0.8, max: 5.0 } },
  { type: 'K', color: '#FFD2A1', temperature: 4000,  proportion: 0.121,   magnitude: { min: 1.0, max: 5.5 } },
  { type: 'M', color: '#FFB56B', temperature: 3000,  proportion: 0.763,   magnitude: { min: 1.0, max: 6.0 } },
];

// Pre-compute cumulative distribution for O(1) weighted random selection
const cumulative: number[] = [];
let total = 0;
for (const s of SPECTRAL_CLASSES) {
  total += s.proportion;
  cumulative.push(total);
}

export function pickSpectralType(): SpectralClass {
  const r = Math.random() * total;
  for (let i = 0; i < cumulative.length; i++) {
    if (r <= cumulative[i]) return SPECTRAL_CLASSES[i];
  }
  return SPECTRAL_CLASSES[SPECTRAL_CLASSES.length - 1];
}
