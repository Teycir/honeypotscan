// Honeypot detection patterns (combined from honeypot_filter.rs + honeypot_detection.yaml)
export const HONEYPOT_PATTERNS = [
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

export const CHAIN_CONFIGS = {
  ethereum: { chainId: 1, name: 'Ethereum' },
  polygon: { chainId: 137, name: 'Polygon' },
  arbitrum: { chainId: 42161, name: 'Arbitrum' },
};
