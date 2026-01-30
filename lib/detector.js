import { HONEYPOT_PATTERNS } from './patterns.js';

export function detectHoneypot(source) {
  const matches = [];
  
  for (const pattern of HONEYPOT_PATTERNS) {
    if (pattern.regex.test(source)) {
      matches.push(pattern.name);
    }
  }
  
  return {
    isHoneypot: matches.length >= 2,
    patterns: matches,
  };
}
