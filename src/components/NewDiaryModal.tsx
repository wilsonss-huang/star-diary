import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Emotion } from '../types';
import EmotionSelector from './EmotionSelector';
import PhotoUploader from './PhotoUploader';
import { uploadPhoto } from '../lib/cloudbase';
import { SparkleIcon } from './Icons';

const DRAFT_KEY = 'star-diary-draft';

interface NewDiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: string, emotion: Emotion, photoFileIds?: string[]) => Promise<void>;
}

const placeholders: Record<Emotion, string> = {
  happy: '今天发生了什么开心的事？...',
  sad: '把你心里的话写下来吧...',
  excited: '什么让你如此激动？分享出来吧...',
  calm: '记录这一刻平静的时光...',
  love: '写下让你心动的每一个瞬间...',
  thoughtful: '你在想些什么呢？...',
};

export default function NewDiaryModal({ isOpen, onClose, onSave }: NewDiaryModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [emotion, setEmotion] = useState<Emotion>('calm');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    if (!isOpen) return;
    try {
      const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}');
      if (draft.title) setTitle(draft.title);
      if (draft.content) setContent(draft.content);
      if (draft.emotion) setEmotion(draft.emotion);
    } catch { /* ignore */ }
  }, [isOpen]);

  const saveDraft = useCallback(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, emotion }));
    } catch { /* ignore */ }
  }, [title, content, emotion]);

  useEffect(() => {
    const t = setInterval(saveDraft, 3000);
    return () => clearInterval(t);
  }, [saveDraft]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim() || saving) return;
    setSaving(true);
    try {
      let fileIds: string[] = [];
      if (photoFiles.length > 0) {
        setUploadProgress({ current: 0, total: photoFiles.length });
        // 逐张上传以显示进度
        for (let i = 0; i < photoFiles.length; i++) {
          const id = await uploadPhoto(photoFiles[i]);
          fileIds.push(id);
          setUploadProgress({ current: i + 1, total: photoFiles.length });
        }
      }
      await onSave(title.trim(), content.trim(), emotion, fileIds);
      setTitle('');
      setContent('');
      setEmotion('calm');
      setPhotoFiles([]);
      setUploadProgress({ current: 0, total: 0 });
      sessionStorage.removeItem(DRAFT_KEY);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    saveDraft();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="glass-strong rounded-3xl px-10 py-10 w-full max-w-xl mx-4 z-10 max-h-[92vh] overflow-y-auto"
            initial={{ scale: 0.92, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-white/55">
                <SparkleIcon size={20} />
              </span>
              <h2 className="text-white text-xl font-semibold tracking-wide">写下新的回忆</h2>
            </div>
            <p className="text-white/25 text-sm mb-8 ml-8">写完日记后，一颗星星将在星空中为你亮起</p>

            {/* Emotion selector */}
            <EmotionSelector selected={emotion} onSelect={setEmotion} />

            {/* Photo uploader */}
            <div className="mt-7">
              <PhotoUploader files={photoFiles} onFilesChange={setPhotoFiles} maxPhotos={3} />
            </div>

            {/* Title input */}
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="今天想记录什么？"
              className="w-full mt-6 px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]
                         text-white placeholder-white/20 outline-none text-base
                         focus:border-white/25 focus:bg-white/[0.06] transition-all"
              autoFocus
            />

            {/* Content textarea */}
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={placeholders[emotion]}
              rows={7}
              className="w-full mt-5 px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]
                         text-white placeholder-white/20 outline-none resize-none text-base
                         focus:border-white/25 focus:bg-white/[0.06] transition-all leading-relaxed"
            />
            <div className="text-right text-white/20 text-xs mt-2 pr-1">
              {content.length} 字
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-4 rounded-2xl border border-white/[0.07] text-white/45
                           hover:bg-white/[0.04] hover:text-white/65 transition-all cursor-pointer text-base"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!title.trim() || !content.trim() || saving}
                className="flex-1 py-4 rounded-2xl font-medium transition-all cursor-pointer text-base
                           disabled:opacity-30 disabled:cursor-not-allowed
                           bg-white/[0.08] border border-white/15 text-white/90
                           hover:bg-white/12 hover:border-white/25
                           active:scale-[0.98] flex items-center justify-center gap-2.5"
              >
                <span className="text-white/55">
                  <SparkleIcon size={16} />
                </span>
                <span>
                  {saving
                    ? uploadProgress.total > 0
                      ? `上传照片 ${uploadProgress.current}/${uploadProgress.total}...`
                      : '正在点亮...'
                    : '点亮这颗星'}
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
