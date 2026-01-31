'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback, memo } from 'react';

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

// Memoized feature display component - animates the whole text block instead of per-character
const FeatureDisplay = memo(function FeatureDisplay({ text, index }: { text: string; index: number }) {
  return (
    <motion.div
      key={index}
      style={{
        fontSize: '11px',
        opacity: 0.9,
        fontWeight: 500,
        textAlign: 'center',
        width: '100%',
        maxWidth: '95%',
        lineHeight: 1.5,
        whiteSpace: 'pre-line',
        wordSpacing: 'normal'
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {text}
    </motion.div>
  );
});

export function CyclingFeatures() {
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Clear any existing interval
    cleanup();

    // Use visibility API to pause when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cleanup();
      } else {
        intervalRef.current = setInterval(() => {
          setIndex((prev) => (prev + 1) % FEATURES.length);
        }, 4000);
      }
    };

    // Start interval
    intervalRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % FEATURES.length);
    }, 4000);

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cleanup();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [mounted, cleanup]);

  // Render static content on server to avoid hydration mismatch
  if (!mounted) {
    return (
      <div style={{ minHeight: '40px', marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 16px' }}>
        <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: 500, textAlign: 'center', width: '100%', maxWidth: '95%', lineHeight: 1.5, whiteSpace: 'pre-line', wordSpacing: 'normal' }}>
          {FEATURES[0] ?? ''}
        </div>
      </div>
    );
  }

  const currentFeature = FEATURES[index] ?? FEATURES[0] ?? '';
  
  return (
    <div style={{ minHeight: '40px', marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 16px' }}>
      <AnimatePresence mode="wait">
        <FeatureDisplay text={currentFeature} index={index} />
      </AnimatePresence>
    </div>
  );
}
