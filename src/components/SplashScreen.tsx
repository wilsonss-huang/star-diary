import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { gsap } from 'gsap';
import { StarLogo } from './Icons';

interface SplashScreenProps {
  onEnter: () => void;
}

function makeStars(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const glow = index % 11 === 0;
    return {
      x: (index * 137 + 29) % 100,
      y: (index * 251 + 17) % 100,
      size: glow ? 2.4 + (index % 3) * 0.7 : 0.9 + (index % 4) * 0.45,
      delay: (index * 0.17) % 4.5,
      duration: 2.6 + (index % 6) * 0.5,
      glow,
      hue: index % 7 === 0 ? '#9be7ff' : index % 13 === 0 ? '#d7c5ff' : '#ffffff',
    };
  });
}

function StarParticle({ star, index }: { star: ReturnType<typeof makeStars>[number]; index: number }) {
  return (
    <span
      className="splash-star absolute rounded-full"
      style={{
        left: `${star.x}%`,
        top: `${star.y}%`,
        width: star.size,
        height: star.size,
        animationDelay: `${star.delay}s`,
        animationDuration: `${star.duration}s`,
        background: star.hue,
        boxShadow: star.glow
          ? `0 0 22px ${star.hue}, 0 0 46px rgba(99,102,241,0.22)`
          : '0 0 7px rgba(255,255,255,0.45)',
        ['--star-depth' as string]: `${0.62 + (index % 8) * 0.07}`,
      }}
    />
  );
}

export default function SplashScreen({ onEnter }: SplashScreenProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<'entering' | 'ready'>('entering');
  const [showPrompt, setShowPrompt] = useState(false);
  const stars = useMemo(() => makeStars(172), []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

      timeline
        .fromTo('.splash-nebula', { opacity: 0, scale: 1.16 }, { opacity: 1, scale: 1, duration: 1.25 })
        .fromTo('.splash-star', { opacity: 0, scale: 0, z: -180 }, {
          opacity: (index) => (index % 11 === 0 ? 0.92 : 0.42),
          scale: 1,
          z: 0,
          stagger: { amount: 1.2, from: 'random' },
          duration: 1.05,
        }, 0.12)
        .fromTo('.splash-observatory', { opacity: 0, scale: 0.76, filter: 'blur(18px)' }, {
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.28,
        }, 0.6)
        .fromTo('.splash-ring', { opacity: 0, scale: 0.55, rotate: -26 }, {
          opacity: 1,
          scale: 1,
          rotate: 0,
          stagger: 0.13,
          duration: 1.1,
        }, 0.72)
        .fromTo('.splash-core', { opacity: 0, scale: 0.28 }, { opacity: 1, scale: 1, duration: 0.9 }, 1)
        .fromTo('.splash-title span', { yPercent: 118, opacity: 0, filter: 'blur(14px)' }, {
          yPercent: 0,
          opacity: 1,
          filter: 'blur(0px)',
          stagger: 0.055,
          duration: 0.8,
        }, 1.28)
        .fromTo('.splash-subtitle', { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.72 }, 1.95)
        .fromTo('.splash-divider', { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.82 }, 2.08)
        .fromTo('.splash-meta', { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65, stagger: 0.08 }, 2.24)
        .fromTo('.splash-scan', { xPercent: -150, opacity: 0 }, { xPercent: 150, opacity: 1, duration: 1.15 }, 2.36)
        .to('.splash-camera', { scale: 1.035, duration: 3.6, ease: 'sine.inOut' }, 0);

      gsap.to('.splash-ring', {
        rotate: 360,
        duration: 22,
        repeat: -1,
        ease: 'none',
        stagger: 1.8,
      });

      gsap.to('.splash-core', {
        scale: 1.08,
        duration: 1.9,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }, rootRef);

    const readyTimer = window.setTimeout(() => setPhase('ready'), 2900);
    const promptTimer = window.setTimeout(() => setShowPrompt(true), 3300);

    return () => {
      ctx.revert();
      window.clearTimeout(readyTimer);
      window.clearTimeout(promptTimer);
    };
  }, []);

  const handleEnter = useCallback(() => {
    if (phase === 'ready') onEnter();
  }, [phase, onEnter]);

  return (
    <AnimatePresence>
      <motion.div
        ref={rootRef}
        className="absolute inset-0 z-50 overflow-hidden bg-[#02030b] text-white cursor-pointer select-none"
        onClick={handleEnter}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.03, filter: 'blur(10px)', transition: { duration: 0.75, ease: 'easeInOut' } }}
      >
        <div className="splash-camera absolute inset-0 will-change-transform">
          <div className="splash-nebula absolute inset-0 pointer-events-none" />
          <div className="splash-grid absolute inset-0 pointer-events-none" />

          <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: 900 }}>
            {stars.map((star, index) => (
              <StarParticle key={index} star={star} index={index} />
            ))}
          </div>

          <div className="splash-comet splash-comet-a" />
          <div className="splash-comet splash-comet-b" />
          <div className="splash-comet splash-comet-c" />
          <div className="splash-light-ribbon splash-light-ribbon-a" />
          <div className="splash-light-ribbon splash-light-ribbon-b" />
          <div className="splash-light-ribbon splash-light-ribbon-c" />

          <main className="relative z-10 flex h-full flex-col items-center justify-center px-6">
            <section className="relative flex flex-col items-center text-center">
              <div className="splash-observatory relative mb-0 flex h-[170px] w-[170px] items-center justify-center sm:h-[218px] sm:w-[218px]">
                <div className="splash-ring absolute h-full w-full rounded-full" />
                <div className="splash-ring absolute h-[82%] w-[82%] rounded-full" />
                <div className="splash-ring absolute h-[62%] w-[62%] rounded-full" />
                <div className="splash-ring absolute h-[42%] w-[42%] rounded-full" />
                <div className="splash-scope-line absolute h-px w-[136%]" />
                <div className="splash-scope-line absolute h-px w-[136%] rotate-90" />
                <div className="splash-core relative h-20 w-20 sm:h-24 sm:w-24">
                  <div className="absolute inset-[-38%] rounded-full bg-cyan-200/10 blur-2xl" />
                  <div className="absolute inset-0 rounded-full border border-white/18 bg-[#0a1028]/80 shadow-[0_0_52px_rgba(125,211,252,0.25)]" />
                  <div className="absolute inset-[18%] rounded-full border border-white/12 bg-white/[0.035]" />
                  <StarLogo
                    size={42}
                    className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-white/88 drop-shadow-[0_0_18px_rgba(224,242,254,0.72)]"
                  />
                  <div className="absolute left-1/2 top-[13%] h-[74%] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/70 to-transparent" />
                  <div className="absolute left-[13%] top-1/2 h-px w-[74%] -translate-y-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                </div>
              </div>

              <div className="relative">
                <div className="splash-scan pointer-events-none absolute -inset-x-12 inset-y-0 opacity-0">
                  <div className="h-full w-32 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                </div>
                <h1 className="splash-title splash-title-segmented overflow-visible pb-5 text-[3.7rem] font-semibold leading-[1.08] tracking-[0.01em] sm:text-[7.2rem]">
                  {'Star'.split('').map((letter, index) => (
                    <span key={`${letter}-${index}`} className="inline-block">{letter}</span>
                  ))}
                  {'Diary'.split('').map((letter, index) => (
                    <span key={`${letter}-${index}`} className="inline-block">{letter}</span>
                  ))}
                </h1>
              </div>

              <div className="splash-divider mx-auto mt-8 h-px w-72 origin-center bg-gradient-to-r from-transparent via-cyan-100/65 to-transparent" />
              <p className="splash-subtitle mt-5 text-sm tracking-[0.45em] text-white/48">
                星空日记
              </p>
              <div className="mt-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-white/22">
                <span className="splash-meta">private memory atlas</span>
                <span className="splash-meta h-1 w-1 rounded-full bg-white/28" />
                <span className="splash-meta">2026</span>
              </div>
            </section>
          </main>
        </div>

        <motion.div
          className="absolute bottom-10 left-1/2 z-20 -translate-x-1/2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: showPrompt ? 1 : 0, y: showPrompt ? 0 : 8 }}
          transition={{ duration: 0.55 }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="splash-enter-button flex h-12 w-12 items-center justify-center rounded-full border border-white/16 bg-white/[0.045] shadow-[0_0_34px_rgba(125,211,252,0.18)] backdrop-blur-xl">
              <ArrowRight size={19} strokeWidth={1.5} className="text-white/62" />
            </div>
            <span className="text-xs tracking-[0.34em] text-white/34">
              点击任意处进入
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
