import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { fetchDiaries, saveDiaryToCloud } from '../lib/cloudbase';
import type { DiaryEntry } from '../types';

interface SettingsPanelProps {
  refreshDiaries: () => void;
}

export default function SettingsPanel({ refreshDiaries }: SettingsPanelProps) {
  const { currentUser, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    try {
      const diaries = await fetchDiaries();
      const blob = new Blob([JSON.stringify(diaries, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `star-diary-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setMessage('导出成功！');
    } catch {
      setMessage('导出失败');
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const data = JSON.parse(await file.text()) as DiaryEntry[];
        if (!Array.isArray(data)) { setMessage('格式错误'); return; }
        for (const entry of data) {
          await saveDiaryToCloud({
            title: entry.title, content: entry.content,
            emotion: entry.emotion, starPosition: entry.starPosition,
          });
        }
        setMessage(`成功导入 ${data.length} 条！`);
        refreshDiaries();
      } catch {
        setMessage('导入失败');
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="absolute top-5 right-5 z-10 w-10 h-10 rounded-xl glass flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all active:scale-95"
        title="设置"
      >
        <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div className="absolute inset-0 z-30 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsOpen(false); setMessage(''); }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div className="glass-strong rounded-2xl p-6 w-full max-w-sm mx-4 z-10" initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} transition={{ type: 'spring', damping: 20, stiffness: 200 }}>
              <h2 className="text-white text-xl font-semibold mb-1">设置</h2>
              <p className="text-white/40 text-sm mb-5">当前账号：{currentUser?.phone || currentUser?.uid || '未知'}</p>

              <div className="flex flex-col gap-3">
                <button type="button" onClick={handleExport} className="w-full py-3 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 hover:text-white hover:border-white/20 transition-all cursor-pointer text-sm flex items-center justify-center gap-2">📤 导出数据备份</button>
                <button type="button" onClick={handleImport} disabled={importing} className="w-full py-3 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 hover:text-white hover:border-white/20 transition-all cursor-pointer text-sm flex items-center justify-center gap-2 disabled:opacity-50">📥 导入数据恢复</button>
                <hr className="border-white/5" />
                <button type="button" onClick={async () => { await logout(); setIsOpen(false); }} className="w-full py-3 rounded-xl border border-red-500/20 text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer text-sm">🚪 注销 / 切换账号</button>
              </div>

              {message && <p className={`text-sm text-center mt-4 ${message.includes('成功') ? 'text-green-400' : 'text-red-400'}`}>{message}</p>}
              <button type="button" onClick={() => { setIsOpen(false); setMessage(''); }} className="w-full mt-3 py-2 text-white/30 text-xs hover:text-white/50 transition-colors cursor-pointer">关闭</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
