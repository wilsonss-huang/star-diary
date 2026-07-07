import { useState, useCallback, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import type { DiaryEntry, Emotion } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { fetchDiaries, saveDiaryToCloud, deleteDiaryFromCloud } from '../lib/cloudbase';

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
    async (title: string, content: string, emotion: Emotion) => {
      if (!currentUser) throw new Error('未登录');

      const starPosition = randomStarPosition();
      const id = await saveDiaryToCloud({ title, content, emotion, starPosition });

      const entry: DiaryEntry = { id, title, content, emotion, createdAt: new Date().toISOString(), starPosition };
      setDiaries((prev) => [...prev, entry]);
      return entry;
    },
    [currentUser],
  );

  const deleteDiary = useCallback(async (diaryId: string) => {
    // 乐观更新：先移除 UI
    setDiaries((prev) => prev.filter((d) => d.id !== diaryId));
    try {
      await deleteDiaryFromCloud(diaryId);
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
  }, []);

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

  const emotionStats = useMemo(() => {
    const stats: Record<Emotion, number> = { happy: 0, sad: 0, excited: 0, calm: 0, love: 0, thoughtful: 0 };
    diaries.forEach((d) => { stats[d.emotion]++; });
    return stats;
  }, [diaries]);

  return {
    diaries,
    saveDiary,
    deleteDiary,
    searchQuery,
    searchDiaries,
    highlightedIds,
    emotionStats,
    totalCount: diaries.length,
    isCloudLoading,
    hasLegacyData,
    migrateLegacy,
    dismissMigration,
    refreshDiaries,
  };
}
