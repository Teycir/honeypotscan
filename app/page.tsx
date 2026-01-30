'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatedBackground } from './components/AnimatedBackground';
import { AnimatedTitle } from './components/AnimatedTitle';
import { Footer } from './components/Footer';
import { LoadingScreen } from './components/LoadingScreen';
import { CyclingFeatures } from './components/CyclingFeatures';
import { motion } from 'framer-motion';
import { API_URL } from '@/lib/constants';
import type { ScanResult } from '@/types';

export default function Home() {
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Scan failed');
      }

      router.push(`/scan/${address}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan contract');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LoadingScreen />
      <AnimatedBackground />
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container mx-auto px-4 py-16">
          {/* Source Code Badge */}
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
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-6xl">🛡️</span>
              <AnimatedTitle text="HoneypotScan" />
            </div>
            <motion.p
              className="text-xl text-gray-300 font-bold"
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

        {/* Scan Form */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleScan} className="bg-gray-800 rounded-lg p-8 shadow-2xl">
            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-medium">
                Contract Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="start-btn w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.2)' }}
            >
              {loading ? 'Scanning...' : 'Scan Contract'}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="mt-6 bg-red-900/50 border border-red-500 text-red-200 px-6 py-4 rounded-lg">
              <p className="font-medium">❌ Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-white font-bold mb-2">Instant Results</h3>
            <p className="text-gray-400 text-sm">Scan completes in 2 seconds</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">🌐</div>
            <h3 className="text-white font-bold mb-2">Multi-chain</h3>
            <p className="text-gray-400 text-sm">Ethereum, Polygon, Arbitrum</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="text-white font-bold mb-2">100% Free</h3>
            <p className="text-gray-400 text-sm">No limits, no API keys</p>
          </div>
        </div>
        </div>
        <Footer />
      </main>
    </>
  );
}
