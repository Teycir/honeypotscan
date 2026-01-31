import { config } from '../config';

// Always use production API - local worker development requires wrangler dev running
// For local testing, we can use the deployed worker
export const API_URL = config.api.production;

export const SCAN_CONFIDENCE = {
  HONEYPOT: config.scan.confidence.honeypot,
  SAFE: config.scan.confidence.safe,
} as const;

export const CACHE_TTL = {
  ONE_DAY: config.cache.ttl.oneDay,
  ONE_WEEK: config.cache.ttl.oneWeek,
} as const;

// Allowed origins for CORS - restrict to specific domains
export const ALLOWED_ORIGINS = [
  'https://honeypotscan.com',
  'https://www.honeypotscan.com',
  'https://honeypotscan.pages.dev',
  'http://localhost:3000',
] as const;

/**
 * Check if an origin is in the allowed list
 * Uses strict string comparison instead of type assertion
 */
export function isAllowedOrigin(origin: string | null | undefined): boolean {
  if (!origin || typeof origin !== 'string') return false;
  // Use explicit includes check without type assertion
  return (ALLOWED_ORIGINS as readonly string[]).includes(origin);
}

// Default CORS headers factory
export function createCorsHeaders(origin?: string | null): Record<string, string> {
  // Check if the origin is in the allowed list using strict comparison
  const allowedOrigin = origin && isAllowedOrigin(origin)
    ? origin
    : ALLOWED_ORIGINS[0]; // Default to primary domain
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin', // Important for caching with dynamic CORS
  };
}

export const CACHE_CONTROL_HEADERS = {
  'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
  'CDN-Cache-Control': 'max-age=86400',
  'Cloudflare-CDN-Cache-Control': 'max-age=86400',
} as const;

// Security limits
export const SECURITY_LIMITS = {
  // Contract code size limits
  MIN_CONTRACT_SIZE: 200, // Minimum characters for valid contract
  MAX_CONTRACT_SIZE: 100 * 1024, // 100KB max contract size
  
  // Address batch limits
  MAX_ADDRESSES_PER_BATCH: 3,
  
  // Request body size limit (in bytes)
  MAX_REQUEST_BODY_SIZE: 150 * 1024, // 150KB to accommodate large contracts with overhead
  
  // Rate limiting (requests per window)
  RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minute window
  RATE_LIMIT_MAX_REQUESTS: 30, // 30 requests per minute per IP
} as const;

// XSS prevention patterns - comprehensive list including bypass attempts
export const XSS_BLOCKLIST = [
  // HTML tags (with various whitespace bypass attempts)
  /<\s*script/i,
  /<\s*\/\s*script/i,
  /<\s*html/i,
  /<\s*body/i,
  /<\s*head/i,
  /<\s*iframe/i,
  /<\s*frame/i,
  /<\s*object/i,
  /<\s*embed/i,
  /<\s*form/i,
  /<\s*input/i,
  /<\s*link/i,
  /<\s*style/i,
  /<\s*meta/i,
  /<\s*img[\s>]/i,
  /<\s*svg[\s>]/i,
  /<\s*math[\s>]/i,
  /<\s*video[\s>]/i,
  /<\s*audio[\s>]/i,
  /<\s*base[\s>]/i,
  /<\s*applet/i,
  /<\s*marquee/i,
  /<\s*bgsound/i,
  /<\s*keygen/i,
  /<\s*source[\s>]/i,
  /<\s*track[\s>]/i,
  /<\s*details[\s>]/i,
  /<\s*template[\s>]/i,
  // Event handlers and dangerous attributes (with whitespace/newline bypass)
  /\bon\s*\w+\s*=/i, // on click=, on error=, etc. with spaces
  /\bon[a-z]+\s*=/i, // onclick=, onerror=, onload=, etc.
  // Protocol handlers
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /livescript\s*:/i,
  /data\s*:\s*text\/html/i,
  /data\s*:\s*application/i,
  // Expression injection
  /expression\s*\(/i,
  /url\s*\(\s*["']?\s*javascript/i,
  /url\s*\(\s*["']?\s*data:/i,
  // Unicode/encoding bypass attempts
  /&#/i, // HTML entities like &#x6A;
  /\\u00/i, // Unicode escapes
  /\\x3c/i, // Hex encoded <
  // CSS expression attacks
  /-moz-binding\s*:/i,
  /behavior\s*:/i,
  // Import/include attacks
  /@import\s/i,
  /@charset\s/i,
] as const;
