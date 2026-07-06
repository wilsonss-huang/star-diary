import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Emotion } from '../types';
import EmotionSelector from './EmotionSelector';

interface NewDiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: string, emotion: Emotion) => void;
}

export default function NewDiaryModal({ isOpen, onClose, onSave }: NewDiaryModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [emotion, setEmotion] = useState<Emotion>('calm');

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;
    onSave(title.trim(), content.trim(), emotion);
    setTitle('');
    setContent('');
    setEmotion('calm');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="glass-strong rounded-2xl p-6 w-full max-w-lg mx-4 z-10"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          >
            <h2 className="text-white text-xl font-semibold mb-1">✨ 写下新的回忆</h2>
            <p className="text-white/40 text-sm mb-5">写完日记后，一颗星星将在星空中为你亮起</p>

            {/* Emotion selector */}
            <EmotionSelector selected={emotion} onSelect={setEmotion} />

            {/* Title */}
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="今天想记录什么？"
              className="w-full mt-4 px-4 py-3 rounded-xl bg-white/5 border border-white/10
                         text-white placeholder-white/25 outline-none
                         focus:border-white/30 focus:bg-white/8 transition-all"
              autoFocus
            />

            {/* Content */}
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="写下你的日记..."
              rows={6}
              className="w-full mt-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10
                         text-white placeholder-white/25 outline-none resize-none
                         focus:border-white/30 focus:bg-white/8 transition-all"
            />

            {/* Actions */}
            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60
                           hover:bg-white/5 hover:text-white/80 transition-all cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!title.trim() || !content.trim()}
                className="flex-1 py-2.5 rounded-xl font-medium transition-all cursor-pointer
                           disabled:opacity-30 disabled:cursor-not-allowed
                           bg-white/10 border border-white/20 text-white
                           hover:bg-white/15 hover:border-white/30
                           active:scale-95"
              >
                🌟 点亮这颗星
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
