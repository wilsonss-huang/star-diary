import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import StarField from './components/StarField';
import NewDiaryModal from './components/NewDiaryModal';
import DiaryCard from './components/DiaryCard';
import SearchBar from './components/SearchBar';
import { useDiaries } from './hooks/useDiaries';
import type { DiaryEntry } from './types';

export default function App() {
  const {
    diaries,
    saveDiary,
    deleteDiary,
    searchQuery,
    searchDiaries,
    highlightedIds,
    totalCount,
  } = useDiaries();

  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedDiary, setSelectedDiary] = useState<DiaryEntry | null>(null);
  const [newStarId, setNewStarId] = useState<string | null>(null);

  const handleSave = useCallback(
    (title: string, content: string, emotion: Parameters<typeof saveDiary>[2]) => {
      const entry = saveDiary(title, content, emotion);
      setNewStarId(entry.id);
      setTimeout(() => setNewStarId(null), 2000);
    },
    [saveDiary],
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return diaries.filter(d => highlightedIds.includes(d.id));
  }, [diaries, highlightedIds, searchQuery]);

  const handleSearchResultClick = useCallback(
    (diary: DiaryEntry) => {
      setSelectedDiary(diary);
    },
    [],
  );

  return (
    <div className="relative w-full h-full bg-[#060618] overflow-hidden select-none">
      {/* 3D Star Field */}
      <StarField
        diaries={diaries}
        highlightedIds={highlightedIds}
        onStarClick={setSelectedDiary}
        newStarId={newStarId}
      />

      {/* Search Bar */}
      <SearchBar
        onSearch={searchDiaries}
        results={searchResults}
        onResultClick={handleSearchResultClick}
        totalCount={totalCount}
      />

      {/* Bottom controls */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="glass px-6 py-3 rounded-2xl text-white text-sm font-medium
                     flex items-center gap-2 cursor-pointer
                     hover:bg-white/10 hover:border-white/20
                     active:scale-95 transition-all duration-200
                     shadow-lg shadow-black/20"
        >
          <span className="text-lg">✨</span>
          <span>写日记 · 点亮星星</span>
        </button>
      </motion.div>

      {/* Star count hint */}
      {totalCount > 0 && (
        <motion.div
          className="absolute bottom-8 right-8 z-10 text-white/20 text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {totalCount} 颗星星在夜空中
        </motion.div>
      )}

      {/* Empty state hint */}
      {totalCount === 0 && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="text-center">
            <div className="text-6xl mb-4">🌌</div>
            <p className="text-white/20 text-lg">写下你的第一篇日记</p>
            <p className="text-white/10 text-sm mt-1">每一段回忆都会化作夜空中的一颗星</p>
          </div>
        </motion.div>
      )}

      {/* New Diary Modal */}
      <NewDiaryModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSave={handleSave}
      />

      {/* Diary Card */}
      <DiaryCard
        diary={selectedDiary}
        onClose={() => setSelectedDiary(null)}
        onDelete={deleteDiary}
      />
    </div>
  );
}
