import type { Emotion } from '../types';
import { EMOTION_MAP } from '../types';

interface EmotionSelectorProps {
  selected: Emotion;
  onSelect: (emotion: Emotion) => void;
}

const emotions = Object.entries(EMOTION_MAP) as [Emotion, typeof EMOTION_MAP[Emotion]][];

export default function EmotionSelector({ selected, onSelect }: EmotionSelectorProps) {
  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {emotions.map(([key, config]) => {
        const isSelected = selected === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`
              relative px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer
              flex items-center gap-1.5 text-sm
              ${isSelected
                ? 'scale-110 shadow-lg'
                : 'opacity-60 hover:opacity-90 hover:scale-105'
              }
            `}
            style={{
              backgroundColor: isSelected ? config.color + '25' : 'rgba(255,255,255,0.05)',
              borderColor: isSelected ? config.color : 'rgba(255,255,255,0.1)',
              borderWidth: 1.5,
              color: isSelected ? config.color : 'rgba(255,255,255,0.7)',
              boxShadow: isSelected ? `0 0 20px ${config.color}30` : 'none',
            }}
          >
            <span className="text-lg">{config.emoji}</span>
            <span>{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}
