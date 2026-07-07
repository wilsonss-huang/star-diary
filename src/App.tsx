import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import StarField from './components/StarField';
import NewDiaryModal from './components/NewDiaryModal';
import DiaryCard from './components/DiaryCard';
import SearchBar from './components/SearchBar';
import AuthScreen from './components/AuthScreen';
import SettingsPanel from './components/SettingsPanel';
import { useDiaries } from './hooks/useDiaries';
import { useAuth } from './contexts/AuthContext';
import type { DiaryEntry } from './types';

export default function App() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const {
    diaries,
    saveDiary,
    deleteDiary,
    searchQuery,
    searchDiaries,
    highlightedIds,
    totalCount,
    isCloudLoading,
    hasLegacyData,
    migrateLegacy,
    dismissMigration,
    refreshDiaries,
  } = useDiaries();

  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedDiary, setSelectedDiary] = useState<DiaryEntry | null>(null);
  const [newStarId, setNewStarId] = useState<string | null>(null);

  const handleSave = useCallback(
    async (title: string, content: string, emotion: Parameters<typeof saveDiary>[2]) => {
      const entry = await saveDiary(title, content, emotion);
      setNewStarId(entry.id);
      setTimeout(() => setNewStarId(null), 2000);
    },
    [saveDiary],
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return diaries.filter((d) => highlightedIds.includes(d.id));
  }, [diaries, highlightedIds, searchQuery]);

  const handleSearchResultClick = useCallback((diary: DiaryEntry) => {
    setSelectedDiary(diary);
  }, []);

  // 启动加载中
  if (authLoading || isCloudLoading) {
    return (
      <div className="relative w-full h-full bg-[#060618] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-pulse mb-4">🌟</div>
          <p className="text-white/30 text-sm">正在连接星空...</p>
        </div>
      </div>
    );
  }

  // 未登录
  if (!currentUser) {
    return <AuthScreen />;
  }

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

      {/* Settings */}
      <SettingsPanel refreshDiaries={refreshDiaries} />

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

      {/* 旧数据迁移提示 */}
      {hasLegacyData && (
        <motion.div
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="glass-strong rounded-xl px-5 py-4 text-sm text-white/80 flex items-center gap-4">
            <div>
              <p className="font-medium">发现本地旧数据 📦</p>
              <p className="text-white/50 text-xs mt-0.5">是否迁移到云端账号？迁移后所有设备都能看到。</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={dismissMigration}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-white/40
                           hover:text-white/60 hover:border-white/20 transition-all cursor-pointer text-xs"
              >
                不需要
              </button>
              <button
                type="button"
                onClick={migrateLegacy}
                className="px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30
                           text-white hover:bg-indigo-500/30 transition-all cursor-pointer text-xs"
              >
                迁移到云端
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
