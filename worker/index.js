// Honeypot detection patterns (combined from honeypot_filter.rs + honeypot_detection.yaml)
const HONEYPOT_PATTERNS = [
  // From honeypot_filter.rs (hardcoded patterns)
  { name: 'balance_tx_origin', regex: /function\s+balanceOf[^}]{0,500}(tx\.origin|origin\(\))/ },
  { name: 'allowance_tx_origin', regex: /function\s+allowance[^}]{0,500}(tx\.origin|origin\(\))/ },
  { name: 'transfer_tx_origin', regex: /function\s+transfer[^}]{0,500}(tx\.origin|origin\(\))/ },
  { name: 'hidden_fee_taxPayer', regex: /function\s+_taxPayer[^}]{0,300}(tx\.origin|origin\(\))/ },
  { name: 'isSuper_tx_origin', regex: /function\s+_isSuper[^}]{0,200}(tx\.origin|origin\(\))/ },
  // From honeypot_detection.yaml (archived template)
  { name: 'sell_block_pattern', regex: /if\s*\(\s*_isSuper\s*\(\s*recipient\s*\)\s*\)\s*return\s+false/ },
  { name: 'asymmetric_transfer_logic', regex: /function\s+_canTransfer.{0,500}return\s+false/ },
  { name: 'transfer_whitelist_only', regex: /require\s*\(\s*_whitelist\[.{0,200}\]\s*\|\|\s*_whitelist\[.{0,200}\]\s*,/ },
  { name: 'hidden_sell_tax', regex: /if\s*\(.{0,200}pair.{0,200}\).{0,500}\{.{0,500}sellTax\s*=\s*(100|99|98|97|96|95)/ },
];

const CHAIN_CONFIGS = {
  ethereum: { chainId: 1, name: 'Ethereum' },
  polygon: { chainId: 137, name: 'Polygon' },
  arbitrum: { chainId: 42161, name: 'Arbitrum' },
};

function parseSourceCode(sourceCode) {
  const normalized = sourceCode.trim();
  const cleaned = normalized.startsWith('{{') && normalized.endsWith('}}') 
    ? normalized.slice(1, -1) 
    : normalized;
  
  if (cleaned.startsWith('{')) {
    try {
      const json = JSON.parse(cleaned);
      
      if (json.sources) {
        let combined = '';
        for (const [filename, fileObj] of Object.entries(json.sources)) {
          if (fileObj.content) {
            combined += `// File: ${filename}\n${fileObj.content}\n\n`;
          }
        }
        if (combined) return combined;
      }
    } catch (e) {
      // Not JSON, return as-is
    }
  }
  
  return sourceCode;
}

async function fetchContractSource(address, chain, env) {
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

function detectHoneypot(source) {
  const matches = [];
  
  for (const pattern of HONEYPOT_PATTERNS) {
    if (pattern.regex.test(source)) {
      matches.push(pattern.name);
    }
  }
  
  return {
    isHoneypot: matches.length >= 2,
    patterns: matches,
  };
}

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }
    
    try {
      const { address, chain = 'ethereum' } = await request.json();
      
      if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return new Response(
          JSON.stringify({ error: 'Invalid contract address' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const cacheKey = `${chain}:${address.toLowerCase()}`;
      const cached = await env.CACHE?.get(cacheKey, 'json');
      if (cached) {
        return new Response(JSON.stringify(cached), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const source = await fetchContractSource(address, chain, env);
      
      if (!source) {
        return new Response(
          JSON.stringify({ error: 'Contract source code not available' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const { isHoneypot, patterns } = detectHoneypot(source);
      
      const result = {
        isHoneypot,
        confidence: isHoneypot ? 95 : 100,
        patterns,
        message: isHoneypot
          ? `⚠️ This contract contains ${patterns.length} honeypot patterns. DO NOT BUY!`
          : '✅ No honeypot patterns detected. Contract appears safe.',
      };
      
      await env.CACHE?.put(cacheKey, JSON.stringify(result), { expirationTtl: 86400 });
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message || 'Scan failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
};
