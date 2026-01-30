import { CHAIN_CONFIGS } from './patterns';

export async function detectChain(address: string): Promise<string | null> {
  const chains = Object.entries(CHAIN_CONFIGS).map(([name, config]) => ({
    name,
    chainId: config.chainId
  }));
  
  const checks = chains.map(async ({ name, chainId }) => {
    const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=proxy&action=eth_getCode&address=${address}&tag=latest`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.result && data.result !== '0x') {
        return name;
      }
    } catch {
      return null;
    }
    return null;
  });
  
  const results = await Promise.all(checks);
  return results.find(r => r !== null) || null;
}
