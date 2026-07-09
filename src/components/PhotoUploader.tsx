import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, X } from 'lucide-react';

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
          setError('单张照片不能超过 10MB');
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
      <div className="mb-4 flex items-center justify-between gap-4">
        <span className="flex items-center gap-2 text-xs text-white/36">
          <ImagePlus size={15} strokeWidth={1.5} />
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
              className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-white/[0.08]
                         bg-white/[0.035] px-4 text-xs text-white/42 transition-all
                         hover:border-white/16 hover:bg-white/[0.06] hover:text-white/72"
            >
              <ImagePlus size={14} strokeWidth={1.5} />
              添加照片
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-2xl border border-red-300/14 bg-red-500/[0.06] px-4 py-3 text-xs text-red-200/72">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <AnimatePresence>
            {files.map((file, i) => (
              <motion.div
                key={`${file.name}-${i}`}
                className="relative h-24 w-24 overflow-hidden rounded-2xl border border-white/[0.08]"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full
                             bg-black/55 text-white/60 transition-all hover:bg-red-500/65 hover:text-white"
                >
                  <X size={13} strokeWidth={1.8} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
