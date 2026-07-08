import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import SplashScreen from './components/SplashScreen';
import StarField from './components/StarField';
import NewDiaryModal from './components/NewDiaryModal';
import DiaryCard from './components/DiaryCard';
import SearchBar from './components/SearchBar';
import AuthScreen from './components/AuthScreen';
import SettingsPanel from './components/SettingsPanel';
import Sidebar from './components/Sidebar';
import { useDiaries } from './hooks/useDiaries';
import { useAuth } from './contexts/AuthContext';
import { fetchDiaries, saveDiaryToCloud } from './lib/cloudbase';
import type { DiaryEntry, Emotion } from './types';
import { SparkleIcon, GalaxyIcon } from './components/Icons';

function useSplash() {
  const [shown, setShown] = useState(() => {
    const key = 'star-diary-splash-shown';
    const val = sessionStorage.getItem(key);
    if (val === '1') return true;
    sessionStorage.setItem(key, '1');
    return false;
  });
  return { shown: shown, dismiss: () => setShown(true) };
}

export default function App() {
  const splash = useSplash();
  const { currentUser, isLoading: authLoading, logout } = useAuth();
  const {
    diaries,
    saveDiary,
    deleteDiary,
    searchQuery,
    searchDiaries,
    highlightedIds,
    totalCount,
    emotionStats,
    isCloudLoading,
    hasLegacyData,
    migrateLegacy,
    dismissMigration,
    refreshDiaries,
    toggleBookmark,
    bookmarkedDiaries,
  } = useDiaries();

  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedDiary, setSelectedDiary] = useState<DiaryEntry | null>(null);
  const [newStarId, setNewStarId] = useState<string | null>(null);
  const [starStyle, setStarStyle] = useState<'realistic' | 'dark'>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSave = useCallback(
    async (title: string, content: string, emotion: Emotion, photoFileIds?: string[]) => {
      const entry = await saveDiary(title, content, emotion, photoFileIds);
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

  // Keyboard shortcuts
  useMemo(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('[data-search-input]')?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Export/Import handlers
  const handleExport = useCallback(async () => {
    try {
      const allDiaries = await fetchDiaries();
      const blob = new Blob([JSON.stringify(allDiaries, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `star-diary-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    } catch { /* ignore */ }
  }, []);

  const handleImport = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text()) as DiaryEntry[];
        if (!Array.isArray(data)) return;
        for (const entry of data) {
          await saveDiaryToCloud({
            title: entry.title, content: entry.content,
            emotion: entry.emotion, starPosition: entry.starPosition,
            photoFileIds: entry.photoFileIds || [], isBookmarked: entry.isBookmarked || false,
            date: entry.date || entry.createdAt.slice(0, 10),
          });
        }
        refreshDiaries();
      } catch { /* ignore */ }
    };
    input.click();
  }, [refreshDiaries]);

  // Splash screen
  if (!splash.shown) {
    return <SplashScreen onEnter={splash.dismiss} />;
  }

  // Loading
  if (authLoading || isCloudLoading) {
    return (
      <div className="relative w-full h-full bg-[#060618] flex items-center justify-center">
        <div className="text-center">
          <div className="mb-5 text-white/25">
            <GalaxyIcon size={48} />
          </div>
          <div className="text-white/15 text-sm">
            <span className="inline-block animate-pulse">正在连接星空</span>
            <span className="inline-block animate-pulse" style={{ animationDelay: '0.3s' }}>.</span>
            <span className="inline-block animate-pulse" style={{ animationDelay: '0.6s' }}>.</span>
            <span className="inline-block animate-pulse" style={{ animationDelay: '0.9s' }}>.</span>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!currentUser) {
    console.log('🟡 [App] 未登录，显示 AuthScreen');
    return <AuthScreen />;
  }

  console.log('🟢 [App] 已登录，显示主界面星空。当前用户:', currentUser.phone);

  return (
    <div className="relative w-full h-full bg-[#060618] overflow-hidden select-none">
      <StarField
        diaries={diaries}
        highlightedIds={highlightedIds}
        onStarClick={setSelectedDiary}
        newStarId={newStarId}
        starStyle={starStyle}
      />

      <SearchBar
        onSearch={searchDiaries}
        results={searchResults}
        onResultClick={handleSearchResultClick}
        totalCount={totalCount}
        diaries={diaries}
        onDiaryClick={setSelectedDiary}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        diaries={diaries}
        bookmarkedDiaries={bookmarkedDiaries}
        emotionStats={emotionStats}
        starStyle={starStyle}
        onStarStyleChange={setStarStyle}
        onDiaryClick={setSelectedDiary}
        onNewDiary={() => setShowNewModal(true)}
        onExport={handleExport}
        onImport={handleImport}
        onLogout={logout}
        currentUserPhone={currentUser?.phone || ''}
      />

      <SettingsPanel refreshDiaries={refreshDiaries} />

      {/* Bottom controls */}
      {!sidebarOpen && (
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="glass px-8 py-4 rounded-2xl text-white text-base font-medium
                       flex items-center gap-3 cursor-pointer
                       hover:bg-white/10 hover:border-white/18
                       active:scale-[0.98] transition-all duration-200
                       shadow-lg shadow-black/20"
          >
            <span className="text-white/55">
              <SparkleIcon size={18} />
            </span>
            <span>写日记 · 点亮星星</span>
          </button>
        </motion.div>
      )}

      {totalCount > 0 && (
        <motion.div
          className="absolute bottom-8 right-8 z-10 text-white/15 text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {totalCount} 颗星星在夜空中
        </motion.div>
      )}

      {totalCount === 0 && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="text-center">
            <div className="mb-5 text-white/10">
              <GalaxyIcon size={64} />
            </div>
            <p className="text-white/15 text-lg">写下你的第一篇日记</p>
            <p className="text-white/08 text-sm mt-2">每一段回忆都会化作夜空中的一颗星</p>
          </div>
        </motion.div>
      )}

      <NewDiaryModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSave={handleSave}
      />

      <DiaryCard
        diary={selectedDiary}
        onClose={() => setSelectedDiary(null)}
        onDelete={deleteDiary}
        onToggleBookmark={toggleBookmark}
      />

      {hasLegacyData && (
        <motion.div
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="glass-strong rounded-2xl px-6 py-5 text-sm text-white/80 flex items-center gap-5">
            <div>
              <p className="font-medium">发现本地旧数据</p>
              <p className="text-white/40 text-xs mt-1">是否迁移到云端账号？迁移后所有设备都能看到。</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={dismissMigration}
                className="px-4 py-2 rounded-xl border border-white/[0.08] text-white/35
                           hover:text-white/55 hover:border-white/18 transition-all cursor-pointer text-xs"
              >
                不需要
              </button>
              <button
                type="button"
                onClick={migrateLegacy}
                className="px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/25
                           text-white hover:bg-indigo-500/25 transition-all cursor-pointer text-xs"
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
