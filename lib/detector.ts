import { HONEYPOT_PATTERNS, MIN_PATTERNS_FOR_DETECTION } from './patterns';
import { execWithTimeout } from './regex-timeout';
import type { Pattern } from '@/types';

// Timeout for regex execution to prevent ReDoS attacks (in milliseconds)
const REGEX_TIMEOUT_MS = 100;

// Pre-compiled regex patterns
const compiledPatterns = HONEYPOT_PATTERNS.map(pattern => ({
  name: pattern.name,
  regex: pattern.regex,
}));

/**
 * Detect honeypot patterns in Solidity source code
 * Uses pre-compiled regex patterns with timeout protection
 */
export function detectHoneypot(source: string): { isHoneypot: boolean; patterns: Pattern[] } {
  const matches: Pattern[] = [];
  
  // Early exit for empty or very short sources
  if (!source || source.length < 50) {
    return { isHoneypot: false, patterns: [] };
  }
  
  // Limit source size to prevent DoS
  const maxSourceLength = 500 * 1024; // 500KB max
  const truncatedSource = source.length > maxSourceLength 
    ? source.substring(0, maxSourceLength) 
    : source;
  
  for (const pattern of compiledPatterns) {
    try {
      // Use timeout-protected regex execution
      for (const result of execWithTimeout(
        pattern.regex,
        truncatedSource,
        { timeoutMs: REGEX_TIMEOUT_MS, maxMatches: 100 }
      )) {
        const lineNumber = truncatedSource.substring(0, result.index).split('\n').length;
        matches.push({
          name: pattern.name,
          line: lineNumber,
          code: result.match.substring(0, 100)
        });
      }
    } catch (error) {
      // Log but don't fail the entire detection
      console.error(`Error in pattern ${pattern.name}:`, error);
    }
  }
  
  return {
    isHoneypot: matches.length >= MIN_PATTERNS_FOR_DETECTION,
    patterns: matches,
  };
}
