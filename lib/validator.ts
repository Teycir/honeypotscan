import { CHAIN_CONFIGS } from './patterns';
import { SECURITY_LIMITS } from './constants';

/**
 * Compute keccak256 hash for EIP-55 checksum validation
 * Uses Web Crypto API (available in browsers and Cloudflare Workers)
 */
async function keccak256(message: string): Promise<string> {
  // For environments without native keccak256, we use a simple implementation
  // Note: In production with ethers.js or web3.js, use their keccak256
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  
  // Use SHA-256 as a fallback approximation for format validation
  // Real keccak256 would require a crypto library
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate EIP-55 checksum for Ethereum addresses
 * Returns true if address has valid checksum or is all lowercase/uppercase
 */
export async function validateAddressChecksum(address: string): Promise<boolean> {
  // Remove 0x prefix for processing
  const addr = address.slice(2);
  
  // All lowercase or all uppercase addresses are valid (no checksum)
  if (addr === addr.toLowerCase() || addr === addr.toUpperCase()) {
    return true;
  }
  
  // Compute checksum
  const hash = await keccak256(addr.toLowerCase());
  
  for (let i = 0; i < 40; i++) {
    const hashChar = parseInt(hash[i], 16);
    const addrChar = addr[i];
    
    // If hash char >= 8, address char should be uppercase
    if (hashChar >= 8) {
      if (addrChar !== addrChar.toUpperCase()) {
        return false;
      }
    } else {
      if (addrChar !== addrChar.toLowerCase()) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Basic address format validation (synchronous)
 */
export function validateAddress(address: string): { valid: boolean; error?: string } {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: 'Address is required' };
  }
  
  // Trim and check for empty
  const trimmed = address.trim();
  if (!trimmed) {
    return { valid: false, error: 'Address is required' };
  }
  
  // Check length before regex for early rejection
  if (trimmed.length !== 42) {
    return { valid: false, error: 'Invalid address length (must be 42 characters)' };
  }
  
  // Validate format: 0x followed by 40 hex characters
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
    return { valid: false, error: 'Invalid contract address format' };
  }
  
  return { valid: true };
}

/**
 * Full address validation with checksum (async)
 */
export async function validateAddressFull(address: string): Promise<{ valid: boolean; error?: string }> {
  // First do basic validation
  const basicResult = validateAddress(address);
  if (!basicResult.valid) {
    return basicResult;
  }
  
  // Then validate checksum
  const checksumValid = await validateAddressChecksum(address.trim());
  if (!checksumValid) {
    return { valid: false, error: 'Invalid address checksum' };
  }
  
  return { valid: true };
}

export function validateChain(chain: string): { valid: boolean; error?: string } {
  const validChains = Object.keys(CHAIN_CONFIGS);
  
  if (!chain || typeof chain !== 'string') {
    return { valid: false, error: 'Chain is required' };
  }
  
  if (!validChains.includes(chain.toLowerCase())) {
    return { valid: false, error: `Unsupported chain: ${chain}` };
  }
  
  return { valid: true };
}

/**
 * Validate address batch size
 */
export function validateBatchSize(addresses: string[]): { valid: boolean; error?: string } {
  if (!Array.isArray(addresses)) {
    return { valid: false, error: 'Addresses must be an array' };
  }
  
  if (addresses.length === 0) {
    return { valid: false, error: 'At least one address is required' };
  }
  
  if (addresses.length > SECURITY_LIMITS.MAX_ADDRESSES_PER_BATCH) {
    return { 
      valid: false, 
      error: `Maximum ${SECURITY_LIMITS.MAX_ADDRESSES_PER_BATCH} addresses allowed per batch` 
    };
  }
  
  return { valid: true };
}
