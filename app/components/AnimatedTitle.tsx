'use client';

import { motion } from 'framer-motion';
import { ScrambleText } from './ScrambleText';

export function AnimatedTitle({ text }: { text: string }) {
  return (
    <motion.h1
      className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 cursor-default"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{
        scale: 1.05,
        textShadow: '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.4)',
        transition: { duration: 0.3 }
      }}
    >
      <ScrambleText text={text} speed={40} maxIterations={12} />
    </motion.h1>
  );
}
