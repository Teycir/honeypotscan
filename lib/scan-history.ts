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

export interface HistoryOperationResult {
  success: boolean;
  error?: string;
}

const STORAGE_KEY = 'honeypotscan_history';
const MAX_HISTORY_ITEMS = 10;

/**
 * Check if localStorage is available and has quota
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get scan history from localStorage
 */
export function getScanHistory(): HistoryScanResult[] {
  if (!isLocalStorageAvailable()) return [];
  
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
 * Returns operation result with success status and error message if failed
 */
export function addToScanHistory(result: HistoryScanResult): HistoryOperationResult {
  if (!isLocalStorageAvailable()) {
    return { success: false, error: 'localStorage is not available' };
  }
  
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
    
    const serialized = JSON.stringify(trimmed);
    
    // Check if we'll exceed quota (rough estimate: 5MB limit typical)
    // localStorage.length gives number of items, not size
    if (serialized.length > 1024 * 1024) { // 1MB safety limit
      // Try to reduce history size
      const minimal = trimmed.slice(0, Math.floor(MAX_HISTORY_ITEMS / 2));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal));
      return { 
        success: true, 
        error: 'History was trimmed due to storage limits' 
      };
    }
    
    localStorage.setItem(STORAGE_KEY, serialized);
    return { success: true };
  } catch (error) {
    // Handle quota exceeded error
    if (error instanceof DOMException && (
      error.code === 22 || // Quota exceeded
      error.code === 1014 || // Firefox quota exceeded
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )) {
      // Try to clear some space by removing old entries
      try {
        const history = getScanHistory();
        const reduced = history.slice(0, Math.floor(MAX_HISTORY_ITEMS / 2));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
        return { 
          success: false, 
          error: 'Storage quota exceeded. Older history was removed to make space.' 
        };
      } catch {
        return { 
          success: false, 
          error: 'Storage quota exceeded. Unable to save scan history.' 
        };
      }
    }
    
    return { 
      success: false, 
      error: 'Failed to save scan history. localStorage may be disabled.' 
    };
  }
}

/**
 * Clear all scan history
 */
export function clearScanHistory(): HistoryOperationResult {
  if (!isLocalStorageAvailable()) {
    return { success: false, error: 'localStorage is not available' };
  }
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to clear scan history' };
  }
}

/**
 * Remove a specific item from history
 */
export function removeFromHistory(address: string): HistoryOperationResult {
  if (!isLocalStorageAvailable()) {
    return { success: false, error: 'localStorage is not available' };
  }
  
  try {
    const history = getScanHistory();
    const filtered = history.filter(
      (item) => item.address.toLowerCase() !== address.toLowerCase()
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to remove item from history' };
  }
}
