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

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;

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

// XSS prevention patterns
export const XSS_BLOCKLIST = [
  // HTML tags
  /<script/i,
  /<\/script/i,
  /<html/i,
  /<body/i,
  /<head/i,
  /<div/i,
  /<span/i,
  /<iframe/i,
  /<frame/i,
  /<object/i,
  /<embed/i,
  /<form/i,
  /<input/i,
  /<link/i,
  /<style/i,
  /<meta/i,
  /<img\s/i,
  /<svg\s/i,
  // Event handlers and dangerous attributes
  /\bon\w+\s*=/i, // onclick=, onerror=, onload=, etc.
  /javascript:/i,
  /vbscript:/i,
  /data:text\/html/i,
  // Expression injection
  /expression\s*\(/i,
  /url\s*\(\s*["']?javascript/i,
] as const;
