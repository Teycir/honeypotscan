'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatedBackground } from '../../components/AnimatedBackground';
import { Footer } from '../../components/Footer';
import { LoadingScreen } from '../../components/LoadingScreen';
import { motion } from 'framer-motion';
import { API_URL } from '@/lib/constants';
import type { ScanResult } from '@/types';

export default function ScanResultPage() {
  const params = useParams();
  const router = useRouter();
  const address = params.address as string;
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchScan = async () => {
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

        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to scan contract');
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchScan();
    }
  }, [address]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = result?.isHoneypot 
    ? `⚠️ HONEYPOT DETECTED: ${address.slice(0, 10)}... - DO NOT BUY!`
    : `✅ Safe Contract: ${address.slice(0, 10)}... - Scan passed`;

  return (
    <>
      <LoadingScreen />
      <AnimatedBackground />
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <button
              onClick={() => router.push('/')}
              className="text-blue-400 hover:text-blue-300 mb-4 inline-flex items-center gap-2"
            >
              ← Back to Scanner
            </button>
            <h1 className="text-4xl font-bold text-white mb-4">Scan Result</h1>
            <p className="text-gray-400 text-sm break-all">{address}</p>
          </div>

          <div className="max-w-2xl mx-auto">
            {loading && (
              <div className="text-center text-gray-400">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                Scanning contract...
              </div>
            )}

            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-6 py-4 rounded-lg">
                <p className="font-medium">❌ Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            {result && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className={`border rounded-lg p-6 ${
                    result.isHoneypot 
                      ? 'bg-red-900/50 border-red-500' 
                      : 'bg-green-900/50 border-green-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {result.isHoneypot ? '🚨 HONEYPOT DETECTED' : '✅ Safe Contract'}
                      </h2>
                      <p className="text-sm text-gray-300 mt-1">Chain: {result.chain}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                      result.isHoneypot ? 'bg-red-600' : 'bg-green-600'
                    }`}>
                      {result.confidence}% Confidence
                    </span>
                  </div>

                  <p className="text-gray-200 mb-4">{result.message}</p>

                  {result.patterns.length > 0 && (
                    <div>
                      <p className="text-gray-300 font-medium mb-3">Risky Code Patterns:</p>
                      <div className="space-y-3">
                        {result.patterns.map((pattern, i) => (
                          <div key={i} className="bg-gray-800/50 rounded p-3 border border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-red-400 font-medium text-sm">{pattern.name}</span>
                              <span className="text-gray-400 text-xs">Line {pattern.line}</span>
                            </div>
                            <code className="text-xs text-gray-300 block overflow-x-auto">
                              {pattern.code}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>

                <div className="mt-6 flex gap-4 justify-center flex-wrap">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl);
                      alert('Link copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                  >
                    📋 Copy Link
                  </button>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}&hashtags=Crypto,Security,Honeypot`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    Share on X
                  </a>
                  <button
                    onClick={() => router.push('/')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    Scan Another
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <div style={{ paddingBottom: '80px' }}></div>
        <Footer />
      </main>
    </>
  );
}
