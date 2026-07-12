import type { CSSProperties } from 'react';
import { CalendarDays, ChevronRight, Image as ImageIcon, Sparkles, Star } from 'lucide-react';
import type { DiaryEntry, Emotion } from '../types';
import { EMOTION_MAP } from '../types';

interface DiaryListViewProps {
  diaries: DiaryEntry[];
  onDiaryClick: (diary: DiaryEntry) => void;
  onWrite: () => void;
  activeFilter: Emotion | 'bookmarked' | null;
  onFilterChange: (filter: Emotion | 'bookmarked' | null) => void;
}

const emotionKeys = Object.keys(EMOTION_MAP) as Emotion[];

function formatDate(date: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(new Date(date));
}

export default function DiaryListView({ diaries, onDiaryClick, onWrite, activeFilter, onFilterChange }: DiaryListViewProps) {
  const filtered = activeFilter === 'bookmarked'
    ? diaries.filter((diary) => diary.isBookmarked)
    : activeFilter
      ? diaries.filter((diary) => diary.emotion === activeFilter)
      : diaries;
  const ordered = [...filtered].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  const emptyLabel = activeFilter === 'bookmarked'
    ? '还没有珍藏的星辰'
    : activeFilter
      ? `还没有${EMOTION_MAP[activeFilter].label}星象的日记`
      : '还没有被点亮的星辰';

  return (
    <main className="celestial-page celestial-list-page">
      <section className="celestial-page-heading">
        <p className="celestial-kicker">MEMORY ARCHIVE</p>
        <h1>记忆星谱</h1>
        <p>穿越内心宇宙的星系。每一段记录，都是你生命长河中璀璨的星辰。</p>
      </section>

      <div className="celestial-filter-row" aria-label="按情绪浏览">
        <span>星象分类</span>
        <button type="button" className={!activeFilter ? 'is-active' : ''} onClick={() => onFilterChange(null)}>全部记忆</button>
        {emotionKeys.slice(0, 4).map((emotion) => (
          <button type="button" key={emotion} className={activeFilter === emotion ? 'is-active' : ''} onClick={() => onFilterChange(emotion)} style={{ '--chip-color': EMOTION_MAP[emotion].color } as CSSProperties}>
            {EMOTION_MAP[emotion].label}
          </button>
        ))}
      </div>

      {ordered.length === 0 ? (
        <section className="celestial-empty-state">
          <Sparkles size={32} />
          <h2>{emptyLabel}</h2>
          <p>写下第一篇日记，让它成为属于你的记忆星图。</p>
          <button type="button" onClick={onWrite}>创建第一篇日记</button>
        </section>
      ) : (
        <section className="celestial-diary-grid">
          {ordered.map((diary, index) => {
            const emotion = EMOTION_MAP[diary.emotion];
            const isFeature = index === 0;
            return (
              <article
                className={`celestial-diary-tile ${isFeature ? 'is-featured' : ''}`}
                key={diary.id}
                style={{ '--emotion-color': emotion.color } as CSSProperties}
              >
                <button type="button" onClick={() => onDiaryClick(diary)}>
                  <div className="celestial-tile-meta">
                    <span><CalendarDays size={13} />{formatDate(diary.date || diary.createdAt)}</span>
                    {diary.isBookmarked && <Star size={14} fill="currentColor" />}
                  </div>
                  <h2>{diary.title}</h2>
                  <p>{diary.content}</p>
                  <footer>
                    <span className="celestial-emotion-dot" />
                    <span>{emotion.label}</span>
                    {diary.photoFileIds.length > 0 && <span className="celestial-photo-count"><ImageIcon size={13} />{diary.photoFileIds.length}</span>}
                    <span className="celestial-word-count">{diary.content.length} 字</span>
                    <ChevronRight className="celestial-tile-arrow" size={19} />
                  </footer>
                </button>
              </article>
            );
          })}
        </section>
      )}

      <button type="button" className="celestial-floating-create" onClick={onWrite} aria-label="创建日记">
        <Sparkles size={21} />
      </button>
    </main>
  );
}
