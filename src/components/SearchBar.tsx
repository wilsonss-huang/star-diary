import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DiaryEntry } from '../types';
import { EMOTION_MAP } from '../types';

interface SearchBarProps {
  onSearch: (query: string) => void;
  results: DiaryEntry[];
  onResultClick: (diary: DiaryEntry) => void;
  totalCount: number;
}

export default function SearchBar({ onSearch, results, onResultClick, totalCount }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      onSearch(val);
    },
    [onSearch],
  );

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4">
      <motion.div
        className="glass rounded-2xl overflow-hidden"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {/* Search input */}
        <div className="flex items-center px-4 py-3 gap-2">
          <svg className="w-4 h-4 text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={`搜索 ${totalCount} 颗星星...`}
            className="flex-1 bg-transparent text-white text-sm placeholder-white/25 outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="text-white/30 hover:text-white/60 transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Results dropdown */}
        <AnimatePresence>
          {isFocused && query.trim() && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-white/5 overflow-hidden"
            >
              {results.length === 0 ? (
                <div className="px-4 py-3 text-white/30 text-sm text-center">
                  没有找到匹配的星星 🌌
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto">
                  {results.map((diary) => (
                    <button
                      key={diary.id}
                      type="button"
                      onClick={() => onResultClick(diary)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5
                                 transition-colors text-left cursor-pointer"
                    >
                      <span className="text-lg">{EMOTION_MAP[diary.emotion].emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm truncate">{diary.title}</div>
                        <div className="text-white/30 text-xs">
                          {new Date(diary.createdAt).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: EMOTION_MAP[diary.emotion].color }}
                      />
                    </button>
                  ))}
                </div>
              )}
              {results.length > 0 && (
                <div className="px-4 py-2 text-white/20 text-xs text-center border-t border-white/5">
                  找到 {results.length} 颗星星 · 点击跳转
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
