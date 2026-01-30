export const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
  ? 'http://localhost:8787' 
  : 'https://honeypotscan-api.teycircoder4.workers.dev';

export const SCAN_CONFIDENCE = {
  HONEYPOT: 95,
  SAFE: 100,
} as const;

export const CACHE_TTL = {
  ONE_DAY: 86400,
  ONE_WEEK: 604800,
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
