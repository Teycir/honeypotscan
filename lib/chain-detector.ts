export async function detectChain(address: string): Promise<string | null> {
  const chains = [
    { name: 'ethereum', chainId: 1 },
    { name: 'polygon', chainId: 137 },
    { name: 'arbitrum', chainId: 42161 }
  ];
  
  const checks = chains.map(async ({ name, chainId }) => {
    const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=proxy&action=eth_getCode&address=${address}&tag=latest`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.result && data.result !== '0x') {
        return name;
      }
    } catch (e) {
      return null;
    }
    return null;
  });
  
  const results = await Promise.all(checks);
  return results.find(r => r !== null) || null;
}
