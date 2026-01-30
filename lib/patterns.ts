import { config } from './config';

export interface HoneypotPattern {
  name: string;
  regex: RegExp;
}

export interface ChainConfig {
  chainId: number;
  name: string;
}

// Honeypot detection patterns - STRICT mode
// Core patterns targeting tx.origin abuse in ERC20 functions
// Requires 2+ pattern matches for high confidence detection
export const HONEYPOT_PATTERNS: HoneypotPattern[] = [
  // Core ERC20 functions with tx.origin abuse
  { name: 'balance_tx_origin', regex: /function\s+balanceOf[^}]{0,500}(?:tx\.origin|origin\(\))/s },
  { name: 'allowance_tx_origin', regex: /function\s+allowance[^}]{0,500}(?:tx\.origin|origin\(\))/s },
  { name: 'transfer_tx_origin', regex: /function\s+transfer[^}]{0,500}(?:tx\.origin|origin\(\))/s },
  
  // Known honeypot helper functions
  { name: 'hidden_fee_taxPayer', regex: /function\s+_taxPayer[^}]{0,300}(?:tx\.origin|origin\(\))/s },
  { name: 'isSuper_tx_origin', regex: /function\s+_isSuper[^}]{0,200}(?:tx\.origin|origin\(\))/s },
  
  // tx.origin in authentication contexts (from tx_origin_auth template)
  { name: 'tx_origin_require', regex: /require\s*\(\s*[^)]{0,500}?tx\.origin/s },
  { name: 'tx_origin_if_auth', regex: /if\s*\(\s*[^)]{0,200}?tx\.origin\s*[!=]=[^)]{0,200}?\)\s*(?:revert|require)/s },
  { name: 'tx_origin_assert', regex: /assert\s*\(\s*[^)]{0,200}?tx\.origin/s },
  
  // tx.origin in mapping access (tracking/restriction patterns)
  { name: 'tx_origin_mapping', regex: /\[\s*tx\.origin\s*\]\s*=/s },
  
  // Transfer restriction patterns (from honeypot_detection template)
  { name: 'sell_block_pattern', regex: /if\s*\(\s*_isSuper\s*\(\s*recipient\s*\)\s*\)\s*return\s+false/s },
  { name: 'asymmetric_transfer_logic', regex: /function\s+_canTransfer[^}]{0,500}return\s+false/s },
  { name: 'transfer_whitelist_only', regex: /require\s*\(\s*_whitelist\[[^\]]{0,200}\]\s*\|\|\s*_whitelist\[[^\]]{0,200}\]\s*,/s },
  { name: 'hidden_sell_tax', regex: /if\s*\([^)]{0,200}pair[^)]{0,200}\)[^{]{0,500}\{[^}]{0,500}sellTax\s*=\s*(?:100|99|98|97|96|95)/s },
];

export const MIN_PATTERNS_FOR_DETECTION = config.scan.minPatterns;

export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  ethereum: { chainId: 1, name: 'Ethereum' },
  polygon: { chainId: 137, name: 'Polygon' },
  arbitrum: { chainId: 42161, name: 'Arbitrum' },
};
