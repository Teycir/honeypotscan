export interface HoneypotPattern {
  name: string;
  regex: RegExp;
}

export interface ChainConfig {
  chainId: number;
  name: string;
}

// Honeypot patterns based on SmartContractPatternFinder (SCPF)
// SCPF uses 5 core patterns and requires 2+ matches for detection
// HoneypotScan adds 4 additional patterns for broader coverage
export const HONEYPOT_PATTERNS: HoneypotPattern[] = [
  // Core ERC20 functions with tx.origin abuse (SCPF patterns)
  { name: 'balance_tx_origin', regex: /function\s+balanceOf[^}]{0,500}?(?:tx\.origin|origin\(\))/s },
  { name: 'allowance_tx_origin', regex: /function\s+allowance[^}]{0,500}?(?:tx\.origin|origin\(\))/s },
  { name: 'transfer_tx_origin', regex: /function\s+transfer[^}]{0,500}?(?:tx\.origin|origin\(\))/s },
  
  // Known honeypot helper functions (SCPF patterns)
  { name: 'hidden_fee_taxPayer', regex: /function\s+_taxPayer[^}]{0,300}?(?:tx\.origin|origin\(\))/s },
  { name: 'isSuper_tx_origin', regex: /function\s+_isSuper[^}]{0,200}?(?:tx\.origin|origin\(\))/s },
  
  // Additional honeypot indicators (HoneypotScan exclusive)
  { name: 'sell_block_pattern', regex: /if\s*\(\s*_isSuper\s*\(\s*recipient\s*\)\s*\)\s*return\s+false/s },
  { name: 'asymmetric_transfer_logic', regex: /function\s+_canTransfer[^}]{0,500}?return\s+false/s },
  { name: 'transfer_whitelist_only', regex: /require\s*\(\s*_whitelist\[[^\]]{0,100}?\]\s*\|\|\s*_whitelist\[[^\]]{0,100}?\]\s*,/s },
  { name: 'hidden_sell_tax', regex: /if\s*\([^)]{0,200}?pair[^)]{0,100}?\)[^{]{0,100}?\{[^}]{0,300}?sellTax\s*=\s*(?:100|9[5-9])/s },
];

// SCPF requires 2+ patterns for high confidence detection
// HoneypotScan uses 1 for aggressive user protection
export const MIN_PATTERNS_FOR_DETECTION = 1;

export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  ethereum: { chainId: 1, name: 'Ethereum' },
  polygon: { chainId: 137, name: 'Polygon' },
  arbitrum: { chainId: 42161, name: 'Arbitrum' },
};
