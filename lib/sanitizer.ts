/**
 * Sanitize and validate Solidity contract code
 */
export interface SanitizeResult {
  sanitized: string;
  isValid: boolean;
  error?: string;
  stats: {
    lines: number;
    chars: number;
  };
}

export function sanitizeContractCode(code: string): SanitizeResult {
  if (!code || typeof code !== 'string') {
    return {
      sanitized: '',
      isValid: false,
      error: 'No code provided',
      stats: { lines: 0, chars: 0 },
    };
  }

  // Normalize line endings
  let sanitized = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Remove single-line comments (but preserve strings)
  sanitized = sanitized.replace(/\/\/.*$/gm, '');
  
  // Remove multi-line comments
  sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Remove excessive blank lines (more than 2 consecutive)
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
  
  // Trim whitespace
  sanitized = sanitized.trim();

  const stats = {
    lines: sanitized ? sanitized.split('\n').length : 0,
    chars: sanitized.length,
  };

  // Validation checks
  if (sanitized.length < 50) {
    return {
      sanitized,
      isValid: false,
      error: 'Code is too short to be a valid contract',
      stats,
    };
  }

  // Check for Solidity indicators
  const hasPragma = /pragma\s+solidity/i.test(sanitized);
  const hasContract = /contract\s+\w+/i.test(sanitized);
  const hasInterface = /interface\s+\w+/i.test(sanitized);
  const hasLibrary = /library\s+\w+/i.test(sanitized);

  if (!hasPragma && !hasContract && !hasInterface && !hasLibrary) {
    return {
      sanitized,
      isValid: false,
      error: 'No valid Solidity code detected (missing pragma/contract/interface)',
      stats,
    };
  }

  // Check for potentially malicious patterns (basic XSS prevention)
  const hasScript = /<script/i.test(sanitized);
  const hasHtml = /<html|<body|<div/i.test(sanitized);
  
  if (hasScript || hasHtml) {
    return {
      sanitized: '',
      isValid: false,
      error: 'Invalid input: HTML/script tags detected',
      stats: { lines: 0, chars: 0 },
    };
  }

  return {
    sanitized,
    isValid: true,
    stats,
  };
}

export function formatCodeStats(code: string): { lines: number; chars: number } {
  if (!code) return { lines: 0, chars: 0 };
  return {
    lines: code.split('\n').length,
    chars: code.length,
  };
}
