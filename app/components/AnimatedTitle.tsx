'use client';

import { motion } from 'framer-motion';
import TextPressure from './TextPressure';

export function AnimatedTitle({ text }: { text: string }) {
  return (
    <motion.h1
      className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 cursor-default"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <TextPressure 
        text={text}
        weight={true}
        alpha={false}
        width={false}
        italic={false}
        textColor="white"
        minFontSize={56}
      />
    </motion.h1>
  );
}
