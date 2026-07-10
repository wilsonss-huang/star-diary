import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Search, X } from 'lucide-react';
import type { DiaryEntry } from '../types';
import { EMOTION_MAP } from '../types';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onHighlightIds?: (ids: string[]) => void;
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

export default function SearchBar({ onSearch, onHighlightIds, results, onResultClick, totalCount, diaries, onDiaryClick }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
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
  const hasDateFilter = dateFilter.year > 0;
  const showDropdown = isFocused && (query.trim() || hasDateFilter);
  const isVisible = isHovering || isFocused || showDateFilter || query.trim().length > 0 || hasDateFilter;

  const years = Array.from(availableDates.years).sort((a, b) => b - a);
  const months = dateFilter.year ? Array.from(availableDates.months.get(dateFilter.year) || []).sort((a, b) => a - b) : [];
  const key = `${dateFilter.year}-${String(dateFilter.month).padStart(2, '0')}`;
  const days = dateFilter.month ? Array.from(availableDates.days.get(key) || []).sort((a, b) => a - b) : [];

  const clearDateFilter = () => setDateFilter({ year: 0, month: 0, day: 0 });
  const setYear = (y: number) => setDateFilter({ year: y, month: 0, day: 0 });
  const setMonth = (m: number) => setDateFilter(p => ({ ...p, month: m, day: 0 }));
  const setDay = (d: number) => setDateFilter(p => ({ ...p, day: d }));

  useEffect(() => {
    if (!onHighlightIds || query.trim()) return;
    onHighlightIds(hasDateFilter ? dateFilteredDiaries.map((diary) => diary.id) : []);
  }, [dateFilteredDiaries, hasDateFilter, onHighlightIds, query]);

  return (
    <>
      {!isVisible && (
        <button
          type="button"
          onClick={() => setIsFocused(true)}
          className="absolute left-[70px] top-[calc(1rem+env(safe-area-inset-top))] z-20 flex h-11 w-11 items-center justify-center rounded-2xl bg-black/42 text-white/58 shadow-[0_18px_48px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-2xl active:scale-95 md:hidden"
          aria-label="搜索日记"
        >
          <Search size={19} strokeWidth={1.7} />
        </button>
      )}
      <div
        className="absolute left-0 right-0 top-0 z-20 hidden h-12 md:block"
        onMouseEnter={() => setIsHovering(true)}
        aria-hidden="true"
      />

      <motion.div
        className="absolute left-1/2 top-[calc(1.25rem+env(safe-area-inset-top))] z-20 w-full max-w-3xl -translate-x-1/2 px-4 sm:px-6"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        initial={{ y: -92, opacity: 0 }}
        animate={{ y: isVisible ? 0 : -92, opacity: isVisible ? 1 : 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 260 }}
        style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
      >
        <div
          className="overflow-hidden rounded-[30px] border border-white/[0.025] bg-black/68 backdrop-blur-3xl"
          style={{
            boxShadow: '0 22px 80px rgba(0,0,0,0.55), 0 0 34px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex min-h-[62px] items-center gap-3 px-4 py-3 sm:min-h-[66px] sm:gap-4 sm:px-6 sm:py-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.035] text-white/48 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:h-11 sm:w-11">
              <Search size={19} strokeWidth={1.7} />
            </span>
            <input
              type="text"
              value={query}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 250)}
              placeholder={`搜索 ${totalCount} 颗星星...`}
              className="min-w-0 flex-1 bg-transparent text-[15px] leading-6 text-white/90 outline-none
                         placeholder:text-white/28"
              data-search-input
            />
            <span className="hidden shrink-0 rounded-lg bg-white/[0.025] px-2.5 py-1.5 text-[11px] text-white/20 sm:block">
              Ctrl+K
            </span>

            <button
              type="button"
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all ${
                hasDateFilter || showDateFilter
                  ? 'bg-indigo-300/[0.14] text-indigo-100/85 shadow-[0_0_22px_rgba(165,180,252,0.14)]'
                  : 'bg-white/[0.032] text-white/35 hover:bg-white/[0.07] hover:text-white/68'
              }`}
              title="按日期筛选"
            >
              <CalendarDays size={18} strokeWidth={1.6} />
            </button>

            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl
                           bg-white/[0.032] text-white/32 transition-all hover:bg-white/[0.07] hover:text-white/70"
                title="清除搜索"
              >
                <X size={17} strokeWidth={1.7} />
              </button>
            )}
          </div>

          <AnimatePresence>
            {showDateFilter && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/[0.025]"
              >
                <div className="flex flex-wrap items-center gap-2 px-4 py-4 sm:gap-3 sm:px-6">
                  <select
                    value={dateFilter.year || ''}
                    onChange={e => setYear(Number(e.target.value))}
                    className="min-h-11 rounded-2xl border border-transparent bg-white/[0.045] px-4 text-sm text-white/62 outline-none"
                  >
                    <option value="">年份</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>

                  {dateFilter.year > 0 && (
                    <select
                      value={dateFilter.month || ''}
                      onChange={e => setMonth(Number(e.target.value))}
                      className="min-h-11 rounded-2xl border border-transparent bg-white/[0.045] px-4 text-sm text-white/62 outline-none"
                    >
                      <option value="">月份</option>
                      {months.map(m => <option key={m} value={m}>{m}月</option>)}
                    </select>
                  )}

                  {dateFilter.month > 0 && (
                    <select
                      value={dateFilter.day || ''}
                      onChange={e => setDay(Number(e.target.value))}
                      className="min-h-11 rounded-2xl border border-transparent bg-white/[0.045] px-4 text-sm text-white/62 outline-none"
                    >
                      <option value="">日期</option>
                      {days.map(d => <option key={d} value={d}>{d}日</option>)}
                    </select>
                  )}

                  {hasDateFilter && (
                    <button
                      type="button"
                      onClick={clearDateFilter}
                      className="ml-auto min-h-11 rounded-2xl px-4 text-xs text-white/30 transition-colors hover:text-white/62"
                    >
                      清除筛选
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showDropdown && displayResults.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/[0.025]"
              >
                <div className="max-h-72 overflow-y-auto py-2">
                  {displayResults.map((diary, i) => (
                    <motion.button
                      key={diary.id}
                      type="button"
                      onClick={() => {
                        (query.trim() ? onResultClick : onDiaryClick)(diary);
                        setIsFocused(false);
                        setIsHovering(false);
                      }}
                      className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors
                                 hover:bg-white/[0.045]"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/25 shadow-[0_0_14px_currentColor]"
                        style={{ color: EMOTION_MAP[diary.emotion].color, backgroundColor: EMOTION_MAP[diary.emotion].color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-white/86">{diary.title}</div>
                        <div className="mt-1 truncate text-xs text-white/24">
                          {diary.date} · {diary.content.slice(0, 36)}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
                <div className="border-t border-white/[0.025] px-6 py-3 text-center text-xs text-white/16">
                  找到 {displayResults.length} 颗星星
                </div>
              </motion.div>
            )}

            {showDropdown && displayResults.length === 0 && (query.trim() !== '' || hasDateFilter) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/[0.025]"
              >
                <div className="px-6 py-6 text-center text-sm text-white/24">
                  没有找到匹配的星星
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
