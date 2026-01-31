'use client';

/**
 * URL Hash Sharing Utilities
 * Encode/decode scan results in URL hash for sharing without server storage
 */

export interface ShareableResult {
  a: string;  // address
  h: boolean; // isHoneypot
  c: number;  // confidence
  p: number;  // pattern count
  n: string;  // chain
  t?: string; // token name
  s?: string; // token symbol
  d: string;  // scanned date
}

/**
 * Encode scan result for URL sharing
 */
export function encodeResultForShare(result: {
  address: string;
  isHoneypot: boolean;
  confidence: number;
  patterns: Array<{ name: string }>;
  chain: string;
  tokenName?: string;
  tokenSymbol?: string;
  scannedAt?: string;
}): string {
  const shareable: ShareableResult = {
    a: result.address,
    h: result.isHoneypot,
    c: result.confidence,
    p: result.patterns.length,
    n: result.chain,
    d: result.scannedAt || new Date().toISOString(),
  };
  
  if (result.tokenName) shareable.t = result.tokenName;
  if (result.tokenSymbol) shareable.s = result.tokenSymbol;
  
  try {
    const json = JSON.stringify(shareable);
    const encoded = btoa(json);
    return encoded;
  } catch {
    return '';
  }
}

/**
 * Decode scan result from URL hash
 */
export function decodeResultFromHash(hash: string): ShareableResult | null {
  try {
    // Remove # prefix if present
    const encoded = hash.startsWith('#result=') 
      ? hash.slice(8) 
      : hash.startsWith('result=') 
        ? hash.slice(7)
        : hash;
    
    const json = atob(encoded);
    const parsed = JSON.parse(json);
    
    // Validate required fields
    if (
      typeof parsed.a !== 'string' ||
      typeof parsed.h !== 'boolean' ||
      typeof parsed.c !== 'number' ||
      typeof parsed.p !== 'number' ||
      typeof parsed.n !== 'string'
    ) {
      return null;
    }
    
    return parsed as ShareableResult;
  } catch {
    return null;
  }
}

/**
 * Generate shareable URL with result hash
 */
export function generateShareUrl(result: {
  address: string;
  isHoneypot: boolean;
  confidence: number;
  patterns: Array<{ name: string }>;
  chain: string;
  tokenName?: string;
  tokenSymbol?: string;
  scannedAt?: string;
}): string {
  const encoded = encodeResultForShare(result);
  if (!encoded) return '';
  
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}`
    : 'https://honeypotscan.com';
  
  return `${baseUrl}#result=${encoded}`;
}

/**
 * Check if URL has a shared result
 */
export function hasSharedResult(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hash.startsWith('#result=');
}

/**
 * Get shared result from current URL
 */
export function getSharedResultFromUrl(): ShareableResult | null {
  if (typeof window === 'undefined') return null;
  if (!hasSharedResult()) return null;
  
  return decodeResultFromHash(window.location.hash);
}

/**
 * Generate plain text summary for copying
 */
export function generateTextSummary(result: {
  address: string;
  isHoneypot: boolean;
  confidence: number;
  patterns: Array<{ name: string; line: number }>;
  chain: string;
  message: string;
  tokenName?: string;
  tokenSymbol?: string;
}): string {
  const lines = [
    '🔍 HoneypotScan Result',
    '═══════════════════════════════════════',
    '',
  ];
  
  if (result.tokenName || result.tokenSymbol) {
    lines.push(`Token: ${result.tokenName || 'Unknown'} (${result.tokenSymbol || '???'})`);
  }
  
  lines.push(
    `Address: ${result.address}`,
    `Chain: ${result.chain.charAt(0).toUpperCase() + result.chain.slice(1)}`,
    '',
    `Status: ${result.isHoneypot ? '🚨 HONEYPOT DETECTED' : '✅ SAFE CONTRACT'}`,
    `Confidence: ${result.confidence}%`,
    '',
    result.message,
  );
  
  if (result.patterns.length > 0) {
    lines.push(
      '',
      `⚠️ Patterns Found (${result.patterns.length}):`,
      ...result.patterns.map(p => `  • ${p.name} (line ${p.line})`),
    );
  }
  
  lines.push(
    '',
    '═══════════════════════════════════════',
    `Scanned at: ${new Date().toISOString()}`,
    'Powered by: https://honeypotscan.com',
  );
  
  return lines.join('\n');
}

/**
 * Download scan result as JSON file
 */
export function downloadResultAsJson(result: {
  address: string;
  isHoneypot: boolean;
  confidence: number;
  patterns: Array<{ name: string; line: number; code: string }>;
  chain: string;
  message: string;
  tokenName?: string;
  tokenSymbol?: string;
  compilerVersion?: string;
}): void {
  if (typeof window === 'undefined') return;
  
  const exportData = {
    scanner: 'HoneypotScan',
    version: '1.0',
    scannedAt: new Date().toISOString(),
    result: {
      address: result.address,
      chain: result.chain,
      isHoneypot: result.isHoneypot,
      confidence: result.confidence,
      message: result.message,
      tokenMetadata: {
        name: result.tokenName || null,
        symbol: result.tokenSymbol || null,
        compilerVersion: result.compilerVersion || null,
      },
      patterns: result.patterns.map(p => ({
        name: p.name,
        line: p.line,
        codeSnippet: p.code,
      })),
    },
  };
  
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `honeypotscan-${result.address.slice(0, 10)}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
