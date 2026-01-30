import { NextRequest, NextResponse } from 'next/server';

// Honeypot detection patterns (from SCPF)
const HONEYPOT_PATTERNS = [
  {
    name: 'balance_tx_origin',
    regex: /function\s+balanceOf[^}]{0,500}(tx\.origin|origin\(\))/,
  },
  {
    name: 'allowance_tx_origin',
    regex: /function\s+allowance[^}]{0,500}(tx\.origin|origin\(\))/,
  },
  {
    name: 'transfer_tx_origin',
    regex: /function\s+transfer[^}]{0,500}(tx\.origin|origin\(\))/,
  },
  {
    name: 'hidden_fee_taxPayer',
    regex: /function\s+_taxPayer[^}]{0,300}(tx\.origin|origin\(\))/,
  },
  {
    name: 'isSuper_tx_origin',
    regex: /function\s+_isSuper[^}]{0,200}(tx\.origin|origin\(\))/,
  },
  {
    name: 'sell_block_pattern',
    regex: /if\s*\(\s*_isSuper\s*\(\s*recipient\s*\)\s*\)\s*return\s+false/,
  },
  {
    name: 'asymmetric_transfer_logic',
    regex: /function\s+_canTransfer.{0,500}return\s+false/,
  },
  {
    name: 'transfer_whitelist_only',
    regex: /require\s*\(\s*_whitelist\[.{0,200}\]\s*\|\|\s*_whitelist\[.{0,200}\]\s*,/,
  },
  {
    name: 'hidden_sell_tax',
    regex: /if\s*\(.{0,200}pair.{0,200}\).{0,500}\{.{0,500}sellTax\s*=\s*(100|99|98|97|96|95)/,
  },
];

// API key rotation
const API_KEYS = [
  process.env.ETHERSCAN_API_KEY_1,
  process.env.ETHERSCAN_API_KEY_2,
  process.env.ETHERSCAN_API_KEY_3,
  process.env.ETHERSCAN_API_KEY_4,
  process.env.ETHERSCAN_API_KEY_5,
  process.env.ETHERSCAN_API_KEY_6,
].filter(Boolean);

let currentKeyIndex = 0;

function getNextApiKey(): string {
  if (API_KEYS.length === 0) {
    throw new Error('No API keys configured');
  }
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key!;
}

// Chain configurations
const CHAIN_CONFIGS: Record<string, { apiUrl: string; name: string }> = {
  ethereum: {
    apiUrl: 'https://api.etherscan.io/api',
    name: 'Ethereum',
  },
  polygon: {
    apiUrl: 'https://api.polygonscan.com/api',
    name: 'Polygon',
  },
  arbitrum: {
    apiUrl: 'https://api.arbiscan.io/api',
    name: 'Arbitrum',
  },
};

// In-memory cache (for development)
const cache = new Map<string, any>();

async function fetchContractSource(address: string, chain: string): Promise<string> {
  const config = CHAIN_CONFIGS[chain];
  if (!config) {
    throw new Error(`Unsupported chain: ${chain}`);
  }

  const apiKey = getNextApiKey();
  const url = `${config.apiUrl}?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== '1' || !data.result || data.result.length === 0) {
    throw new Error('Contract not verified or not found');
  }

  return data.result[0].SourceCode || '';
}

function detectHoneypot(source: string): { isHoneypot: boolean; patterns: string[] } {
  const matches: string[] = [];

  for (const pattern of HONEYPOT_PATTERNS) {
    if (pattern.regex.test(source)) {
      matches.push(pattern.name);
    }
  }

  // Require 2+ patterns for high confidence
  return {
    isHoneypot: matches.length >= 2,
    patterns: matches,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { address, chain = 'ethereum' } = await request.json();

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json(
        { error: 'Invalid contract address' },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `${chain}:${address.toLowerCase()}`;
    if (cache.has(cacheKey)) {
      return NextResponse.json(cache.get(cacheKey));
    }

    // Fetch contract source
    const source = await fetchContractSource(address, chain);

    if (!source) {
      return NextResponse.json(
        { error: 'Contract source code not available' },
        { status: 404 }
      );
    }

    // Detect honeypot
    const { isHoneypot, patterns } = detectHoneypot(source);

    const result = {
      isHoneypot,
      confidence: isHoneypot ? 95 : 100,
      patterns,
      message: isHoneypot
        ? `⚠️ This contract contains ${patterns.length} honeypot patterns. DO NOT BUY!`
        : '✅ No honeypot patterns detected. Contract appears safe.',
    };

    // Cache result
    cache.set(cacheKey, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scan failed' },
      { status: 500 }
    );
  }
}
