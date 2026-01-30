'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedBackground } from './components/AnimatedBackground';
import { AnimatedTitle } from './components/AnimatedTitle';
import { Footer } from './components/Footer';
import { LoadingScreen } from './components/LoadingScreen';
import { CyclingFeatures } from './components/CyclingFeatures';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '@/lib/constants';

const DEMO_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export default function Home() {
  const router = useRouter();
  const [addresses, setAddresses] = useState(['', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedInputs, setExpandedInputs] = useState([true, false, false]);
  const [validationErrors, setValidationErrors] = useState<string[]>(['', '', '']);

  const validateAddress = (address: string, index: number) => {
    if (!address.trim()) {
      const newErrors = [...validationErrors];
      newErrors[index] = '';
      setValidationErrors(newErrors);
      return;
    }

    const newErrors = [...validationErrors];
    if (!isValidEthereumAddress(address.trim())) {
      newErrors[index] = 'Invalid Ethereum address format';
    } else {
      newErrors[index] = '';
    }
    setValidationErrors(newErrors);
  };

  const handleAddressChange = (value: string, index: number) => {
    const trimmed = value.trim();
    const newAddrs = [...addresses];
    newAddrs[index] = trimmed;
    setAddresses(newAddrs);
    validateAddress(trimmed, index);
  };

  const handlePaste = async (index: number) => {
    try {
      const text = await navigator.clipboard.readText();
      handleAddressChange(text, index);
      if (!expandedInputs[index]) {
        const newExpanded = [...expandedInputs];
        newExpanded[index] = true;
        setExpandedInputs(newExpanded);
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const handleDemo = () => {
    const newAddrs = [...addresses];
    newAddrs[0] = DEMO_ADDRESS;
    setAddresses(newAddrs);
    validateAddress(DEMO_ADDRESS, 0);
    const newExpanded = [...expandedInputs];
    newExpanded[0] = true;
    setExpandedInputs(newExpanded);
  };

  const handleClearAll = () => {
    setAddresses(['', '', '']);
    setValidationErrors(['', '', '']);
    setError('');
  };

  const hasValidAddresses = addresses.some((addr, i) => 
    addr.trim() && !validationErrors[i]
  );

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const validAddresses = addresses.filter((a, i) => a.trim() && !validationErrors[i]);
    if (validAddresses.length === 0) {
      setError('Please enter at least one valid contract address');
      setLoading(false);
      return;
    }

    try {
      await Promise.all(
        validAddresses.map(addr => 
          fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: addr }),
          }).then(r => r.json())
        )
      );

      if (validAddresses.length === 1) {
        router.push(`/scan/${validAddresses[0]}`);
      } else {
        router.push(`/batch/${validAddresses.join(',')}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan contracts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filledCount = addresses.filter(a => a.trim()).length;

  return (
    <>
      <LoadingScreen />
      <AnimatedBackground />
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 16, zIndex: 10 }}>
            <a
              href="https://github.com/Teycir/honeypotscan#readme"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', textDecoration: 'none', borderRadius: 10, fontSize: 10, fontWeight: 600, border: '1px solid rgba(255, 255, 255, 0.2)', transition: 'transform 0.2s, background 0.2s', whiteSpace: 'nowrap' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Source Code
            </a>
          </div>
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <AnimatedTitle text="HoneypotScan" />
            </div>
            <motion.p
              className="text-lg sm:text-xl text-gray-300 font-bold px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{
                scale: 1.05,
                textShadow: '0 0 20px rgba(255, 255, 255, 0.8)',
                transition: { duration: 0.3 }
              }}
            >
              Check if a token is a scam before you buy
            </motion.p>
            <p className="text-sm text-gray-400 mt-2">
              Free • Fast • Accurate
            </p>
            <CyclingFeatures />
          </div>

        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleScan} className="bg-gray-800 rounded-lg p-4 sm:p-6 lg:p-8 shadow-2xl">
            <div className="mb-6 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
                <label className="block text-gray-300 font-medium text-sm sm:text-base">
                  Contract Addresses (up to 3)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDemo}
                    className="text-xs px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded transition"
                  >
                    Try Demo
                  </button>
                  {filledCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-xs px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
              {addresses.map((addr, i) => {
                const isValid = addr.trim() && !validationErrors[i];
                const hasContent = addr.trim();
                
                return (
                  <div key={i} className="border border-gray-700 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        const newExpanded = [...expandedInputs];
                        newExpanded[i] = !newExpanded[i];
                        setExpandedInputs(newExpanded);
                      }}
                      className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800 hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300 font-medium text-sm sm:text-base">Contract {i + 1}</span>
                        {hasContent && !expandedInputs[i] && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            isValid 
                              ? 'bg-green-600/20 text-green-400' 
                              : 'bg-red-600/20 text-red-400'
                          }`}>
                            {isValid ? '✓ Valid' : '⚠ Invalid'}
                          </span>
                        )}
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${expandedInputs[i] ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <AnimatePresence>
                      {expandedInputs[i] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-gray-800">
                            <div className="relative">
                              <input
                                type="text"
                                value={addr}
                                onChange={(e) => handleAddressChange(e.target.value, i)}
                                placeholder="0x1234...abcd (42 characters)"
                                className={`w-full px-4 py-3 pr-24 bg-gray-700 text-white rounded-lg focus:ring-2 outline-none transition-all ${
                                  validationErrors[i] 
                                    ? 'border-2 border-red-500 focus:ring-red-500' 
                                    : isValid
                                    ? 'border-2 border-green-500 focus:ring-green-500'
                                    : 'focus:ring-blue-500'
                                }`}
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                {isValid && (
                                  <span className="text-green-400 text-lg">✓</span>
                                )}
                                {addr && (
                                  <button
                                    type="button"
                                    onClick={() => handleAddressChange('', i)}
                                    className="text-gray-400 hover:text-white transition"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </div>
                            {validationErrors[i] && (
                              <motion.p
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-red-400 text-xs mt-2"
                              >
                                {validationErrors[i]}
                              </motion.p>
                            )}
                            {addr.trim() && !validationErrors[i] && (
                              <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-gray-400 text-xs mt-2"
                              >
                                {addr.length}/42 characters
                              </motion.p>
                            )}
                            <button
                              type="button"
                              onClick={() => handlePaste(i)}
                              className="mt-2 text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              Paste
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={loading || !hasValidAddresses}
              className="start-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
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
                <>
                  Scan {filledCount > 0 ? `Contract${filledCount > 1 ? 's' : ''}` : 'Contract'}
                </>
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
        </div>

        </div>
        <Footer />
      </main>
    </>
  );
}
