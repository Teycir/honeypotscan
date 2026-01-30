'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedBackground } from './components/AnimatedBackground';
import { Footer } from './components/Footer';
import { LoadingScreen } from './components/LoadingScreen';
import { CyclingFeatures } from './components/CyclingFeatures';
import StackedTitle from './components/StackedTitle';
import { AnimatedTagline } from './components/AnimatedTagline';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '@/lib/constants';
import { validateAddress as validateEthAddress } from '@/lib/validator';

export default function Home() {
  const router = useRouter();
  const [addresses, setAddresses] = useState(['', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>(['', '', '']);

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
      <main className="min-h-screen pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <h1 className="text-5xl sm:text-6xl font-bold text-white mb-2">
                <StackedTitle text="HoneypotScan" className="text-white" />
              </h1>
            </div>

            <AnimatedTagline text="Check if a token is a scam before you buy" />
            <CyclingFeatures />
          </div>

        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleScan} className="bg-gray-800 rounded-lg p-4 sm:p-6 shadow-2xl">
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
        </div>

        </div>
        <Footer />
      </main>
    </>
  );
}
