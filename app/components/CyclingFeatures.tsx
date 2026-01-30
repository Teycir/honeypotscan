'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const FEATURES = [
  'tx.origin Detection\nERC20 function abuse',
  'Hidden Fee Scanner\nTax function analysis',
  'Transfer Restrictions\nSell blocking detection',
  'Whitelist Analysis\nTransfer permission checks',
  'Sell Tax Detection\n95-100% tax patterns',
  'Multi-chain Support\nEthereum, Polygon, Arbitrum',
  'Smart Caching\n95%+ cache hit rate',
  'Instant Results\n2 second scans',
  '100% Free\nNo API keys needed',
  'Privacy First\nNo tracking or data collection',
  'Source Code Analysis\nVerified contracts only',
  'Pattern Matching\n6+ honeypot signatures',
];

export function CyclingFeatures() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % FEATURES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: '40px', marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 16px' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          style={{ fontSize: '11px', opacity: 0.9, fontWeight: 500, textAlign: 'center', width: '100%', maxWidth: '95%', lineHeight: 1.5, whiteSpace: 'pre-line', wordSpacing: 'normal' }}
        >
          {FEATURES[index].split('').map((char, i) => (
            <motion.span
              key={`${index}-${i}-${char}`}
              style={{ whiteSpace: 'pre' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.15,
                delay: (FEATURES[index].length - 1 - i) * 0.02
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
