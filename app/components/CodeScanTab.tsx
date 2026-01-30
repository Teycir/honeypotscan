'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeContractCode, formatCodeStats } from '@/lib/sanitizer';
import { detectHoneypot } from '@/lib/detector';

interface ScanResult {
  isHoneypot: boolean;
  confidence: number;
  patterns: Array<{ name: string; line: number; code: string }>;
  message: string;
}

export function CodeScanTab() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);

  const stats = formatCodeStats(code);

  const handleCodeChange = useCallback((value: string) => {
    setCode(value);
    setError('');
    setResult(null);
    
    // Live validation feedback
    if (value.trim()) {
      const { isValid, error: valError } = sanitizeContractCode(value);
      setValidationError(isValid ? '' : (valError || ''));
    } else {
      setValidationError('');
    }
  }, []);

  const handleClear = () => {
    setCode('');
    setError('');
    setValidationError('');
    setResult(null);
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    const { sanitized, isValid, error: sanitizeError } = sanitizeContractCode(code);

    if (!isValid) {
      setError(sanitizeError || 'Invalid contract code');
      setLoading(false);
      return;
    }

    try {
      // Use local detection since we have the code directly
      const detection = detectHoneypot(sanitized);
      
      const confidence = detection.isHoneypot 
        ? Math.min(95, 60 + detection.patterns.length * 10)
        : Math.max(70, 95 - detection.patterns.length * 5);

      setResult({
        isHoneypot: detection.isHoneypot,
        confidence,
        patterns: detection.patterns,
        message: detection.isHoneypot
          ? `Detected ${detection.patterns.length} suspicious pattern(s) in the contract code.`
          : 'No honeypot patterns detected in the contract code.',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze contract code');
    } finally {
      setLoading(false);
    }
  };

  const isValid = code.trim() && !validationError;

  return (
    <div role="tabpanel" id="panel-code" aria-labelledby="tab-code">
      <form onSubmit={handleScan}>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-gray-300 font-medium text-sm">
              Solidity Contract Code
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                {stats.lines} lines • {stats.chars.toLocaleString()} chars
              </span>
              {code && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          
          <div className="relative">
            <textarea
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="// Paste your Solidity contract code here...
pragma solidity ^0.8.0;

contract MyToken {
    // Contract code...
}"
              className={`w-full h-64 px-3 py-3 bg-gray-700 text-white text-sm font-mono rounded-lg focus:ring-2 outline-none transition-all resize-none ${
                validationError
                  ? 'border border-red-500 focus:ring-red-500'
                  : isValid
                  ? 'border border-green-500 focus:ring-green-500'
                  : 'focus:ring-blue-500'
              }`}
              spellCheck={false}
            />
            {isValid && (
              <span className="absolute right-3 top-3 text-green-400 text-sm">✓</span>
            )}
          </div>

          {validationError && (
            <p className="mt-2 text-xs text-red-400">{validationError}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !isValid}
          className="start-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          style={{ boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.2)' }}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing...
            </>
          ) : (
            'Scan Code'
          )}
        </button>
      </form>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 bg-red-900/50 border border-red-500 text-red-200 px-6 py-4 rounded-lg"
          >
            <p className="font-medium">❌ Error</p>
            <p className="text-sm mt-1">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`mt-6 p-6 rounded-lg border-2 ${
              result.isHoneypot
                ? 'bg-red-900/30 border-red-500'
                : 'bg-green-900/30 border-green-500'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">
                  {result.isHoneypot ? '🚨 HONEYPOT DETECTED' : '✅ SAFE CONTRACT'}
                </h3>
                <p className="text-sm text-gray-300">
                  Direct code analysis
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                result.isHoneypot ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
              }`}>
                {result.confidence}% confidence
              </span>
            </div>

            <p className={`text-sm mb-4 ${
              result.isHoneypot ? 'text-red-200' : 'text-green-200'
            }`}>
              {result.message}
            </p>

            {result.patterns.length > 0 && (
              <div className="bg-black/30 rounded p-3 space-y-2">
                <p className="text-xs font-bold text-red-300 uppercase">Detected Patterns:</p>
                {result.patterns.map((pattern, i) => (
                  <div key={i} className="text-xs text-gray-300">
                    <span className="font-mono text-red-400">{pattern.name}</span>
                    <span className="text-gray-500"> (line {pattern.line})</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
