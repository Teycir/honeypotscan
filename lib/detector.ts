import { HONEYPOT_PATTERNS } from './patterns';
import type { Pattern } from '@/types';

export function detectHoneypot(source: string): { isHoneypot: boolean; patterns: Pattern[] } {
  const matches: Pattern[] = [];
  
  for (const pattern of HONEYPOT_PATTERNS) {
    const match = pattern.regex.exec(source);
    if (match) {
      const lineNumber = source.substring(0, match.index).split('\n').length;
      matches.push({
        name: pattern.name,
        line: lineNumber,
        code: match[0].substring(0, 100)
      });
    }
  }
  
  return {
    isHoneypot: matches.length >= 2,
    patterns: matches,
  };
}
