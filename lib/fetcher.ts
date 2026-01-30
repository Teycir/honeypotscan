import { CHAIN_CONFIGS } from './patterns';
import { parseSourceCode } from './parser';
import type { Env } from '@/types';

/**
 * Fisher-Yates shuffle algorithm for unbiased randomization
 * Math.random() - 0.5 sort is NOT uniformly random
 * @see https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function fetchContractSource(address: string, chain: string, env: Env): Promise<string> {
  const config = CHAIN_CONFIGS[chain];
  if (!config) throw new Error(`Unsupported chain: ${chain}`);
  
  const keys = [
    env.ETHERSCAN_API_KEY_1,
    env.ETHERSCAN_API_KEY_2,
    env.ETHERSCAN_API_KEY_3,
    env.ETHERSCAN_API_KEY_4,
    env.ETHERSCAN_API_KEY_5,
    env.ETHERSCAN_API_KEY_6,
  ].filter(Boolean) as string[];
  
  if (keys.length === 0) throw new Error('No API keys configured');
  
  // Use Fisher-Yates shuffle for unbiased key selection
  const shuffled = shuffleArray(keys);
  
  let lastError: Error | null = null;
  
  for (let idx = 0; idx < shuffled.length; idx++) {
    if (idx > 0) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    const apiKey = shuffled[idx];
    const url = `https://api.etherscan.io/v2/api?chainid=${config.chainId}&module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;
    
    try {
      const response = await fetch(url);
      
      // Check HTTP response status before parsing JSON
      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        continue;
      }
      
      const data = await response.json();
      
      if (data.status !== '1') {
        const errorMsg = data.message || 'Unknown error';
        lastError = new Error(`API error: ${errorMsg}`);
        continue;
      }
      
      if (!data.result || !Array.isArray(data.result) || data.result.length === 0) {
        lastError = new Error('No result in API response');
        continue;
      }
      
      const sourceCode = data.result[0].SourceCode;
      if (!sourceCode) {
        lastError = new Error('Source code not found');
        continue;
      }
      
      return parseSourceCode(sourceCode);
      
    } catch (error) {
      lastError = error as Error;
      continue;
    }
  }
  
  throw lastError || new Error(`All ${shuffled.length} API keys failed`);
}
