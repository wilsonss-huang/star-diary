import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CalendarDays, Check, FileText, Pencil, Trash2, X } from 'lucide-react';
import type { DiaryEntry, Emotion } from '../types';
import { EMOTION_MAP } from '../types';
import PhotoGallery from './PhotoGallery';
import { StarFilled, StarOutline } from './Icons';

interface DiaryCardProps {
  diary: DiaryEntry | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onUpdate: (id: string, updates: Pick<DiaryEntry, 'title' | 'content' | 'emotion'>) => Promise<void>;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  let relative = '';
  if (days === 0) relative = '今天';
  else if (days === 1) relative = '昨天';
  else if (days < 7) relative = `${days} 天前`;
  else if (days < 30) relative = `${Math.floor(days / 7)} 周前`;
  else if (days < 365) relative = `${Math.floor(days / 30)} 个月前`;

  const absolute = d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  return relative ? `${relative} · ${absolute}` : absolute;
}

function EmotionMark({ color, label }: { color: string; label: string }) {
  return (
    <div
      className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
      style={{
        background: `radial-gradient(circle at 38% 28%, rgba(255,255,255,0.85), ${color}55 32%, rgba(8,10,28,0.78) 100%)`,
        boxShadow: `0 0 30px ${color}24, inset 0 1px 0 rgba(255,255,255,0.14)`,
      }}
      title={label}
    >
      <span className="absolute h-6 w-6 rounded-full blur-md" style={{ backgroundColor: color, opacity: 0.42 }} />
      <span className="relative h-4 w-4 rounded-full border border-white/40" style={{ backgroundColor: color, boxShadow: `0 0 18px ${color}` }} />
    </div>
  );
}

const emotionKeys = Object.keys(EMOTION_MAP) as Emotion[];

export default function DiaryCard({ diary, onClose, onDelete, onToggleBookmark, onUpdate }: DiaryCardProps) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [draftEmotion, setDraftEmotion] = useState<Emotion>('calm');

  useEffect(() => {
    if (!diary) return;
    setIsEditing(false);
    setSaving(false);
    setDeleteConfirm(false);
    setDraftTitle(diary.title);
    setDraftContent(diary.content);
    setDraftEmotion(diary.emotion);
  }, [diary?.id]);

  if (!diary) return null;

  const emotionConfig = EMOTION_MAP[isEditing ? draftEmotion : diary.emotion];
  const hasPhotos = diary.photoFileIds && diary.photoFileIds.length > 0;

  const handleDelete = () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 3000);
      return;
    }
    onDelete(diary.id);
    onClose();
  };

  const handleSave = async () => {
    if (!draftTitle.trim() || !draftContent.trim() || saving) return;
    setSaving(true);
    try {
      await onUpdate(diary.id, {
        title: draftTitle.trim(),
        content: draftContent.trim(),
        emotion: draftEmotion,
      });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {diary && (
        <motion.div
          className="absolute inset-0 z-40 flex items-center justify-end px-7 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/38 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.article
            className="relative z-10 flex max-h-[86vh] w-full max-w-xl flex-col overflow-hidden rounded-[30px]
                       border border-white/[0.035] bg-black/72 shadow-[0_34px_110px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.055)]
                       backdrop-blur-3xl"
            initial={{ scale: 0.94, opacity: 0, x: 34 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0.94, opacity: 0, x: 34 }}
            transition={{ type: 'spring', damping: 24, stiffness: 190 }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full
                         bg-white/[0.04] text-white/34 transition-all hover:bg-white/[0.08] hover:text-white/72"
              title="关闭"
            >
              <X size={15} strokeWidth={1.7} />
            </button>

            <div className="h-0.5 shrink-0" style={{ background: `linear-gradient(90deg, transparent, ${emotionConfig.color}9A, transparent)` }} />

            <div className="min-h-0 overflow-y-auto px-7 py-7">
              <header className="flex items-start gap-4 pr-8">
                <EmotionMark color={emotionConfig.color} label={emotionConfig.label} />

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2.5">
                    <span
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={{ backgroundColor: `${emotionConfig.color}16`, color: emotionConfig.color }}
                    >
                      {emotionConfig.label}
                    </span>
                    {hasPhotos && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.035] px-3 py-1 text-xs text-white/36">
                        <Camera size={13} strokeWidth={1.5} />
                        {diary.photoFileIds.length} 张照片
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <input
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      className="w-full rounded-2xl bg-white/[0.055] px-4 py-3 text-[22px] font-semibold leading-tight text-white/92 outline-none
                                 placeholder:text-white/22 focus:bg-white/[0.08]"
                    />
                  ) : (
                    <h3 className="break-words text-[26px] font-semibold leading-tight text-white/94">
                      {diary.title}
                    </h3>
                  )}

                  <div className="mt-3 flex items-center gap-2 text-sm text-white/32">
                    <CalendarDays size={15} strokeWidth={1.5} />
                    <span>{formatDate(diary.createdAt)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleBookmark(diary.id)}
                  className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-all active:scale-90 ${
                    diary.isBookmarked
                      ? 'bg-amber-300/[0.12] text-amber-200 shadow-[0_0_22px_rgba(251,191,36,0.16)]'
                      : 'bg-white/[0.035] text-white/30 hover:bg-white/[0.07] hover:text-white/70'
                  }`}
                  title={diary.isBookmarked ? '取消收藏' : '收藏星星'}
                >
                  {diary.isBookmarked ? <StarFilled size={19} /> : <StarOutline size={19} />}
                </button>
              </header>

              {isEditing && (
                <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {emotionKeys.map((emotion) => {
                    const config = EMOTION_MAP[emotion];
                    const selected = draftEmotion === emotion;
                    return (
                      <button
                        key={emotion}
                        type="button"
                        onClick={() => setDraftEmotion(emotion)}
                        className={`flex min-h-10 items-center justify-center rounded-2xl text-xs transition-all ${
                          selected ? 'bg-white/[0.09] text-white/90' : 'bg-white/[0.035] text-white/38 hover:text-white/70'
                        }`}
                        style={{ boxShadow: selected ? `0 0 18px ${config.color}22` : undefined }}
                      >
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              )}

              <section className="mt-6 rounded-[24px] bg-white/[0.03] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
                <div className="mb-3 flex items-center gap-2 text-xs text-white/30">
                  <FileText size={14} strokeWidth={1.5} />
                  <span>日记内容</span>
                </div>
                {isEditing ? (
                  <textarea
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    rows={7}
                    className="w-full resize-none rounded-2xl bg-white/[0.055] px-4 py-3 text-[15px] leading-8 text-white/82 outline-none
                               placeholder:text-white/22 focus:bg-white/[0.08]"
                  />
                ) : (
                  <p className="max-h-52 overflow-y-auto whitespace-pre-wrap break-words text-[15px] leading-8 text-white/72">
                    {diary.content}
                  </p>
                )}
              </section>

              {!isEditing && <PhotoGallery fileIds={diary.photoFileIds} />}
            </div>

            <footer className="shrink-0 border-t border-white/[0.025] bg-white/[0.012] px-7 py-4 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleDelete}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-2xl px-4 text-sm transition-all ${
                    deleteConfirm
                      ? 'bg-red-500/14 text-red-200'
                      : 'bg-red-500/[0.035] text-red-300/52 hover:bg-red-500/[0.08] hover:text-red-200/86'
                  }`}
                >
                  <Trash2 size={15} strokeWidth={1.6} />
                  {deleteConfirm ? '再次确认' : '删除'}
                </button>

                <div className="flex gap-3">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setDraftTitle(diary.title);
                          setDraftContent(diary.content);
                          setDraftEmotion(diary.emotion);
                          setIsEditing(false);
                        }}
                        className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-white/[0.035] px-4 text-sm text-white/46
                                   transition-all hover:bg-white/[0.07] hover:text-white/76"
                      >
                        <X size={15} strokeWidth={1.6} />
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={!draftTitle.trim() || !draftContent.trim() || saving}
                        className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-white/[0.09] px-4 text-sm text-white/86
                                   transition-all hover:bg-white/[0.13] disabled:opacity-35"
                      >
                        <Check size={15} strokeWidth={1.7} />
                        {saving ? '保存中' : '保存'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="inline-flex min-h-10 items-center gap-2 rounded-2xl bg-white/[0.045] px-4 text-sm text-white/56
                                 transition-all hover:bg-white/[0.08] hover:text-white/82"
                    >
                      <Pencil size={15} strokeWidth={1.6} />
                      修改
                    </button>
                  )}
                </div>
              </div>
            </footer>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
