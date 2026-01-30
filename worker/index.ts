import { fetchContractSource } from '../lib/fetcher';
import { detectHoneypot } from '../lib/detector';
import { validateAddress } from '../lib/validator';
import { detectChain } from '../lib/chain-detector';

interface Env {
  CACHE?: KVNamespace;
  ETHERSCAN_API_KEY_1?: string;
  ETHERSCAN_API_KEY_2?: string;
  ETHERSCAN_API_KEY_3?: string;
  ETHERSCAN_API_KEY_4?: string;
  ETHERSCAN_API_KEY_5?: string;
  ETHERSCAN_API_KEY_6?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }
    
    try {
      const { address } = await request.json() as { address: string };
      
      const addressValidation = validateAddress(address);
      if (!addressValidation.valid) {
        return new Response(
          JSON.stringify({ error: addressValidation.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const chain = await detectChain(address);
      if (!chain) {
        return new Response(
          JSON.stringify({ error: 'Contract not found on supported chains' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const cacheKey = `${chain}:${address.toLowerCase()}`;
      const cached = await env.CACHE?.get(cacheKey, 'json');
      if (cached) {
        return new Response(JSON.stringify(cached), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
            'CDN-Cache-Control': 'max-age=86400',
            'Cloudflare-CDN-Cache-Control': 'max-age=86400'
          }
        });
      }
      
      const source = await fetchContractSource(address, chain, env);
      
      if (!source) {
        return new Response(
          JSON.stringify({ error: 'Contract source code not available' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const { isHoneypot, patterns } = detectHoneypot(source);
      
      const result = {
        isHoneypot,
        confidence: isHoneypot ? 95 : 100,
        patterns,
        chain,
        message: isHoneypot
          ? `⚠️ This contract contains ${patterns.length} honeypot patterns. DO NOT BUY!`
          : '✅ No honeypot patterns detected. Contract appears safe.',
      };
      
      await env.CACHE?.put(cacheKey, JSON.stringify(result), { expirationTtl: 86400 });
      
      return new Response(JSON.stringify(result), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
          'CDN-Cache-Control': 'max-age=86400',
          'Cloudflare-CDN-Cache-Control': 'max-age=86400'
        }
      });
      
    } catch (error) {
      return new Response(
        JSON.stringify({ error: (error as Error).message || 'Scan failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
};
