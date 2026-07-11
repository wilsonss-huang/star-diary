import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { StarLogo } from './Icons';

interface SplashScreenProps { onEnter: () => void; }

function makeStars() {
  return Array.from({ length: 154 }, (_, index) => ({
    left: `${(index * 67 + 23) % 100}%`, top: `${(index * 41 + 11) % 100}%`,
    size: index % 10 === 0 ? 2.2 : .8 + (index % 4) * .35,
    delay: `${(index % 13) * .33}s`, gold: index % 13 === 0,
  }));
}

export default function SplashScreen({ onEnter }: SplashScreenProps) {
  const [ready, setReady] = useState(false);
  const stars = useMemo(makeStars, []);
  useEffect(() => { const timer = window.setTimeout(() => setReady(true), 700); return () => window.clearTimeout(timer); }, []);
  const enter = useCallback(() => { if (ready) onEnter(); }, [ready, onEnter]);

  return (
    <AnimatePresence>
      <motion.div className="stitch-splash" onClick={enter} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04, filter: 'blur(9px)' }} transition={{ duration: .65 }}>
        <div className="stitch-splash-nebula" />
        <div className="stitch-splash-stars" aria-hidden="true">{stars.map((star, index) => <i key={index} className={star.gold ? 'is-gold' : ''} style={{ left: star.left, top: star.top, width: star.size, height: star.size, animationDelay: star.delay }} />)}</div>
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
