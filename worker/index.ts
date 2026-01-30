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

function createErrorResponse(message: string, status = 500): Response {
  return createJsonResponse({ error: message }, status);
}

const worker = {
  async fetch(
    request: Request,
    env: Env,
  ): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: CORS_HEADERS,
      });
    }

    try {
      const { address } = (await request.json()) as { address: string };

      const addressValidation = validateAddress(address);
      if (!addressValidation.valid) {
        return createErrorResponse(
          addressValidation.error || "Invalid address",
          400,
        );
      }

      const chain = await detectChain(address);
      if (!chain) {
        return createErrorResponse(
          "Contract not found on supported chains",
          404,
        );
      }

      const cacheKey = `${chain}:${address.toLowerCase()}`;

      if (env.CACHE) {
        const cached = await env.CACHE.get(cacheKey, "json");
        if (cached) {
          return createJsonResponse(cached, 200, true);
        }
      }

      const source = await fetchContractSource(address, chain, env);

      if (!source) {
        return createErrorResponse("Contract source code not available", 404);
      }

      const { isHoneypot, patterns } = detectHoneypot(source);

      const result = {
        isHoneypot,
        confidence: isHoneypot
          ? SCAN_CONFIDENCE.HONEYPOT
          : SCAN_CONFIDENCE.SAFE,
        patterns,
        chain,
        message: isHoneypot
          ? `⚠️ This contract contains ${patterns.length} honeypot patterns. DO NOT BUY!`
          : "✅ No honeypot patterns detected. Contract appears safe.",
      };

      if (env.CACHE) {
        await env.CACHE.put(cacheKey, JSON.stringify(result), {
          expirationTtl: CACHE_TTL.ONE_DAY,
        });
      }

      return createJsonResponse(result, 200, true);
    } catch (error) {
      return createErrorResponse(
        (error as Error).message || "Scan failed",
        500,
      );
    }
  },
};

export default worker;
