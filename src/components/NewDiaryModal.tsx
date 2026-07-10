import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, PenLine, Sparkles } from 'lucide-react';
import type { Emotion } from '../types';
import EmotionSelector from './EmotionSelector';
import PhotoUploader from './PhotoUploader';
import { uploadPhoto } from '../lib/cloudbase';
import { StarLogo } from './Icons';

const DRAFT_KEY = 'star-diary-draft';

interface NewDiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: string, emotion: Emotion, photoFileIds?: string[]) => Promise<void>;
}

const placeholders: Record<Emotion, string> = {
  happy: '今天发生了什么开心的事？',
  sad: '把你心里的话慢慢写下来。',
  excited: '什么让你这么兴奋？记录这一刻。',
  calm: '记录这一刻平静的时光。',
  love: '写下让你心动的瞬间。',
  thoughtful: '你正在想些什么？',
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
          className="absolute inset-0 z-40 flex items-center justify-center px-4 py-[calc(1rem+env(safe-area-inset-top))]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/62 backdrop-blur-md"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="z-10 max-h-[calc(100vh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/[0.08]
                       bg-[#080a1e]/88 p-5 shadow-[0_34px_110px_rgba(0,0,0,0.50)] backdrop-blur-3xl sm:rounded-[34px] sm:p-9"
            initial={{ scale: 0.92, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 22, stiffness: 200 }}
          >
            <header className="mb-6 flex items-start gap-4 sm:mb-8 sm:gap-5">
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/[0.10]"
                style={{
                  background: 'radial-gradient(circle at 35% 25%, rgba(255,255,255,0.22), rgba(126,200,168,0.16) 42%, rgba(9,12,32,0.84) 100%)',
                  boxShadow: '0 18px 46px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.12)',
                }}
              >
                <StarLogo size={28} className="text-white/78" />
              </span>
              <div className="min-w-0 pt-0.5">
                <div className="mb-2 flex items-center gap-2 text-xs text-white/32">
                  <PenLine size={14} strokeWidth={1.5} />
                  <span>新的星星</span>
                </div>
                <h2 className="text-[28px] font-semibold leading-tight text-white/94">写下新的回忆</h2>
                <p className="mt-2 text-sm leading-6 text-white/34">写完日记后，一颗星星会在星空中为你亮起。</p>
              </div>
            </header>

            <section className="rounded-[26px] border border-white/[0.06] bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center gap-2 text-xs text-white/34">
                <Sparkles size={14} strokeWidth={1.5} />
                <span>选择今天的情绪</span>
              </div>
              <EmotionSelector selected={emotion} onSelect={setEmotion} />
            </section>

            <section className="mt-5 rounded-[26px] border border-white/[0.06] bg-white/[0.03] p-5">
              <PhotoUploader files={photoFiles} onFilesChange={setPhotoFiles} maxPhotos={3} />
            </section>

            <section className="mt-5 rounded-[26px] border border-white/[0.06] bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center gap-2 text-xs text-white/34">
                <FileText size={14} strokeWidth={1.5} />
                <span>日记内容</span>
              </div>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="今天想记录什么？"
                className="min-h-14 w-full rounded-2xl border border-white/[0.08] bg-[#07091a]/52 px-5 text-[17px]
                           text-white/90 outline-none transition-all placeholder:text-white/24
                           focus:border-white/22 focus:bg-white/[0.055]"
                autoFocus
              />

              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={placeholders[emotion]}
                rows={8}
                className="mt-4 w-full resize-none rounded-2xl border border-white/[0.08] bg-[#07091a]/52 px-5 py-4
                           text-[16px] leading-8 text-white/86 outline-none transition-all placeholder:text-white/24
                           focus:border-white/22 focus:bg-white/[0.055]"
              />
              <div className="mt-3 text-right text-xs text-white/24">
                {content.length} 字
              </div>
            </section>

            <footer className="mt-6 flex gap-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex min-h-[52px] flex-1 items-center justify-center rounded-2xl border border-white/[0.08]
                           bg-white/[0.025] text-base text-white/50 transition-all hover:bg-white/[0.06] hover:text-white/76"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!title.trim() || !content.trim() || saving}
                className="flex min-h-[52px] flex-1 items-center justify-center gap-3 rounded-2xl border border-white/14
                           bg-white/[0.08] text-base font-medium text-white/90 transition-all
                           hover:bg-white/12 hover:border-white/25 active:scale-[0.98]
                           disabled:cursor-not-allowed disabled:opacity-35"
              >
                <Sparkles size={17} strokeWidth={1.6} className="text-white/58" />
                <span>
                  {saving
                    ? uploadProgress.total > 0
                      ? `上传照片 ${uploadProgress.current}/${uploadProgress.total}...`
                      : '正在点亮...'
                    : '点亮这颗星'}
                </span>
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
