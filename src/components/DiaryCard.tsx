import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DiaryEntry } from '../types';
import { EMOTION_MAP } from '../types';
import PhotoGallery from './PhotoGallery';
import { StarFilled, StarOutline } from './Icons';

interface DiaryCardProps {
  diary: DiaryEntry | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onToggleBookmark: (id: string) => void;
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

export default function DiaryCard({ diary, onClose, onDelete, onToggleBookmark }: DiaryCardProps) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  if (!diary) return null;

  const handleDelete = () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 3000);
      return;
    }
    onDelete(diary.id);
    onClose();
  };

  const emotionConfig = EMOTION_MAP[diary.emotion];
  const hasPhotos = diary.photoFileIds && diary.photoFileIds.length > 0;

  return (
    <AnimatePresence>
      {diary && (
        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Card */}
          <motion.div
            className="glass-strong rounded-3xl w-full max-w-xl mx-4 z-10 overflow-hidden
                       max-h-[88vh] flex flex-col"
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 18, stiffness: 180 }}
          >
            {/* Emotion color bar */}
            <div
              className="h-0.5 shrink-0"
              style={{ backgroundColor: emotionConfig.color, opacity: 0.5 }}
            />

            {/* Scrollable content */}
            <div className="overflow-y-auto px-8 py-7">
              {/* Header row */}
              <div className="flex items-start gap-4">
                {/* Emoji */}
                <div
                  className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                  style={{
                    backgroundColor: emotionConfig.color + '18',
                    border: `1px solid ${emotionConfig.color}28`,
                  }}
                >
                  {emotionConfig.emoji}
                </div>

                {/* Title + date */}
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="text-white text-lg font-semibold leading-snug break-words">
                    {diary.title}
                  </h3>
                  <span className="text-white/25 text-xs mt-1.5 inline-block">
                    {formatDate(diary.createdAt)}
                  </span>
                </div>

                {/* Bookmark */}
                <button
                  type="button"
                  onClick={() => onToggleBookmark(diary.id)}
                  className={`shrink-0 mt-1.5 transition-all cursor-pointer active:scale-75
                    ${diary.isBookmarked
                      ? 'text-amber-300/90 hover:text-amber-300'
                      : 'text-white/15 hover:text-white/40'
                    }`}
                  title={diary.isBookmarked ? '取消收藏' : '收藏星星'}
                >
                  {diary.isBookmarked ? <StarFilled size={22} /> : <StarOutline size={22} />}
                </button>
              </div>

              {/* Emotion tag + photo count */}
              <div className="flex items-center gap-3 mt-5 mb-5">
                <span
                  className="inline-block text-xs px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: emotionConfig.color + '15',
                    color: emotionConfig.color,
                    border: `1px solid ${emotionConfig.color}28`,
                  }}
                >
                  {emotionConfig.label}
                </span>
                {hasPhotos && (
                  <span className="text-white/20 text-xs flex items-center gap-1">
                    📷 {diary.photoFileIds.length} 张照片
                  </span>
                )}
              </div>

              {/* Content */}
              <p className="text-white/65 text-sm leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto">
                {diary.content}
              </p>

              {/* Photo gallery — prominent */}
              <PhotoGallery fileIds={diary.photoFileIds} />

            </div>

            {/* Action buttons — sticky bottom */}
            <div className="px-8 py-5 border-t border-white/[0.04] shrink-0
                          bg-white/[0.01] backdrop-blur-sm">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-white/[0.07] text-white/35
                             hover:bg-white/[0.04] hover:text-white/55 transition-all cursor-pointer text-sm"
                >
                  关闭
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className={`py-3 px-5 rounded-xl text-sm transition-all cursor-pointer border
                    ${deleteConfirm
                      ? 'bg-red-500/12 border-red-500/30 text-red-400'
                      : 'border-red-500/12 text-red-400/40 hover:bg-red-500/6 hover:text-red-400 hover:border-red-500/25'
                    }`}
                >
                  {deleteConfirm ? '再次确认删除' : '删除'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
