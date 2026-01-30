import { CHAIN_CONFIGS } from './patterns';

interface ChainDetectorEnv {
  ETHERSCAN_API_KEY_1?: string;
  ETHERSCAN_API_KEY_2?: string;
}

/**
 * Detect which blockchain a contract address is deployed on
 * Uses Etherscan API v2 to check for contract bytecode on each chain
 * 
 * @param address - The contract address to check
 * @param env - Environment variables containing API keys (optional but recommended)
 * @returns The chain name or null if not found on any supported chain
 */
export async function detectChain(address: string, env?: ChainDetectorEnv): Promise<string | null> {
  const chains = Object.entries(CHAIN_CONFIGS).map(([name, config]) => ({
    name,
    chainId: config.chainId
  }));
  
  // Get API key from env if available to avoid rate limiting
  // Without an API key, requests are heavily rate-limited (1 req/5s)
  const apiKey = env?.ETHERSCAN_API_KEY_1 || env?.ETHERSCAN_API_KEY_2 || '';
  
  const checks = chains.map(async ({ name, chainId }) => {
    // Include API key if available to avoid rate limiting
    const apiKeyParam = apiKey ? `&apikey=${apiKey}` : '';
    const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=proxy&action=eth_getCode&address=${address}&tag=latest${apiKeyParam}`;
    
    try {
      const response = await fetch(url);
      
      // Check HTTP response status before parsing
      if (!response.ok) {
        console.warn(`[chain-detector] HTTP ${response.status} for chain ${name}`);
        return null;
      }
      
      const data = await response.json();
      
      // Check for API error responses
      if (data.status === '0' && data.message) {
        console.warn(`[chain-detector] API error for chain ${name}: ${data.message}`);
        return null;
      }
      
      if (data.result && data.result !== '0x') {
        return name;
      }
    } catch (error) {
      // Log the error for debugging but don't fail the entire detection
      console.warn(`[chain-detector] Error checking ${name}:`, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
    return null;
  });
  
  const results = await Promise.all(checks);
  return results.find(r => r !== null) || null;
}
