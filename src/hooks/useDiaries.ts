import { useState, useCallback, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import type { DiaryEntry, Emotion } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { fetchDiaries, saveDiaryToCloud, deleteDiaryFromCloud, updateDiaryBookmark, updateDiaryInCloud } from '../lib/cloudbase';

const STORAGE_KEY = 'star-diary-entries';

function randomStarPosition(): [number, number, number] {
  const radius = 8 + Math.random() * 8;
  const phi = Math.random() * Math.PI * 0.55;
  const theta = Math.random() * Math.PI * 2;
  return [
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi) + 1.5,
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

function getLegacyDiaries(): DiaryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useDiaries() {
  const { currentUser } = useAuth();
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [isCloudLoading, setIsCloudLoading] = useState(true);
  const [hasLegacyData, setHasLegacyData] = useState(false);
  const [legacyMigrated, setLegacyMigrated] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshDiaries = useCallback(() => setRefreshTrigger((n) => n + 1), []);

  useEffect(() => {
    if (!currentUser) {
      setDiaries([]);
      setIsCloudLoading(false);
      return;
    }

    let cancelled = false;
    setIsCloudLoading(true);

    (async () => {
      try {
        const cloudDiaries = await fetchDiaries();
        if (cancelled) return;

        const legacy = getLegacyDiaries();
        if (legacy.length > 0 && cloudDiaries.length === 0 && !legacyMigrated) {
          setHasLegacyData(true);
        }

        setDiaries(cloudDiaries);
      } catch (err) {
        console.error('加载日记失败:', err);
        if (err instanceof Error) {
          console.error('  错误信息:', err.message);
          console.error('  错误堆栈:', err.stack);
        }
        // Token 可能过期，清缓存让用户重新登录。数据在云端完好。
        try { localStorage.removeItem('star-diary-user'); } catch { /* ignore */ }
        setDiaries([]);
        // CloudBase 错误对象可能不是 Error 实例，尝试打印完整结构
        try { console.error('  完整错误:', JSON.stringify(err, null, 2)); } catch { /* ignore */ }
      } finally {
        if (!cancelled) setIsCloudLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [currentUser, legacyMigrated, refreshTrigger]);

  const migrateLegacy = useCallback(async () => {
    const legacy = getLegacyDiaries();
    let failed = 0;
    for (let i = 0; i < legacy.length; i++) {
      try {
        await saveDiaryToCloud({
          title: legacy[i].title,
          content: legacy[i].content,
          emotion: legacy[i].emotion,
          starPosition: legacy[i].starPosition,
          photoFileIds: legacy[i].photoFileIds || [],
          isBookmarked: legacy[i].isBookmarked || false,
          date: legacy[i].date || legacy[i].createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        });
      } catch (err) {
        console.error(`迁移第 ${i + 1} 条失败:`, err);
        failed++;
      }
    }
    // 只有全部成功才清除旧数据
    if (failed === 0) {
      localStorage.removeItem(STORAGE_KEY);
      setHasLegacyData(false);
      setLegacyMigrated(true);
    } else {
      console.warn(`${failed}/${legacy.length} 条迁移失败，旧数据保留`);
    }
  }, []);

  const dismissMigration = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHasLegacyData(false);
  }, []);

  const saveDiary = useCallback(
    async (title: string, content: string, emotion: Emotion, photoFileIds: string[] = []) => {
      if (!currentUser) throw new Error('未登录');

      const starPosition = randomStarPosition();
      const date = new Date().toISOString().slice(0, 10);
      const id = await saveDiaryToCloud({ title, content, emotion, starPosition, photoFileIds, isBookmarked: false, date });

      const entry: DiaryEntry = { id, title, content, emotion, createdAt: new Date().toISOString(), starPosition, photoFileIds, photoUrls: [], isBookmarked: false, date };
      setDiaries((prev) => [...prev, entry]);
      return entry;
    },
    [currentUser],
  );

  const deleteDiary = useCallback(async (diaryId: string) => {
    const target = diaries.find(d => d.id === diaryId);
    // 乐观更新：先移除 UI
    setDiaries((prev) => prev.filter((d) => d.id !== diaryId));
    try {
      await deleteDiaryFromCloud(diaryId, target?.photoFileIds);
    } catch (err) {
      console.error('删除失败:', err);
      // 云端删除失败，重新拉取恢复正确状态
      try {
        const cloudDiaries = await fetchDiaries();
        setDiaries(cloudDiaries);
      } catch (refetchErr) {
        console.error('恢复日记列表失败:', refetchErr);
      }
    }
  }, [diaries]);

  const updateDiary = useCallback(async (diaryId: string, updates: Pick<DiaryEntry, 'title' | 'content' | 'emotion'>) => {
    const previous = diaries.find(d => d.id === diaryId);
    setDiaries(prev => prev.map(d => d.id === diaryId ? { ...d, ...updates } : d));
    try {
      await updateDiaryInCloud(diaryId, updates);
    } catch (err) {
      console.error('鏇存柊鏃ヨ澶辫触:', err);
      if (previous) setDiaries(prev => prev.map(d => d.id === diaryId ? previous : d));
      throw err;
    }
  }, [diaries]);

  // Fuse 搜索实例随 diaries 自动重建
  const fuse = useMemo(() => {
    return new Fuse(diaries, {
      keys: ['title', 'content'],
      threshold: 0.4,
      includeScore: true,
    });
  }, [diaries]);

  const searchDiaries = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) { setHighlightedIds([]); return; }
      const results = fuse.search(query.trim());
      setHighlightedIds(results.map((r) => r.item.id));
    },
    [fuse],
  );

  const highlightDiaries = useCallback((ids: string[]) => {
    setHighlightedIds(ids);
  }, []);

  const toggleBookmark = useCallback(async (diaryId: string) => {
    const diary = diaries.find(d => d.id === diaryId);
    if (!diary) return;
    const newVal = !diary.isBookmarked;
    // 乐观更新
    setDiaries(prev => prev.map(d => d.id === diaryId ? { ...d, isBookmarked: newVal } : d));
    try {
      await updateDiaryBookmark(diaryId, newVal);
    } catch (err) {
      console.error('更新收藏失败:', err);
      setDiaries(prev => prev.map(d => d.id === diaryId ? { ...d, isBookmarked: !newVal } : d));
    }
  }, [diaries]);

  const bookmarkedDiaries = useMemo(() => diaries.filter(d => d.isBookmarked), [diaries]);

  const emotionStats = useMemo(() => {
    const stats: Record<Emotion, number> = { happy: 0, sad: 0, excited: 0, calm: 0, love: 0, thoughtful: 0 };
    diaries.forEach((d) => { stats[d.emotion]++; });
    return stats;
  }, [diaries]);

  return {
    diaries,
    saveDiary,
    updateDiary,
    deleteDiary,
    searchQuery,
    searchDiaries,
    highlightDiaries,
    highlightedIds,
    emotionStats,
    totalCount: diaries.length,
    isCloudLoading,
    hasLegacyData,
    migrateLegacy,
    dismissMigration,
    refreshDiaries,
    toggleBookmark,
    bookmarkedDiaries,
  };
}
