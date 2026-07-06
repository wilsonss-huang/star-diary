import { motion, AnimatePresence } from 'framer-motion';
import type { DiaryEntry } from '../types';
import { EMOTION_MAP } from '../types';

interface DiaryCardProps {
  diary: DiaryEntry | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

export default function DiaryCard({ diary, onClose, onDelete }: DiaryCardProps) {
  return (
    <AnimatePresence>
      {diary && (
        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
          />

          {/* Card */}
          <motion.div
            className="glass-strong rounded-2xl p-6 w-full max-w-md mx-4 z-10 overflow-hidden"
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 18, stiffness: 180 }}
          >
            {/* Star color accent bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ backgroundColor: EMOTION_MAP[diary.emotion].color }}
            />

            <div className="flex items-center gap-3 mb-3 mt-1">
              <span className="text-2xl">{EMOTION_MAP[diary.emotion].emoji}</span>
              <div className="flex-1">
                <h3 className="text-white text-lg font-semibold leading-tight">{diary.title}</h3>
                <span className="text-white/35 text-xs">{formatDate(diary.createdAt)}</span>
              </div>
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  backgroundColor: EMOTION_MAP[diary.emotion].color + '20',
                  color: EMOTION_MAP[diary.emotion].color,
                }}
              >
                {EMOTION_MAP[diary.emotion].label}
              </span>
            </div>

            <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
              {diary.content}
            </p>

            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-xl border border-white/10 text-white/50
                           hover:bg-white/5 hover:text-white/70 transition-all cursor-pointer text-sm"
              >
                关闭
              </button>
              <button
                type="button"
                onClick={() => { onDelete(diary.id); onClose(); }}
                className="py-2 px-4 rounded-xl border border-red-500/20 text-red-400/60
                           hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40
                           transition-all cursor-pointer text-sm"
              >
                🗑 删除
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
