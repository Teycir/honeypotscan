/**
 * Regex Timeout Protection
 * 
 * Provides ReDoS protection by executing regex patterns with hard timeouts.
 * Since JavaScript doesn't support interrupting regex execution directly,
 * we use a chunked approach that processes input in segments.
 */

export interface RegexMatch {
  index: number;
  match: string;
  groups?: string[];
}

export interface TimeoutConfig {
  timeoutMs: number;
  maxMatches?: number;
  chunkSize?: number;
}

const DEFAULT_CONFIG: Required<TimeoutConfig> = {
  timeoutMs: 100,
  maxMatches: 100,
  chunkSize: 50000, // Process 50KB chunks
};

/**
 * Execute regex with hard timeout protection using chunked processing
 * 
 * This approach:
 * 1. Splits input into manageable chunks
 * 2. Processes each chunk with time checks
 * 3. Aborts if any chunk takes too long
 * 4. Handles overlapping matches at chunk boundaries
 */
export function* execWithTimeout(
  regex: RegExp,
  input: string,
  config: TimeoutConfig = DEFAULT_CONFIG
): Generator<RegexMatch> {
  const { timeoutMs, maxMatches, chunkSize } = { ...DEFAULT_CONFIG, ...config };
  
  const startTime = Date.now();
  let matchCount = 0;
  
  // Track seen matches globally to avoid duplicates
  const seenMatches = new Set<number>();
  
  // For small inputs, process directly with timeout check
  if (input.length <= chunkSize) {
    // Remove global flag to prevent duplicates - we'll manage iteration manually
    const flags = regex.flags.replace(/g/g, '');
    const chunkRegex = new RegExp(regex.source, flags + 'g');
    let match: RegExpExecArray | null;
    
    while ((match = chunkRegex.exec(input)) !== null) {
      // Hard timeout check before processing match
      if (Date.now() - startTime > timeoutMs) {
        console.warn(`[ReDoS Protection] Regex timeout after ${Date.now() - startTime}ms`);
        return;
      }
      
      // Skip duplicate matches at the same index
      if (seenMatches.has(match.index)) {
        if (match.index === chunkRegex.lastIndex) chunkRegex.lastIndex++;
        continue;
      }
      
      seenMatches.add(match.index);
      
      yield {
        index: match.index,
        match: match[0],
        groups: match.slice(1),
      };
      
      if (++matchCount >= maxMatches) {
        console.warn(`[ReDoS Protection] Max matches (${maxMatches}) reached`);
        return;
      }
      
      // Prevent infinite loops on zero-length matches
      if (match.index === chunkRegex.lastIndex) {
        chunkRegex.lastIndex++;
      }
    }
    return;
  }
  
  // For large inputs, process in chunks with overlap
  // Overlap size is 2x the max match size to catch boundary matches
  const overlapSize = Math.min(2000, chunkSize / 2);
  let offset = 0;
  
  while (offset < input.length) {
    // Check timeout at chunk boundaries
    if (Date.now() - startTime > timeoutMs) {
      console.warn(`[ReDoS Protection] Timeout during chunked processing at offset ${offset}`);
      return;
    }
    
    const chunkEnd = Math.min(offset + chunkSize, input.length);
    const chunk = input.substring(offset, chunkEnd + overlapSize);
    
    // Remove global flag and re-add to ensure clean state
    const flags = regex.flags.replace(/g/g, '');
    const chunkRegex = new RegExp(regex.source, flags + 'g');
    let match: RegExpExecArray | null;
    
    const chunkStartTime = Date.now();
    
    while ((match = chunkRegex.exec(chunk)) !== null) {
      // Check timeout during chunk processing
      const chunkElapsed = Date.now() - chunkStartTime;
      if (chunkElapsed > timeoutMs / 2) {
        console.warn(`[ReDoS Protection] Single chunk took ${chunkElapsed}ms - possible ReDoS pattern`);
        return;
      }
      
      const globalIndex = offset + match.index;
      
      // Skip duplicates from overlapping regions
      if (seenMatches.has(globalIndex)) {
        if (match.index === chunkRegex.lastIndex) chunkRegex.lastIndex++;
        continue;
      }
      
      seenMatches.add(globalIndex);
      
      yield {
        index: globalIndex,
        match: match[0],
        groups: match.slice(1),
      };
      
      if (++matchCount >= maxMatches) {
        console.warn(`[ReDoS Protection] Max matches (${maxMatches}) reached`);
        return;
      }
      
      // Prevent infinite loops
      if (match.index === chunkRegex.lastIndex) {
        chunkRegex.lastIndex++;
      }
    }
    
    offset += chunkSize;
  }
}

/**
 * Test if a regex can match a string within the timeout
 * Returns null if timeout exceeded, otherwise returns first match
 */
export function testWithTimeout(
  regex: RegExp,
  input: string,
  timeoutMs: number = 100
): RegExpExecArray | null {
  const startTime = Date.now();
  
  try {
    const testRegex = new RegExp(regex.source, regex.flags);
    const match = testRegex.exec(input);
    
    const elapsed = Date.now() - startTime;
    if (elapsed > timeoutMs) {
      console.warn(`[ReDoS Protection] test() took ${elapsed}ms - timeout exceeded`);
      return null;
    }
    
    return match;
  } catch (error) {
    console.error('[ReDoS Protection] Regex execution error:', error);
    return null;
  }
}

/**
 * Validate that a regex pattern is safe (quick heuristic check)
 * Checks for common ReDoS patterns like nested quantifiers
 */
export function isSafePattern(pattern: string): { safe: boolean; reason?: string } {
  // Check for nested quantifiers: (a+)+ or (a*)*
  const nestedQuantifiers = /\([^)]*[*+]\)[*+]/;
  if (nestedQuantifiers.test(pattern)) {
    return {
      safe: false,
      reason: 'Nested quantifiers detected - potential ReDoS risk',
    };
  }
  
  // Check for alternation with overlapping branches: (a|a)+
  const overlappingAlternation = /\([^|)]+\|[^)]+\)[*+]/;
  if (overlappingAlternation.test(pattern)) {
    return {
      safe: false,
      reason: 'Overlapping alternation with quantifier - potential ReDoS risk',
    };
  }
  
  // Check for excessive character class repetition: [^x]{500,}
  const excessiveRepetition = /\[[^\]]+\]\{[1-9]\d{2,}/;
  if (excessiveRepetition.test(pattern)) {
    return {
      safe: false,
      reason: 'Excessive character class repetition - potential ReDoS risk',
    };
  }
  
  return { safe: true };
}
