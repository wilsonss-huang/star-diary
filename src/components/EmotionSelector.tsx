import { motion } from 'framer-motion';
import type { Emotion } from '../types';
import { EMOTION_MAP } from '../types';

interface EmotionSelectorProps {
  selected: Emotion;
  onSelect: (emotion: Emotion) => void;
}

const emotions = Object.entries(EMOTION_MAP) as [Emotion, typeof EMOTION_MAP[Emotion]][];

export default function EmotionSelector({ selected, onSelect }: EmotionSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {emotions.map(([key, config]) => {
        const isSelected = selected === key;
        return (
          <motion.button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`relative flex min-h-[68px] items-center gap-3 rounded-2xl border px-4 text-left
                        transition-all duration-200 ${
              isSelected
                ? 'bg-white/[0.08] text-white/92'
                : 'bg-white/[0.028] text-white/48 hover:bg-white/[0.055] hover:text-white/76'
            }`}
            style={{
              borderColor: isSelected ? `${config.color}66` : 'rgba(255,255,255,0.07)',
              boxShadow: isSelected ? `0 0 24px ${config.color}22, inset 0 1px 0 rgba(255,255,255,0.09)` : 'none',
            }}
            whileTap={{ scale: 0.97 }}
            animate={{ y: isSelected ? -1 : 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          >
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
              <span
                className="absolute inset-0 rounded-2xl blur-md"
                style={{ backgroundColor: config.color, opacity: isSelected ? 0.34 : 0.16 }}
              />
              <span
                className="relative h-4 w-4 rounded-full border border-white/35"
                style={{ backgroundColor: config.color, boxShadow: `0 0 16px ${config.color}` }}
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{config.label}</span>
              <span className="mt-1 block text-[11px] text-white/24">情绪星点</span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
