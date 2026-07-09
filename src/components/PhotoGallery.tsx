import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X } from 'lucide-react';
import { getPhotoUrls } from '../lib/cloudbase';

interface PhotoGalleryProps {
  fileIds: string[];
}

export default function PhotoGallery({ fileIds }: PhotoGalleryProps) {
  const [urls, setUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (fileIds.length === 0) return;
    setLoading(true);
    setError(false);
    getPhotoUrls(fileIds)
      .then((result) => {
        if (result.length === 0) setError(true);
        else setUrls(result);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [fileIds.join(',')]);

  if (fileIds.length === 0) return null;

  if (loading) {
    return (
      <div className="mt-6 rounded-[24px] border border-white/[0.06] bg-white/[0.03] p-5">
        <p className="mb-4 flex items-center gap-2 text-xs text-white/30">
          <Camera size={14} strokeWidth={1.5} />
          加载照片中...
        </p>
        <div className="grid grid-cols-2 gap-3">
          {fileIds.map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-white/[0.03] skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 rounded-[24px] border border-white/[0.06] bg-white/[0.03] px-5 py-6 text-center text-xs text-white/28">
        照片暂时加载失败，请刷新重试
      </div>
    );
  }

  if (urls.length === 0) return null;

  return (
    <div className="mt-6 rounded-[24px] border border-white/[0.06] bg-white/[0.03] p-5">
      <p className="mb-4 flex items-center gap-2 text-xs text-white/32">
        <Camera size={14} strokeWidth={1.5} />
        照片 · {urls.length} 张
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {urls.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-white/[0.07]
                       bg-white/[0.025] transition-all hover:border-white/24 active:scale-[0.98]"
          >
            <img
              src={url}
              alt={`照片 ${i + 1}`}
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
              <span className="mb-4 rounded-full border border-white/12 bg-black/36 px-3 py-1 text-xs text-white/72 backdrop-blur-xl">
                查看
              </span>
            </div>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxIndex(null)}
          >
            <motion.img
              src={urls[lightboxIndex]}
              alt={`照片 ${lightboxIndex + 1}`}
              className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            />

            {lightboxIndex > 0 && (
              <button
                type="button"
                className="absolute left-5 top-1/2 z-50 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full
                           bg-white/[0.08] text-white/66 transition-all hover:bg-white/16 hover:text-white"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
              >
                ‹
              </button>
            )}
            {lightboxIndex < urls.length - 1 && (
              <button
                type="button"
                className="absolute right-5 top-1/2 z-50 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full
                           bg-white/[0.08] text-white/66 transition-all hover:bg-white/16 hover:text-white"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
              >
                ›
              </button>
            )}

            <button
              type="button"
              className="absolute right-5 top-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08]
                         text-white/58 transition-all hover:bg-white/16 hover:text-white"
              onClick={() => setLightboxIndex(null)}
            >
              <X size={18} strokeWidth={1.7} />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/44 backdrop-blur-xl">
              {lightboxIndex + 1} / {urls.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
