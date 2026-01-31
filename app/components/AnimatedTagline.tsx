'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function AnimatedTagline({ text }: { text: string }) {
  const [mounted, setMounted] = useState(false);
  const chars = text.split('');

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <p className="text-base sm:text-lg text-gray-300 cursor-default">
        {text}
      </p>
    );
  }

  return (
    <motion.p
      className="text-base sm:text-lg text-gray-300 cursor-default inline-block"
      initial={false}
      whileHover={{
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
