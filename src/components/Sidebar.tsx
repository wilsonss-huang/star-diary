import { motion, AnimatePresence } from 'framer-motion';
import type { DiaryEntry, Emotion } from '../types';
import { EMOTION_MAP } from '../types';
import { StarLogo, StarFilled, StarOutline, SparkleIcon } from './Icons';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  diaries: DiaryEntry[];
  bookmarkedDiaries: DiaryEntry[];
  emotionStats: Record<Emotion, number>;
  starStyle: 'realistic' | 'dark';
  onStarStyleChange: (style: 'realistic' | 'dark') => void;
  onDiaryClick: (diary: DiaryEntry) => void;
  onNewDiary: () => void;
  onExport: () => void;
  onImport: () => void;
  onLogout: () => void;
  currentUserPhone: string;
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export default function Sidebar({
  isOpen, onToggle, diaries, bookmarkedDiaries, emotionStats, starStyle, onStarStyleChange,
  onDiaryClick, onNewDiary, onExport, onImport, onLogout, currentUserPhone,
}: SidebarProps) {
  const handleDiaryClick = (diary: DiaryEntry) => {
    onDiaryClick(diary);
    onToggle();
  };

  return (
    <>
      {/* Toggle button */}
      <motion.button
        type="button"
        className="absolute top-5 left-5 z-10 flex items-center gap-2.5 px-4 py-2.5 rounded-xl glass
                   cursor-pointer hover:bg-white/10 active:scale-95 group"
        onClick={onToggle}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: 1,
          x: isOpen ? 336 : 0,
          boxShadow: ['0 0 0px rgba(99,102,241,0)', '0 0 12px rgba(99,102,241,0.3)', '0 0 0px rgba(99,102,241,0)'],
        }}
        transition={{
          x: { type: 'spring', damping: 22, stiffness: 200 },
          boxShadow: { repeat: 3, duration: 2 },
        }}
      >
        <svg className="w-5 h-5 text-white/60 group-hover:text-white/80 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span className="text-white/50 text-xs group-hover:text-white/70 transition-colors hidden sm:inline">
          菜单
        </span>
      </motion.button>

      {/* Sidebar panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-80 z-20 glass-strong
                       border-r border-white/[0.06] flex flex-col"
            initial={{ x: -336 }}
            animate={{ x: 0 }}
            exit={{ x: -336 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 py-7 border-b border-white/[0.04]">
              <div className="flex items-center gap-3">
                <span className="text-white/55">
                  <StarLogo size={24} />
                </span>
                <span className="text-white font-semibold text-base tracking-wide">星空日记</span>
              </div>
              <button
                type="button"
                onClick={onToggle}
                className="w-8 h-8 rounded-lg flex items-center justify-center
                           text-white/20 hover:text-white/55 hover:bg-white/5 transition-all cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* New diary button */}
            <div className="px-6 py-6 border-b border-white/[0.04]">
              <button
                type="button"
                onClick={onNewDiary}
                className="w-full py-4 rounded-xl font-medium transition-all cursor-pointer
                           bg-indigo-500/10 border border-indigo-500/20 text-white/90
                           hover:bg-indigo-500/20 hover:border-indigo-500/35
                           active:scale-[0.98] flex items-center justify-center gap-2.5 text-sm"
              >
                <span className="text-white/65">
                  <SparkleIcon size={16} />
                </span>
                <span>写日记 · 点亮星星</span>
              </button>
            </div>

            {/* Star style toggle */}
            <div className="px-6 py-5 border-b border-white/[0.04] flex items-center justify-between">
              <span className="text-white/35 text-xs">星空风格</span>
              <div className="flex gap-1 bg-white/[0.03] rounded-lg p-0.5">
                {(['realistic', 'dark'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onStarStyleChange(s)}
                    className={`px-3.5 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
                      starStyle === s ? 'bg-white/10 text-white/90' : 'text-white/30 hover:text-white/55'
                    }`}
                  >
                    {s === 'realistic' ? '天文' : '暗夜'}
                  </button>
                ))}
              </div>
            </div>

            {/* Bookmarked stars */}
            <div className="px-6 py-6 flex-1 overflow-hidden flex flex-col">
              <h3 className="text-white/35 text-xs font-medium mb-4 flex items-center gap-2">
                <span className="text-white/45">
                  <StarFilled size={12} />
                </span>
                <span>收藏星</span>
                <span className="text-white/15">({bookmarkedDiaries.length})</span>
              </h3>

              {bookmarkedDiaries.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center px-6">
                    <div className="mb-4 text-white/10">
                      <StarOutline size={32} />
                    </div>
                    <p className="text-white/18 text-xs leading-relaxed">还没有收藏的星星</p>
                    <p className="text-white/10 text-xs mt-2 leading-relaxed">点击日记卡片中的星标收藏</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-1">
                  {bookmarkedDiaries.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleDiaryClick(d)}
                      className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-lg
                                 hover:bg-white/[0.04] transition-colors text-left cursor-pointer group"
                    >
                      <span className="text-base shrink-0">{EMOTION_MAP[d.emotion].emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-white/80 text-sm truncate group-hover:text-white">
                          {d.title}
                        </div>
                        <div className="text-white/18 text-xs mt-0.5">{formatDateShort(d.createdAt)}</div>
                      </div>
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0 opacity-50"
                        style={{ backgroundColor: EMOTION_MAP[d.emotion].color }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Emotion stats */}
            <div className="px-6 py-5 border-t border-white/[0.04]">
              <div className="flex gap-4 justify-center">
                {(Object.entries(emotionStats) as [Emotion, number][]).map(([key, count]) => (
                  <div key={key} className="flex flex-col items-center gap-1.5" title={`${EMOTION_MAP[key].label}: ${count}`}>
                    <span className="text-sm opacity-55">{EMOTION_MAP[key].emoji}</span>
                    <span className="text-white/18 text-[10px]">{count}</span>
                  </div>
                ))}
              </div>
              <div className="text-center text-white/10 text-[10px] mt-3">
                {diaries.length} 颗星星
              </div>
            </div>

            {/* Bottom actions */}
            <div className="px-6 py-6 border-t border-white/[0.04] space-y-3">
              <button
                type="button"
                onClick={onExport}
                className="w-full py-3.5 rounded-xl border border-white/[0.06] text-white/45
                           hover:bg-white/[0.04] hover:text-white/70 hover:border-white/15
                           transition-all cursor-pointer text-xs flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                导出备份
              </button>
              <button
                type="button"
                onClick={onImport}
                className="w-full py-3.5 rounded-xl border border-white/[0.06] text-white/45
                           hover:bg-white/[0.04] hover:text-white/70 hover:border-white/15
                           transition-all cursor-pointer text-xs flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                导入恢复
              </button>
              <div className="flex items-center justify-between pt-2">
                <span className="text-white/18 text-[10px] truncate max-w-[150px]">
                  {currentUserPhone}
                </span>
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-white/20 hover:text-red-400/55 transition-colors cursor-pointer text-[10px]"
                >
                  注销
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
