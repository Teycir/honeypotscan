'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '@/lib/constants';
import { validateAddress as validateEthAddress } from '@/lib/validator';

interface ScanResult {
  address: string;
  isHoneypot: boolean;
  confidence: number;
  patterns: Array<{ name: string; line: number; code: string }>;
  chain: string;
  message: string;
}

export function AddressScanTab() {
  const [addresses, setAddresses] = useState(['', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>(['', '', '']);
  const [results, setResults] = useState<ScanResult[]>([]);

  const validateAddress = (address: string, index: number) => {
    if (!address.trim()) {
      const newErrors = [...validationErrors];
      newErrors[index] = '';
      setValidationErrors(newErrors);
      return;
    }

    const newErrors = [...validationErrors];
    const validation = validateEthAddress(address.trim());
    newErrors[index] = validation.valid ? '' : (validation.error || 'Invalid address');
    setValidationErrors(newErrors);
  };

  const handleAddressChange = (value: string, index: number) => {
    const trimmed = value.trim();
    const newAddrs = [...addresses];
    newAddrs[index] = trimmed;
    setAddresses(newAddrs);
    validateAddress(trimmed, index);
  };

  const handleClearAll = () => {
    setAddresses(['', '', '']);
    setValidationErrors(['', '', '']);
    setError('');
    setResults([]);
  };

  const hasValidAddresses = addresses.some((addr, i) => 
    addr.trim() && !validationErrors[i]
  );

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

    try {
      const scanResults = await Promise.all(
        validAddresses.map(async (addr) => {
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: addr }),
          });
          const data = await response.json();
          return { address: addr, ...data };
        })
      );

      setResults(scanResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan contracts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filledCount = addresses.filter(a => a.trim()).length;

  return (
    <div role="tabpanel" id="panel-address" aria-labelledby="tab-address">
      <form onSubmit={handleScan}>
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-gray-300 font-medium text-sm">
              Contract Addresses (up to 3)
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
            
            return (
              <div key={i} className="relative">
                <input
                  type="text"
                  value={addr}
                  onChange={(e) => handleAddressChange(e.target.value, i)}
                  placeholder={`Contract ${i + 1}: 0x...`}
                  className={`w-full px-3 py-2 pr-10 bg-gray-700 text-white text-sm rounded-lg focus:ring-2 outline-none transition-all ${
                    validationErrors[i] 
                      ? 'border border-red-500 focus:ring-red-500' 
                      : isValid
                      ? 'border border-green-500 focus:ring-green-500'
                      : 'focus:ring-blue-500'
                  }`}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {isValid && <span className="text-green-400 text-sm">✓</span>}
                  {addr && (
                    <button
                      type="button"
                      onClick={() => handleAddressChange('', i)}
                      className="text-gray-400 hover:text-white transition text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
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
              Scanning...
            </>
          ) : (
            'Scan'
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
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-8 space-y-4"
          >
            {results.map((result, idx) => (
              <motion.div
                key={result.address}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-6 rounded-lg border-2 ${
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
                    <p className="text-sm text-gray-300 font-mono break-all">
                      {result.address}
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

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="capitalize">Chain: {result.chain}</span>
                  {result.patterns.length > 0 && (
                    <span>Patterns: {result.patterns.length}</span>
                  )}
                </div>

                {result.patterns.length > 0 && (
                  <div className="mt-4 bg-black/30 rounded p-3 space-y-2">
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
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
