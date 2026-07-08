import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarLogo } from './Icons';

export default function SettingsPanel(_props: { refreshDiaries: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="absolute top-5 right-5 z-10 w-10 h-10 rounded-xl glass
                   flex items-center justify-center cursor-pointer
                   hover:bg-white/10 transition-all active:scale-95"
        title="关于星空日记"
      >
        <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div className="absolute inset-0 z-30 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            />
            <motion.div
              className="glass-strong rounded-3xl px-10 py-10 w-full max-w-sm mx-4 z-10 text-center"
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            >
              <div className="inline-flex items-center justify-center mb-6 text-white/45">
                <StarLogo size={48} />
              </div>
              <h2 className="text-white text-xl font-semibold tracking-wide">星空日记</h2>
              <p className="text-white/20 text-sm mt-3 mb-6">Star Diary v1.0.1</p>
              <p className="text-white/30 text-sm leading-relaxed">
                每篇日记化作一颗星星<br />
                挂在属于你的夜空之中
              </p>
              <p className="text-white/12 text-xs mt-4">按下 Ctrl+B 打开侧边栏</p>
              <button
                type="button"
                onClick={() => { setIsOpen(false); }}
                className="w-full mt-7 py-3 rounded-xl border border-white/[0.06] text-white/25
                           text-sm hover:text-white/50 hover:border-white/15 transition-all cursor-pointer"
              >
                关闭
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
