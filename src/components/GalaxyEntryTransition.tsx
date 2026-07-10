import { motion } from 'framer-motion';

interface GalaxyEntryTransitionProps {
  hasStars: boolean;
}

export default function GalaxyEntryTransition({ hasStars }: GalaxyEntryTransitionProps) {
  return (
    <motion.div
      className="galaxy-entry fixed inset-0 z-40 overflow-hidden bg-black pointer-events-none"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 4.25, duration: 1.15, ease: 'easeInOut' }}
    >
      <motion.div
        className="galaxy-entry-flight absolute inset-[-16%]"
        initial={{ scale: 1.25, rotate: -8, x: '-10%' }}
        animate={{ scale: 0.92, rotate: 0, x: '0%' }}
        transition={{ duration: 4.6, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div
        className="galaxy-entry-core absolute left-1/2 top-1/2 h-[34vmin] w-[34vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{ opacity: [0, 0.8, 0.28], scale: [0.2, 1.08, 2.5] }}
        transition={{ duration: 4.4, ease: 'easeInOut' }}
      />
      <motion.div
        className="galaxy-entry-vignette absolute inset-0"
        initial={{ opacity: 0.95 }}
        animate={{ opacity: 0.22 }}
        transition={{ duration: 4.2, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute bottom-[13%] left-1/2 w-full -translate-x-1/2 text-center"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: [0, 1, 1, 0], y: [14, 0, 0, -10] }}
        transition={{ duration: 4.2, times: [0, 0.2, 0.75, 1], ease: 'easeInOut' }}
      >
        <p className="text-[12px] uppercase tracking-[0.34em] text-cyan-100/36">entering private atlas</p>
        <p className="mt-3 text-sm tracking-[0.18em] text-white/55">
          {hasStars ? '正在靠近你点亮的日记星系' : '正在穿过第一片流动星河'}
        </p>
      </motion.div>
    </motion.div>
  );
}
