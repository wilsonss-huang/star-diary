import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, CalendarDays, ImagePlus, MapPin, Mic, Smile, Sparkles, Tag, X } from 'lucide-react';
import type { Emotion } from '../types';
import { EMOTION_MAP } from '../types';
import EmotionSelector from './EmotionSelector';
import PhotoUploader from './PhotoUploader';
import { uploadPhoto } from '../lib/cloudbase';

const DRAFT_KEY = 'star-diary-draft';

interface NewDiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: string, emotion: Emotion, photoFileIds?: string[]) => Promise<void>;
}

const placeholders: Record<Emotion, string> = {
  happy: '把今天闪闪发光的片刻写下来…',
  sad: '把心里的话，慢慢写下来…',
  excited: '记录这份正在发生的雀跃…',
  calm: '记录这一刻平静的时光…',
  love: '写下让你心动的瞬间…',
  thoughtful: '此刻，你正在思考什么？',
};

export default function NewDiaryModal({ isOpen, onClose, onSave }: NewDiaryModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [emotion, setEmotion] = useState<Emotion>('calm');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [openTool, setOpenTool] = useState<'mood' | 'photo' | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}');
      if (draft.title) setTitle(draft.title);
      if (draft.content) setContent(draft.content);
      if (draft.emotion) setEmotion(draft.emotion);
    } catch { /* ignore corrupted draft */ }
  }, [isOpen]);

  const saveDraft = useCallback(() => {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, emotion })); } catch { /* ignore */ }
  }, [title, content, emotion]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setInterval(saveDraft, 3000);
    return () => window.clearInterval(timer);
  }, [isOpen, saveDraft]);

  const handleClose = () => { saveDraft(); onClose(); };
  const handleSave = async () => {
    if (!title.trim() || !content.trim() || saving) return;
    setSaving(true);
    try {
      const fileIds: string[] = [];
      if (photoFiles.length) {
        setUploadProgress({ current: 0, total: photoFiles.length });
        for (let index = 0; index < photoFiles.length; index++) {
          fileIds.push(await uploadPhoto(photoFiles[index]));
          setUploadProgress({ current: index + 1, total: photoFiles.length });
        }
      }
      await onSave(title.trim(), content.trim(), emotion, fileIds);
      setTitle(''); setContent(''); setEmotion('calm'); setPhotoFiles([]); setUploadProgress({ current: 0, total: 0 });
      sessionStorage.removeItem(DRAFT_KEY);
      onClose();
    } finally { setSaving(false); }
  };

  const today = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());
  const emotionConfig = EMOTION_MAP[emotion];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.section className="stitch-editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <header className="stitch-editor-header">
            <button type="button" onClick={handleClose}><ArrowLeft size={19} />取消</button>
            <nav><span className="is-active">日记</span><span>主页</span><span>设置</span></nav>
            <strong>StarDiary</strong>
            <button type="button" className="stitch-editor-save-top" disabled={!title.trim() || !content.trim() || saving} onClick={handleSave}>
              {saving ? (uploadProgress.total ? `上传 ${uploadProgress.current}/${uploadProgress.total}` : '正在保存…') : '保存至星辰'}
            </button>
          </header>

          <main className="stitch-editor-body">
            <div className="stitch-editor-meta"><span><CalendarDays size={15} />{today}</span><span><MapPin size={15} />星尘观测台</span><span style={{ color: emotionConfig.color }}><Sparkles size={15} />宇宙共鸣：{emotionConfig.label}</span></div>
            <div className="stitch-editor-title-wrap">
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="此刻的心情标题…" autoFocus />
            </div>
            <div className="stitch-editor-content-wrap">
              <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder={placeholders[emotion]} />
              <i />
            </div>
          </main>

          <AnimatePresence>
            {openTool && (
              <motion.div className="stitch-editor-tool-panel" initial={{ opacity: 0, y: 14, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14, scale: .98 }}>
                <header><span>{openTool === 'mood' ? '选择今天的情绪' : `照片 (${photoFiles.length}/3)`}</span><button type="button" onClick={() => setOpenTool(null)}><X size={17} /></button></header>
                {openTool === 'mood' ? <EmotionSelector selected={emotion} onSelect={(value) => { setEmotion(value); setOpenTool(null); }} /> : <PhotoUploader files={photoFiles} onFilesChange={setPhotoFiles} maxPhotos={3} />}
              </motion.div>
            )}
          </AnimatePresence>

          <nav className="stitch-editor-toolbar">
            <button type="button" onClick={() => setOpenTool(openTool === 'photo' ? null : 'photo')} className={openTool === 'photo' ? 'is-active' : ''} title="添加照片"><ImagePlus size={21} /></button>
            <button type="button" onClick={() => setOpenTool(openTool === 'mood' ? null : 'mood')} className={openTool === 'mood' ? 'is-active' : ''} title="选择情绪"><Smile size={21} /></button>
            <button type="button" onClick={() => setOpenTool(openTool === 'mood' ? null : 'mood')} title="情绪"><Sparkles size={21} /></button>
            <i />
            <button type="button" title="标签"><Tag size={21} /></button>
            <button type="button" title="语音记录"><Mic size={21} /></button>
          </nav>
          <p className="stitch-editor-count">{content.length} 字</p>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
