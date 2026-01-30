import { CHAIN_CONFIGS } from './patterns';

export function validateAddress(address: string): { valid: boolean; error?: string } {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: 'Address is required' };
  }
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return { valid: false, error: 'Invalid contract address format' };
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
