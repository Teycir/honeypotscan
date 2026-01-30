import { fetchContractSource } from "../lib/fetcher";
import { detectHoneypot } from "../lib/detector";
import { validateAddress } from "../lib/validator";
import { detectChain } from "../lib/chain-detector";
import {
  SCAN_CONFIDENCE,
  CACHE_TTL,
  CORS_HEADERS,
  CACHE_CONTROL_HEADERS,
} from "../lib/constants";
import type { Env } from "../types";

// Version for cache invalidation - increment when detection patterns change
const DETECTION_VERSION = "v2";

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

    // Validate content type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return createErrorResponse(
        "Content-Type must be application/json",
        400,
        "INVALID_CONTENT_TYPE"
      );
    }

    try {
      // Parse and validate request body
      let body: ScanRequest;
      try {
        body = (await request.json()) as ScanRequest;
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
        chain = await detectChain(normalizedAddress);
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
