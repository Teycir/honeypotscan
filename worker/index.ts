import { fetchContractSource } from "../lib/fetcher";
import { detectHoneypot } from "../lib/detector";
import { validateAddress } from "../lib/validator";
import { detectChain } from "../lib/chain-detector";
import {
  SCAN_CONFIDENCE,
  CACHE_TTL,
  CORS_HEADERS,
  CACHE_CONTROL_HEADERS,
  SECURITY_LIMITS,
} from "../lib/constants";
import type { Env } from "../types";

// Version for cache invalidation - increment when detection patterns change
const DETECTION_VERSION = "v2";

// In-memory rate limiting store (per worker instance)
// Note: For distributed rate limiting, use Cloudflare's Rate Limiting or KV
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface ScanRequest {
  address: string;
  skipCache?: boolean;
}

function createJsonResponse(
  data: unknown,
  status = 200,
  withCache = false,
): Response {
  const headers = {
    ...CORS_HEADERS,
    "Content-Type": "application/json",
    ...(withCache ? CACHE_CONTROL_HEADERS : {}),
  };
  return new Response(JSON.stringify(data), { status, headers });
}

function createErrorResponse(message: string, status = 500, code?: string): Response {
  return createJsonResponse({ error: message, code }, status);
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
 * Check rate limit for a given IP
 * Returns true if request should be allowed, false if rate limited
 */
function checkRateLimit(clientIP: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(clientIP);
  
  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [ip, data] of rateLimitStore) {
      if (data.resetTime < now) {
        rateLimitStore.delete(ip);
      }
    }
  }
  
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

const worker = {
  async fetch(
    request: Request,
    env: Env,
  ): Promise<Response> {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Only allow POST requests
    if (request.method !== "POST") {
      return createErrorResponse(
        "Method not allowed. Use POST with JSON body.",
        405,
        "METHOD_NOT_ALLOWED"
      );
    }

    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP);
    
    if (!rateLimit.allowed) {
      const response = createErrorResponse(
        `Rate limit exceeded. Please try again in ${Math.ceil(rateLimit.resetIn / 1000)} seconds.`,
        429,
        "RATE_LIMIT_EXCEEDED"
      );
      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', String(SECURITY_LIMITS.RATE_LIMIT_MAX_REQUESTS));
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetIn / 1000)));
      response.headers.set('Retry-After', String(Math.ceil(rateLimit.resetIn / 1000)));
      return response;
    }

    // Validate content type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return createErrorResponse(
        "Content-Type must be application/json",
        400,
        "INVALID_CONTENT_TYPE"
      );
    }

    // Check Content-Length header for size limit
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > SECURITY_LIMITS.MAX_REQUEST_BODY_SIZE) {
      return createErrorResponse(
        `Request body too large (max ${Math.round(SECURITY_LIMITS.MAX_REQUEST_BODY_SIZE / 1024)}KB)`,
        413,
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
          "BODY_READ_ERROR"
        );
      }

      // Verify actual body size
      if (bodyText.length > SECURITY_LIMITS.MAX_REQUEST_BODY_SIZE) {
        return createErrorResponse(
          `Request body too large (max ${Math.round(SECURITY_LIMITS.MAX_REQUEST_BODY_SIZE / 1024)}KB)`,
          413,
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
          "INVALID_JSON"
        );
      }

      const { address, skipCache = false } = body;

      // Validate address is provided
      if (!address) {
        return createErrorResponse(
          "Address is required",
          400,
          "MISSING_ADDRESS"
        );
      }

      // Validate address format
      const addressValidation = validateAddress(address);
      if (!addressValidation.valid) {
        return createErrorResponse(
          addressValidation.error || "Invalid address format",
          400,
          "INVALID_ADDRESS"
        );
      }

      const normalizedAddress = sanitizeAddress(address);
      
      // Detect which chain the contract is on
      let chain: string | null;
      try {
        chain = await detectChain(normalizedAddress, env);
      } catch (error) {
        console.error("Chain detection error:", error);
        return createErrorResponse(
          "Failed to detect contract chain. Please try again.",
          503,
          "CHAIN_DETECTION_FAILED"
        );
      }

      if (!chain) {
        return createErrorResponse(
          "Contract not found on supported chains (Ethereum, Polygon, Arbitrum)",
          404,
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
            return createJsonResponse({ ...cached as object, cached: true }, 200, true);
          }
        } catch (cacheError) {
          console.error("Cache read error:", cacheError);
          // Continue without cache on error
        }
      }

      // Fetch contract source code
      let source: string;
      try {
        source = await fetchContractSource(normalizedAddress, chain, env);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Source fetch error:", errorMessage);
        
        if (errorMessage.includes("not verified") || errorMessage.includes("not found")) {
          return createErrorResponse(
            "Contract source code is not verified on block explorer",
            404,
            "SOURCE_NOT_VERIFIED"
          );
        }
        
        return createErrorResponse(
          "Failed to fetch contract source code. Please try again.",
          503,
          "SOURCE_FETCH_FAILED"
        );
      }

      if (!source || source.trim().length === 0) {
        return createErrorResponse(
          "Contract source code not available or not verified",
          404,
          "SOURCE_NOT_AVAILABLE"
        );
      }

      // Perform honeypot detection
      const { isHoneypot, patterns } = detectHoneypot(source);

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
          console.error("Cache write error:", cacheError);
          // Continue without caching on error
        }
      }

      return createJsonResponse(result, 200, true);
    } catch (error) {
      console.error("Unexpected error:", error);
      return createErrorResponse(
        error instanceof Error ? error.message : "An unexpected error occurred",
        500,
        "INTERNAL_ERROR"
      );
    }
  },
};

export default worker;
