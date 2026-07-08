import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DiaryEntry } from '../types';
import { EMOTION_MAP } from '../types';
import { CalendarIcon } from './Icons';

interface SearchBarProps {
  onSearch: (query: string) => void;
  results: DiaryEntry[];
  onResultClick: (diary: DiaryEntry) => void;
  totalCount: number;
  diaries: DiaryEntry[];
  onDiaryClick: (diary: DiaryEntry) => void;
}

function getAvailableDates(diaries: DiaryEntry[]) {
  const years = new Set<number>();
  const months = new Map<number, Set<number>>();
  const days = new Map<string, Set<number>>();

  diaries.forEach(d => {
    const [y, m, day] = d.date.split('-').map(Number);
    years.add(y);
    if (!months.has(y)) months.set(y, new Set());
    months.get(y)!.add(m);
    const key = `${y}-${String(m).padStart(2, '0')}`;
    if (!days.has(key)) days.set(key, new Set());
    days.get(key)!.add(day);
  });

  return { years, months, days };
}

export default function SearchBar({ onSearch, results, onResultClick, totalCount, diaries, onDiaryClick }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState({ year: 0, month: 0, day: 0 });

  const availableDates = useMemo(() => getAvailableDates(diaries), [diaries]);

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

  const dateFilteredDiaries = useMemo(() => {
    const { year, month, day } = dateFilter;
    if (!year && !month && !day) return [];
    return diaries.filter(d => {
      const [dy, dm, dd] = d.date.split('-').map(Number);
      if (year && dy !== year) return false;
      if (month && dm !== month) return false;
      if (day && dd !== day) return false;
      return true;
    });
  }, [diaries, dateFilter]);

  const displayResults = query.trim() ? results : dateFilteredDiaries;
  const showDropdown = isFocused && (query.trim() || dateFilter.year > 0);

  const years = Array.from(availableDates.years).sort((a, b) => b - a);
  const months = dateFilter.year ? Array.from(availableDates.months.get(dateFilter.year) || []).sort((a, b) => a - b) : [];
  const key = `${dateFilter.year}-${String(dateFilter.month).padStart(2, '0')}`;
  const days = dateFilter.month ? Array.from(availableDates.days.get(key) || []).sort((a, b) => a - b) : [];

  const clearDateFilter = () => setDateFilter({ year: 0, month: 0, day: 0 });
  const setYear = (y: number) => setDateFilter({ year: y, month: 0, day: 0 });
  const setMonth = (m: number) => setDateFilter(p => ({ ...p, month: m, day: 0 }));
  const setDay = (d: number) => setDateFilter(p => ({ ...p, day: d }));

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-full max-w-xl px-4">
      <motion.div
        className="glass rounded-3xl overflow-hidden"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {/* Search row */}
        <div className="flex items-center px-6 py-4 gap-3">
          <svg className="w-4 h-4 text-white/20 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 250)}
            placeholder={`搜索 ${totalCount} 颗星星...`}
            className="flex-1 bg-transparent text-white text-sm placeholder-white/20 outline-none"
            data-search-input
          />
          <span className="text-white/10 text-[10px] border border-white/8 rounded-md px-1.5 py-0.5 shrink-0 hidden sm:block">
            Ctrl+K
          </span>

          <button
            type="button"
            onClick={() => setShowDateFilter(!showDateFilter)}
            className={`transition-all cursor-pointer shrink-0 ${dateFilter.year > 0 ? 'text-indigo-400/80' : 'text-white/20 hover:text-white/40'}`}
            title="按日期筛选"
          >
            <CalendarIcon size={16} />
          </button>

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="text-white/20 hover:text-white/50 transition-colors cursor-pointer shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Date filter panel */}
        <AnimatePresence>
          {showDateFilter && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/[0.04] overflow-hidden"
            >
              <div className="px-6 py-4 flex gap-3 items-center">
                <select
                  value={dateFilter.year || ''}
                  onChange={e => setYear(Number(e.target.value))}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-white/50 text-xs outline-none cursor-pointer"
                >
                  <option value="">年份</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                {dateFilter.year > 0 && (
                  <select
                    value={dateFilter.month || ''}
                    onChange={e => setMonth(Number(e.target.value))}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-white/50 text-xs outline-none cursor-pointer"
                  >
                    <option value="">月份</option>
                    {months.map(m => <option key={m} value={m}>{m}月</option>)}
                  </select>
                )}

                {dateFilter.month > 0 && (
                  <select
                    value={dateFilter.day || ''}
                    onChange={e => setDay(Number(e.target.value))}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-white/50 text-xs outline-none cursor-pointer"
                  >
                    <option value="">日期</option>
                    {days.map(d => <option key={d} value={d}>{d}日</option>)}
                  </select>
                )}

                {dateFilter.year > 0 && (
                  <button
                    type="button"
                    onClick={clearDateFilter}
                    className="text-white/20 hover:text-white/50 text-xs cursor-pointer ml-auto transition-colors"
                  >
                    清除筛选
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results dropdown */}
        <AnimatePresence>
          {showDropdown && displayResults.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/[0.04] overflow-hidden"
            >
              <div className="max-h-60 overflow-y-auto">
                {displayResults.map((diary, i) => (
                  <motion.button
                    key={diary.id}
                    type="button"
                    onClick={() => {
                      (query.trim() ? onResultClick : onDiaryClick)(diary);
                      setIsFocused(false);
                    }}
                    className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.04]
                               transition-colors text-left cursor-pointer"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <span className="text-xl shrink-0">{EMOTION_MAP[diary.emotion].emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-white/85 text-sm truncate">{diary.title}</div>
                      <div className="text-white/20 text-xs mt-0.5">
                        {diary.date} · {diary.content.slice(0, 30)}
                      </div>
                    </div>
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0 opacity-40"
                      style={{ backgroundColor: EMOTION_MAP[diary.emotion].color }}
                    />
                  </motion.button>
                ))}
              </div>
              <div className="px-6 py-3 text-white/12 text-xs text-center border-t border-white/[0.04]">
                找到 {displayResults.length} 颗星星
              </div>
            </motion.div>
          )}

          {showDropdown && displayResults.length === 0 && (query.trim() !== '' || dateFilter.year > 0) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/[0.04] overflow-hidden"
            >
              <div className="px-6 py-5 text-white/20 text-sm text-center">
                没有找到匹配的星星
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
