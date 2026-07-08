import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PhotoUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxPhotos?: number;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function PhotoUploader({ files, onFilesChange, maxPhotos = 3 }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError('');
      const selected = Array.from(e.target.files || []);
      if (files.length + selected.length > maxPhotos) {
        setError(`最多 ${maxPhotos} 张照片`);
        return;
      }
      for (const f of selected) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
          setError('仅支持 JPG、PNG、WebP 格式');
          return;
        }
        if (f.size > MAX_SIZE) {
          setError('单张照片不超过 10MB');
          return;
        }
      }
      onFilesChange([...files, ...selected]);
      if (inputRef.current) inputRef.current.value = '';
    },
    [files, onFilesChange, maxPhotos],
  );

  const removeFile = useCallback(
    (index: number) => {
      onFilesChange(files.filter((_, i) => i !== index));
    },
    [files, onFilesChange],
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/35 text-xs flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          照片 ({files.length}/{maxPhotos})
        </span>
        {files.length < maxPhotos && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs text-white/30 hover:text-white/60 transition-colors cursor-pointer
                         px-3.5 py-2 rounded-xl border border-white/[0.07] hover:border-white/15"
            >
              + 添加照片
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="text-red-400/60 text-xs mb-3">{error}</p>
      )}

      {files.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <AnimatePresence>
            {files.map((file, i) => (
              <motion.div
                key={`${file.name}-${i}`}
                className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/[0.08]"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute top-0 right-0 w-6 h-6 bg-black/50 rounded-bl-xl
                             flex items-center justify-center text-white/50 hover:text-white
                             hover:bg-red-500/50 transition-all cursor-pointer"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
