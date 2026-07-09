import { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpenText, ChevronLeft, Menu, Orbit, PenLine, Sparkles } from 'lucide-react';
import type { DiaryEntry, Emotion } from '../types';
import { EMOTION_MAP } from '../types';
import { StarLogo, StarFilled, StarOutline } from './Icons';

interface SidebarProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
  diaries: DiaryEntry[];
  bookmarkedDiaries: DiaryEntry[];
  emotionStats: Record<Emotion, number>;
  onDiaryClick: (diary: DiaryEntry) => void;
  onNewDiary: () => void;
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function EmotionGlow({ emotion, size = 14 }: { emotion: Emotion; size?: number }) {
  const color = EMOTION_MAP[emotion].color;

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size }}
      title={EMOTION_MAP[emotion].label}
    >
      <span className="absolute inset-0 rounded-full blur-[5px] opacity-60" style={{ backgroundColor: color }} />
      <span
        className="relative block rounded-full border border-white/25"
        style={{
          width: Math.max(7, size - 6),
          height: Math.max(7, size - 6),
          background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9), ${color} 38%, rgba(6,8,22,0.8) 100%)`,
        }}
      />
    </span>
  );
}

export default function Sidebar({
  isOpen,
  onOpen,
  onClose,
  onToggle,
  diaries,
  bookmarkedDiaries,
  emotionStats,
  onDiaryClick,
  onNewDiary,
}: SidebarProps) {
  const closeTimerRef = useRef<number | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current === null) return;
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }, []);

  const handleOpen = useCallback(() => {
    clearCloseTimer();
    onOpen();
  }, [clearCloseTimer, onOpen]);

  const handleDelayedClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      onClose();
      closeTimerRef.current = null;
    }, 220);
  }, [clearCloseTimer, onClose]);

  const handleImmediateClose = useCallback(() => {
    clearCloseTimer();
    onClose();
  }, [clearCloseTimer, onClose]);

  useEffect(() => clearCloseTimer, [clearCloseTimer]);

  const handleDiaryClick = (diary: DiaryEntry) => {
    onDiaryClick(diary);
    handleImmediateClose();
  };

  return (
    <>
      <div className="absolute left-0 top-0 bottom-0 z-30 w-10" onMouseEnter={handleOpen} aria-hidden="true" />

      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            className="absolute left-4 top-5 z-[31] flex h-11 items-center gap-2 rounded-2xl
                       bg-black/42 px-3 text-white/55
                       shadow-[0_18px_48px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-2xl
                       transition-all hover:bg-white/[0.07] hover:text-white/82 active:scale-95"
            onMouseEnter={handleOpen}
            onClick={onToggle}
            initial={{ opacity: 0, x: -16, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            title="菜单"
          >
            <Menu size={19} strokeWidth={1.6} />
            <span className="hidden text-xs font-medium sm:inline">菜单</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            className="absolute left-0 top-0 bottom-0 z-30 flex w-[360px] max-w-[86vw] flex-col
                       border-r border-white/[0.025] bg-black/62 shadow-[24px_0_90px_rgba(0,0,0,0.56)]
                       backdrop-blur-3xl"
            onMouseEnter={handleOpen}
            onMouseLeave={handleDelayedClose}
            initial={{ x: -380, opacity: 0.9 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -380, opacity: 0.9 }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
          >
            <div className="flex items-center justify-between border-b border-white/[0.025] px-7 py-7">
              <div className="flex min-w-0 items-center gap-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    background: 'radial-gradient(circle at 35% 25%, rgba(255,255,255,0.22), rgba(129,140,248,0.16) 42%, rgba(9,12,32,0.8) 100%)',
                    boxShadow: '0 16px 42px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.10)',
                  }}
                >
                  <StarLogo size={23} className="text-white/78" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold tracking-wide text-white/92">星空日记</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-white/28">
                    <Orbit size={12} strokeWidth={1.5} />
                    <span>{diaries.length} 颗星星</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleImmediateClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white/28
                           transition-all hover:bg-white/[0.06] hover:text-white/70"
                title="收起"
              >
                <ChevronLeft size={18} strokeWidth={1.6} />
              </button>
            </div>

            <div className="px-7 py-6">
              <button
                type="button"
                onClick={onNewDiary}
                className="flex w-full items-center justify-center gap-3 rounded-2xl
                           bg-indigo-400/[0.10] px-5 py-4 text-sm font-medium text-white/92
                           shadow-[0_16px_44px_rgba(24,26,60,0.28)] transition-all
                           hover:bg-indigo-300/[0.16] active:scale-[0.98]"
              >
                <PenLine size={18} strokeWidth={1.7} />
                <span>写日记 · 点亮星星</span>
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-7 py-4">
              <h3 className="mb-4 flex items-center gap-2 text-xs font-medium text-white/38">
                <StarFilled size={13} />
                <span>收藏星星</span>
                <span className="text-white/18">({bookmarkedDiaries.length})</span>
              </h3>

              {bookmarkedDiaries.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <div className="px-8 text-center">
                    <div className="mb-4 flex justify-center text-white/12">
                      <StarOutline size={34} />
                    </div>
                    <p className="text-xs leading-relaxed text-white/22">还没有收藏的星星</p>
                    <p className="mt-2 text-xs leading-relaxed text-white/12">打开日记卡片后可以把重要回忆收藏起来</p>
                  </div>
                </div>
              ) : (
                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                  {bookmarkedDiaries.map((diary) => (
                    <button
                      key={diary.id}
                      type="button"
                      onClick={() => handleDiaryClick(diary)}
                      className="group flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left
                                 transition-all hover:bg-white/[0.055]"
                    >
                      <EmotionGlow emotion={diary.emotion} size={17} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-white/82 transition-colors group-hover:text-white">
                          {diary.title}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-white/24">
                          <BookOpenText size={12} strokeWidth={1.5} />
                          <span>{formatDateShort(diary.createdAt)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-white/[0.025] px-7 py-6">
              <div className="mb-4 flex items-center gap-2 text-xs text-white/35">
                <Sparkles size={14} strokeWidth={1.5} />
                <span>情绪星谱</span>
              </div>
              <div className="grid grid-cols-6 gap-3">
                {(Object.entries(emotionStats) as [Emotion, number][]).map(([key, count]) => (
                  <div
                    key={key}
                    className="flex min-w-0 flex-col items-center gap-2 rounded-xl
                               bg-white/[0.025] px-2 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]"
                    title={`${EMOTION_MAP[key].label}: ${count}`}
                  >
                    <EmotionGlow emotion={key} size={16} />
                    <span className="text-[11px] text-white/28">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
