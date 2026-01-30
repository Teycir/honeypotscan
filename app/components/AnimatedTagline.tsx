'use client';

import { motion } from 'framer-motion';

export function AnimatedTagline({ text }: { text: string }) {
  const chars = text.split('');

  return (
    <motion.p
      className="text-base sm:text-lg text-gray-300 cursor-default group relative"
      initial="hidden"
      animate="visible"
      whileHover={{
        scale: 1.05,
        textShadow: '0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.4)',
        transition: { duration: 0.3 }
      }}
    >
      {chars.map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.1,
            delay: (chars.length - 1 - i) * 0.05
          }}
          whileHover={{
            y: -2,
            color: '#60a5fa',
            textShadow: '0 0 10px rgba(96, 165, 250, 1)',
            transition: { duration: 0.2 }
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.p>
  );
}
