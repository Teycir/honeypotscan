import { fetchContractSource } from "../lib/fetcher";
import { detectHoneypot } from "../lib/detector";
import { validateAddress } from "../lib/validator";
import { detectChain } from "../lib/chain-detector";
import {
  SCAN_CONFIDENCE,
  CACHE_TTL,
  CACHE_CONTROL_HEADERS,
  SECURITY_LIMITS,
  createCorsHeaders,
  isAllowedOrigin,
} from "../lib/constants";
import type { Env } from "../types";

// Version for cache invalidation - increment when detection patterns change
const DETECTION_VERSION = "v2";

// In-memory rate limiting store (per worker instance)
// ⚠️ PRODUCTION WARNING: This in-memory approach does NOT work across Cloudflare's
// distributed edge locations. Each edge location maintains its own Map, so users
// can bypass rate limits by hitting different edge locations.
// 
// For production deployments, use one of these solutions:
// 1. Cloudflare's native Rate Limiting product (recommended)
// 2. Cloudflare KV with TTL for distributed state
// 3. Cloudflare Durable Objects for strongly consistent rate limiting
//
// This implementation is suitable for:
// - Local development and testing
// - Single-region deployments
// - As a first-line defense in conjunction with Cloudflare Rate Limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Cleanup tracking for rate limit store
let lastCleanupTime = Date.now();
const CLEANUP_INTERVAL_MS = 60000; // Cleanup every 60 seconds max
const MAX_STORE_SIZE = 5000; // Trigger cleanup at 5000 entries

interface ScanRequest {
  address: string;
  skipCache?: boolean;
}

/**
 * Structured logging helper for consistent log format
 */
interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

function log(level: LogEntry['level'], message: string, metadata?: Record<string, unknown>): void {
  const entry: LogEntry = {
    level,
    message,
    metadata,
    timestamp: new Date().toISOString(),
  };
  
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

function createJsonResponse(
  data: unknown,
  status = 200,
  corsHeaders: Record<string, string>,
  withCache = false,
): Response {
  const headers = {
    ...corsHeaders,
    "Content-Type": "application/json",
    ...(withCache ? CACHE_CONTROL_HEADERS : {}),
  };
  return new Response(JSON.stringify(data), { status, headers });
}

function createErrorResponse(
  message: string, 
  status = 500, 
  corsHeaders: Record<string, string>,
  code?: string
): Response {
  return createJsonResponse({ error: message, code }, status, corsHeaders);
}

function sanitizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

/**
 * Get client IP from request headers
 */
function getClientIP(request: Request): string {
  // Cloudflare provides the client IP in CF-Connecting-IP header
  return request.headers.get('CF-Connecting-IP') 
    || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    || request.headers.get('X-Real-IP')
    || 'unknown';
}

/**
 * Perform periodic cleanup of expired rate limit entries
 * Uses time-based throttling to prevent excessive cleanup overhead
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  
  // Throttle cleanup: only run if enough time has passed or store is large
  if (now - lastCleanupTime < CLEANUP_INTERVAL_MS && rateLimitStore.size < MAX_STORE_SIZE) {
    return;
  }
  
  lastCleanupTime = now;
  
  // Delete expired entries
  for (const [ip, data] of rateLimitStore) {
    if (data.resetTime < now) {
      rateLimitStore.delete(ip);
    }
  }
  
  // If still too large after cleanup, remove oldest entries (LRU-like)
  if (rateLimitStore.size > MAX_STORE_SIZE) {
    const entries = Array.from(rateLimitStore.entries())
      .sort((a, b) => a[1].resetTime - b[1].resetTime);
    
    const toRemove = entries.slice(0, Math.floor(MAX_STORE_SIZE * 0.2)); // Remove 20%
    for (const [ip] of toRemove) {
      rateLimitStore.delete(ip);
    }
  }
}

/**
 * Check rate limit for a given IP
 * Returns true if request should be allowed, false if rate limited
 */
function checkRateLimit(clientIP: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(clientIP);
  
  // Perform periodic cleanup
  cleanupExpiredEntries();
  
  if (!entry || entry.resetTime < now) {
    // New window
    rateLimitStore.set(clientIP, {
      count: 1,
      resetTime: now + SECURITY_LIMITS.RATE_LIMIT_WINDOW_MS,
    });
    return { 
      allowed: true, 
      remaining: SECURITY_LIMITS.RATE_LIMIT_MAX_REQUESTS - 1,
      resetIn: SECURITY_LIMITS.RATE_LIMIT_WINDOW_MS,
    };
  }
  
  if (entry.count >= SECURITY_LIMITS.RATE_LIMIT_MAX_REQUESTS) {
    return { 
      allowed: false, 
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }
  
  entry.count++;
  return { 
    allowed: true, 
    remaining: SECURITY_LIMITS.RATE_LIMIT_MAX_REQUESTS - entry.count,
    resetIn: entry.resetTime - now,
  };
}

// Use isAllowedOrigin from constants for consistent validation

const worker = {
  async fetch(
    request: Request,
    env: Env,
  ): Promise<Response> {
    const origin = request.headers.get('Origin');
    const corsHeaders = createCorsHeaders(origin);
    
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      // For preflight, check if origin is allowed
      if (origin && !isAllowedOrigin(origin)) {
        log('warn', 'CORS preflight from unauthorized origin', { origin });
      }
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST requests
    if (request.method !== "POST") {
      return createErrorResponse(
        "Method not allowed. Use POST with JSON body.",
        405,
        corsHeaders,
        "METHOD_NOT_ALLOWED"
      );
    }

    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP);
    
    // Helper to add rate limit headers to any response
    const addRateLimitHeaders = (response: Response, remaining: number, resetIn: number): Response => {
      response.headers.set('X-RateLimit-Limit', String(SECURITY_LIMITS.RATE_LIMIT_MAX_REQUESTS));
      response.headers.set('X-RateLimit-Remaining', String(remaining));
      response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetIn / 1000)));
      return response;
    };

    if (!rateLimit.allowed) {
      log('warn', 'Rate limit exceeded', { clientIP, resetIn: rateLimit.resetIn });
      const response = createErrorResponse(
        `Rate limit exceeded. Please try again in ${Math.ceil(rateLimit.resetIn / 1000)} seconds.`,
        429,
        corsHeaders,
        "RATE_LIMIT_EXCEEDED"
      );
      addRateLimitHeaders(response, 0, rateLimit.resetIn);
      response.headers.set('Retry-After', String(Math.ceil(rateLimit.resetIn / 1000)));
      return response;
    }

    // Validate content type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return createErrorResponse(
        "Content-Type must be application/json",
        400,
        corsHeaders,
        "INVALID_CONTENT_TYPE"
      );
    }

    // Check Content-Length header for size limit
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > SECURITY_LIMITS.MAX_REQUEST_BODY_SIZE) {
      return createErrorResponse(
        `Request body too large (max ${Math.round(SECURITY_LIMITS.MAX_REQUEST_BODY_SIZE / 1024)}KB)`,
        413,
        corsHeaders,
        "REQUEST_TOO_LARGE"
      );
    }

    try {
      // Parse and validate request body with size check
      let bodyText: string;
      try {
        bodyText = await request.text();
      } catch {
        return createErrorResponse(
          "Failed to read request body",
          400,
          corsHeaders,
          "BODY_READ_ERROR"
        );
      }

      // Verify actual body size
      if (bodyText.length > SECURITY_LIMITS.MAX_REQUEST_BODY_SIZE) {
        return createErrorResponse(
          `Request body too large (max ${Math.round(SECURITY_LIMITS.MAX_REQUEST_BODY_SIZE / 1024)}KB)`,
          413,
          corsHeaders,
          "REQUEST_TOO_LARGE"
        );
      }

      let body: ScanRequest;
      try {
        body = JSON.parse(bodyText) as ScanRequest;
      } catch {
        return createErrorResponse(
          "Invalid JSON in request body",
          400,
          corsHeaders,
          "INVALID_JSON"
        );
      }

      const { address, skipCache = false } = body;

      // Validate address is provided
      if (!address) {
        return createErrorResponse(
          "Address is required",
          400,
          corsHeaders,
          "MISSING_ADDRESS"
        );
      }

      // Validate address format
      const addressValidation = validateAddress(address);
      if (!addressValidation.valid) {
        return createErrorResponse(
          addressValidation.error || "Invalid address format",
          400,
          corsHeaders,
          "INVALID_ADDRESS"
        );
      }

      const normalizedAddress = sanitizeAddress(address);
      
      log('info', 'Scanning address', { address: normalizedAddress, clientIP });
      
      // Detect which chain the contract is on
      let chain: string | null;
      try {
        chain = await detectChain(normalizedAddress, env);
      } catch (error) {
        log('error', 'Chain detection error', { 
          address: normalizedAddress, 
          error: error instanceof Error ? error.message : 'Unknown' 
        });
        return createErrorResponse(
          "Failed to detect contract chain. Please try again.",
          503,
          corsHeaders,
          "CHAIN_DETECTION_FAILED"
        );
      }

      if (!chain) {
        return createErrorResponse(
          "Contract not found on supported chains (Ethereum, Polygon, Arbitrum). Please verify the address is correct and the contract is deployed.",
          404,
          corsHeaders,
          "CONTRACT_NOT_FOUND"
        );
      }

      // Create versioned cache key
      const cacheKey = `${DETECTION_VERSION}:${chain}:${normalizedAddress}`;

      // Check cache (unless skipCache is true)
      if (env.CACHE && !skipCache) {
        try {
          const cached = await env.CACHE.get(cacheKey, "json");
          if (cached) {
            log('info', 'Cache hit', { address: normalizedAddress, chain });
            return createJsonResponse({ ...cached as object, cached: true }, 200, corsHeaders, true);
          }
        } catch (cacheError) {
          log('error', 'Cache read error', { 
            error: cacheError instanceof Error ? cacheError.message : 'Unknown' 
          });
          // Continue without cache on error
        }
      }

      // Fetch contract source code and metadata
      let source: string;
      let tokenMetadata: { name: string | null; symbol: string | null; compilerVersion: string | null } = {
        name: null,
        symbol: null,
        compilerVersion: null,
      };
      try {
        const fetchResult = await fetchContractSource(normalizedAddress, chain, env);
        source = fetchResult.sourceCode;
        tokenMetadata = fetchResult.metadata;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        // Log the full error for debugging, but sanitize for client response
        log('error', 'Source fetch error', { address: normalizedAddress, chain, error: errorMessage });
        
        // Sanitize error message - don't expose internal API details to clients
        const isNotVerified = errorMessage.includes("not verified") || errorMessage.includes("not found");
        const isTimeout = errorMessage.includes("timeout");
        const isRateLimit = errorMessage.includes("rate limit") || errorMessage.includes("429");
        
        if (isNotVerified) {
          const response = createErrorResponse(
            "Contract source code is not verified on block explorer. Only verified contracts can be scanned.",
            404,
            corsHeaders,
            "SOURCE_NOT_VERIFIED"
          );
          return addRateLimitHeaders(response, rateLimit.remaining, rateLimit.resetIn);
        }
        
        if (isTimeout) {
          const response = createErrorResponse(
            "Request timed out while fetching contract source. Please try again.",
            504,
            corsHeaders,
            "SOURCE_FETCH_TIMEOUT"
          );
          return addRateLimitHeaders(response, rateLimit.remaining, rateLimit.resetIn);
        }
        
        if (isRateLimit) {
          const response = createErrorResponse(
            "External API rate limit reached. Please wait a moment and try again.",
            503,
            corsHeaders,
            "EXTERNAL_RATE_LIMIT"
          );
          return addRateLimitHeaders(response, rateLimit.remaining, rateLimit.resetIn);
        }
        
        // Generic error - don't expose internal details
        const response = createErrorResponse(
          "Failed to fetch contract source code. Please try again later.",
          503,
          corsHeaders,
          "SOURCE_FETCH_FAILED"
        );
        return addRateLimitHeaders(response, rateLimit.remaining, rateLimit.resetIn);
      }

      if (!source || source.trim().length === 0) {
        const response = createErrorResponse(
          "Contract source code not available or not verified on the block explorer.",
          404,
          corsHeaders,
          "SOURCE_NOT_AVAILABLE"
        );
        return addRateLimitHeaders(response, rateLimit.remaining, rateLimit.resetIn);
      }

      // Perform honeypot detection
      const { isHoneypot, patterns } = detectHoneypot(source);
      
      log('info', 'Scan completed', { 
        address: normalizedAddress, 
        chain, 
        isHoneypot, 
        patternCount: patterns.length 
      });

      const result = {
        isHoneypot,
        confidence: isHoneypot
          ? SCAN_CONFIDENCE.HONEYPOT
          : SCAN_CONFIDENCE.SAFE,
        patterns,
        chain,
        message: isHoneypot
          ? `⚠️ This contract contains ${patterns.length} honeypot pattern${patterns.length > 1 ? 's' : ''}. DO NOT BUY!`
          : "✅ No honeypot patterns detected. Contract appears safe.",
        tokenMetadata,
        scannedAt: new Date().toISOString(),
        detectionVersion: DETECTION_VERSION,
      };

      // Cache the result
      if (env.CACHE) {
        try {
          await env.CACHE.put(cacheKey, JSON.stringify(result), {
            expirationTtl: CACHE_TTL.ONE_DAY,
          });
        } catch (cacheError) {
          log('error', 'Cache write error', { 
            error: cacheError instanceof Error ? cacheError.message : 'Unknown' 
          });
          // Continue without caching on error
        }
      }

      const response = createJsonResponse(result, 200, corsHeaders, true);
      return addRateLimitHeaders(response, rateLimit.remaining, rateLimit.resetIn);
    } catch (error) {
      log('error', 'Unexpected error', { 
        error: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      });
      // Don't expose internal error details to client
      const response = createErrorResponse(
        "An unexpected error occurred. Please try again later.",
        500,
        corsHeaders,
        "INTERNAL_ERROR"
      );
      return addRateLimitHeaders(response, rateLimit.remaining, rateLimit.resetIn);
    }
  },
};

export default worker;
