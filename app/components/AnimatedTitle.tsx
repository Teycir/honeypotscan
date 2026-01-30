'use client';

import { motion } from 'framer-motion';

export function AnimatedTitle({ text }: { text: string }) {
  const chars = text.split('').map((char, i) => ({ char, id: `${char}-${i}` }));

  return (
    <motion.h1
      className="text-6xl font-bold text-white mb-4 cursor-default"
      initial="hidden"
      animate="visible"
      whileHover={{
        scale: 1.05,
        textShadow: '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.4)',
        transition: { duration: 0.3 }
      }}
    >
      {chars.map((item, i) => (
        <motion.span
          key={item.id}
          className="inline-block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.1,
            delay: i * 0.05
          }}
          whileHover={{
            y: -2,
            color: '#ffffff',
            textShadow: '0 0 10px rgba(255, 255, 255, 1)',
            transition: { duration: 0.2 }
          }}
        >
          {item.char === ' ' ? '\u00A0' : item.char}
        </motion.span>
      ))}
    </motion.h1>
  );
}
