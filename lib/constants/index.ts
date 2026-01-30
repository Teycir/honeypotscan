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
