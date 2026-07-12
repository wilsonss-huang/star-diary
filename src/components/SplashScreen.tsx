import { useCallback, useEffect, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { StarLogo } from './Icons';
import FlowingGalaxyBackdrop from './FlowingGalaxyBackdrop';

interface SplashScreenProps { onEnter: () => void; }

export default function SplashScreen({ onEnter }: SplashScreenProps) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => setReady(true), 700); return () => window.clearTimeout(timer); }, []);
  const enter = useCallback(() => { if (ready) onEnter(); }, [ready, onEnter]);

  return (
    <AnimatePresence>
      <motion.div className="stitch-splash" onClick={enter} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04, filter: 'blur(9px)' }} transition={{ duration: .65 }}>
        <FlowingGalaxyBackdrop />
        <header className="stitch-splash-header"><strong>StarDiary</strong><nav><span>首页</span><span>日记</span><span>设置</span><span>个人中心</span><b>创建日记</b></nav></header>
        <main className="stitch-splash-content">
          <motion.div className="stitch-memory-core" initial={{ opacity: 0, scale: .7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .18, duration: .7 }}>
            <i /><i /><i />
            <div><StarLogo size={31} /></div>
          </motion.div>
          <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .35, duration: .65 }}>
            <h1>StarDiary</h1>
            <p className="stitch-splash-chinese">星空日记</p>
            <p className="stitch-splash-meta">PRIVATE MEMORY ATLAS <b /> 2026</p>
          </motion.section>
          <motion.div className="stitch-splash-enter" initial={{ opacity: 0, y: 10 }} animate={{ opacity: ready ? 1 : 0, y: ready ? 0 : 10 }} transition={{ duration: .4 }}>
            <span><ArrowDown size={19} /></span><p>点击任意处开启记忆旅程</p>
          </motion.div>
        </main>
        <footer><a href="#terms">虚空条款</a><a href="#credits">星图致谢</a><p>私人记忆星图 2026</p></footer>
      </motion.div>
    </AnimatePresence>
  );
}
