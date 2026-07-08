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
    <div className="flex gap-3 flex-wrap justify-center">
      {emotions.map(([key, config]) => {
        const isSelected = selected === key;
        return (
          <motion.button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className="relative px-5 py-3 rounded-2xl transition-all duration-300 cursor-pointer
                       flex items-center gap-2.5 text-sm"
            style={{
              backgroundColor: isSelected ? config.color + '20' : 'rgba(255,255,255,0.04)',
              borderColor: isSelected ? config.color : 'rgba(255,255,255,0.08)',
              borderWidth: 1,
              color: isSelected ? config.color : 'rgba(255,255,255,0.55)',
              boxShadow: isSelected ? `0 0 20px ${config.color}25` : 'none',
            }}
            whileTap={{ scale: 0.96 }}
            animate={{
              scale: isSelected ? 1.06 : 1,
              borderColor: isSelected ? config.color : 'rgba(255,255,255,0.08)',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <motion.span
              className="text-lg"
              animate={{ scale: isSelected ? 1.15 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              {config.emoji}
            </motion.span>
            <span>{config.label}</span>

            {isSelected && (
              <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                layoutId="emotion-glow"
                style={{
                  boxShadow: `inset 0 0 8px ${config.color}25, 0 0 12px ${config.color}15`,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
