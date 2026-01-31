'use client';

/**
 * Scan History Management (localStorage)
 * Stores last 10 scans for quick reference
 */

export interface HistoryScanResult {
  address: string;
  isHoneypot: boolean;
  confidence: number;
  patternCount: number;
  chain: string;
  scannedAt: string;
  tokenName?: string;
  tokenSymbol?: string;
}

const STORAGE_KEY = 'honeypotscan_history';
const MAX_HISTORY_ITEMS = 10;

/**
 * Get scan history from localStorage
 */
export function getScanHistory(): HistoryScanResult[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Add a scan result to history
 */
export function addToScanHistory(result: HistoryScanResult): void {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getScanHistory();
    
    // Remove duplicate if exists
    const filtered = history.filter(
      (item) => item.address.toLowerCase() !== result.address.toLowerCase()
    );
    
    // Add new result at the beginning
    filtered.unshift({
      ...result,
      scannedAt: result.scannedAt || new Date().toISOString(),
    });
    
    // Keep only last MAX_HISTORY_ITEMS
    const trimmed = filtered.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage might be full or disabled
  }
}

/**
 * Clear all scan history
 */
export function clearScanHistory(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Remove a specific item from history
 */
export function removeFromHistory(address: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const history = getScanHistory();
    const filtered = history.filter(
      (item) => item.address.toLowerCase() !== address.toLowerCase()
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore errors
  }
}
