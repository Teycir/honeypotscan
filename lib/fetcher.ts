import { CHAIN_CONFIGS } from './patterns';
import { parseSourceCode } from './parser';
import type { Env, FetchResult, TokenMetadata } from '@/types';

// Request timeout in milliseconds
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Fisher-Yates shuffle algorithm for unbiased randomization
 * Math.random() - 0.5 sort is NOT uniformly random
 * @see https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    const swapVal = shuffled[j];
    if (temp !== undefined && swapVal !== undefined) {
      shuffled[i] = swapVal;
      shuffled[j] = temp;
    }
  }
  return shuffled;
}

/**
 * Etherscan API response schema validation
 */
interface EtherscanContractResult {
  SourceCode?: string;
  ContractName?: string;
  CompilerVersion?: string;
  [key: string]: unknown;
}

interface EtherscanResponse {
  status: string;
  message?: string;
  result?: EtherscanContractResult[];
}

function isValidEtherscanResponse(data: unknown): data is EtherscanResponse {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.status !== 'string') return false;
  if (obj.message !== undefined && typeof obj.message !== 'string') return false;
  if (obj.result !== undefined && !Array.isArray(obj.result)) return false;
  return true;
}

/**
 * Extract token metadata from Etherscan response
 */
function extractMetadata(contractResult: EtherscanContractResult): TokenMetadata {
  return {
    name: typeof contractResult.ContractName === 'string' ? contractResult.ContractName : null,
    symbol: null, // Etherscan API doesn't return symbol directly, would need to parse from source
    compilerVersion: typeof contractResult.CompilerVersion === 'string' ? contractResult.CompilerVersion : null,
  };
}

export async function fetchContractSource(address: string, chain: string, env: Env): Promise<FetchResult> {
  const config = CHAIN_CONFIGS[chain];
  if (!config) throw new Error(`Unsupported chain: ${chain}`);
  
  const keys = [
    env.ETHERSCAN_API_KEY_1,
    env.ETHERSCAN_API_KEY_2,
    env.ETHERSCAN_API_KEY_3,
    env.ETHERSCAN_API_KEY_4,
    env.ETHERSCAN_API_KEY_5,
    env.ETHERSCAN_API_KEY_6,
  ].filter((key): key is string => Boolean(key));
  
  if (keys.length === 0) throw new Error('No API keys configured');
  
  // Use Fisher-Yates shuffle for unbiased key selection
  const shuffled = shuffleArray(keys);
  
  let lastError: Error | null = null;
  
  for (let idx = 0; idx < shuffled.length; idx++) {
    if (idx > 0) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    const apiKey = shuffled[idx];
    if (!apiKey) continue;
    
    const url = `https://api.etherscan.io/v2/api?chainid=${config.chainId}&module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;
    
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    
    try {
      const response = await fetch(url, { signal: controller.signal });
      
      // Check HTTP response status before parsing JSON
      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        continue;
      }
      
      const data: unknown = await response.json();
      
      // Validate response schema
      if (!isValidEtherscanResponse(data)) {
        lastError = new Error('Invalid API response format');
        continue;
      }
      
      if (data.status !== '1') {
        const errorMsg = data.message || 'Unknown error';
        lastError = new Error(`API error: ${errorMsg}`);
        continue;
      }
      
      if (!data.result || !Array.isArray(data.result) || data.result.length === 0) {
        lastError = new Error('No result in API response');
        continue;
      }
      
      const firstResult = data.result[0];
      const sourceCode = firstResult?.SourceCode;
      if (!sourceCode || typeof sourceCode !== 'string') {
        lastError = new Error('Source code not found or invalid');
        continue;
      }
      
      return {
        sourceCode: parseSourceCode(sourceCode),
        metadata: extractMetadata(firstResult),
      };
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new Error(`Request timeout after ${REQUEST_TIMEOUT_MS / 1000}s`);
      } else {
        lastError = error as Error;
      }
      continue;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  // Provide actionable error message
  throw new Error(
    `Failed to fetch contract source after ${shuffled.length} attempts. ` +
    `Last error: ${lastError?.message || 'Unknown'}. ` +
    `Please verify the contract address exists on ${chain}.`
  );
}
