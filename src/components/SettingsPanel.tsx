import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarLogo } from './Icons';
import pkg from '../../package.json';

export default function SettingsPanel(_props: { refreshDiaries: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Small ? button — to the left of AccountMenu avatar */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="absolute top-[26px] right-[84px] z-20 w-9 h-9 rounded-full
                   bg-white/[0.04]
                   flex items-center justify-center cursor-pointer
                   hover:bg-white/[0.10] transition-all active:scale-95"
        title="关于星空日记"
      >
        <svg className="w-4 h-4 text-white/35" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div className="absolute inset-0 z-30 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            />
            <motion.div
              className="glass-strong rounded-3xl px-10 py-10 w-full max-w-sm mx-4 z-10 text-center"
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            >
              <div className="inline-flex items-center justify-center mb-6 text-white/45">
                <StarLogo size={48} />
              </div>
              <h2 className="text-white text-xl font-semibold tracking-wide">星空日记</h2>
              <p className="text-white/20 text-sm mt-3 mb-6">Star Diary v{pkg.version}</p>

              {/* Changelog */}
              <div className="text-left text-white/25 text-xs leading-relaxed space-y-1.5 mb-5
                              border border-white/[0.06] rounded-2xl px-5 py-4 bg-white/[0.015]">
                <p className="text-white/40 font-medium mb-2">更新内容</p>
                <p>· 暗黑风格统一，全新视觉</p>
                <p>· 侧边栏重设计，鼠标悬停展开</p>
                <p>· 新增账号菜单，切换/退出登录</p>
                <p>· 支持编辑已发布的日记</p>
                <p>· 点击星星摄像机平滑推近</p>
                <p>· 搜索支持日期筛选</p>
                <p>· 登录卡片更紧凑、输入更流畅</p>
              </div>

              <p className="text-white/30 text-sm leading-relaxed">
                每篇日记化作一颗星星<br />
                挂在属于你的夜空之中
              </p>
              <p className="text-white/12 text-xs mt-4">按下 Ctrl+B 打开侧边栏</p>
              <button
                type="button"
                onClick={() => { setIsOpen(false); }}
                className="w-full mt-7 py-3 rounded-xl border border-white/[0.06] text-white/25
                           text-sm hover:text-white/50 hover:border-white/15 transition-all cursor-pointer"
              >
                关闭
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
