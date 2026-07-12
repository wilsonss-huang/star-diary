import { useState, useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import SplashScreen from './components/SplashScreen';
import StarField from './components/StarField';
import NewDiaryModal from './components/NewDiaryModal';
import DiaryCard from './components/DiaryCard';
import SearchBar from './components/SearchBar';
import AuthScreen from './components/AuthScreen';
import GalaxyEntryTransition from './components/GalaxyEntryTransition';
import DiaryListView from './components/DiaryListView';
import ProfileView from './components/ProfileView';
import WebNavigation, { type AppView } from './components/WebNavigation';
import { useDiaries } from './hooks/useDiaries';
import { useAuth } from './contexts/AuthContext';
import type { DiaryEntry, Emotion } from './types';
import { GalaxyIcon, SparkleIcon } from './components/Icons';

function useSplash() {
  const [shown, setShown] = useState(() => {
    const key = 'star-diary-splash-shown';
    const val = sessionStorage.getItem(key);
    if (val === '1') return true;
    sessionStorage.setItem(key, '1');
    return false;
  });
  return { shown, dismiss: () => setShown(true) };
}

export default function App() {
  const splash = useSplash();
  const { currentUser, isLoading: authLoading, logout } = useAuth();
  const {
    diaries,
    saveDiary,
    updateDiary,
    deleteDiary,
    searchQuery,
    searchDiaries,
    highlightDiaries,
    highlightedIds,
    totalCount,
    isCloudLoading,
    hasLegacyData,
    migrateLegacy,
    dismissMigration,
    toggleBookmark,
  } = useDiaries();

  const [activeView, setActiveView] = useState<AppView>('atlas');
  const [diaryListFilter, setDiaryListFilter] = useState<Emotion | 'bookmarked' | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedDiary, setSelectedDiary] = useState<DiaryEntry | null>(null);
  const [newStarId, setNewStarId] = useState<string | null>(null);
  const [showGalaxyEntry, setShowGalaxyEntry] = useState(true);
  const activeDiary = useMemo(
    () => selectedDiary ? (diaries.find((diary) => diary.id === selectedDiary.id) || selectedDiary) : null,
    [diaries, selectedDiary],
  );

  const handleSave = useCallback(async (title: string, content: string, emotion: Emotion, photoFileIds?: string[], location?: DiaryEntry['location']) => {
    const entry = await saveDiary(title, content, emotion, photoFileIds, location);
    setNewStarId(entry.id);
    setActiveView('atlas');
    setTimeout(() => setNewStarId(null), 2000);
  }, [saveDiary]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return diaries.filter((diary) => highlightedIds.includes(diary.id));
  }, [diaries, highlightedIds, searchQuery]);

  const openDiary = useCallback((diary: DiaryEntry) => setSelectedDiary(diary), []);
  const handleNavigate = useCallback((view: AppView) => {
    setActiveView(view);
    setDiaryListFilter(null);
    if (view !== 'atlas') searchDiaries('');
  }, [searchDiaries]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setActiveView('atlas');
        window.setTimeout(() => document.querySelector<HTMLInputElement>('[data-search-input]')?.focus(), 0);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!currentUser || authLoading || isCloudLoading) {
      setShowGalaxyEntry(true);
      return;
    }
    const timer = window.setTimeout(() => setShowGalaxyEntry(false), 5400);
    return () => window.clearTimeout(timer);
  }, [authLoading, currentUser, isCloudLoading]);

  const handleSwitchAccount = useCallback(async () => {
    sessionStorage.setItem('star-diary-skip-welcome', '1');
    await logout();
  }, [logout]);

  if (!splash.shown) return <SplashScreen onEnter={splash.dismiss} />;

  if (authLoading) {
    return (
      <div className="relative flex h-full w-full items-center justify-center bg-[#0a0e17]">
        <div className="text-center"><GalaxyIcon size={48} /><p className="mt-5 text-sm text-white/35">正在连接星空…</p></div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!currentUser ? (
        <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
          <AuthScreen />
        </motion.div>
      ) : (
        <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.32, delay: 0.06 }} className="cosmic-app-shell">
          <div className={activeView === 'atlas' ? 'celestial-starfield is-visible' : 'celestial-starfield'}>
            <StarField
              diaries={diaries}
              highlightedIds={highlightedIds}
              focusedDiaryId={activeDiary?.id || null}
              onStarClick={openDiary}
              newStarId={newStarId}
            />
          </div>
          <div className="celestial-page-background" />

          <WebNavigation activeView={activeView} onNavigate={handleNavigate} onWrite={() => setShowNewModal(true)} />

          {activeView === 'atlas' && (
            <>
              <section className="celestial-atlas-copy">
                <p className="celestial-kicker">PRIVATE MEMORY ATLAS</p>
                <h1>记忆星图</h1>
                <p>每一颗星，都是一段被珍藏的回忆。</p>
              </section>
              <SearchBar
                onSearch={searchDiaries}
                onHighlightIds={highlightDiaries}
                results={searchResults}
                onResultClick={openDiary}
                totalCount={totalCount}
                diaries={diaries}
                onDiaryClick={openDiary}
              />
              {showGalaxyEntry && <GalaxyEntryTransition hasStars={totalCount > 0} />}
              <div className="celestial-atlas-action">
                <button type="button" onClick={() => setShowNewModal(true)}><SparkleIcon size={18} /><span>写日记 · 点亮星星</span></button>
              </div>
              {totalCount === 0 && (
                <div className="celestial-atlas-empty"><GalaxyIcon size={48} /><p>写下你的第一篇日记</p><span>每一段回忆都会化作夜空中的一颗星</span></div>
              )}
            </>
          )}

          {activeView === 'diaries' && <DiaryListView diaries={diaries} activeFilter={diaryListFilter} onFilterChange={setDiaryListFilter} onDiaryClick={openDiary} onWrite={() => setShowNewModal(true)} />}
          {activeView === 'profile' && (
            <ProfileView
              userId={currentUser.uid}
              phone={currentUser.phone}
              diaries={diaries}
              onLogout={logout}
              onSwitchAccount={handleSwitchAccount}
              onNavigateToAtlas={() => handleNavigate('atlas')}
              onOpenBookmarked={() => { setDiaryListFilter('bookmarked'); setActiveView('diaries'); searchDiaries(''); }}
            />
          )}

          <NewDiaryModal isOpen={showNewModal} onClose={() => setShowNewModal(false)} onSave={handleSave} />
          <DiaryCard diary={activeDiary} onClose={() => setSelectedDiary(null)} onDelete={deleteDiary} onToggleBookmark={toggleBookmark} onUpdate={updateDiary} />

          {hasLegacyData && (
            <div className="celestial-migration-note">
              <div><strong>发现本地旧数据</strong><p>是否迁移到云端账户？</p></div>
              <button type="button" onClick={dismissMigration}>暂不迁移</button>
              <button type="button" onClick={migrateLegacy}>迁移到云端</button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
