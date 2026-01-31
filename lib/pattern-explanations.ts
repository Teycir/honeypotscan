/**
 * Human-readable explanations for honeypot detection patterns
 * Educational content that helps users understand why patterns are flagged
 */

export interface PatternExplanation {
  name: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium';
  howItWorks: string;
  protection: string;
}

export const PATTERN_EXPLANATIONS: Record<string, PatternExplanation> = {
  balance_tx_origin: {
    name: 'balance_tx_origin',
    title: 'Balance Check with tx.origin',
    description: 'The balanceOf function uses tx.origin to manipulate balance reporting.',
    severity: 'critical',
    howItWorks: 'When you check your balance through a DEX or wallet, it may show inflated numbers. But when you try to sell, the contract checks tx.origin and returns your real (often zero) balance.',
    protection: 'Always verify balances directly on a block explorer before trading.',
  },
  allowance_tx_origin: {
    name: 'allowance_tx_origin',
    title: 'Allowance Manipulation via tx.origin',
    description: 'The allowance function behaves differently based on tx.origin.',
    severity: 'critical',
    howItWorks: 'Approvals may appear to work, but when a DEX router tries to spend tokens on your behalf, the allowance check fails because tx.origin differs.',
    protection: 'Test with a tiny amount before making larger purchases.',
  },
  transfer_tx_origin: {
    name: 'transfer_tx_origin',
    title: 'Transfer Restriction via tx.origin',
    description: 'Transfer function checks tx.origin to selectively block transactions.',
    severity: 'critical',
    howItWorks: 'Only the deployer (or whitelisted addresses) can successfully transfer tokens. Regular users get their sell transactions reverted.',
    protection: 'Avoid tokens that show different behavior between direct and DEX transfers.',
  },
  hidden_fee_taxPayer: {
    name: 'hidden_fee_taxPayer',
    title: 'Hidden Tax Mechanism',
    description: 'Contract contains a hidden _taxPayer function using tx.origin.',
    severity: 'high',
    howItWorks: 'A concealed function applies excessive fees (often 99-100%) to non-whitelisted sellers, effectively draining all value during sells.',
    protection: 'Check contract source for any fee-related functions and their tax rates.',
  },
  isSuper_tx_origin: {
    name: 'isSuper_tx_origin',
    title: 'Super User Check',
    description: 'Contract has a _isSuper function that grants special privileges.',
    severity: 'high',
    howItWorks: 'Certain addresses are marked as "super users" who bypass restrictions. Regular holders cannot sell while super users drain liquidity.',
    protection: 'Look for whitelist or privilege-granting functions in the contract.',
  },
  tx_origin_require: {
    name: 'tx_origin_require',
    title: 'tx.origin in Require Statement',
    description: 'A require statement uses tx.origin for access control.',
    severity: 'critical',
    howItWorks: 'Transactions are blocked unless tx.origin matches a specific address. DEX sells always fail because the router becomes the msg.sender.',
    protection: 'tx.origin checks in access control are a major red flag.',
  },
  tx_origin_if_auth: {
    name: 'tx_origin_if_auth',
    title: 'Conditional tx.origin Authentication',
    description: 'Authentication logic uses tx.origin in if statements.',
    severity: 'high',
    howItWorks: 'The contract conditionally reverts based on tx.origin, making it impossible to interact through standard DeFi protocols.',
    protection: 'Legitimate tokens never use tx.origin for authentication.',
  },
  tx_origin_assert: {
    name: 'tx_origin_assert',
    title: 'tx.origin Assertion',
    description: 'An assert statement checks tx.origin.',
    severity: 'critical',
    howItWorks: 'Assert failures consume all gas and revert the transaction. This makes failed sells expensive and frustrating.',
    protection: 'Assert with tx.origin is almost always malicious.',
  },
  tx_origin_mapping: {
    name: 'tx_origin_mapping',
    title: 'tx.origin Tracking in Mapping',
    description: 'Contract stores tx.origin values in a mapping for tracking.',
    severity: 'medium',
    howItWorks: 'The contract tracks who originated transactions, potentially to blacklist buyers or apply different rules based on origin.',
    protection: 'Any tx.origin tracking should be investigated further.',
  },
  sell_block_pattern: {
    name: 'sell_block_pattern',
    title: 'Explicit Sell Blocking',
    description: 'Contract contains logic that explicitly blocks sells to certain recipients.',
    severity: 'critical',
    howItWorks: 'When tokens are sent to the liquidity pair (selling), the function returns false, blocking the sale entirely.',
    protection: 'Check if the contract allows transfers to the liquidity pool address.',
  },
  asymmetric_transfer_logic: {
    name: 'asymmetric_transfer_logic',
    title: 'Asymmetric Transfer Logic',
    description: 'Transfer logic behaves differently for buys vs sells.',
    severity: 'high',
    howItWorks: 'A _canTransfer function that returns false for certain conditions allows buys but blocks sells.',
    protection: 'Verify that transfer logic is symmetric and fair.',
  },
  transfer_whitelist_only: {
    name: 'transfer_whitelist_only',
    title: 'Whitelist-Only Transfers',
    description: 'Transfers require sender or recipient to be whitelisted.',
    severity: 'high',
    howItWorks: 'Only addresses added to a whitelist can successfully transfer. Regular buyers are trapped.',
    protection: 'Whitelist requirements on standard transfers are extremely suspicious.',
  },
  hidden_sell_tax: {
    name: 'hidden_sell_tax',
    title: 'Hidden Excessive Sell Tax',
    description: 'Contract applies very high taxes (95-100%) on sells.',
    severity: 'critical',
    howItWorks: 'When selling to the liquidity pair, a hidden tax of 95-100% is applied, leaving sellers with almost nothing.',
    protection: 'Check sell tax rates in the contract - anything above 10% is suspicious.',
  },
};

/**
 * Get explanation for a pattern by name
 */
export function getPatternExplanation(patternName: string): PatternExplanation | null {
  return PATTERN_EXPLANATIONS[patternName] || null;
}

/**
 * Get severity color class for UI display
 */
export function getSeverityColor(severity: PatternExplanation['severity']): string {
  switch (severity) {
    case 'critical':
      return 'text-red-400 bg-red-900/30';
    case 'high':
      return 'text-orange-400 bg-orange-900/30';
    case 'medium':
      return 'text-yellow-400 bg-yellow-900/30';
    default:
      return 'text-gray-400 bg-gray-900/30';
  }
}
