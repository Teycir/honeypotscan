'use client';

import { useState } from 'react';

type ScanResult = {
  isHoneypot: boolean;
  confidence: number;
  patterns: string[];
  message: string;
};

export default function Home() {
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState('ethereum');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('https://honeypotscan-api.teycircoder4.workers.dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, chain }),
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">
            🛡️ HoneypotScan
          </h1>
          <p className="text-xl text-gray-300">
            Check if a token is a scam before you buy
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Free • Fast • Accurate
          </p>
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

            <div className="mb-6">
              <label className="block text-gray-300 mb-2 font-medium">
                Blockchain
              </label>
              <select
                value={chain}
                onChange={(e) => setChain(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ethereum">Ethereum</option>
                <option value="polygon">Polygon</option>
                <option value="arbitrum">Arbitrum</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Results */}
          {result && (
            <div className={`mt-6 border rounded-lg p-6 ${
              result.isHoneypot 
                ? 'bg-red-900/50 border-red-500' 
                : 'bg-green-900/50 border-green-500'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">
                  {result.isHoneypot ? '🚨 HONEYPOT DETECTED' : '✅ Safe Contract'}
                </h2>
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                  result.isHoneypot ? 'bg-red-600' : 'bg-green-600'
                }`}>
                  {result.confidence}% Confidence
                </span>
              </div>

              <p className="text-gray-200 mb-4">{result.message}</p>

              {result.patterns.length > 0 && (
                <div>
                  <p className="text-gray-300 font-medium mb-2">Detected Patterns:</p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {result.patterns.map((pattern, i) => (
                      <li key={i} className="text-sm">{pattern}</li>
                    ))}
                  </ul>
                </div>
              )}
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
    </main>
  );
}
