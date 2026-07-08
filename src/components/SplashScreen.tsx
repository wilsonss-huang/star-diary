import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onEnter: () => void;
}

function StarParticle({ index }: { index: number }) {
  const x = ((index * 137 + 50) % 100);
  const y = ((index * 251 + 30) % 100);
  const size = 1 + (index % 3);
  const delay = (index * 0.3) % 5;
  const duration = 2 + (index % 4);

  return (
    <div
      className="absolute rounded-full bg-white"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        opacity: 0,
        animation: `twinkle ${duration}s ${delay}s infinite ease-in-out`,
      }}
    />
  );
}

export default function SplashScreen({ onEnter }: SplashScreenProps) {
  const [phase, setPhase] = useState<'entering' | 'ready'>('entering');
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Phase timing
    const t1 = setTimeout(() => setPhase('ready'), 2500);
    const t2 = setTimeout(() => setShowPrompt(true), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleClick = useCallback(() => {
    if (phase === 'ready') onEnter();
  }, [phase, onEnter]);

  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 z-50 bg-[#060618] flex flex-col items-center justify-center
                   overflow-hidden cursor-pointer"
        onClick={handleClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.8 } }}
      >
        {/* Star particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 80 }).map((_, i) => (
            <StarParticle key={i} index={i} />
          ))}
        </div>

        {/* Floating light orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute w-72 h-72 rounded-full opacity-[0.04]"
            style={{
              background: 'radial-gradient(circle, #6366f1, transparent 70%)',
              top: '20%', left: '10%',
              animation: 'float 8s ease-in-out infinite',
            }}
          />
          <div
            className="absolute w-96 h-96 rounded-full opacity-[0.03]"
            style={{
              background: 'radial-gradient(circle, #a78bfa, transparent 70%)',
              bottom: '10%', right: '5%',
              animation: 'float 10s ease-in-out 2s infinite',
            }}
          />
        </div>

        {/* Main title */}
        <div className="relative">
          {/* Light gleam sweep */}
          <motion.div
            className="absolute inset-0 z-10 pointer-events-none"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ delay: 0.8, duration: 1.2, ease: 'easeInOut' }}
          >
            <div
              className="w-32 h-full"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                transform: 'skewX(-20deg)',
              }}
            />
          </motion.div>

          {/* "STAR" */}
          <motion.h1
            className="text-6xl sm:text-7xl font-light tracking-[0.15em] text-white text-center"
            initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
          >
            STAR
          </motion.h1>

          {/* "DIARY" */}
          <motion.h1
            className="text-6xl sm:text-7xl font-light tracking-[0.15em] text-white text-center mt-2"
            initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, delay: 0.7, ease: 'easeOut' }}
          >
            DIARY
          </motion.h1>

          {/* Shimmer accent line */}
          <motion.div
            className="h-px mx-auto mt-6"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), rgba(167,139,250,0.6), rgba(99,102,241,0.6), transparent)',
            }}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '60%', opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.4, ease: 'easeOut' }}
          />
        </div>

        {/* Subtitle */}
        <motion.p
          className="text-white/20 text-sm mt-8 tracking-widest"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.8 }}
        >
          星空日记
        </motion.p>

        {/* Click to enter prompt */}
        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: showPrompt ? 1 : 0 }}
        >
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center"
              style={{ animation: 'breathe 2s ease-in-out infinite' }}
            >
              <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <span
              className="text-white/25 text-xs tracking-widest"
              style={{ animation: 'breathe 2s ease-in-out 0.5s infinite' }}
            >
              点击任意处进入
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
