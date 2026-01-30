'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatedBackground } from '@/app/components/AnimatedBackground';
import { Footer } from '@/app/components/Footer';
import { API_URL } from '@/lib/constants';
import type { ScanResult } from '@/types';

export default function BatchScanPage() {
  const params = useParams();
  const router = useRouter();
  const addresses = (params.addresses as string).split(',');
  const [results, setResults] = useState<Record<string, ScanResult>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    const scanAll = async () => {
      if (addresses.length > 3) {
        setResults({});
        setLoading(false);
        return;
      }
      
      const resultsMap: Record<string, ScanResult> = {};
      
      for (let i = 0; i < addresses.length; i++) {
        const addr = addresses[i];
        try {
          const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: addr }),
          });
          
          if (res.status === 429) {
            await sleep(2000);
            const retry = await fetch(API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ address: addr }),
            });
            const data = await retry.json();
            resultsMap[addr] = data;
          } else {
            const data = await res.json();
            resultsMap[addr] = data;
          }
          
          setResults({ ...resultsMap });
          
          if (i < addresses.length - 1) {
            await sleep(300);
          }
        } catch (err) {
          resultsMap[addr] = {
            isHoneypot: false,
            confidence: 0,
            patterns: [],
            chain: 'unknown',
            message: 'Scan failed',
          };
        }
      }
      
      setLoading(false);
    };

    scanAll();
  }, [addresses]);

  if (addresses.length > 3) {
    return (
      <>
        <AnimatedBackground />
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-white mb-4">Too Many Contracts</h1>
            <p className="text-gray-300 mb-6">Maximum 3 contracts per batch scan to prevent rate limits.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              ← Back to Scanner
            </button>
          </div>
        </main>
      </>
    );
  }

  if (loading) {
    const scannedCount = Object.keys(results).length;
    return (
      <>
        <AnimatedBackground />
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-pulse">🛡️</div>
            <p className="text-white text-xl">Scanning {addresses.length} contracts...</p>
            {scannedCount > 0 && (
              <p className="text-gray-400 text-sm mt-2">{scannedCount} of {addresses.length} complete</p>
            )}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground />
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Batch Scan Results</h1>
            <button
              onClick={() => router.push('/')}
              className="text-blue-400 hover:text-blue-300 transition"
            >
              ← Scan More Contracts
            </button>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {addresses.map((addr) => {
              const result = results[addr];
              if (!result) return null;

              return (
                <div
                  key={addr}
                  className={`bg-gray-800 rounded-lg p-6 border-2 ${
                    result.isHoneypot ? 'border-red-500' : 'border-green-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Contract Address</div>
                      <div className="text-white font-mono text-sm break-all">{addr}</div>
                      <div className="text-xs text-gray-400 mt-1">Chain: {result.chain}</div>
                    </div>
                    <button
                      onClick={() => router.push(`/scan/${addr}`)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      View Details →
                    </button>
                  </div>

                  <div className={`text-2xl font-bold mb-2 ${result.isHoneypot ? 'text-red-400' : 'text-green-400'}`}>
                    {result.isHoneypot ? '⚠️ HONEYPOT DETECTED' : '✅ SAFE'}
                  </div>

                  <p className="text-gray-300 text-sm mb-4">{result.message}</p>

                  {result.patterns && result.patterns.length > 0 && (
                    <div className="bg-gray-900 rounded p-4">
                      <div className="text-red-400 font-bold mb-2">
                        {result.patterns.length} Pattern{result.patterns.length > 1 ? 's' : ''} Found
                      </div>
                      <div className="space-y-2">
                        {result.patterns.slice(0, 3).map((p, i) => (
                          <div key={i} className="text-xs text-gray-400">
                            • {p.name.replace(/_/g, ' ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ paddingBottom: '80px' }}></div>
        <Footer />
      </main>
    </>
  );
}
