'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL, SECURITY_LIMITS } from '@/lib/constants';
import { validateAddress as validateEthAddress } from '@/lib/validator';

interface ScanResult {
  address: string;
  isHoneypot: boolean;
  confidence: number;
  patterns: Array<{ name: string; line: number; code: string }>;
  chain: string;
  message: string;
  error?: string;
}

interface ScanProgress {
  current: number;
  total: number;
  currentAddress: string;
}

const ETHERSCAN_URLS: Record<string, string> = {
  ethereum: 'https://etherscan.io/address/',
  polygon: 'https://polygonscan.com/address/',
  arbitrum: 'https://arbiscan.io/address/',
};

const SCAN_TIMEOUT = 30000; // 30 seconds per address
const MAX_ADDRESSES = SECURITY_LIMITS.MAX_ADDRESSES_PER_BATCH;

// Create initial state arrays based on max addresses
const createEmptyArray = () => Array(MAX_ADDRESSES).fill('');

export function AddressScanTab() {
  const [addresses, setAddresses] = useState(createEmptyArray);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>(createEmptyArray);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const validateAddress = useCallback((address: string, index: number) => {
    if (!address.trim()) {
      setValidationErrors(prev => {
        const newErrors = [...prev];
        newErrors[index] = '';
        return newErrors;
      });
      return;
    }

    setValidationErrors(prev => {
      const newErrors = [...prev];
      const validation = validateEthAddress(address.trim());
      newErrors[index] = validation.valid ? '' : (validation.error || 'Invalid address');
      return newErrors;
    });
  }, []);

  const handleAddressChange = useCallback((value: string, index: number) => {
    const trimmed = value.trim();
    setAddresses(prev => {
      const newAddrs = [...prev];
      newAddrs[index] = trimmed;
      return newAddrs;
    });
    validateAddress(trimmed, index);
  }, [validateAddress]);

  const handleClearAll = useCallback(() => {
    setAddresses(createEmptyArray());
    setValidationErrors(createEmptyArray());
    setError('');
    setResults([]);
    setProgress(null);
  }, []);

  const handleCopyAddress = useCallback(async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch {
      // Clipboard API not available
    }
  }, []);

  const hasValidAddresses = addresses.some((addr, i) => 
    addr.trim() && !validationErrors[i]
  );

  const scanSingleAddress = async (addr: string, signal: AbortSignal): Promise<ScanResult> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SCAN_TIMEOUT);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr }),
        signal: signal.aborted ? signal : controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          address: addr,
          isHoneypot: false,
          confidence: 0,
          patterns: [],
          chain: 'unknown',
          message: '',
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return { address: addr, ...data };
    } catch (err) {
      clearTimeout(timeoutId);
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          return {
            address: addr,
            isHoneypot: false,
            confidence: 0,
            patterns: [],
            chain: 'unknown',
            message: '',
            error: 'Request timed out. Please try again.',
          };
        }
        return {
          address: addr,
          isHoneypot: false,
          confidence: 0,
          patterns: [],
          chain: 'unknown',
          message: '',
          error: err.message === 'Failed to fetch' 
            ? 'Network error. Please check your connection.' 
            : err.message,
        };
      }
      return {
        address: addr,
        isHoneypot: false,
        confidence: 0,
        patterns: [],
        chain: 'unknown',
        message: '',
        error: 'An unexpected error occurred.',
      };
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults([]);

    const validAddresses = addresses.filter((a, i) => a.trim() && !validationErrors[i]);
    if (validAddresses.length === 0) {
      setError('Please enter at least one valid contract address');
      setLoading(false);
      return;
    }

    const abortController = new AbortController();
    const scanResults: ScanResult[] = [];

    try {
      for (let i = 0; i < validAddresses.length; i++) {
        const addr = validAddresses[i];
        setProgress({
          current: i + 1,
          total: validAddresses.length,
          currentAddress: addr,
        });

        const result = await scanSingleAddress(addr, abortController.signal);
        scanResults.push(result);
        
        // Update results progressively
        setResults([...scanResults]);
      }
    } catch {
      setError('Scan was interrupted. Please try again.');
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  const filledCount = addresses.filter(a => a.trim()).length;
  const successfulResults = results.filter(r => !r.error);
  const honeypotCount = successfulResults.filter(r => r.isHoneypot).length;
  const safeCount = successfulResults.filter(r => !r.isHoneypot).length;

  return (
    <div role="tabpanel" id="panel-address" aria-labelledby="tab-address">
      <form onSubmit={handleScan}>
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-gray-300 font-medium text-sm">
              Contract Addresses (up to {MAX_ADDRESSES})
            </label>
            {filledCount > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition"
              >
                Clear
              </button>
            )}
          </div>
          {addresses.map((addr, i) => {
            const isValid = addr.trim() && !validationErrors[i];
            const hasError = !!validationErrors[i];
            
            return (
              <div key={i} className="relative group">
                <input
                  type="text"
                  value={addr}
                  onChange={(e) => handleAddressChange(e.target.value, i)}
                  placeholder={`Contract ${i + 1}: 0x...`}
                  disabled={loading}
                  className={`w-full px-3 py-2.5 pr-20 bg-gray-700/80 text-white text-sm rounded-lg focus:ring-2 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    hasError 
                      ? 'border border-red-500 focus:ring-red-500' 
                      : isValid
                      ? 'border border-green-500 focus:ring-green-500'
                      : 'border border-transparent focus:ring-blue-500 hover:border-gray-600'
                  }`}
                  aria-invalid={hasError}
                  aria-describedby={hasError ? `error-${i}` : undefined}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {isValid && (
                    <>
                      <span className="text-green-400 text-sm" title="Valid address">✓</span>
                      <button
                        type="button"
                        onClick={() => handleCopyAddress(addr)}
                        className="text-gray-400 hover:text-blue-400 transition text-xs p-1 opacity-0 group-hover:opacity-100"
                        title="Copy address"
                      >
                        {copiedAddress === addr ? '✓' : '📋'}
                      </button>
                    </>
                  )}
                  {addr && (
                    <button
                      type="button"
                      onClick={() => handleAddressChange('', i)}
                      disabled={loading}
                      className="text-gray-400 hover:text-white transition text-sm p-1 disabled:opacity-50"
                      title="Clear"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {hasError && (
                  <p id={`error-${i}`} className="text-xs text-red-400 mt-1 ml-1">
                    {validationErrors[i]}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={loading || !hasValidAddresses}
          className="start-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          style={{ boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.2)' }}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {progress ? (
                <span>Scanning {progress.current}/{progress.total}...</span>
              ) : (
                <span>Scanning...</span>
              )}
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Scan {filledCount > 0 ? `(${filledCount})` : ''}
            </>
          )}
        </button>
        <p className="mt-2 text-center text-xs text-gray-500/70">
          Scans Solidity contracts via Etherscan API on Ethereum, Polygon, and Arbitrum
        </p>
      </form>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-6 bg-red-900/50 border border-red-500 text-red-200 px-6 py-4 rounded-lg"
            role="alert"
          >
            <p className="font-medium flex items-center gap-2">
              <span>❌</span> Error
            </p>
            <p className="text-sm mt-1">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-8 space-y-4"
          >
            {/* Summary Banner */}
            {successfulResults.length > 1 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-4 p-3 bg-gray-800/50 rounded-lg text-sm"
              >
                <span className="text-gray-400">Results:</span>
                {honeypotCount > 0 && (
                  <span className="text-red-400 font-medium">
                    🚨 {honeypotCount} Honeypot{honeypotCount > 1 ? 's' : ''}
                  </span>
                )}
                {safeCount > 0 && (
                  <span className="text-green-400 font-medium">
                    ✅ {safeCount} Safe
                  </span>
                )}
              </motion.div>
            )}

            {results.map((result, idx) => (
              <motion.div
                key={result.address}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-6 rounded-lg border-2 ${
                  result.error
                    ? 'bg-yellow-900/20 border-yellow-500/50'
                    : result.isHoneypot
                    ? 'bg-red-900/30 border-red-500'
                    : 'bg-green-900/30 border-green-500'
                }`}
              >
                {result.error ? (
                  // Error state
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
                        <span>⚠️</span> Scan Failed
                      </h3>
                    </div>
                    <p className="text-sm text-gray-300 font-mono break-all mb-2">
                      {result.address}
                    </p>
                    <p className="text-sm text-yellow-200">{result.error}</p>
                  </div>
                ) : (
                  // Success state
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                          {result.isHoneypot ? (
                            <>
                              <span className="text-2xl">🚨</span>
                              <span className="text-red-400">HONEYPOT DETECTED</span>
                            </>
                          ) : (
                            <>
                              <span className="text-2xl">✅</span>
                              <span className="text-green-400">SAFE CONTRACT</span>
                            </>
                          )}
                        </h3>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-300 font-mono break-all">
                            {result.address}
                          </p>
                          <button
                            onClick={() => handleCopyAddress(result.address)}
                            className="text-gray-400 hover:text-blue-400 transition text-xs shrink-0"
                            title="Copy address"
                          >
                            {copiedAddress === result.address ? '✓' : '📋'}
                          </button>
                          {ETHERSCAN_URLS[result.chain] && (
                            <a
                              href={`${ETHERSCAN_URLS[result.chain]}${result.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-blue-400 transition text-xs shrink-0"
                              title="View on Explorer"
                            >
                              🔗
                            </a>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
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

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span className="bg-gray-700/50 px-2 py-1 rounded capitalize">
                        Chain: {result.chain}
                      </span>
                      {result.patterns.length > 0 && (
                        <span className="bg-red-900/30 text-red-300 px-2 py-1 rounded">
                          {result.patterns.length} Pattern{result.patterns.length > 1 ? 's' : ''} Found
                        </span>
                      )}
                    </div>

                    {result.patterns.length > 0 && (
                      <details className="mt-4">
                        <summary className="cursor-pointer text-xs font-bold text-red-300 uppercase hover:text-red-200 transition">
                          View Detected Patterns ({result.patterns.length})
                        </summary>
                        <div className="mt-3 bg-black/30 rounded p-3 space-y-2">
                          {result.patterns.map((pattern, i) => (
                            <div key={i} className="text-xs text-gray-300 flex items-start gap-2">
                              <span className="text-red-400">•</span>
                              <div>
                                <span className="font-mono text-red-400">{pattern.name}</span>
                                <span className="text-gray-500 ml-2">(line {pattern.line})</span>
                                {pattern.code && (
                                  <pre className="mt-1 text-gray-500 text-[10px] overflow-x-auto max-w-full">
                                    {pattern.code.substring(0, 80)}...
                                  </pre>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {result.isHoneypot && (
                      <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
                        <p className="text-xs text-red-200 font-medium">
                          ⚠️ <strong>Warning:</strong> This contract contains patterns commonly found in honeypot scams. 
                          Do not buy or interact with this token.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
