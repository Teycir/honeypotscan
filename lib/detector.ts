import { HONEYPOT_PATTERNS, MIN_PATTERNS_FOR_DETECTION } from './patterns';
import type { Pattern } from '@/types';

export function detectHoneypot(source: string): { isHoneypot: boolean; patterns: Pattern[] } {
  const matches: Pattern[] = [];
  
  for (const pattern of HONEYPOT_PATTERNS) {
    // Create a new regex with global flag to find ALL matches, not just the first one
    // Using .exec() without global flag only returns the first match per pattern
    // which could miss multiple occurrences of malicious patterns
    const globalRegex = new RegExp(pattern.regex.source, pattern.regex.flags + (pattern.regex.flags.includes('g') ? '' : 'g'));
    
    let match: RegExpExecArray | null;
    while ((match = globalRegex.exec(source)) !== null) {
      const lineNumber = source.substring(0, match.index).split('\n').length;
      matches.push({
        name: pattern.name,
        line: lineNumber,
        code: match[0].substring(0, 100)
      });
      
      // Prevent infinite loops on zero-length matches
      if (match.index === globalRegex.lastIndex) {
        globalRegex.lastIndex++;
      }
    }
  }
  
  return {
    isHoneypot: matches.length >= MIN_PATTERNS_FOR_DETECTION,
    patterns: matches,
  };
}
