export async function detectChain(address) {
  const chains = ['ethereum', 'polygon', 'arbitrum'];
  
  for (const chain of chains) {
    const chainId = chain === 'ethereum' ? 1 : chain === 'polygon' ? 137 : 42161;
    const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=proxy&action=eth_getCode&address=${address}&tag=latest`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.result && data.result !== '0x') {
        return chain;
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}
