import { CHAIN_CONFIGS } from './patterns.js';
import { parseSourceCode } from './parser.js';

export async function fetchContractSource(address, chain, env) {
  const config = CHAIN_CONFIGS[chain];
  if (!config) throw new Error(`Unsupported chain: ${chain}`);
  
  const keys = [
    env.ETHERSCAN_API_KEY_1,
    env.ETHERSCAN_API_KEY_2,
    env.ETHERSCAN_API_KEY_3,
    env.ETHERSCAN_API_KEY_4,
    env.ETHERSCAN_API_KEY_5,
    env.ETHERSCAN_API_KEY_6,
  ].filter(Boolean);
  
  if (keys.length === 0) throw new Error('No API keys configured');
  
  // Shuffle keys randomly (like Rust implementation)
  const shuffled = keys.sort(() => Math.random() - 0.5);
  
  let lastError = null;
  
  for (let idx = 0; idx < shuffled.length; idx++) {
    if (idx > 0) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    const apiKey = shuffled[idx];
    const url = `https://api.etherscan.io/v2/api?chainid=${config.chainId}&module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;
    
    try {
      const response = await fetch(url);
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
      lastError = error;
      continue;
    }
  }
  
  throw lastError || new Error(`All ${shuffled.length} API keys failed`);
}
