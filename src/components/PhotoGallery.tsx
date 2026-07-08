import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
      <div className="mt-5">
        <p className="text-white/20 text-xs mb-3 flex items-center gap-2">
          <span>📷</span> 加载照片中...
        </p>
        <div className="grid grid-cols-2 gap-2">
          {fileIds.map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-white/[0.03] skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-5 text-center text-white/20 text-xs py-4">
        ⚠️ 照片暂时加载失败，请刷新重试
      </div>
    );
  }

  if (urls.length === 0) return null;

  return (
    <div className="mt-5">
      <p className="text-white/25 text-xs mb-3 flex items-center gap-2">
        <span>📷</span> 照片 · {urls.length} 张
      </p>
      <div className="grid grid-cols-2 gap-2">
        {urls.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className="aspect-square rounded-xl overflow-hidden border border-white/[0.06]
                       hover:border-white/30 hover:scale-[1.02] transition-all cursor-pointer
                       active:scale-[0.97] group relative"
          >
            <img
              src={url}
              alt={`照片 ${i + 1}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors
                          flex items-center justify-center">
              <span className="text-white/0 group-hover:text-white/70 text-xs transition-all">
                查看
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxIndex(null)}
          >
            <motion.img
              src={urls[lightboxIndex]}
              alt={`照片 ${lightboxIndex + 1}`}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Navigation arrows */}
            {lightboxIndex > 0 && (
              <button
                type="button"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                           bg-white/[0.06] hover:bg-white/15 flex items-center justify-center
                           text-white/60 hover:text-white/90 transition-all z-50 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {lightboxIndex < urls.length - 1 && (
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full
                           bg-white/[0.06] hover:bg-white/15 flex items-center justify-center
                           text-white/60 hover:text-white/90 transition-all z-50 cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Close button */}
            <button
              type="button"
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/[0.06]
                         hover:bg-white/15 flex items-center justify-center
                         text-white/50 hover:text-white/80 transition-all z-50 cursor-pointer"
              onClick={() => setLightboxIndex(null)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/30 text-sm">
              {lightboxIndex + 1} / {urls.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
