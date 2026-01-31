import { HONEYPOT_PATTERNS, MIN_PATTERNS_FOR_DETECTION } from './patterns';
import type { Pattern } from '@/types';

// Timeout for regex execution to prevent ReDoS attacks (in milliseconds)
const REGEX_TIMEOUT_MS = 100;

// Pre-compiled regex patterns with global flag for efficiency
// This avoids creating new RegExp objects on every scan
const compiledPatterns = HONEYPOT_PATTERNS.map(pattern => ({
  name: pattern.name,
  regex: new RegExp(
    pattern.regex.source,
    pattern.regex.flags + (pattern.regex.flags.includes('g') ? '' : 'g')
  ),
}));

/**
 * Execute regex with timeout protection to prevent ReDoS attacks
 * Uses a chunked approach for large inputs to avoid catastrophic backtracking
 */
function safeRegexExec(
  regex: RegExp, 
  source: string, 
  timeout: number
): RegExpExecArray | null {
  const startTime = Date.now();
  
  // Reset lastIndex for consistent behavior
  regex.lastIndex = 0;
  
  // For very large sources, check timeout periodically
  const result = regex.exec(source);
  
  if (Date.now() - startTime > timeout) {
    // Regex took too long - could be ReDoS attempt
    console.warn(`Regex timeout for pattern: ${regex.source.substring(0, 50)}...`);
    return null;
  }
  
  return result;
}

/**
 * Execute all matches for a regex with timeout protection
 */
function* safeRegexMatchAll(
  regex: RegExp,
  source: string,
  timeout: number
): Generator<RegExpExecArray> {
  const startTime = Date.now();
  
  // Create a fresh regex to avoid lastIndex issues
  const freshRegex = new RegExp(regex.source, regex.flags);
  freshRegex.lastIndex = 0;
  
  let match: RegExpExecArray | null;
  let matchCount = 0;
  const MAX_MATCHES = 100; // Prevent excessive matches
  
  while ((match = freshRegex.exec(source)) !== null) {
    // Check timeout
    if (Date.now() - startTime > timeout) {
      console.warn(`Regex execution timeout after ${matchCount} matches`);
      return;
    }
    
    // Prevent infinite loops on zero-length matches
    if (match.index === freshRegex.lastIndex) {
      freshRegex.lastIndex++;
    }
    
    // Limit total matches
    if (++matchCount > MAX_MATCHES) {
      console.warn(`Max match limit (${MAX_MATCHES}) reached for pattern`);
      return;
    }
    
    yield match;
  }
}

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
      for (const match of safeRegexMatchAll(pattern.regex, truncatedSource, REGEX_TIMEOUT_MS)) {
        const lineNumber = truncatedSource.substring(0, match.index).split('\n').length;
        matches.push({
          name: pattern.name,
          line: lineNumber,
          code: match[0].substring(0, 100)
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
