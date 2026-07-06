import { useState, useCallback, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import type { DiaryEntry, Emotion } from '../types';

const STORAGE_KEY = 'star-diary-entries';

function loadDiaries(): DiaryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDiaries(diaries: DiaryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(diaries));
}

function randomStarPosition(): [number, number, number] {
  const radius = 8 + Math.random() * 8; // 8-16 units away
  const phi = Math.random() * Math.PI * 0.55; // Upper hemisphere (0 to ~100°)
  const theta = Math.random() * Math.PI * 2;
  return [
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi) + 1.5, // Shift up so stars are above
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

let fuseInstance: Fuse<DiaryEntry> | null = null;

function getFuse(diaries: DiaryEntry[]): Fuse<DiaryEntry> {
  if (!fuseInstance) {
    fuseInstance = new Fuse(diaries, {
      keys: ['title', 'content'],
      threshold: 0.4,
      includeScore: true,
    });
  } else {
    fuseInstance.setCollection(diaries);
  }
  return fuseInstance;
}

export function useDiaries() {
  const [diaries, setDiaries] = useState<DiaryEntry[]>(loadDiaries);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);

  useEffect(() => {
    saveDiaries(diaries);
    fuseInstance = null;
  }, [diaries]);

  const saveDiary = useCallback((title: string, content: string, emotion: Emotion) => {
    const entry: DiaryEntry = {
      id: crypto.randomUUID(),
      title,
      content,
      emotion,
      createdAt: new Date().toISOString(),
      starPosition: randomStarPosition(),
    };
    setDiaries(prev => [...prev, entry]);
    return entry;
  }, []);

  const deleteDiary = useCallback((id: string) => {
    setDiaries(prev => prev.filter(d => d.id !== id));
  }, []);

  const updateDiary = useCallback((id: string, updates: Partial<Pick<DiaryEntry, 'title' | 'content' | 'emotion'>>) => {
    setDiaries(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  }, []);

  const searchDiaries = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setHighlightedIds([]);
      return;
    }
    const fuse = getFuse(diaries);
    const results = fuse.search(query.trim());
    setHighlightedIds(results.map(r => r.item.id));
  }, [diaries]);

  const emotionStats = useMemo(() => {
    const stats: Record<Emotion, number> = { happy: 0, sad: 0, excited: 0, calm: 0, love: 0, thoughtful: 0 };
    diaries.forEach(d => { stats[d.emotion]++; });
    return stats;
  }, [diaries]);

  return {
    diaries,
    saveDiary,
    deleteDiary,
    updateDiary,
    searchQuery,
    searchDiaries,
    highlightedIds,
    emotionStats,
    totalCount: diaries.length,
  };
}
