import { SECURITY_LIMITS, XSS_BLOCKLIST } from './constants';

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

/**
 * Remove single-line comments while preserving string literals
 * This prevents corrupting URLs like "https://example.com" which contain //
 */
function removeLineComments(code: string): string {
  const result: string[] = [];
  let i = 0;
  
  while (i < code.length) {
    // Check for string literals (double quotes)
    if (code[i] === '"') {
      const start = i;
      i++; // Skip opening quote
      while (i < code.length && code[i] !== '"') {
        if (code[i] === '\\' && i + 1 < code.length) {
          i += 2; // Skip escaped character
        } else {
          i++;
        }
      }
      i++; // Skip closing quote
      result.push(code.substring(start, i));
      continue;
    }
    
    // Check for string literals (single quotes)
    if (code[i] === "'") {
      const start = i;
      i++; // Skip opening quote
      while (i < code.length && code[i] !== "'") {
        if (code[i] === '\\' && i + 1 < code.length) {
          i += 2; // Skip escaped character
        } else {
          i++;
        }
      }
      i++; // Skip closing quote
      result.push(code.substring(start, i));
      continue;
    }
    
    // Check for single-line comments
    if (code[i] === '/' && code[i + 1] === '/') {
      // Skip until end of line
      while (i < code.length && code[i] !== '\n') {
        i++;
      }
      continue;
    }
    
    // Check for multi-line comments
    if (code[i] === '/' && code[i + 1] === '*') {
      i += 2; // Skip /*
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
        i++;
      }
      i += 2; // Skip */
      continue;
    }
    
    result.push(code[i]);
    i++;
  }
  
  return result.join('');
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

  // Check maximum size limit first (DoS prevention)
  if (code.length > SECURITY_LIMITS.MAX_CONTRACT_SIZE) {
    return {
      sanitized: '',
      isValid: false,
      error: `Contract code exceeds maximum size limit (${Math.round(SECURITY_LIMITS.MAX_CONTRACT_SIZE / 1024)}KB)`,
      stats: { lines: 0, chars: code.length },
    };
  }

  // Check for XSS patterns BEFORE any processing (security first)
  for (const pattern of XSS_BLOCKLIST) {
    if (pattern.test(code)) {
      return {
        sanitized: '',
        isValid: false,
        error: 'Invalid input: Potentially malicious content detected',
        stats: { lines: 0, chars: 0 },
      };
    }
  }

  // Normalize line endings
  let sanitized = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Remove comments while preserving string literals (prevents corrupting URLs)
  sanitized = removeLineComments(sanitized);
  
  // Remove excessive blank lines (more than 2 consecutive)
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
  
  // Trim whitespace
  sanitized = sanitized.trim();

  const stats = {
    lines: sanitized ? sanitized.split('\n').length : 0,
    chars: sanitized.length,
  };

  // Minimum size validation (raised threshold for real contracts)
  if (sanitized.length < SECURITY_LIMITS.MIN_CONTRACT_SIZE) {
    return {
      sanitized,
      isValid: false,
      error: `Code is too short to be a valid contract (minimum ${SECURITY_LIMITS.MIN_CONTRACT_SIZE} characters)`,
      stats,
    };
  }

  // Check for Solidity indicators - require BOTH pragma AND contract/interface/library
  const hasPragma = /pragma\s+solidity/i.test(sanitized);
  const hasContract = /contract\s+\w+/i.test(sanitized);
  const hasInterface = /interface\s+\w+/i.test(sanitized);
  const hasLibrary = /library\s+\w+/i.test(sanitized);
  const hasDefinition = hasContract || hasInterface || hasLibrary;

  if (!hasPragma) {
    return {
      sanitized,
      isValid: false,
      error: 'No valid Solidity code detected (missing pragma solidity statement)',
      stats,
    };
  }

  if (!hasDefinition) {
    return {
      sanitized,
      isValid: false,
      error: 'No valid Solidity code detected (missing contract, interface, or library definition)',
      stats,
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
