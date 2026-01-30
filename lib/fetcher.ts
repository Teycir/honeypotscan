import { CHAIN_CONFIGS } from './patterns';
import { parseSourceCode } from './parser';

interface Env {
  ETHERSCAN_API_KEY_1?: string;
  ETHERSCAN_API_KEY_2?: string;
  ETHERSCAN_API_KEY_3?: string;
  ETHERSCAN_API_KEY_4?: string;
  ETHERSCAN_API_KEY_5?: string;
  ETHERSCAN_API_KEY_6?: string;
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
  
  const shuffled = keys.sort(() => Math.random() - 0.5);
  
  let lastError: Error | null = null;
  
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
      lastError = error as Error;
      continue;
    }
  }
  
  throw lastError || new Error(`All ${shuffled.length} API keys failed`);
}
